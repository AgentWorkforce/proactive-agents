import { describe, it, mock } from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import {
  attachPoolErrorListener,
  attachPoolLifecycleTelemetry,
  getWorkerNeonPoolConfigForTesting,
} from "../src/db/worker-neon.js";

describe("worker-neon pool error listener", () => {
  it("configures Worker Neon pools to bound stale socket waits", () => {
    assert.deepEqual(getWorkerNeonPoolConfigForTesting(), {
      connectionTimeoutMillis: 3_000,
      idleTimeoutMillis: 1,
      maxUses: 1,
    });
  });

  it("swallows pool connection errors instead of throwing EventEmitter unhandled errors", () => {
    const pool = new EventEmitter();
    const warn = mock.method(console, "warn", () => {});
    try {
      attachPoolErrorListener(pool);

      // Without a listener, EventEmitter#emit("error") throws
      // `Unhandled error. (Uncaught Error: Network connection lost.)` —
      // the exact log line observed on the prod Worker when workerd severs
      // the pool's idle Neon WebSockets at request-context teardown.
      assert.doesNotThrow(() => {
        pool.emit("error", new Error("Network connection lost."));
      });

      assert.equal(warn.mock.callCount(), 1);
      const [message, detail] = warn.mock.calls[0].arguments;
      assert.match(String(message), /neon pool connection error/);
      assert.equal(detail, "Network connection lost.");
    } finally {
      warn.mock.restore();
    }
  });

  it("stringifies non-Error values defensively", () => {
    const pool = new EventEmitter();
    const warn = mock.method(console, "warn", () => {});
    try {
      attachPoolErrorListener(pool);
      // EventEmitter still throws for non-listener cases only; with the
      // listener attached an arbitrary value must not crash the handler.
      assert.doesNotThrow(() => {
        pool.emit("error", "socket gone");
      });
      assert.equal(warn.mock.callCount(), 1);
      assert.equal(warn.mock.calls[0].arguments[1], "socket gone");
    } finally {
      warn.mock.restore();
    }
  });

  it("logs failed pool acquisition timing", async () => {
    const pool = new EventEmitter() as EventEmitter & {
      connect: () => Promise<unknown>;
      totalCount: number;
      idleCount: number;
      waitingCount: number;
    };
    pool.totalCount = 1;
    pool.idleCount = 0;
    pool.waitingCount = 1;
    pool.connect = async () => {
      throw new Error("timeout exceeded when trying to connect");
    };
    const warn = mock.method(console, "warn", () => {});
    try {
      attachPoolLifecycleTelemetry(pool);

      await assert.rejects(() => pool.connect(), /timeout exceeded/);

      assert.equal(warn.mock.callCount(), 1);
      const [message, fields] = warn.mock.calls[0].arguments;
      assert.equal(message, "[db] neon worker pool acquire timing");
      assert.equal(typeof (fields as { durationMs?: unknown }).durationMs, "number");
      assert.deepEqual({ ...(fields as object), durationMs: 0 }, {
        durationMs: 0,
        outcome: "error",
        totalCount: 1,
        idleCount: 0,
        waitingCount: 1,
        error: "timeout exceeded when trying to connect",
      });
    } finally {
      warn.mock.restore();
    }
  });
});
