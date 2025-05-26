// app/api/spotify/search/route.ts
import { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';
import { spotifyApi, setSpotifyCredentials, refreshAccessToken, isTokenExpired } from '@/lib/spotify';
import type { SpotifyTokens } from '@/types/spotify';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    const tokens = (session as any).spotifyTokens as SpotifyTokens | undefined;
    if (!tokens) {
      return new Response('Spotify tokens not found', { status: 401 });
    }

    let currentTokens = tokens;
    if (isTokenExpired(currentTokens)) {
      currentTokens = await refreshAccessToken(currentTokens);
      (session as any).spotifyTokens = currentTokens;
    }

    setSpotifyCredentials(currentTokens);

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return new Response('Search query is required', { status: 400 });
    }

    const data = await spotifyApi.searchTracks(query, { limit: 10 });
    return new Response(JSON.stringify(data.body), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error searching tracks:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}