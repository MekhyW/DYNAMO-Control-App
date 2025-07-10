// app/api/spotify/play/route.ts
import { getSession } from '@/lib/session';
import { spotifyApi, setSpotifyCredentials, refreshAccessToken, isTokenExpired } from '@/lib/spotify';
import type { SpotifyTokens, SpotifyPlayOptions } from '@/types/spotify';

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
    const { uris, device_id } = body;

    const playOptions: SpotifyPlayOptions = {};
    if (uris && Array.isArray(uris) && uris.length > 0) {
      playOptions.uris = uris;
    }
    if (device_id) {
      playOptions.device_id = device_id;
    }

    await spotifyApi.play(playOptions);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error playing track:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}