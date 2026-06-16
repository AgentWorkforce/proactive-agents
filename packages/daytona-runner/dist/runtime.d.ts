import type { Daytona, Sandbox } from '@daytonaio/sdk';
import type { ExecOptions, ExecResult, AsyncExecStartResult, AsyncExecStatus, LaunchOptions, RuntimeCapabilities, RuntimeHandle, WorkflowRuntime } from './types.js';
export interface DaytonaRuntimeOptions {
    daytona: Daytona;
    snapshot?: string;
    defaultHomeDir?: string;
}
export declare class SnapshotNotFoundError extends Error {
    readonly snapshot: string;
    constructor(snapshot: string, cause?: unknown);
}
export interface DaytonaAttachedSandboxOptions {
    homeDir?: string;
    workdir?: string;
    owned?: boolean;
    states?: readonly string[] | null;
}
export interface DaytonaFindByLabelsOptions extends DaytonaAttachedSandboxOptions {
    states?: readonly string[] | null;
    limit?: number;
    /** @deprecated Use limit. */
    pageSize?: number;
}
export interface DaytonaRunScriptOptions extends ExecOptions {
    command: string;
    sessionId?: string;
    useSession?: boolean;
    suppressInputEcho?: boolean;
}
export interface DaytonaRunScriptResult {
    output: string;
    stdout?: string;
    stderr?: string;
    exitCode: number | null;
    cmdId?: string;
}
export interface DaytonaBundleFile {
    source: string | Buffer;
    destination: string;
}
export interface DaytonaUploadBundleOptions {
    files: DaytonaBundleFile[];
    manifest?: unknown;
    manifestPath?: string;
}
export declare class DaytonaRuntime implements WorkflowRuntime {
    readonly id = "daytona";
    readonly capabilities: RuntimeCapabilities;
    private readonly sandboxes;
    private readonly daytona;
    private readonly snapshot?;
    private readonly defaultHomeDir;
    constructor(options: DaytonaRuntimeOptions);
    launch(options?: LaunchOptions): Promise<RuntimeHandle>;
    launchDetached(options?: LaunchOptions): Promise<RuntimeHandle>;
    getById(id: string, options?: DaytonaAttachedSandboxOptions): Promise<RuntimeHandle | null>;
    findByLabels(labels: Record<string, string>, options?: DaytonaFindByLabelsOptions): Promise<RuntimeHandle | null>;
    findAllByLabels(labels: Record<string, string>, options?: DaytonaFindByLabelsOptions): Promise<RuntimeHandle[]>;
    attachSandbox(sandbox: Sandbox, options?: DaytonaAttachedSandboxOptions): RuntimeHandle;
    exec(handle: RuntimeHandle, command: string, options?: ExecOptions): Promise<ExecResult>;
    runScript(handle: RuntimeHandle, options: DaytonaRunScriptOptions): Promise<DaytonaRunScriptResult>;
    startScript(handle: RuntimeHandle, options: DaytonaRunScriptOptions): Promise<AsyncExecStartResult>;
    getScriptStatus(handle: RuntimeHandle, sessionId: string, commandId: string): Promise<AsyncExecStatus>;
    getScriptLogs(handle: RuntimeHandle, sessionId: string, commandId: string): Promise<DaytonaRunScriptResult>;
    startExec(handle: RuntimeHandle, command: string, options?: ExecOptions & {
        sessionId?: string;
    }): Promise<AsyncExecStartResult>;
    getExecStatus(handle: RuntimeHandle, sessionId: string, commandId: string): Promise<AsyncExecStatus>;
    getExecLogs(handle: RuntimeHandle, sessionId: string, commandId: string): Promise<ExecResult>;
    uploadFile(handle: RuntimeHandle, source: string | Buffer, destination: string): Promise<void>;
    uploadBundle(handle: RuntimeHandle, options: DaytonaUploadBundleOptions): Promise<void>;
    downloadFile(handle: RuntimeHandle, source: string, destination?: string): Promise<Buffer | void>;
    getHomeDir(handle: RuntimeHandle): Promise<string>;
    destroy(handle: RuntimeHandle): Promise<void>;
    stop(handle: RuntimeHandle): Promise<void>;
    start(handle: RuntimeHandle): Promise<RuntimeHandle>;
    private createSandbox;
    private createSandboxDetached;
    private buildCreateParams;
    private buildCreateOptions;
    private createWithOptions;
    private createDetachedWithOptions;
    private listSandboxes;
    private registerSandbox;
    private requireSandbox;
    private supportsSessionExec;
    private buildScriptCommand;
    private scriptLogPath;
    private matchesState;
    private readSandboxState;
    private uploadParentDirectories;
    private ensureUploadParentDirectories;
    private resolveHomeDir;
    private msToSeconds;
}
