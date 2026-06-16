import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { NangoSyncJob } from "../src/sync/nango-sync-job.js";
import { createNangoQueueAdapter } from "../src/sync/nango-queue-adapter.js";

describe("createNangoQueueAdapter", () => {
  it("adapts a Worker queue sender into the checkpoint re-enqueue contract", async () => {
    const sent: NangoSyncJob[] = [];
    const adapter = createNangoQueueAdapter((job) => {
      sent.push(job);
    });
    const job: NangoSyncJob = {
      type: "nango_sync",
      provider: "confluence",
      providerConfigKey: "confluence-relay",
      connectionId: "conn_1",
      syncName: "fetch-spaces",
      model: "ConfluenceSpace",
      modifiedAfter: "2026-05-19T00:00:00.000Z",
      cursor: "cursor-2",
      workspaceId: "rw_test",
    };

    await adapter.reenqueue(job);

    assert.deepEqual(sent, [job]);
  });
});
