import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { NangoSyncJob } from "../packages/core/src/sync/nango-sync-job.js";

const {
  listRecordsMock,
  markProviderInitialSyncCompleteMock,
  markProviderInitialSyncFailedMock,
  markProviderInitialSyncRunningMock,
  nangoProxyMock,
  relayfileConstructorMock,
  notionAdapterConstructorMock,
  handleNotionSyncNotificationMock,
  sqsSendMock,
  sendMessageCommandMock,
  writeFileMock,
  deleteFileMock,
} = vi.hoisted(() => ({
  listRecordsMock: vi.fn(),
  markProviderInitialSyncCompleteMock: vi.fn().mockResolvedValue(undefined),
  markProviderInitialSyncFailedMock: vi.fn().mockResolvedValue(undefined),
  markProviderInitialSyncRunningMock: vi.fn().mockResolvedValue(undefined),
  nangoProxyMock: vi.fn(),
  relayfileConstructorMock: vi.fn(),
  notionAdapterConstructorMock: vi.fn(),
  handleNotionSyncNotificationMock: vi.fn(),
  sqsSendMock: vi.fn().mockResolvedValue({}),
  sendMessageCommandMock: vi.fn(function SendMessageCommand(input: unknown) {
    return { input };
  }),
  writeFileMock: vi.fn().mockResolvedValue(undefined),
  deleteFileMock: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../packages/core/src/provider-readiness.js", () => ({
  markProviderInitialSyncComplete: markProviderInitialSyncCompleteMock,
  markProviderInitialSyncFailed: markProviderInitialSyncFailedMock,
  markProviderInitialSyncRunning: markProviderInitialSyncRunningMock,
}));

vi.mock("@relayfile/adapter-notion", () => ({
  NotionAdapter: notionAdapterConstructorMock.mockImplementation(
    function NotionAdapter() {
      return {};
    },
  ),
}));

vi.mock("@nangohq/node", () => ({
  Nango: vi.fn().mockImplementation(function Nango() {
    return {
      listRecords: listRecordsMock,
      proxy: nangoProxyMock,
    };
  }),
}));

vi.mock("@relayfile/provider-nango", () => ({
  fetchNangoRecords: vi.fn(),
  NotionIngestHandler: {
    handleNotionSyncNotification: handleNotionSyncNotificationMock,
  },
  NotionSupportedModelSchema: {
    safeParse: (value: unknown) =>
      value === "NotionDatabase" ||
      value === "NotionPage" ||
      value === "NotionContentMetadata"
        ? { success: true, data: value }
        : { success: false },
  },
}));

vi.mock("@aws-sdk/client-sqs", () => ({
  SQSClient: vi.fn().mockImplementation(function SQSClient() {
    return {
      send: sqsSendMock,
    };
  }),
  SendMessageCommand: sendMessageCommandMock,
}));

vi.mock("@relayfile/sdk", () => ({
  RelayFileClient: relayfileConstructorMock.mockImplementation(
    function RelayFileClient() {
      return {
        writeFile: writeFileMock,
        deleteFile: deleteFileMock,
      };
    },
  ),
}));

vi.mock("sst", () => ({
  Resource: {
    NangoSecretKey: { value: "nango-secret" },
    RelayJwtSecret: { value: "relay-secret" },
    NangoSyncQueue: { url: "https://sqs.us-east-1.amazonaws.com/123/NangoSyncQueue" },
  },
}));

function installWorkerMocks(): void {
  vi.doMock("../packages/core/src/provider-readiness.js", () => ({
    markProviderInitialSyncComplete: markProviderInitialSyncCompleteMock,
    markProviderInitialSyncFailed: markProviderInitialSyncFailedMock,
    markProviderInitialSyncRunning: markProviderInitialSyncRunningMock,
  }));

  vi.doMock("@relayfile/adapter-notion", () => ({
    NotionAdapter: notionAdapterConstructorMock.mockImplementation(
      function NotionAdapter() {
        return {};
      },
    ),
  }));

  vi.doMock("@nangohq/node", () => ({
    Nango: vi.fn().mockImplementation(function Nango() {
      return {
        listRecords: listRecordsMock,
        proxy: nangoProxyMock,
      };
    }),
  }));

  vi.doMock("@relayfile/provider-nango", () => ({
    fetchNangoRecords: vi.fn(),
    NotionIngestHandler: {
      handleNotionSyncNotification: handleNotionSyncNotificationMock,
    },
    NotionSupportedModelSchema: {
      safeParse: (value: unknown) =>
        value === "NotionDatabase" ||
        value === "NotionPage" ||
        value === "NotionContentMetadata"
          ? { success: true, data: value }
          : { success: false },
    },
  }));

  vi.doMock("@aws-sdk/client-sqs", () => ({
    SQSClient: vi.fn().mockImplementation(function SQSClient() {
      return {
        send: sqsSendMock,
      };
    }),
    SendMessageCommand: sendMessageCommandMock,
  }));

  vi.doMock("@relayfile/sdk", () => ({
    RelayFileClient: relayfileConstructorMock.mockImplementation(
      function RelayFileClient() {
        return {
          writeFile: writeFileMock,
          deleteFile: deleteFileMock,
        };
      },
    ),
  }));

  vi.doMock("sst", () => ({
    Resource: {
      NangoSecretKey: { value: "nango-secret" },
      RelayJwtSecret: { value: "relay-secret" },
      NangoSyncQueue: { url: "https://sqs.us-east-1.amazonaws.com/123/NangoSyncQueue" },
    },
  }));
}

function createJob(overrides: Partial<NangoSyncJob> = {}): NangoSyncJob {
  return {
    type: "nango_sync",
    provider: "github",
    connectionId: "conn-123",
    providerConfigKey: "github-sage",
    syncName: "fetch-repos",
    model: "Repo",
    modifiedAfter: "2026-01-01T00:00:00Z",
    cursor: null,
    workspaceId: "22222222-2222-4222-8222-222222222222",
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

async function loadWorker() {
  return import(
    new URL("../packages/core/src/sync/nango-sync-worker.ts", import.meta.url).href
  );
}

describe("nango sync worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    installWorkerMocks();
    delete process.env.NANGO_HOST;
    delete process.env.RELAYFILE_URL;
    listRecordsMock.mockResolvedValue({ records: [], next_cursor: null });
    nangoProxyMock.mockResolvedValue({ status: 200, headers: {}, data: {} });
    handleNotionSyncNotificationMock.mockResolvedValue({
      written: 0,
      deletesDropped: 0,
      errorCount: 0,
      errors: [],
      durationMs: 1,
    });
    writeFileMock.mockResolvedValue(undefined);
    deleteFileMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches one page and writes records without re-enqueueing when complete", async () => {
    listRecordsMock.mockResolvedValueOnce({
      records: [
        {
          id: "repo-1",
          full_name: "AgentWorkforce/cloud",
          _nango_metadata: { last_action: "ADDED" },
        },
      ],
      next_cursor: null,
    });
    const { handler } = await loadWorker();

    await handler(createEvent(createJob()), createContext(180_000), vi.fn());

    expect(listRecordsMock).toHaveBeenCalledWith({
      providerConfigKey: "github-sage",
      connectionId: "conn-123",
      model: "Repo",
      modifiedAfter: "2026-01-01T00:00:00Z",
      limit: 100,
    });
    expect(writeFileMock).toHaveBeenCalledWith(
      expect.objectContaining({
        path: "/github/repos/AgentWorkforce/cloud/metadata.json",
      }),
    );
    expect(markProviderInitialSyncRunningMock).toHaveBeenCalledWith({
      workspaceId: "22222222-2222-4222-8222-222222222222",
      provider: "github",
      syncName: "fetch-repos",
      model: "Repo",
      modifiedAfter: "2026-01-01T00:00:00Z",
    });
    expect(markProviderInitialSyncCompleteMock).toHaveBeenCalledWith({
      workspaceId: "22222222-2222-4222-8222-222222222222",
      provider: "github",
      syncName: "fetch-repos",
      model: "Repo",
      modifiedAfter: "2026-01-01T00:00:00Z",
    });
    expect(sqsSendMock).not.toHaveBeenCalled();
  });

  it("re-enqueues the same job cursor without fetching when the deadline is near", async () => {
    const job = createJob({ cursor: "cursor-1" });
    const { handler } = await loadWorker();

    await handler(createEvent(job), createContext(10_000), vi.fn());

    expect(listRecordsMock).not.toHaveBeenCalled();
    expect(sendMessageCommandMock).toHaveBeenCalledWith({
      QueueUrl: "https://sqs.us-east-1.amazonaws.com/123/NangoSyncQueue",
      MessageBody: JSON.stringify(job),
    });
    expect(sqsSendMock).toHaveBeenCalledTimes(1);
  });

  it("continues the page when an individual relayfile write fails", async () => {
    writeFileMock
      .mockRejectedValueOnce(new Error("relayfile write failed"))
      .mockResolvedValueOnce(undefined);
    listRecordsMock.mockResolvedValueOnce({
      records: [
        {
          id: "repo-1",
          full_name: "AgentWorkforce/cloud",
          _nango_metadata: { last_action: "ADDED" },
        },
        {
          id: "repo-2",
          full_name: "AgentWorkforce/relayfile",
          _nango_metadata: { last_action: "ADDED" },
        },
      ],
      next_cursor: null,
    });
    const { handler } = await loadWorker();

    await expect(
      handler(createEvent(createJob()), createContext(180_000), vi.fn()),
    ).resolves.toBeUndefined();

    expect(writeFileMock).toHaveBeenCalledTimes(2);
    expect(sqsSendMock).not.toHaveBeenCalled();
  });

  it("marks the provider failed when the worker crashes before completion", async () => {
    listRecordsMock.mockRejectedValueOnce(new Error("nango unavailable"));
    const { handler } = await loadWorker();

    await expect(
      handler(createEvent(createJob()), createContext(180_000), vi.fn()),
    ).rejects.toThrow("nango unavailable");

    expect(markProviderInitialSyncFailedMock).toHaveBeenCalledWith({
      workspaceId: "22222222-2222-4222-8222-222222222222",
      provider: "github",
      error: "nango unavailable",
      syncName: "fetch-repos",
      model: "Repo",
      modifiedAfter: "2026-01-01T00:00:00Z",
    });
  });

  it("treats Notion jobs like any other provider — listRecords, no proxy fanout", async () => {
    listRecordsMock.mockResolvedValueOnce({
      records: [
        {
          id: "page-1",
          title: "A page",
          url: "https://notion.so/page-1",
          parent_type: "workspace",
          parent_id: null,
          last_edited_time: "2026-05-06T10:00:00.000Z",
          _nango_metadata: { last_action: "ADDED" },
        },
      ],
      next_cursor: null,
    });
    const { handler } = await loadWorker();

    await handler(
      createEvent(
        createJob({
          provider: "notion",
          providerConfigKey: "notion-relay",
          connectionId: "conn-notion-123",
          model: "NotionPage",
          syncName: "fetch-pages",
        }),
      ),
      createContext(180_000),
      vi.fn(),
    );

    expect(notionAdapterConstructorMock).not.toHaveBeenCalled();
    expect(nangoProxyMock).not.toHaveBeenCalled();
    expect(listRecordsMock).toHaveBeenCalledWith({
      providerConfigKey: "notion-relay",
      connectionId: "conn-notion-123",
      model: "NotionPage",
      modifiedAfter: "2026-01-01T00:00:00Z",
      limit: 100,
    });
  });
});
