// app/api/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { spotifyApi } from '@/lib/spotify';
import { updateSharedTokens } from '@/lib/shared-spotify';

const sessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: 'spotify_owner_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const session = await getIronSession(cookies(), sessionOptions);

    if (error || !state) {
      return NextResponse.redirect(new URL('/admin?error=state_mismatch', request.url));
    }

    const data = await spotifyApi.authorizationCodeGrant(code as string);

    // Store tokens in the session
    const tokens = {
      accessToken: data.body.access_token,
      refreshToken: data.body.refresh_token,
      accessTokenExpires: Date.now() + data.body.expires_in * 1000,
    };
    (session as any).spotifyTokens = tokens;
    await session.save();
    
    // Update shared tokens for all users to use
    updateSharedTokens(tokens);

    return NextResponse.redirect(new URL('/admin?status=success', request.url));
  } catch (error) {
    console.error('Error during authentication:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.redirect(
      new URL(`/admin?error=${encodeURIComponent(errorMessage)}`, request.url)
    );
  }
}
