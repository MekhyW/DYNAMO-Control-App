// app/api/spotify/shared/pause/route.ts
import { setupSharedSpotifyApi } from '@/lib/shared-spotify';
import { spotifyApi } from '@/lib/spotify';

export async function PUT() {
  try {
    // Set up Spotify API with shared tokens
    const hasAccess = await setupSharedSpotifyApi();
    if (!hasAccess) {
      return new Response('Spotify not available - owner needs to authenticate first', { status: 503 });
    }

    await spotifyApi.pause();
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error pausing playback:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}