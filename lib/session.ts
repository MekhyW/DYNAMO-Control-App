// lib/session.ts
import { SessionOptions } from 'iron-session';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_PASSWORD as string,
  cookieName: 'spotify_owner_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

declare module 'iron-session' {
  interface IronSessionData {
    spotifyTokens?: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpires: number;
    };
    state?: string;
  }
}