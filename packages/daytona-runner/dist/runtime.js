export class SnapshotNotFoundError extends Error {
    snapshot;
    constructor(snapshot, cause) {
        super(`Snapshot not found in Daytona: '${snapshot}'. Refusing silent fallback to typescript base — fix DEFAULT_SNAPSHOT or rebuild/publish the snapshot before retrying.`, { cause });
        this.name = 'SnapshotNotFoundError';
        this.snapshot = snapshot;
    }
}
// Upper bound on how many trailing bytes of a run's captured log file
// getScriptLogs pulls back into the (Cloudflare Worker) poll process. A
// long issue→PR run can emit MBs of stdout; `tail -c` bounds the read at the
// source so the Worker never buffers the whole file. The failure is almost
// always at the END of the run, so the trailing bytes are the useful ones.
const SCRIPT_LOG_READ_MAX_BYTES = 262_144; // 256 KiB
export class DaytonaRuntime {
    id = 'daytona';
    capabilities = {
        pty: false,
        snapshots: true,
        isolation: 'strong',
        persistentHandle: true,
        streamingLogs: true,
    };
    sandboxes = new Map();
    daytona;
    snapshot;
    defaultHomeDir;
    constructor(options) {
        this.daytona = options.daytona;
        this.snapshot = options.snapshot;
        this.defaultHomeDir = options.defaultHomeDir ?? '/home/daytona';
    }
    async launch(options = {}) {
        const sandbox = await this.createSandbox(options);
        const homeDir = await this.resolveHomeDir(sandbox);
        return this.registerSandbox(sandbox, {
            owned: true,
            homeDir,
            workdir: options.workdir,
        });
    }
    async launchDetached(options = {}) {
        const sandbox = await this.createSandboxDetached(options);
        if (isRuntimeHandle(sandbox)) {
            return {
                ...sandbox,
                ...(options.workdir ? { workdir: options.workdir } : {}),
            };
        }
        return this.registerSandbox(sandbox, {
            owned: true,
            workdir: options.workdir,
        });
    }
    async getById(id, options = {}) {
        let sandbox;
        try {
            sandbox = await this.daytona.get(id);
        }
        catch (error) {
            if (isDaytonaNotFoundError(error)) {
                return null;
            }
            throw error;
        }
        const states = options.states === undefined ? null : options.states;
        if (!this.matchesState(sandbox, states)) {
            return null;
        }
        return this.registerSandbox(sandbox, {
            owned: options.owned ?? false,
            homeDir: options.homeDir,
            workdir: options.workdir,
        });
    }
    async findByLabels(labels, options = {}) {
        const limit = options.limit ?? options.pageSize ?? 10;
        const states = options.states === undefined ? ['STARTED'] : options.states;
        for await (const sandbox of this.listSandboxes(labels, { limit, states })) {
            if (this.matchesState(sandbox, states)) {
                const homeDir = options.homeDir ?? await this.resolveHomeDir(sandbox);
                return this.registerSandbox(sandbox, {
                    owned: options.owned ?? false,
                    homeDir,
                    workdir: options.workdir,
                });
            }
        }
        return null;
    }
    async findAllByLabels(labels, options = {}) {
        const limit = options.limit ?? options.pageSize ?? 10;
        const states = options.states === undefined ? ['STARTED'] : options.states;
        const handles = [];
        for await (const sandbox of this.listSandboxes(labels, { limit, states })) {
            if (!this.matchesState(sandbox, states)) {
                continue;
            }
            handles.push(this.registerSandbox(sandbox, {
                owned: options.owned ?? false,
                homeDir: options.homeDir,
                workdir: options.workdir,
            }));
        }
        return handles;
    }
    attachSandbox(sandbox, options = {}) {
        return this.registerSandbox(sandbox, {
            owned: options.owned ?? false,
            homeDir: options.homeDir,
            workdir: options.workdir,
        });
    }
    async exec(handle, command, options = {}) {
        const sandbox = this.requireSandbox(handle);
        const result = await sandbox.process.executeCommand(command, options.cwd, options.env, this.msToSeconds(options.timeoutMs));
        return {
            output: result.result ?? '',
            exitCode: result.exitCode ?? 0,
        };
    }
    async runScript(handle, options) {
        const sandbox = this.requireSandbox(handle);
        const command = this.buildScriptCommand(options);
        const timeoutSeconds = this.msToSeconds(options.timeoutMs);
        const useSession = options.useSession ?? true;
        if (useSession) {
            if (!this.supportsSessionExec(sandbox)) {
                throw new Error('Daytona session execution is not available on this sandbox');
            }
            const sessionId = options.sessionId ?? `run-${handle.id}-${Date.now()}`;
            await sandbox.process.createSession(sessionId);
            const result = await sandbox.process.executeSessionCommand(sessionId, {
                command,
                runAsync: false,
                suppressInputEcho: options.suppressInputEcho,
            }, timeoutSeconds);
            return {
                output: result.output ?? result.stdout ?? result.stderr ?? '',
                ...(result.stdout ? { stdout: result.stdout } : {}),
                ...(result.stderr ? { stderr: result.stderr } : {}),
                exitCode: typeof result.exitCode === 'number' ? result.exitCode : null,
                ...(result.cmdId ? { cmdId: result.cmdId } : {}),
            };
        }
        const result = await sandbox.process.executeCommand(command, undefined, undefined, timeoutSeconds);
        return {
            output: result.result ?? result.artifacts?.stdout ?? '',
            ...(result.artifacts?.stdout ? { stdout: result.artifacts.stdout } : {}),
            exitCode: typeof result.exitCode === 'number' ? result.exitCode : null,
        };
    }
    async startScript(handle, options) {
        const sandbox = this.requireSandbox(handle);
        if (!this.supportsSessionExec(sandbox)) {
            throw new Error('Daytona session execution is not available on this sandbox');
        }
        const sessionId = options.sessionId ?? `run-${handle.id}-${Date.now()}`;
        await sandbox.process.createSession(sessionId);
        // Capture the run's combined stdout+stderr to a per-session log file.
        //
        // Daytona's REST `getSessionCommandLogs` snapshot returns EMPTY for
        // `runAsync: true` commands — the command RECORD keeps the exitCode (so
        // getScriptStatus works), but the log BODY is only retrievable via the
        // follow=true WebSocket stream, which the SDK implements with
        // `isomorphic-ws` → node `ws` and therefore does NOT run on the Cloudflare
        // Worker that polls these runs. Without capture, every poll reads empty
        // output and a failing run surfaces only as the bare "runner.mjs failed"
        // fallback string (cloud #1516).
        //
        // A command group redirects only this run's script and leaves the session's
        // stdout/stderr intact for the later synchronous `tail` read. Its exit code
        // is the exit code of the last command in the group, so this still preserves
        // the script status. getScriptLogs reads this file back.
        const logPath = this.scriptLogPath(sessionId);
        const command = `{\n${this.buildScriptCommand(options)}\n} > ${shellSingleQuote(logPath)} 2>&1`;
        const result = await sandbox.process.executeSessionCommand(sessionId, {
            command,
            runAsync: true,
            suppressInputEcho: options.suppressInputEcho,
        }, this.msToSeconds(options.timeoutMs));
        if (!result.cmdId) {
            throw new Error('Daytona async session command did not return a command id');
        }
        return { sessionId, commandId: result.cmdId };
    }
    async getScriptStatus(handle, sessionId, commandId) {
        const sandbox = this.requireSandbox(handle);
        if (!this.supportsSessionExec(sandbox)) {
            throw new Error('Daytona session execution is not available on this sandbox');
        }
        const command = await sandbox.process.getSessionCommand(sessionId, commandId);
        return {
            exitCode: typeof command.exitCode === 'number' ? command.exitCode : null,
        };
    }
    async getScriptLogs(handle, sessionId, commandId) {
        const sandbox = this.requireSandbox(handle);
        if (!this.supportsSessionExec(sandbox)) {
            throw new Error('Daytona session execution is not available on this sandbox');
        }
        const logs = await sandbox.process.getSessionCommandLogs(sessionId, commandId);
        let output = logs.output ?? logs.stdout ?? logs.stderr ?? '';
        // Fallback for runAsync commands whose snapshot logs come back empty (see
        // startScript): read the per-session redirect file we captured. Bounded at
        // the source with `tail -c` so a multi-MB run can't pull the whole file
        // into the Worker. The read uses the sync (runAsync:false) path, which
        // returns output inline over REST and works on the Worker. Best-effort: a
        // recycled sandbox / missing file / closed session yields empty — exactly
        // the same blind state as before, never a throw (cloud #1516).
        if (!output) {
            try {
                const logPath = this.scriptLogPath(sessionId);
                const fileLogs = await sandbox.process.executeSessionCommand(sessionId, {
                    command: `tail -c ${SCRIPT_LOG_READ_MAX_BYTES} ${shellSingleQuote(logPath)} 2>/dev/null || true`,
                    runAsync: false,
                });
                output = fileLogs.output ?? fileLogs.stdout ?? fileLogs.stderr ?? '';
            }
            catch {
                // best-effort; keep the empty snapshot result
            }
        }
        return {
            output,
            ...(logs.stdout ? { stdout: logs.stdout } : {}),
            ...(logs.stderr ? { stderr: logs.stderr } : {}),
            exitCode: null,
            cmdId: commandId,
        };
    }
    startExec(handle, command, options = {}) {
        return this.startScript(handle, {
            command,
            sessionId: options.sessionId,
            timeoutMs: options.timeoutMs,
            env: options.env,
            useSession: true,
            suppressInputEcho: true,
        });
    }
    getExecStatus(handle, sessionId, commandId) {
        return this.getScriptStatus(handle, sessionId, commandId);
    }
    async getExecLogs(handle, sessionId, commandId) {
        const logs = await this.getScriptLogs(handle, sessionId, commandId);
        return {
            output: logs.output,
            exitCode: logs.exitCode ?? 0,
        };
    }
    async uploadFile(handle, source, destination) {
        const sandbox = this.requireSandbox(handle);
        if (typeof source === 'string') {
            await sandbox.fs.uploadFile(source, destination);
            return;
        }
        await sandbox.fs.uploadFile(source, destination);
    }
    async uploadBundle(handle, options) {
        await this.ensureUploadParentDirectories(handle, this.uploadParentDirectories(options));
        for (const file of options.files) {
            await this.uploadFile(handle, file.source, file.destination);
        }
        if (options.manifest !== undefined) {
            await this.uploadFile(handle, Buffer.from(JSON.stringify(options.manifest, null, 2), 'utf8'), options.manifestPath ?? '/workspace/manifest.json');
        }
    }
    async downloadFile(handle, source, destination) {
        const sandbox = this.requireSandbox(handle);
        if (destination) {
            await sandbox.fs.downloadFile(source, destination);
            return;
        }
        return sandbox.fs.downloadFile(source);
    }
    async getHomeDir(handle) {
        if (handle.homeDir) {
            return handle.homeDir;
        }
        const sandbox = this.requireSandbox(handle);
        const homeDir = await this.resolveHomeDir(sandbox);
        handle.homeDir = homeDir;
        return homeDir;
    }
    async destroy(handle) {
        const entry = this.sandboxes.get(handle.id);
        if (!entry) {
            return;
        }
        if (!entry.owned) {
            // For attached (non-owned) sandboxes we never call the remote
            // delete; just drop the local registration so the caller-managed
            // resource isn't tracked here any more.
            this.sandboxes.delete(handle.id);
            return;
        }
        const client = this.daytona;
        const remove = client.remove ?? client.delete;
        // Order matters: do the remote delete *first*, and only drop the
        // local map entry after it succeeds. If we dropped the entry first
        // and the remote delete then failed, the handle id would be lost
        // and the caller could not retry cleanup safely.
        await remove.call(client, entry.sandbox);
        this.sandboxes.delete(handle.id);
    }
    async stop(handle) {
        const entry = this.sandboxes.get(handle.id);
        if (!entry) {
            return;
        }
        if (!entry.owned) {
            return;
        }
        const client = this.daytona;
        if (client.stop) {
            await client.stop(entry.sandbox);
            return;
        }
        await entry.sandbox.stop?.();
    }
    async start(handle) {
        const entry = this.sandboxes.get(handle.id);
        if (!entry) {
            return handle;
        }
        if (!entry.owned) {
            return handle;
        }
        const client = this.daytona;
        if (client.start) {
            await client.start(entry.sandbox);
        }
        else {
            await entry.sandbox.start?.();
        }
        handle.state = 'STARTED';
        return handle;
    }
    async createSandbox(options) {
        const params = this.buildCreateParams(options);
        const createOptions = this.buildCreateOptions(options);
        if (this.snapshot) {
            try {
                return await this.createWithOptions({ snapshot: this.snapshot, ...params }, createOptions);
            }
            catch (err) {
                // Only fall back to a fresh sandbox when the snapshot itself is
                // missing. Auth/network/quota errors should bubble — otherwise
                // we silently mask real failures (a 401 ends up creating an
                // unsnapshotted sandbox under whichever credentials worked).
                if (!isSnapshotNotFoundError(err)) {
                    throw err;
                }
            }
        }
        return this.createWithOptions({ language: 'typescript', ...params }, createOptions);
    }
    async createSandboxDetached(options) {
        const params = this.buildCreateParams(options);
        const createOptions = this.buildCreateOptions(options);
        if (this.snapshot) {
            try {
                return await this.createDetachedWithOptions({ snapshot: this.snapshot, ...params }, createOptions);
            }
            catch (err) {
                if (!isSnapshotNotFoundError(err)) {
                    throw err;
                }
                throw new SnapshotNotFoundError(this.snapshot, err);
            }
        }
        return this.createDetachedWithOptions({ language: 'typescript', ...params }, createOptions);
    }
    buildCreateParams(options) {
        const envVars = options.env && Object.keys(options.env).length > 0 ? options.env : undefined;
        const name = options.name?.trim()
            ? options.name.trim()
            : options.label?.trim()
                ? options.label.trim()
                : undefined;
        const labels = options.labels && Object.keys(options.labels).length > 0 ? options.labels : undefined;
        return {
            ...(envVars ? { envVars } : {}),
            ...(name ? { name } : {}),
            ...(labels ? { labels } : {}),
        };
    }
    buildCreateOptions(options) {
        if (!options.createTimeoutSeconds || options.createTimeoutSeconds <= 0) {
            return undefined;
        }
        return { timeout: Math.ceil(options.createTimeoutSeconds) };
    }
    createWithOptions(params, createOptions) {
        if (createOptions) {
            return this.daytona.create(params, createOptions);
        }
        return this.daytona.create(params);
    }
    async createDetachedWithOptions(params, createOptions) {
        const client = this.daytona;
        const labels = params.labels && typeof params.labels === 'object'
            ? { ...params.labels }
            : {};
        const language = typeof params.language === 'string' && params.language.trim()
            ? params.language.trim()
            : 'python';
        labels['code-toolbox-language'] = language;
        const response = await client.sandboxApi.createSandbox({
            name: params.name,
            snapshot: params.snapshot,
            env: params.envVars ?? {},
            labels,
            target: client.target,
        }, undefined, createOptions ? { timeout: Math.min(createOptions.timeout, 15) * 1000 } : undefined);
        const handle = {
            id: response.data.id,
            ...((response.data.state ?? response.data.status)
                ? { state: response.data.state ?? response.data.status }
                : {}),
        };
        if (!this.matchesState(handle, ['STARTED'])) {
            return handle;
        }
        try {
            return await client.get(response.data.id);
        }
        catch {
            return { ...handle, state: 'STARTING' };
        }
    }
    listSandboxes(labels, options) {
        const query = {
            labels,
            limit: options.limit,
        };
        if (options.states !== null) {
            query.states = options.states.map(normalizeDaytonaState);
        }
        return this.daytona.list(query);
    }
    registerSandbox(sandbox, options) {
        const handle = {
            id: sandbox.id,
            ...(this.readSandboxState(sandbox) ? { state: this.readSandboxState(sandbox) } : {}),
            ...(sandbox.createdAt ? { createdAt: sandbox.createdAt } : {}),
            ...(sandbox.updatedAt ? { updatedAt: sandbox.updatedAt } : {}),
            ...(sandbox.lastActivityAt ? { lastActivityAt: sandbox.lastActivityAt } : {}),
            ...(options.homeDir ? { homeDir: options.homeDir } : {}),
            ...(options.workdir ? { workdir: options.workdir } : {}),
        };
        this.sandboxes.set(handle.id, {
            sandbox,
            owned: options.owned,
        });
        return handle;
    }
    requireSandbox(handle) {
        const entry = this.sandboxes.get(handle.id);
        if (!entry) {
            throw new Error(`Runtime handle "${handle.id}" is no longer active`);
        }
        return entry.sandbox;
    }
    supportsSessionExec(sandbox) {
        const process = sandbox.process;
        if (!process || typeof process !== 'object') {
            return false;
        }
        const candidate = process;
        return (typeof candidate.createSession === 'function' &&
            typeof candidate.executeSessionCommand === 'function');
    }
    buildScriptCommand(options) {
        const statements = [];
        if (options.cwd) {
            statements.push(`cd ${shellSingleQuote(options.cwd)}`);
        }
        for (const [key, value] of Object.entries(options.env ?? {})) {
            statements.push(`export ${key}=${shellSingleQuote(value)}`);
        }
        statements.push(options.command);
        return statements.join('\n');
    }
    // Deterministic per-session log path written by startScript's `exec`
    // redirect and read back by getScriptLogs. Keyed by sessionId (known before
    // the command id exists) and filesystem-sanitised. Proactive delivery runs
    // one command per `tick-<deploymentId>` session, so this is unambiguous.
    scriptLogPath(sessionId) {
        return `/tmp/.daytona-run-${sessionSafeId(sessionId)}.log`;
    }
    matchesState(sandbox, states) {
        if (states === null) {
            return true;
        }
        const expected = new Set(states.map((state) => state.toUpperCase()));
        const actual = this.readSandboxState(sandbox);
        return actual ? expected.has(actual.toUpperCase()) : false;
    }
    readSandboxState(sandbox) {
        const candidate = sandbox;
        const value = candidate.state
            ?? candidate.status
            ?? candidate.sandboxState
            ?? candidate.info?.state
            ?? candidate.info?.status;
        return typeof value === 'string' && value.trim() ? value.trim() : null;
    }
    uploadParentDirectories(options) {
        const destinations = options.files.map((file) => file.destination);
        if (options.manifest !== undefined) {
            destinations.push(options.manifestPath ?? '/workspace/manifest.json');
        }
        const directories = new Set();
        for (const destination of destinations) {
            const directory = parentDirectory(destination);
            if (directory) {
                directories.add(directory);
            }
        }
        return Array.from(directories).sort();
    }
    async ensureUploadParentDirectories(handle, directories) {
        if (directories.length === 0) {
            return;
        }
        const result = await this.runScript(handle, {
            command: `mkdir -p ${directories.map(shellSingleQuote).join(' ')}`,
            sessionId: `mkdir-${sessionSafeId(handle.id)}-${Date.now()}`,
            timeoutMs: 30_000,
        });
        if (result.exitCode == null || result.exitCode !== 0) {
            throw new Error(`Failed to create upload directories: ${result.output || result.stderr || result.stdout || 'mkdir failed'}`);
        }
    }
    async resolveHomeDir(sandbox) {
        try {
            const home = await sandbox.getUserHomeDir();
            if (home) {
                return home;
            }
        }
        catch {
            // fall through to default
        }
        return this.defaultHomeDir;
    }
    msToSeconds(timeoutMs) {
        if (!timeoutMs || timeoutMs <= 0) {
            return undefined;
        }
        return Math.max(1, Math.ceil(timeoutMs / 1000));
    }
}
function normalizeDaytonaState(state) {
    return state.toLowerCase();
}
function isRuntimeHandle(value) {
    return !('getUserHomeDir' in value);
}
function shellSingleQuote(value) {
    return `'${value.replaceAll("'", "'\\''")}'`;
}
function sessionSafeId(value) {
    return value.replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'sandbox';
}
function parentDirectory(destination) {
    const normalized = destination.trim().replace(/\/+$/g, '');
    if (!normalized || normalized === '/' || !normalized.includes('/')) {
        return null;
    }
    const separatorIndex = normalized.lastIndexOf('/');
    if (separatorIndex <= 0) {
        return null;
    }
    const directory = normalized.slice(0, separatorIndex);
    return directory && directory !== '.' ? directory : null;
}
/**
 * Heuristic: identify Daytona errors that indicate the snapshot we asked
 * for doesn't exist (so falling back to a fresh sandbox is safe). We look
 * at the HTTP status when the SDK surfaces one, plus a few well-known
 * error-message shapes Daytona emits. Anything else propagates so the
 * caller sees the original error (auth/network/quota/etc.).
 */
function isSnapshotNotFoundError(err) {
    if (!err || typeof err !== 'object')
        return false;
    const candidate = err;
    const status = typeof candidate.status === 'number'
        ? candidate.status
        : typeof candidate.statusCode === 'number'
            ? candidate.statusCode
            : undefined;
    if (status === 404)
        return true;
    const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : '';
    if (!message)
        return false;
    return (message.includes('snapshot') &&
        (message.includes('not found') || message.includes('does not exist') || message.includes('no such')));
}
function isDaytonaNotFoundError(err) {
    if (!err || typeof err !== 'object')
        return false;
    const candidate = err;
    const status = typeof candidate.status === 'number'
        ? candidate.status
        : typeof candidate.statusCode === 'number'
            ? candidate.statusCode
            : undefined;
    if (status === 404)
        return true;
    if (candidate.name === 'DaytonaNotFoundError')
        return true;
    const message = typeof candidate.message === 'string' ? candidate.message.toLowerCase() : '';
    return message.includes('sandbox') && message.includes('not found');
}
