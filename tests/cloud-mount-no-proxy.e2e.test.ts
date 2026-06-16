import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

type NangoSyncJob = {
  type: "nango_sync";
  provider: string;
  connectionId: string;
  providerConfigKey: string;
  syncName: string;
  model: string;
  modifiedAfter: string;
  cursor: string | null;
  workspaceId: string;
};

const {
  listRecordsMock,
  nangoProxyMock,
  markProviderInitialSyncCompleteMock,
  markProviderInitialSyncFailedMock,
  markProviderInitialSyncRunningMock,
  relayfileConstructorMock,
  writeBatchToRelayfileMock,
} = vi.hoisted(() => ({
  listRecordsMock: vi.fn(),
  nangoProxyMock: vi.fn(),
  markProviderInitialSyncCompleteMock: vi.fn().mockResolvedValue(undefined),
  markProviderInitialSyncFailedMock: vi.fn().mockResolvedValue(undefined),
  markProviderInitialSyncRunningMock: vi.fn().mockResolvedValue(undefined),
  relayfileConstructorMock: vi.fn(),
  writeBatchToRelayfileMock: vi.fn(),
}));

const WORKSPACE_ID = "22222222-2222-4222-8222-222222222222";

function fakeNotionRecords(count: number): Array<Record<string, unknown>> {
  return Array.from({ length: count }, (_, index) => {
    const n = String(index + 1).padStart(3, "0");
    return {
      id: `page-${n}`,
      title: `Cloud mount page ${n}`,
      url: `https://notion.so/page-${n}`,
      parent_type: "workspace",
      parent_id: null,
      last_edited_time: "2026-05-06T10:00:00.000Z",
      content_preview: `Record ${n}`,
      _nango_metadata: { last_action: "ADDED" },
    };
  });
}

function createJob(overrides: Partial<NangoSyncJob> = {}): NangoSyncJob {
  return {
    type: "nango_sync",
    provider: "notion",
    connectionId: "conn-notion-123",
    providerConfigKey: "notion-relay",
    syncName: "fetch-pages",
    model: "NotionPage",
    modifiedAfter: "2026-05-06T00:00:00.000Z",
    cursor: null,
    workspaceId: WORKSPACE_ID,
    ...overrides,
  };
}

function createEvent(job: NangoSyncJob) {
  return {
    Records: [
      {
        messageId: "message-1",
        receiptHandle: "receipt-1",
        body: JSON.stringify(job),
        attributes: {},
        messageAttributes: {},
        md5OfBody: "md5",
        eventSource: "aws:sqs",
        eventSourceARN: "arn:aws:sqs:us-east-1:123:NangoSyncQueue",
        awsRegion: "us-east-1",
      },
    ],
  };
}

function createContext(remainingMs: number) {
  return {
    getRemainingTimeInMillis: () => remainingMs,
  };
}

function installWorkerMocks(records: Array<Record<string, unknown>>) {
  vi.doMock("../packages/core/src/provider-readiness.js", () => ({
    markProviderInitialSyncComplete: markProviderInitialSyncCompleteMock,
    markProviderInitialSyncFailed: markProviderInitialSyncFailedMock,
    markProviderInitialSyncRunning: markProviderInitialSyncRunningMock,
  }));

  vi.doMock("../packages/core/src/relayfile/client.js", () => ({
    mintRelayfileToken: vi.fn().mockResolvedValue("relayfile-token"),
  }));

  vi.doMock("../packages/core/src/sync/record-writer.js", () => ({
    WRITE_CONCURRENCY: 10,
    writeBatchToRelayfile: writeBatchToRelayfileMock.mockResolvedValue({
      written: records.length,
      deleted: 0,
      errors: 0,
    }),
  }));

  vi.doMock(
    "@aws-sdk/client-sqs",
    () => ({
      SQSClient: vi.fn().mockImplementation(function SQSClient() {
        return {
        send: vi.fn().mockResolvedValue({}),
        };
      }),
      SendMessageCommand: vi.fn().mockImplementation((input: unknown) => ({ input })),
    }),
  );

  vi.doMock(
    "@nangohq/node",
    () => ({
      Nango: vi.fn().mockImplementation(function Nango() {
        return {
          listRecords: listRecordsMock.mockResolvedValue({
            records,
            next_cursor: null,
          }),
          proxy: nangoProxyMock.mockImplementation(() => {
            throw new Error("Nango proxy must not be called by cloud-mount ingest");
          }),
        };
      }),
    }),
  );

  vi.doMock(
    "@relayfile/adapter-notion",
    () => ({
      NotionAdapter: vi.fn().mockImplementation(() => {
        throw new Error("Legacy Notion adapter path must not be constructed");
      }),
    }),
  );

  vi.doMock(
    "@relayfile/provider-nango",
    () => ({
      fetchNangoRecords: vi.fn(),
      NotionIngestHandler: {
        handleNotionSyncNotification: vi.fn().mockRejectedValue(
          new Error("Legacy Notion ingest handler must not be used"),
        ),
      },
      NotionSupportedModelSchema: {
        safeParse: vi.fn().mockReturnValue({ success: true, data: "NotionPage" }),
      },
    }),
  );

  vi.doMock(
    "@relayfile/sdk",
    () => ({
      RelayFileClient: relayfileConstructorMock.mockImplementation(function RelayFileClient() {
        return {
          writeFile: vi.fn().mockResolvedValue(undefined),
          deleteFile: vi.fn().mockResolvedValue(undefined),
        };
      }),
    }),
  );

  vi.doMock(
    "sst",
    () => ({
      Resource: {
        NangoSecretKey: { value: "nango-secret" },
        WebRelayauthApiKey: { value: "relayauth-api-key" },
        NangoSyncQueue: { url: "https://sqs.us-east-1.amazonaws.com/123/NangoSyncQueue" },
      },
    }),
  );
}

async function loadWorker() {
  return import(
    new URL("../packages/core/src/sync/nango-sync-worker.ts", import.meta.url).href
  );
}

describe("cloud mount no-proxy contract", () => {
  it("writes a Notion sync batch from Nango records without calling the Nango proxy", async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const records = fakeNotionRecords(100);
    installWorkerMocks(records);
    const { handler } = await loadWorker();

    await expect(
      handler(createEvent(createJob()), createContext(300_000), vi.fn()),
    ).resolves.toBeUndefined();

    expect(listRecordsMock).toHaveBeenCalledWith({
      providerConfigKey: "notion-relay",
      connectionId: "conn-notion-123",
      model: "NotionPage",
      modifiedAfter: "2026-05-06T00:00:00.000Z",
      limit: 100,
    });
    expect(writeBatchToRelayfileMock).toHaveBeenCalledTimes(1);
    expect(writeBatchToRelayfileMock).toHaveBeenCalledWith(
      expect.anything(),
      records,
      createJob(),
      { concurrency: 10 },
    );
    expect(nangoProxyMock).not.toHaveBeenCalled();
    expect(markProviderInitialSyncRunningMock).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      provider: "notion",
      syncName: "fetch-pages",
      model: "NotionPage",
      modifiedAfter: "2026-05-06T00:00:00.000Z",
    });
    expect(markProviderInitialSyncCompleteMock).toHaveBeenCalledWith({
      workspaceId: WORKSPACE_ID,
      provider: "notion",
      syncName: "fetch-pages",
      model: "NotionPage",
      modifiedAfter: "2026-05-06T00:00:00.000Z",
    });
  });

  it("keeps the worker source free of the legacy Notion proxy fanout helpers", async () => {
    const source = await readFile(
      resolve("packages/core/src/sync/nango-sync-worker.ts"),
      "utf8",
    );

    expect(source).not.toContain("proxyNotionRequest");
    expect(source).not.toContain("createNotionAdapter");
    expect(source).not.toContain("NotionConnectionProvider");
    expect(source).not.toContain("nangoClient.proxy");
  });
});

describe("cloud-owned Nango metadata", () => {
  it("declares relay-owned provider config keys and no sage-owned config keys", async () => {
    const body = await readFile(
      resolve("nango-integrations/.nango/nango.json"),
      "utf8",
    );
    const configs = JSON.parse(body) as Array<{
      providerConfigKey?: string;
      syncs?: Array<{ name?: string; runs?: string; output?: string[] }>;
    }>;

    expect(configs.map((config) => config.providerConfigKey).sort()).toEqual([
      "confluence-relay",
      "github-relay",
      "jira-relay",
      "linear-relay",
      "notion-relay",
      "slack-relay",
    ]);
    expect(body).not.toMatch(/-sage["/]/);
    expect(
      configs.flatMap((config) =>
        (config.syncs ?? []).map((sync) => `${config.providerConfigKey}:${sync.name}`),
      ),
    ).toEqual(expect.arrayContaining([
      "notion-relay:fetch-pages",
      "linear-relay:fetch-active-issues",
      "github-relay:fetch-repos",
      "slack-relay:fetch-channel-history",
    ]));
  });
});
