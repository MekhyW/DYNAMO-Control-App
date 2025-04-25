"use client"

import { useState, useEffect } from 'react';
import { Terminal, Settings, HardDrive, Cpu, MemoryStick, Volume2, RefreshCcw, Power } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

export default function AdminPanel() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    diskSpace: 0,
    temperature: 0,
  });
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedInputDevice, setSelectedInputDevice] = useState("");
  const [selectedOutputDevice, setSelectedOutputDevice] = useState("");

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

  const handleCommand = (command: string) => {
    setTerminalOutput(prev => [...prev, `> ${command}`, 'Processing command...']);
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">System Administration</h1>

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
            variant="outline"
            className="flex-1"
            onClick={() => window.location.reload()}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh System
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={() => setShowResetDialog(true)}
          >
            <Power className="mr-2 h-4 w-4" />
            Reset System
          </Button>
        </div>

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
  );
}