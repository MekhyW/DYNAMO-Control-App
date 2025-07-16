// app/api/spotify/shared/search/route.ts
import { NextRequest } from 'next/server';
import { setupSharedSpotifyApi } from '@/lib/shared-spotify';
import { spotifyApi } from '@/lib/spotify';

export async function GET(request: NextRequest) {
  try {
    // Set up Spotify API with shared tokens
    const hasAccess = await setupSharedSpotifyApi();
    if (!hasAccess) {
      return new Response('Spotify not available - owner needs to authenticate first', { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return Response.json({ tracks: { items: [] } });
    }

    const searchResults = await spotifyApi.searchTracks(query, { limit: 20 });
    return Response.json(searchResults.body);
  } catch (error) {
    console.error('Error searching tracks:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}