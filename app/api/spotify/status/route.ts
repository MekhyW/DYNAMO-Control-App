// app/api/spotify/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { spotifyApi, setSpotifyCredentials, refreshAccessToken, isTokenExpired } from '@/lib/spotify';
import type { SpotifyTokens } from '@/types/spotify';

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
    const session = await getIronSession(cookies(), sessionOptions);
    const tokens = (session as any).spotifyTokens as SpotifyTokens | undefined;

    if (!tokens) {
      return NextResponse.json({ connected: false });
    }

    try {
      // Refresh token if needed
      let currentTokens = tokens;
      if (isTokenExpired(tokens)) {
        currentTokens = await refreshAccessToken(tokens);
        (session as any).spotifyTokens = currentTokens;
        await session.save();
      }

      // Set the API credentials
      setSpotifyCredentials(currentTokens);

      // Test the connection by fetching the user profile
      await spotifyApi.getMe();

      // If we get here without an error, we're connected
      return NextResponse.json({ connected: true });
    } catch (error) {
      console.error('Spotify connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json({ connected: false, error: errorMessage });
    }
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { connected: false, error: 'Session error' },
      { status: 500 }
    );
  }
}