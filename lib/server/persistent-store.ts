// Server-only access to the Turso settings table.
import { createClient, type Client } from '@libsql/client';

export const PERSISTENT_LIST_KEYS = ['soundEffects', 'voiceEffects', 'soundDevices'] as const;
export type PersistentListKey = (typeof PERSISTENT_LIST_KEYS)[number];

const MAX_VALUE_BYTES = 256 * 1024;

let client: Client | null = null;
let schemaReady: Promise<void> | null = null;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || '',
      authToken: process.env.TURSO_AUTH_TOKEN || '',
    });
  }
  return client;
}

async function ensureSchema() {
  if (!schemaReady) {
    schemaReady = getClient()
      .execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
      .then(() => undefined)
      .catch((error) => {
        schemaReady = null;
        throw error;
      });
  }
  return schemaReady;
}

export function isPersistentListKey(key: unknown): key is PersistentListKey {
  return typeof key === 'string' && (PERSISTENT_LIST_KEYS as readonly string[]).includes(key);
}

export async function readList(key: PersistentListKey): Promise<unknown[]> {
  await ensureSchema();
  const res = await getClient().execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] });
  const row = res.rows?.[0] as { value?: unknown } | undefined;
  if (!row || row.value == null) return [];
  try {
    const parsed = JSON.parse(typeof row.value === 'string' ? row.value : String(row.value));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeList(key: PersistentListKey, value: unknown[]): Promise<void> {
  const valueStr = JSON.stringify(value);
  if (Buffer.byteLength(valueStr) > MAX_VALUE_BYTES) {
    throw new Error('Value too large');
  }
  await ensureSchema();
  await getClient().execute({
    sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    args: [key, valueStr],
  });
}
