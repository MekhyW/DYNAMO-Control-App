// lib/spotify.ts
import SpotifyWebApi from 'spotify-web-api-node';
import { SpotifyTokens, SpotifyPublicTokens } from '../types/spotify';

export const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

export function setSpotifyCredentials(tokens: SpotifyTokens | null): void {
  if (tokens) {
    spotifyApi.setAccessToken(tokens.accessToken);
    spotifyApi.setRefreshToken(tokens.refreshToken);
  }
}

export async function refreshAccessToken(tokens: SpotifyTokens): Promise<SpotifyTokens> {
  try {
    spotifyApi.setRefreshToken(tokens.refreshToken);
    const data = await spotifyApi.refreshAccessToken();
    
    return {
      ...tokens,
      accessToken: data.body.access_token,
      // Keep the refresh token if a new one wasn't provided
      refreshToken: data.body.refresh_token || tokens.refreshToken, 
      accessTokenExpires: Date.now() + data.body.expires_in * 1000,
    };
  } catch (error) {
    console.error('Error refreshing access token', error);
    return tokens;
  }
}

export function isTokenExpired(tokens: SpotifyTokens | null): boolean {
  if (!tokens) return true;
  // Refresh if less than 5 minutes remaining
  return Date.now() >= tokens.accessTokenExpires - 5 * 60 * 1000;
}

// Get a client-safe version of tokens (without the refresh token)
export function getPublicTokens(tokens: SpotifyTokens | null): SpotifyPublicTokens | null {
  if (!tokens) return null;
  return {
    accessToken: tokens.accessToken,
    accessTokenExpires: tokens.accessTokenExpires,
  };
}