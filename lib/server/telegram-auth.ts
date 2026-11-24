// Server-side verification of Telegram Mini App init data.
// See https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
import { createHmac, timingSafeEqual } from 'crypto';

export interface VerifiedTelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface AuthContext {
  user: VerifiedTelegramUser;
  isOwner: boolean;
}

// Init data is re-issued by Telegram every time the Mini App is opened.
const INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;
const CLOCK_SKEW_SECONDS = 5 * 60;

export function getOwnerId(): string | null {
  const id = process.env.NEXT_PUBLIC_FURSUIT_OWNER_ID;
  return id && id.trim() ? id.trim() : null;
}

function dataCheckString(params: URLSearchParams, exclude: Set<string>): string {
  return Array.from(params.entries())
    .filter(([key]) => !exclude.has(key))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}

function safeHexEqual(expectedHex: string, actualHex: string): boolean {
  const a = Buffer.from(expectedHex, 'hex');
  const b = Buffer.from(actualHex, 'hex');
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

/**
 * Validates raw init data (the query string Telegram passes to the Mini App)
 * against the bot token. Returns the user when the signature is valid and fresh.
 */
export function validateInitData(raw: string, botToken: string): VerifiedTelegramUser | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(raw); }
  catch { return null; }
  const hash = params.get('hash');
  if (!hash || !/^[0-9a-f]{64}$/i.test(hash)) return null;
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  // Newer clients also send a `signature` field (for third-party Ed25519 validation).
  // Accept the HMAC computed either with or without it; both are keyed by the bot token.
  const candidates = [new Set(['hash']), new Set(['hash', 'signature'])];
  const valid = candidates.some((exclude) => {
    const computed = createHmac('sha256', secretKey).update(dataCheckString(params, exclude)).digest('hex');
    return safeHexEqual(computed, hash.toLowerCase());
  });
  if (!valid) return null;
  const authDate = Number(params.get('auth_date'));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(authDate) || authDate <= 0) return null;
  if (now - authDate > INIT_DATA_MAX_AGE_SECONDS) return null;
  if (authDate - now > CLOCK_SKEW_SECONDS) return null;
  const userRaw = params.get('user');
  if (!userRaw) return null;
  try {
    const user = JSON.parse(userRaw);
    if (!user || typeof user.id !== 'number' || !Number.isSafeInteger(user.id)) return null;
    return {
      id: user.id,
      first_name: typeof user.first_name === 'string' ? user.first_name.slice(0, 128) : '',
      last_name: typeof user.last_name === 'string' ? user.last_name.slice(0, 128) : undefined,
      username: typeof user.username === 'string' ? user.username.slice(0, 64) : undefined,
    };
  } catch {
    return null;
  }
}

function devFallbackUser(): AuthContext | null {
  if (process.env.NODE_ENV !== 'development') return null;
  const ownerId = getOwnerId();
  const asOwner = process.env.NEXT_PUBLIC_DEV_AS_OWNER === 'true' && ownerId !== null;
  return {
    user: { id: asOwner ? Number(ownerId) : 0, first_name: 'Developer' },
    isOwner: asOwner,
  };
}

/**
 * Reads `Authorization: tma <initDataRaw>` from the request and verifies it.
 * Returns null when the caller is not an authenticated Telegram user.
 */
export function authenticateRequest(request: Request): AuthContext | null {
  const header = request.headers.get('authorization') || '';
  const match = header.match(/^tma\s+(.+)$/i);
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!match) return devFallbackUser();
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN is not set; cannot verify Telegram users.');
    return devFallbackUser();
  }
  const user = validateInitData(match[1].trim(), botToken);
  if (!user) return null;
  const ownerId = getOwnerId();
  return { user, isOwner: ownerId !== null && String(user.id) === ownerId };
}
