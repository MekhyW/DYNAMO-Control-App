// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { spotifyApi } from '@/lib/spotify';
import { getSession } from '@/lib/session';
import { updateSharedTokens } from '@/lib/shared-spotify';

export const dynamic = 'force-dynamic';

function statesMatch(expected: string | undefined, actual: string | null): boolean {
  if (!expected || !actual) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const session = await getSession();
    const expectedState = session.state;
    session.state = undefined; // The state is single-use.

    if (error || !code || !statesMatch(expectedState, state)) {
      await session.save();
      return NextResponse.redirect(new URL('/admin?error=state_mismatch', request.url));
    }

    const data = await spotifyApi.authorizationCodeGrant(code);
    const tokens = {
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      accessTokenExpires: Date.now() + data.body.expires_in * 1000,
    };
    (session as any).spotifyTokens = tokens;
    await session.save();

    updateSharedTokens(tokens); // Update shared tokens for all users to use

    return NextResponse.redirect(new URL('/admin?status=success', request.url));
  } catch (error) {
    console.error('Error during authentication:', error);
    return NextResponse.redirect(new URL('/admin?error=authentication_failed', request.url));
  }
}
