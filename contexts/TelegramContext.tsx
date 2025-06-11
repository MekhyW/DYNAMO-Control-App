'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramContextType {
  user: TelegramUser | null;
  isOwner: boolean;
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  isLoading: boolean;
  initDataRaw: string | null;
}

const TelegramContext = createContext<TelegramContextType | undefined>(undefined);

interface TelegramProviderProps {
  children: ReactNode;
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isAppLocked, setIsAppLocked] = useState(false); // Default to unlocked
  const [isLoading, setIsLoading] = useState(true);
  const [initDataRaw, setInitDataRaw] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeTelegram = async () => {
      try {
        if (typeof window !== 'undefined') {
          const savedLockState = localStorage.getItem('appLockState');
          if (savedLockState !== null) {
            setIsAppLocked(savedLockState === 'true');
          }
          
          const launchParams = retrieveLaunchParams();
          const { initDataRaw: rawData } = launchParams;
          setInitDataRaw(rawData as string | null);
          const initData = (launchParams as any)?.tgWebAppData;
          if (initData?.user) {
            const telegramUser = initData.user;
            setUser(telegramUser);
            const isUserOwner = process.env.NEXT_PUBLIC_FURSUIT_OWNER_ID && 
              telegramUser.id.toString() === process.env.NEXT_PUBLIC_FURSUIT_OWNER_ID;
            setIsOwner(!!isUserOwner);
          }
        }
      } catch (error) {
        console.error('Error initializing Telegram:', error);
        const isDev = process.env.NODE_ENV === 'development';
        if (isDev) {
          const devOwner = process.env.NEXT_PUBLIC_DEV_AS_OWNER === 'true';
          setIsOwner(devOwner);
        }
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };
    initializeTelegram();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && isInitialized) {
      localStorage.setItem('appLockState', isAppLocked.toString());
    }
  }, [isAppLocked, isInitialized]);

  const contextValue: TelegramContextType = {
    user,
    isOwner,
    isAppLocked,
    setIsAppLocked,
    isLoading,
    initDataRaw,
  };

  return (
    <TelegramContext.Provider value={contextValue}>
      {children}
    </TelegramContext.Provider>
  );
}

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (context === undefined) {
    throw new Error('useTelegram must be used within a TelegramProvider');
  }
  return context;
}