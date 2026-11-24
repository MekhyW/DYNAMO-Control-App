// Client-side helper: attaches the Telegram init data so the server can verify who is calling.
import { retrieveRawInitData } from '@telegram-apps/sdk';

let cachedInitData: string | null = null;

export function getInitDataRaw(): string | null {
  if (typeof window === 'undefined') return null;
  if (cachedInitData) return cachedInitData;
  try { cachedInitData = retrieveRawInitData() || null; }
  catch { cachedInitData = null; }
  return cachedInitData;
}

export function telegramAuthHeaders(): Record<string, string> {
  const initData = getInitDataRaw();
  return initData ? { Authorization: `tma ${initData}` } : {};
}
