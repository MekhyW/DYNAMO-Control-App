// app/api/spotify/transfer/route.ts
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

    const body = await request.json();
    const { device_ids, play = false } = body;

    if (!device_ids || !Array.isArray(device_ids) || device_ids.length === 0) {
      return new Response('device_ids array is required', { status: 400 });
    }

    await spotifyApi.transferMyPlayback(device_ids, { play });
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error transferring playback:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}