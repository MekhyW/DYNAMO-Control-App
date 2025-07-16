// app/api/spotify/shared/play/route.ts
import { setupSharedSpotifyApi } from '@/lib/shared-spotify';
import { spotifyApi } from '@/lib/spotify';
import type { SpotifyPlayOptions } from '@/types/spotify';

export async function PUT(request: Request) {
  try {
    // Set up Spotify API with shared tokens
    const hasAccess = await setupSharedSpotifyApi();
    if (!hasAccess) {
      return new Response('Spotify not available - owner needs to authenticate first', { status: 503 });
    }

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