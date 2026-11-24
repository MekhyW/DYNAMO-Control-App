import { NextResponse } from 'next/server';
import { authenticateRequest, type AuthContext } from './telegram-auth';
import { isAppLocked } from './mqtt-server';

interface AuthorizeOptions {
  ownerOnly?: boolean;
  respectAppLock?: boolean;
}

type AuthorizeResult = { ok: true; auth: AuthContext } | { ok: false; response: NextResponse };

function deny(status: number, error: string): AuthorizeResult {
  return { ok: false, response: NextResponse.json({ error }, { status }) };
}

export async function authorize(request: Request, options: AuthorizeOptions = {}): Promise<AuthorizeResult> {
  const auth = authenticateRequest(request);
  if (!auth) return deny(401, 'Open this app from Telegram to continue.');
  if (options.ownerOnly && !auth.isOwner) return deny(403, 'Only the owner can do this.');
  if (options.respectAppLock && !auth.isOwner) {
    try {
      if (await isAppLocked()) return deny(423, 'The app is locked by the owner.');
    } catch (error) {
      console.error('Could not read app lock state:', error);
      return deny(503, 'Device connection unavailable.');
    }
  }
  return { ok: true, auth };
}
