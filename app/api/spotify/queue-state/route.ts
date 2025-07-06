// app/api/spotify/queue-state/route.ts
import { getSession } from '@/lib/session';
import { spotifyApi, setSpotifyCredentials, refreshAccessToken, isTokenExpired } from '@/lib/spotify';
import type { SpotifyTokens } from '@/types/spotify';

export const dynamic = 'force-dynamic';

export async function GET() {
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

    const data = await spotifyApi.getMyCurrentPlaybackState();
    return new Response(JSON.stringify({ queue: [] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error getting queue state:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}