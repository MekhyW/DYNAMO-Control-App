// app/api/spotify/play/route.ts
import { getSession } from '@/lib/session';
import { spotifyApi, setSpotifyCredentials, refreshAccessToken, isTokenExpired } from '@/lib/spotify';
import type { SpotifyTokens } from '@/types/spotify';

export async function PUT(request: Request) {
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

    const body = await request.json().catch(() => ({}));
    const { uris } = body;

    if (uris && Array.isArray(uris) && uris.length > 0) {
      await spotifyApi.play({ uris });
    } else {
      await spotifyApi.play();
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error playing track:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}