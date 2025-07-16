// app/api/spotify/shared/devices/route.ts
import { setupSharedSpotifyApi } from '@/lib/shared-spotify';
import { spotifyApi } from '@/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Set up Spotify API with shared tokens
    const hasAccess = await setupSharedSpotifyApi();
    if (!hasAccess) {
      return new Response('Spotify not available - owner needs to authenticate first', { status: 503 });
    }

    const devices = await spotifyApi.getMyDevices();
    return Response.json(devices.body);
  } catch (error) {
    console.error('Error fetching devices:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}