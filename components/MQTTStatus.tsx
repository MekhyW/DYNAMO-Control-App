'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { useMQTT } from '@/hooks/useMQTT';

interface MQTTStatusProps {
  showLabel?: boolean;
}

export function MQTTStatus({ showLabel = true }: MQTTStatusProps) {
  const { isConnected } = useMQTT();

  return (
    <div className="flex items-center gap-2">
      {isConnected ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      {showLabel && (
        <span className="text-sm">
          {isConnected ? 'MQTT Connected' : 'MQTT Disconnected'}
        </span>
      )}
    </div>
  );
}