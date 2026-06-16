import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The bug this guards against: the engine buffers product telemetry via the
// posthog-node client, but a Cloudflare Worker suspends its isolate the moment
// the Response is returned — so unless every entrypoint flushes the buffer
// (request: via ctx.waitUntil; queue: by awaiting before return; cron: in the
// waitUntil chain), low-volume `relaycast_server_*` events are dropped and
// never reach PostHog. These tests assert the flush is wired on all three
// entrypoints.

const flushCloudflareTelemetry = vi.fn().mockResolvedValue(undefined);
const captureException = vi.fn();
const createCloudflareTelemetry = vi.fn(() => ({
  capture: vi.fn(),
  captureException,
}));

const engineFetch = vi.fn(() => new Response('ok'));
const deliverEvent = vi.fn().mockResolvedValue(undefined);
const runA2aHealthChecks = vi.fn().mockResolvedValue(undefined);

vi.mock('../../providers/telemetry.js', () => ({
  createCloudflareTelemetry,
  flushCloudflareTelemetry,
}));

vi.mock('@relaycast/engine', () => ({
  createEngine: vi.fn(() => ({ fetch: engineFetch })),
  deliverEvent,
  runA2aHealthChecks,
  schema: {},
  completeEvent: vi.fn().mockResolvedValue(undefined),
  failEvent: vi.fn().mockResolvedValue(undefined),
  rescheduleEvent: vi.fn().mockResolvedValue(undefined),
  sweepPendingEvents: vi.fn().mockResolvedValue([]),
  cleanupOldEvents: vi.fn().mockResolvedValue(0),
}));

vi.mock('../../adapters/cloudflare/index.js', () => ({
  createCloudflareEngineDeps: vi.fn(() => ({})),
}));

vi.mock('drizzle-orm/d1', () => ({
  drizzle: vi.fn(() => ({})),
}));

function createCtx(): ExecutionContext & { settled: () => Promise<void> } {
  const pending: Promise<unknown>[] = [];
  return {
    waitUntil: (p: Promise<unknown>) => {
      pending.push(Promise.resolve(p));
    },
    passThroughOnException: () => {},
    props: {},
    // Test helper: await everything handed to waitUntil.
    settled: () => Promise.all(pending).then(() => undefined),
  } as ExecutionContext & { settled: () => Promise<void> };
}

const env = { DB: {}, POSTHOG_API_KEY: 'phc_test', WEBHOOK_QUEUE: { send: vi.fn() } } as never;

describe('cloudflare entrypoint telemetry flush', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    engineFetch.mockReturnValue(new Response('ok'));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetch flushes telemetry via ctx.waitUntil after the response settles', async () => {
    const handler = (await import('../cloudflare.js')).default;
    const ctx = createCtx();

    const response = await handler.fetch(new Request('https://gateway.relaycast.dev/v1/ping'), env, ctx);
    expect(response).toBeInstanceOf(Response);

    // Flush must not block the response, but must run before the isolate idles.
    await ctx.settled();
    expect(flushCloudflareTelemetry).toHaveBeenCalledTimes(1);
  });

  it('fetch still flushes telemetry when the engine response rejects', async () => {
    engineFetch.mockReturnValueOnce(Promise.reject(new Error('engine boom')) as never);
    const handler = (await import('../cloudflare.js')).default;
    const ctx = createCtx();

    // The handler returns the (rejected) response to the runtime; we only assert
    // the flush chain handed to waitUntil still drains the buffer and does not
    // itself become an unhandled rejection.
    await expect(
      Promise.resolve(handler.fetch(new Request('https://gateway.relaycast.dev/v1/ping'), env, ctx)),
    ).rejects.toThrow('engine boom');

    await ctx.settled();
    expect(flushCloudflareTelemetry).toHaveBeenCalledTimes(1);
  });

  it('queue awaits a telemetry flush before returning', async () => {
    const handler = (await import('../cloudflare.js')).default;
    const batch = {
      messages: [
        { body: { type: 'file.created', workspaceId: 'ws_1', data: {} }, ack: vi.fn(), retry: vi.fn() },
      ],
    } as unknown as MessageBatch;

    await handler.queue(batch, env, createCtx());

    expect(deliverEvent).toHaveBeenCalledTimes(1);
    expect(flushCloudflareTelemetry).toHaveBeenCalledTimes(1);
  });

  it('queue still flushes after a delivery failure', async () => {
    deliverEvent.mockRejectedValueOnce(new Error('boom'));
    const handler = (await import('../cloudflare.js')).default;
    const retry = vi.fn();
    const batch = {
      messages: [
        { body: { type: 'file.created', workspaceId: 'ws_1', data: {} }, ack: vi.fn(), retry },
      ],
    } as unknown as MessageBatch;

    await handler.queue(batch, env, createCtx());

    expect(retry).toHaveBeenCalledTimes(1);
    expect(captureException).toHaveBeenCalledTimes(1);
    expect(flushCloudflareTelemetry).toHaveBeenCalledTimes(1);
  });

  it('scheduled flushes telemetry in its waitUntil chains', async () => {
    const handler = (await import('../cloudflare.js')).default;
    const ctx = createCtx();

    await handler.scheduled({} as ScheduledController, env, ctx);
    await ctx.settled();

    expect(runA2aHealthChecks).toHaveBeenCalledTimes(1);
    // One flush per scheduled waitUntil chain: A2A health checks + outbox sweep
    // + fleet invocation dispatch sweep.
    expect(flushCloudflareTelemetry).toHaveBeenCalledTimes(3);
  });
});
