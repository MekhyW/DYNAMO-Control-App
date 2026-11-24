// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { spotifyApi } from '@/lib/spotify';
import { getSession } from '@/lib/session';
import { authorize } from '@/lib/server/authorize';

// Define the scopes your application needs
const scopes = [
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
];

export const dynamic = 'force-dynamic';

function passwordMatches(provided: unknown, expected: string): boolean {
  if (typeof provided !== 'string') return false;
  const a = createHash('sha256').update(provided).digest();
  const b = createHash('sha256').update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  // Only the verified owner may (re)link the Spotify account that everyone shares.
  const authz = await authorize(request, { ownerOnly: true });
  if (!authz.ok) return authz.response;

  try {
    const passwordRequired = process.env.NEXT_PUBLIC_ADMIN_PASSWORD_REQUIRED === 'true';
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (passwordRequired && adminPassword) {
      const body = await request.json().catch(() => ({}));
      if (!passwordMatches(body?.password, adminPassword)) {
        return NextResponse.json({ error: 'Invalid admin password' }, { status: 403 });
      }
    }

    // Random, single-use OAuth state bound to this browser's session (CSRF protection).
    const state = randomBytes(24).toString('hex');
    const session = await getSession();
    session.state = state;
    await session.save();

    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
    return NextResponse.json({ url: authorizeURL });
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
