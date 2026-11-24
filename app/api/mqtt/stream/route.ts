import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/server/telegram-auth';
import { createBrokerClient, APP_LOCK_TOPIC } from '@/lib/server/mqtt-server';
import { readList, writeList, type PersistentListKey } from '@/lib/server/persistent-store';
import { rateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Close a little before the platform limit so the client reconnects cleanly.
const STREAM_LIFETIME_MS = 280_000;
const HEARTBEAT_MS = 20_000;

const PERSISTED_TOPICS: Record<string, PersistentListKey> = {
  'dynamo/data/sound_effects': 'soundEffects',
  'dynamo/data/voice_effects': 'voiceEffects',
  'dynamo/data/sound_devices': 'soundDevices',
};

const TOPICS = [
  'dynamo/data/sound_effects',
  'dynamo/data/voice_effects',
  'dynamo/data/bitmap',
  'dynamo/data/sound_devices',
  'dynamo/data/chat_logs',
  APP_LOCK_TOPIC,
  'dynamo/spotify',
];

export async function GET(request: Request) {
  const auth = authenticateRequest(request);
  if (!auth) {
    return NextResponse.json({ error: 'Open this app from Telegram to continue.' }, { status: 401 });
  }
  if (!rateLimit(`stream:${auth.user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many connections.' }, { status: 429 });
  }

  let client: ReturnType<typeof createBrokerClient>;
  try {
    client = createBrokerClient('dynamo-relay');
  } catch (error) {
    console.error('MQTT relay unavailable:', error);
    return NextResponse.json({ error: 'Device connection unavailable.' }, { status: 503 });
  }

  const encoder = new TextEncoder();
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  let lifetime: ReturnType<typeof setTimeout> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          shutdown();
        }
      };

      const shutdown = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        clearTimeout(lifetime);
        client.end(true);
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      request.signal.addEventListener('abort', shutdown);
      lifetime = setTimeout(shutdown, STREAM_LIFETIME_MS);
      heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          shutdown();
        }
      }, HEARTBEAT_MS);

      client.on('connect', () => {
        client.subscribe(TOPICS, { qos: 0 }, (err) => {
          if (err) console.error('MQTT relay subscribe failed:', err.message);
        });
        send('status', { connected: true });
      });
      client.on('close', () => send('status', { connected: false }));
      client.on('offline', () => send('status', { connected: false }));
      client.on('error', (error) => console.error('MQTT relay error:', error.message));

      client.on('message', async (topic, message) => {
        let data: unknown;
        try {
          data = JSON.parse(message.toString());
        } catch {
          return;
        }

        const listKey = PERSISTED_TOPICS[topic];
        if (listKey) {
          try {
            if (Array.isArray(data) && data.length > 0) {
              await writeList(listKey, data);
            } else {
              data = await readList(listKey);
            }
          } catch (error) {
            console.error(`Persistent list ${listKey} unavailable:`, error);
          }
        }

        send('message', { topic, data });
      });
    },
    cancel() {
      closed = true;
      clearInterval(heartbeat);
      clearTimeout(lifetime);
      client.end(true);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
