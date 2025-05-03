// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { spotifyApi } from '@/lib/spotify';

// Define the scopes your application needs
const scopes = [
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'playlist-read-collaborative',
  'user-library-read',
];

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const authorizeURL = spotifyApi.createAuthorizeURL(scopes, 'spotify_auth_state');

    // Return the URL to redirect to
    return NextResponse.json({ url: authorizeURL });
  } catch (error) {
    console.error('Error in login route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}