import { describe, expect, it } from 'vitest';
import { createCloudflareRealtime } from '../realtime.js';
import type { CloudflareBindings } from '../../../env.js';

function createEnv(agentTypes: Record<string, string | undefined> = {}) {
  const requests: Array<{ namespace: string; name: string; body: Record<string, unknown> }> = [];

  function namespace(namespaceName: string): DurableObjectNamespace {
    return {
      idFromName(name: string) {
        return name as unknown as DurableObjectId;
      },
      get(name: DurableObjectId) {
        return {
          async fetch(request: Request) {
            requests.push({
              namespace: namespaceName,
              name: name as unknown as string,
              body: (await request.json()) as Record<string, unknown>,
            });
            return Response.json({ ok: true, channel_seq: 7, agent_seq: 11 });
          },
        } as DurableObjectStub;
      },
    } as DurableObjectNamespace;
  }

  const env = {
    DB: {
      prepare() {
        return {
          bind(_workspaceId: string, agentId: string) {
            return {
              async first() {
                const type = agentTypes[agentId];
                return type ? { type } : null;
              },
            };
          },
        };
      },
    },
    CHANNEL_DO: namespace('channel'),
    AGENT_DO: namespace('agent'),
    WORKSPACE_STREAM_DO: namespace('workspace'),
  } as unknown as CloudflareBindings;

  return { env, requests };
}

describe('createCloudflareRealtime', () => {
  it('adds agent_type to channel message fanout from D1', async () => {
    const { env, requests } = createEnv({ agent_human: 'human' });
    const realtime = createCloudflareRealtime(env);

    await realtime.broadcastToChannel({
      workspaceId: 'ws_1',
      channelId: 'ch_1',
      event: {
        type: 'message.created',
        message: {
          id: 'msg_1',
          agent_id: 'agent_human',
          agent_name: 'Alice',
          text: 'hello',
          attachments: [],
        },
      },
    });

    expect(requests[0]?.body.event).toMatchObject({
      message: { agent_type: 'human' },
    });
  });

  it('adds agent_type to direct agent delivery and workspace stream fanout', async () => {
    const { env, requests } = createEnv({ agent_system: 'system' });
    const realtime = createCloudflareRealtime(env);
    const event = {
      type: 'dm.received',
      conversation_id: 'dm_1',
      message: {
        id: 'msg_2',
        agent_id: 'agent_system',
        agent_name: 'DeployBot',
        text: 'done',
      },
    };

    await realtime.deliverToAgents({ workspaceId: 'ws_1', agentIds: ['agent_1'], event });
    await realtime.publishToWorkspaceStream({ workspaceId: 'ws_1', event });

    expect(requests.find((request) => request.namespace === 'agent')?.body).toMatchObject({
      message: { agent_type: 'system' },
    });
    expect(requests.find((request) => request.namespace === 'workspace')?.body).toMatchObject({
      message: { agent_type: 'system' },
    });
  });

  it('preserves fanout when the agent type lookup fails', async () => {
    const { env, requests } = createEnv();
    env.DB = {
      prepare() {
        throw new Error('d1 unavailable');
      },
    } as unknown as D1Database;
    const realtime = createCloudflareRealtime(env);

    await realtime.pushToAgent('ws_1', 'agent_1', {
      type: 'thread.reply',
      message: {
        id: 'msg_3',
        agent_id: 'agent_missing',
        agent_name: 'Unknown',
        text: 'reply',
      },
    });

    expect(requests[0]?.body).toMatchObject({
      type: 'thread.reply',
      message: {
        id: 'msg_3',
        agent_id: 'agent_missing',
      },
    });
  });
});
