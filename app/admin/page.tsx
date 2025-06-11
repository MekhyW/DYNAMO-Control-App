"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCcw, Power, LogOut, Lock, Unlock, Copy, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { MQTTStatus } from '@/components/MQTTStatus';
import { useMQTT } from '@/hooks/useMQTT';

type SpotifyConnectionStatus = 'loading' | 'connected' | 'disconnected' | 'error';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function AdminPanelContent() {
  const mqtt = useMQTT();
  const [showPowerDialog, setShowPowerDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedInputDevice, setSelectedInputDevice] = useState("");
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("");
  const [password, setPassword] = useState<string>('');
  const [status, setSpotifyStatus] = useState<string>('');
  const [error, setSpotifyError] = useState<string>('');
  const [SpotifyConnectionStatus, setSpotifyConnectionStatus] = useState<SpotifyConnectionStatus>('loading');
  const [isExternalCommandsLocked, setIsExternalCommandsLocked] = useState(true);
  const [anydeskKey] = useState('591283563');
  const [keyCopied, setKeyCopied] = useState(false);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log('Search Params:', searchParams);
    if (searchParams.get('status') === 'success') {
      setSpotifyStatus('Authentication successful!');
    }
    else if (searchParams.get('error')) {
      setSpotifyError(`Error: ${searchParams.get('error')}`);
    }
    
    checkSpotifyConnectionStatus();
  }, [searchParams]);

  async function checkSpotifyConnectionStatus() {
    try {
      const response = await fetch('/api/spotify/status');
      const data = await response.json();
      
      if (data.connected) {
        setSpotifyConnectionStatus('connected');
      } else {
        setSpotifyConnectionStatus('disconnected');
      }
    } catch (error) {
      setSpotifyConnectionStatus('error');
      setSpotifyError(`Connection check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async function handleAuthenticate(e: React.FormEvent) {
    e.preventDefault();
    setSpotifyStatus('Authenticating...');
    setSpotifyError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Authentication failed');
      }
      
      const data = await response.json();
      // Redirect to Spotify authorization page
      window.location.href = data.url;
    } catch (error) {
      setSpotifyError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setSpotifyStatus('');
    }
  }

  const handleToggleLock = async () => {
    const newLockedState = !isExternalCommandsLocked;
    setIsExternalCommandsLocked(newLockedState);
    try {
      await mqtt.toggleExternalCommands(newLockedState);
    } catch (error) {
      console.error('Failed to toggle external commands:', error);
    }
  };

  const handleCopyAnydeskKey = async () => {
    try {
      await navigator.clipboard.writeText(anydeskKey);
      setKeyCopied(true);
      setTimeout(() => setKeyCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy AnyDesk key:', err);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <div className="container mx-auto px-4 pb-20 pt-6">
        <div className="mb-6">

          {/* AnyDesk Number */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AnyDesk Remote Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">AnyDesk ID</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-muted rounded-md font-mono text-lg font-semibold tracking-wider">
                    {anydeskKey}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyAnydeskKey}
                    className="flex items-center gap-2"
                  >
                    {keyCopied ? (
                      <>
                        <CheckCheck className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use this ID to connect remotely via AnyDesk
                </p>
              </div>
            </CardContent>
          </Card>

          {/* MQTT Connection Status */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MQTT Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <MQTTStatus showLabel={true} />
              <p className="text-xs text-muted-foreground mt-2">
                MQTT connection status for real-time device communication
              </p>
            </CardContent>
          </Card>

          {/* Lock and Unlock External Commands */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Controls</CardTitle>
              {isExternalCommandsLocked ? (
                <Lock className="h-4 w-4 text-red-500" />
              ) : (
                <Unlock className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">External Commands</label>
                  <p className="text-xs text-muted-foreground">
                    {isExternalCommandsLocked 
                      ? 'System commands are currently locked for security' 
                      : 'System commands are unlocked and can be executed'
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {isExternalCommandsLocked ? 'Locked' : 'Unlocked'}
                  </span>
                  <Switch
                    checked={!isExternalCommandsLocked}
                    onCheckedChange={handleToggleLock}
                  />
                </div>
              </div>
              <div className={`p-3 rounded-md text-sm ${
                isExternalCommandsLocked 
                  ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800' 
                  : 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-center gap-2">
                  {isExternalCommandsLocked ? (
                    <>
                      <Lock className="h-4 w-4" />
                      <span className="font-medium">Security Active:</span>
                      External system commands are blocked
                    </>
                  ) : (
                    <>
                      <Unlock className="h-4 w-4" />
                      <span className="font-medium">Security Disabled:</span>
                      External system commands are allowed
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Spotify Authentication */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Spotify Connection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Connection Status */}
              <div>
                {SpotifyConnectionStatus === 'loading' && (
                  <div className="text-muted-foreground">Checking connection...</div>
                )}
                {SpotifyConnectionStatus === 'connected' && (
                  <div className="text-green-600 dark:text-green-400 flex items-center gap-2">
                    <span className="text-lg">✓</span> Connected to Spotify
                  </div>
                )}
                {SpotifyConnectionStatus === 'disconnected' && (
                  <div className="text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span className="text-lg">×</span> Not connected to Spotify
                  </div>
                )}
                {SpotifyConnectionStatus === 'error' && (
                  <div className="text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span className="text-lg">⚠</span> Error checking connection status
                  </div>
                )}
              </div>

              {/* Authentication Form */}
              <form onSubmit={handleAuthenticate} className="space-y-4">
                {process.env.NEXT_PUBLIC_ADMIN_PASSWORD_REQUIRED === 'true' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Admin Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={SpotifyConnectionStatus === 'connected'}
                >
                  {SpotifyConnectionStatus === 'connected' ? 'Connected' : 'Connect to Spotify'}
                </Button>
              </form>

              {/* Status Messages */}
              {status && (
                <div className="text-green-600 dark:text-green-400">{status}</div>
              )}
              {error && (
                <div className="text-red-600 dark:text-red-400">{error}</div>
              )}
            </CardContent>
          </Card>

          {/* Audio Device Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Input Device</label>
                  <Select value={selectedInputDevice} onValueChange={setSelectedInputDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select input device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mic1">Microphone (Built-in)</SelectItem>
                      <SelectItem value="mic2">Microphone (USB)</SelectItem>
                      <SelectItem value="mic3">Virtual Input</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Output Device</label>
                  <Select value={selectedOutputDevice} onValueChange={setSelectedOutputDevice}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select output device" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spk1">Speakers (Built-in)</SelectItem>
                      <SelectItem value="spk2">Headphones (USB)</SelectItem>
                      <SelectItem value="spk3">Virtual Output</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Control Buttons */}
          <div className="flex gap-4">
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setShowPowerDialog(true)}
            >
              <Power className="mr-2 h-4 w-4" />
              Power Options
              {isExternalCommandsLocked && <Lock className="ml-2 h-3 w-3" />}
            </Button>
          </div>

          {/* Power Options Dialog */}
          <AlertDialog open={showPowerDialog} onOpenChange={setShowPowerDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Power Options</AlertDialogTitle>
                <AlertDialogDescription>
                  Please select a power option:
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 py-4">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setShowPowerDialog(false);
                    try {
                      await mqtt.shutdown();
                    } catch (error) {
                      console.error('Failed to send shutdown command:', error);
                    }
                  }}
                >
                  <Power className="mr-2 h-4 w-4" />
                  Shutdown
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setShowPowerDialog(false);
                    try {
                      await mqtt.reboot();
                    } catch (error) {
                      console.error('Failed to send reboot command:', error);
                    }
                  }}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reboot
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setShowPowerDialog(false);
                    try {
                      await mqtt.killSoftware();
                    } catch (error) {
                      console.error('Failed to send kill software command:', error);
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Kill Software
                </Button>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPanelContent />
    </Suspense>
  );
}