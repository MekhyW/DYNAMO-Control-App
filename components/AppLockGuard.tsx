'use client';

import React from 'react';
import { useTelegram } from '@/contexts/TelegramContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User } from 'lucide-react';

interface AppLockGuardProps {
  children: React.ReactNode;
}

export function AppLockGuard({ children }: AppLockGuardProps) {
  const { isOwner, isAppLocked, isLoading, user } = useTelegram();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 pb-20 pt-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isOwner) {
    return <>{children}</>;
  }

  if (isAppLocked) {
    return (
      <div className="container mx-auto px-4 pb-20 pt-6 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-xl font-bold text-red-600 dark:text-red-400">
              Access Restricted
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              The M.E.K.H.Y Control System is currently locked by the owner.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact the system administrator for access.
            </p>
            {user && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>
                    Logged in as: {user.first_name} {user.last_name || ''}
                    {user.username && ` (@${user.username})`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  User ID: {user.id}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
}