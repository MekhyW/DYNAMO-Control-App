// app/api/spotify/shared/playback-state/route.ts
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

    const playbackState = await spotifyApi.getMyCurrentPlaybackState();
    
    if (!playbackState.body || Object.keys(playbackState.body).length === 0) {
      return Response.json({
        is_playing: false,
        item: null,
        device: null,
        progress_ms: 0
      });
    }

    return Response.json(playbackState.body);
  } catch (error) {
    console.error('Error fetching playback state:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}