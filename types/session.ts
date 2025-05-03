// types/session.ts
import { SpotifyTokens } from './spotify';

declare module 'iron-session' {
  interface IronSessionData {
    spotifyTokens?: SpotifyTokens;
    state?: string;
  }
}