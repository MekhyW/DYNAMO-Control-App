// app/api/spotify/shared/transfer/route.ts
import { setupSharedSpotifyApi } from '@/lib/shared-spotify';
import { spotifyApi } from '@/lib/spotify';

export async function PUT(request: Request) {
  try {
    // Set up Spotify API with shared tokens
    const hasAccess = await setupSharedSpotifyApi();
    if (!hasAccess) {
      return new Response('Spotify not available - owner needs to authenticate first', { status: 503 });
    }

    const { device_ids, play } = await request.json();
    if (!device_ids || !Array.isArray(device_ids)) {
      return new Response('Device IDs are required', { status: 400 });
    }

    await spotifyApi.transferMyPlayback(device_ids, { play: play || false });
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error transferring playback:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}