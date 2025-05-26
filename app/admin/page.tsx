"use client"

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Terminal, Settings, HardDrive, Cpu, MemoryStick, RefreshCcw, Power, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
import { ScrollArea } from '@/components/ui/scroll-area';

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskSpace: number;
  temperature: number;
}

function AdminPanelContent() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskSpace: 0,
    temperature: 0,
  });
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [showPowerDialog, setShowPowerDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedInputDevice, setSelectedInputDevice] = useState("");
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("");
  const [password, setPassword] = useState<string>('');
  const [status, setSpotifyStatus] = useState<string>('');
  const [error, setSpotifyError] = useState<string>('');
  const [SpotifyConnectionStatus, setSpotifyConnectionStatus] = useState<SpotifyConnectionStatus>('loading');
  
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

  // Simulate metrics update
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        cpuUsage: Math.random() * 100,
        memoryUsage: Math.random() * 100,
        diskSpace: Math.random() * 100,
        temperature: 40 + Math.random() * 20,
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

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

  const handleCommand = (command: string) => {
    setTerminalOutput(prev => [...prev, `> ${command}`, 'Processing command...']);
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      {
        <div className="container mx-auto px-4 pb-20 pt-6">
        <div className="mb-6">
  
          {/* System Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.cpuUsage.toFixed(1)}%</div>
                <div className="w-full bg-secondary mt-2 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${metrics.cpuUsage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <MemoryStick className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(1)}%</div>
                <div className="w-full bg-secondary mt-2 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${metrics.memoryUsage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Space</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.diskSpace.toFixed(1)}%</div>
                <div className="w-full bg-secondary mt-2 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${metrics.diskSpace}%` }}
                  />
                </div>
              </CardContent>
            </Card>
  
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.temperature.toFixed(1)}°C</div>
                <div className="w-full bg-secondary mt-2 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${(metrics.temperature - 40) * 5}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
  
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
  
          {/* Command Terminal */}
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Terminal</CardTitle>
              <Terminal className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border bg-black p-4">
                <div className="font-mono text-sm text-green-400">
                  {terminalOutput.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              </ScrollArea>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Enter command..."
                  className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCommand(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
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
                  onClick={() => {
                    setShowPowerDialog(false);
                    handleCommand('system:shutdown');
                  }}
                >
                  <Power className="mr-2 h-4 w-4" />
                  Shutdown
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowPowerDialog(false);
                    handleCommand('system:reboot');
                  }}
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Reboot
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowPowerDialog(false);
                    handleCommand('system:kill');
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
  
          {/* Reset Confirmation Dialog */}
          <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset System?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action will reset all system settings to their default values.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    setShowResetDialog(false);
                    handleCommand('system:reset');
                  }}
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      }
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