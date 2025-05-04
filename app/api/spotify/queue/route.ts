// app/api/spotify/queue/route.ts
import { getSession } from '@/lib/session';
import { spotifyApi, setSpotifyCredentials, refreshAccessToken, isTokenExpired } from '@/lib/spotify';
import type { SpotifyTokens } from '@/types/spotify';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { uri } = body;

    if (!uri) {
      return new Response('Track URI is required', { status: 400 });
    }

    await spotifyApi.addToQueue(uri);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error adding to queue:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}