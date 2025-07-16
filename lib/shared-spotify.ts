// lib/shared-spotify.ts
import { spotifyApi, setSpotifyCredentials, refreshAccessToken, isTokenExpired } from './spotify';
import { getSession } from './session';
import type { SpotifyTokens } from '@/types/spotify';

// Global variable to store the owner's tokens for shared access
let sharedSpotifyTokens: SpotifyTokens | null = null;
let lastTokenRefresh = 0;
const TOKEN_REFRESH_COOLDOWN = 30000; // 30 seconds

/**
 * Get the shared Spotify tokens (owner's tokens for all users to use)
 */
export async function getSharedSpotifyTokens(): Promise<SpotifyTokens | null> {
  // First, try to get fresh tokens from the owner's session
  try {
    const session = await getSession();
    const sessionTokens = (session as any).spotifyTokens as SpotifyTokens | undefined;
    
    if (sessionTokens) {
      // If we have session tokens, use them and update shared tokens
      if (isTokenExpired(sessionTokens)) {
        const refreshedTokens = await refreshAccessToken(sessionTokens);
        (session as any).spotifyTokens = refreshedTokens;
        sharedSpotifyTokens = refreshedTokens;
        await session.save();
        return refreshedTokens;
      } else {
        sharedSpotifyTokens = sessionTokens;
        return sessionTokens;
      }
    }
  } catch (error) {
    console.log('No owner session found, using shared tokens if available');
  }

  // If no session tokens, use shared tokens if available
  if (sharedSpotifyTokens) {
    if (isTokenExpired(sharedSpotifyTokens)) {
      // Prevent too frequent refresh attempts
      const now = Date.now();
      if (now - lastTokenRefresh < TOKEN_REFRESH_COOLDOWN) {
        return sharedSpotifyTokens; // Return expired tokens, let the caller handle it
      }
      
      try {
        lastTokenRefresh = now;
        const refreshedTokens = await refreshAccessToken(sharedSpotifyTokens);
        sharedSpotifyTokens = refreshedTokens;
        return refreshedTokens;
      } catch (error) {
        console.error('Failed to refresh shared tokens:', error);
        return null;
      }
    }
    return sharedSpotifyTokens;
  }

  return null;
}

/**
 * Set up Spotify API with shared tokens
 */
export async function setupSharedSpotifyApi(): Promise<boolean> {
  const tokens = await getSharedSpotifyTokens();
  if (tokens) {
    setSpotifyCredentials(tokens);
    return true;
  }
  return false;
}

/**
 * Update shared tokens (called when owner authenticates)
 */
export function updateSharedTokens(tokens: SpotifyTokens | null): void {
  sharedSpotifyTokens = tokens;
}

/**
 * Check if shared Spotify access is available
 */
export function isSharedSpotifyAvailable(): boolean {
  return sharedSpotifyTokens !== null;
}