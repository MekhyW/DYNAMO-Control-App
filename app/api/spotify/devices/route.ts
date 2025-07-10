// app/api/spotify/devices/route.ts
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

    const devices = await spotifyApi.getMyDevices();
    return Response.json(devices.body);
  } catch (error) {
    console.error('Error fetching devices:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}