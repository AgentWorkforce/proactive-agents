import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Fleet schema now lives entirely in the @relaycast/engine 4.0 migrations that
// #2189 copied into the hosted worker (0016_fleet_nodes … 0019_fleet_mailbox).
// PR #2090's separate cloud "0016 bridge" was dropped during the engine-4.0
// rebase to avoid a duplicate-0016 / duplicate-column collision, so this test
// applies the REAL engine migration chain against better-sqlite3 and asserts the
// node/action-retry/mailbox shape the cloud fleet code depends on.
const ENGINE_MIGRATIONS = [
  '0016_fleet_nodes.sql',
  '0017_spawn_reservation_and_retry_state.sql',
  '0018_spawn_reserved_at.sql',
  '0019_fleet_mailbox.sql',
] as const;

function readMigration(name: string): string {
  return readFileSync(new URL(`../../db/migrations/${name}`, import.meta.url), 'utf8');
}

// Representative pre-0016 schema: only the tables/columns the engine migrations
// read, rename, ALTER, or backfill. This lets us run the REAL migration SQL
// against a real SQLite engine instead of grepping the files as strings.
const PRE_FLEET_SCHEMA = `
  CREATE TABLE workspaces (id TEXT PRIMARY KEY NOT NULL);
  CREATE TABLE agents (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE messages (id TEXT PRIMARY KEY NOT NULL, channel_id TEXT);
  CREATE TABLE deliveries (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    mode TEXT NOT NULL DEFAULT 'immediate',
    reason TEXT,
    priority TEXT NOT NULL DEFAULT 'normal',
    deadline INTEGER DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'accepted',
    retryable INTEGER DEFAULT NULL,
    available_at INTEGER DEFAULT NULL,
    error TEXT DEFAULT NULL,
    idempotency_key TEXT DEFAULT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT NULL
  );
  CREATE UNIQUE INDEX deliveries_message_agent_unique ON deliveries(message_id, agent_id);
  CREATE TABLE actions (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    handler_agent_id TEXT,
    input_schema TEXT DEFAULT '{}',
    output_schema TEXT DEFAULT '{}',
    available_to TEXT DEFAULT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE UNIQUE INDEX actions_workspace_name_unique ON actions(workspace_id, name);
  CREATE TABLE action_invocations (
    id TEXT PRIMARY KEY NOT NULL,
    workspace_id TEXT NOT NULL,
    action_id TEXT,
    action_name TEXT NOT NULL,
    caller_id TEXT,
    caller_name TEXT,
    input TEXT DEFAULT '{}',
    output TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'invoked',
    error TEXT DEFAULT NULL,
    duration_ms INTEGER DEFAULT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    completed_at INTEGER DEFAULT NULL
  );
`;

function freshMigratedDb(): Database.Database {
  const db = new Database(':memory:');
  db.exec(PRE_FLEET_SCHEMA);
  for (const name of ENGINE_MIGRATIONS) {
    db.exec(readMigration(name));
  }
  db.prepare('INSERT INTO workspaces (id) VALUES (?)').run('ws1');
  db.prepare("INSERT INTO agents (id, workspace_id, name, status) VALUES (?, ?, ?, 'active')").run('a1', 'ws1', 'worker');
  return db;
}

describe('engine 4.0 fleet D1 migrations — applied to a fresh DB', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = freshMigratedDb();
  });

  afterEach(() => {
    db.close();
  });

  it('applies the full engine chain (0016–0019) with no duplicate-column error', () => {
    // freshMigratedDb already ran every migration in beforeEach; reaching here
    // proves there is no duplicate ADD COLUMN / duplicate-0016 collision.
    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(
      (t) => t.name,
    );
    expect(tables).toContain('nodes');
    expect(tables).toContain('triggers');
  });

  it('enforces a full per-agent seq unique index (engine 4.0 assigns seq on insert)', () => {
    const insert = db.prepare(
      'INSERT INTO deliveries (id, workspace_id, message_id, agent_id, status, seq) VALUES (?, ?, ?, ?, ?, ?)',
    );
    expect(() => insert.run('d3', 'ws1', 'm3', 'a1', 'queued', 5)).not.toThrow();
    // Same (workspace, agent, seq) but a different message must collide: the
    // engine 4.0 mailbox is first-class and assigns a distinct seq per agent.
    expect(() => insert.run('d4', 'ws1', 'm4', 'a1', 'queued', 5)).toThrow(/UNIQUE/i);
    // A different seq for the same agent is fine.
    expect(() => insert.run('d5', 'ws1', 'm5', 'a1', 'queued', 6)).not.toThrow();
  });

  it('creates the node, action retry, and mailbox columns the node engine requires', () => {
    const deliveryCols = (db.prepare('PRAGMA table_info(deliveries)').all() as { name: string }[]).map((c) => c.name);
    for (const col of ['seq', 'location_type', 'location_node_id', 'expires_at', 'acked_at', 'dead_lettered_at']) {
      expect(deliveryCols).toContain(col);
    }

    const invocationCols = (db.prepare('PRAGMA table_info(action_invocations)').all() as { name: string }[]).map(
      (c) => c.name,
    );
    for (const col of ['attempted_node_ids', 'dispatch_attempts', 'retry_after_at', 'spawn_reserved_at', 'dispatched_node_id']) {
      expect(invocationCols).toContain(col);
    }

    const nodeCols = (db.prepare('PRAGMA table_info(nodes)').all() as { name: string }[]).map((c) => c.name);
    expect(nodeCols).toContain('reserved_agents');

    const actionCols = (db.prepare('PRAGMA table_info(actions)').all() as { name: string }[]).map((c) => c.name);
    expect(actionCols).toContain('handler_node_id');

    const agentCols = (db.prepare('PRAGMA table_info(agents)').all() as { name: string }[]).map((c) => c.name);
    for (const col of ['location_type', 'location_node_id', 'resumable', 'session_ref', 'origin_node_id', 'delivery_ack_seq']) {
      expect(agentCols).toContain(col);
    }
  });

  it('uses a full (non-partial) deliveries_agent_seq_unique index', () => {
    const ddl = db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'index' AND name = 'deliveries_agent_seq_unique'")
      .get() as { sql: string } | undefined;
    expect(ddl?.sql).toBeTruthy();
    // Engine 4.0 dropped the cloud-only `WHERE seq > 0` partial scoping.
    expect(ddl?.sql).not.toMatch(/WHERE\s+seq\s*>\s*0/i);
  });
});
