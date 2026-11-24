// Server-side MQTT access. Broker credentials never leave the server.
import mqtt, { type IClientOptions, type MqttClient } from 'mqtt';
import { randomUUID } from 'crypto';

export const APP_LOCK_TOPIC = 'mekhy/app/lock';

interface BrokerConfig {
  url: string;
  username: string;
  password: string;
}

function getBrokerConfig(): BrokerConfig {
  const host = process.env.MQTT_HOST || '';
  const port = process.env.MQTT_PORT || '8884';
  const username = process.env.MQTT_USERNAME || '';
  const password = process.env.MQTT_PASSWORD || '';
  if (!host || !username || !password) { throw new Error('MQTT broker is not configured (MQTT_HOST, MQTT_USERNAME, MQTT_PASSWORD).'); }
  return { url: `wss://${host}:${port}/mqtt`, username, password };
}

export function createBrokerClient(clientIdPrefix: string, overrides: IClientOptions = {}): MqttClient {
  const config = getBrokerConfig();
  return mqtt.connect(config.url, {
    clientId: `${clientIdPrefix}-${randomUUID().slice(0, 12)}`,
    username: config.username,
    password: config.password,
    clean: true,
    connectTimeout: 8000,
    keepalive: 60,
    protocolVersion: 4,
    ...overrides,
  });
}

interface PublisherState {
  client: MqttClient | null;
  connecting: Promise<MqttClient> | null;
  lockState: boolean | null;
  lockKnown: Promise<void> | null;
}

const globalForMqtt = globalThis as unknown as { __dynamoPublisher?: PublisherState };
const state: PublisherState =
  globalForMqtt.__dynamoPublisher ??
  (globalForMqtt.__dynamoPublisher = { client: null, connecting: null, lockState: null, lockKnown: null });

function parseLock(message: Buffer): boolean | null {
  try {
    const data = JSON.parse(message.toString());
    return typeof data?.locked === 'boolean' ? data.locked : null;
  } catch {
    return null;
  }
}

async function getPublisher(): Promise<MqttClient> {
  if (state.client?.connected) return state.client;
  if (state.connecting) return state.connecting;
  if (state.client) {
    state.client.end(true);
    state.client = null;
  }
  state.lockKnown = null;
  state.connecting = new Promise<MqttClient>((resolve, reject) => {
    // No auto-reconnect: a stale client is replaced on the next request instead.
    const client = createBrokerClient('dynamo-server', { reconnectPeriod: 0 });
    const fail = (error: Error) => {
      client.end(true);
      reject(error);
    };
    client.once('error', fail);
    client.once('connect', () => {
      client.off('error', fail);
      client.on('error', (error) => console.error('MQTT publisher error:', error.message));
      client.on('message', (topic, message) => {
        if (topic === APP_LOCK_TOPIC) {
          const locked = parseLock(message);
          if (locked !== null) state.lockState = locked;
        }
      });
      state.client = client;
      resolve(client);
    });
  }).finally(() => { state.connecting = null; });
  return state.connecting;
}

export async function publishToBroker(topic: string, payload: unknown, options: { qos?: 0 | 1 | 2; retain?: boolean } = {}): Promise<void> {
  const client = await getPublisher();
  const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
  await client.publishAsync(topic, message, { qos: options.qos ?? 1, retain: options.retain ?? false });
  if (topic === APP_LOCK_TOPIC) {
    const locked = parseLock(Buffer.from(message));
    if (locked !== null) state.lockState = locked;
  }
}

/** Current global app lock (retained on the broker). Defaults to unlocked, like the UI. */
export async function isAppLocked(): Promise<boolean> {
  const client = await getPublisher();
  if (!state.lockKnown) {
    state.lockKnown = (async () => {
      await client.subscribeAsync(APP_LOCK_TOPIC, { qos: 0 });
      // The retained value is delivered right after SUBACK; give it a moment to arrive.
      const deadline = Date.now() + 1500;
      while (state.lockState === null && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 50));
      }
    })().catch((error) => {
      state.lockKnown = null;
      throw error;
    });
  }
  await state.lockKnown;
  return state.lockState === true;
}
