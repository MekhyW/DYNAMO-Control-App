// app/api/spotify/shared/queue/route.ts
import { setupSharedSpotifyApi } from '@/lib/shared-spotify';
import { spotifyApi } from '@/lib/spotify';

export async function POST(request: Request) {
  try {
    // Set up Spotify API with shared tokens
    const hasAccess = await setupSharedSpotifyApi();
    if (!hasAccess) {
      return new Response('Spotify not available - owner needs to authenticate first', { status: 503 });
    }

    const { uri } = await request.json();
    if (!uri) {
      return new Response('Track URI is required', { status: 400 });
    }

    await spotifyApi.addToQueue(uri);
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('Error adding to queue:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}