import { useState, useEffect, useCallback } from 'react';
import { createMQTTService, getMQTTService, MQTTConfig, SoundEffect, VoiceEffect, DeviceInfo } from '@/lib/mqtt';

interface MQTTState {
  isConnected: boolean;
  soundEffects: SoundEffect[];
  voiceEffects: VoiceEffect[];
  soundDevices: string[];
  anydeskId: string | null;
  bitmap: string | null;
}

interface MQTTActions {
  connect: (config: MQTTConfig) => Promise<boolean>;
  disconnect: () => void;
  playSoundEffect: (effectId: number) => Promise<void>;
  setVoiceEffect: (effectId: number) => Promise<void>;
  setOutputVolume: (volume: number) => Promise<void>;
  setMicrophoneVolume: (volume: number) => Promise<void>;
  toggleMicrophone: (enabled: boolean) => Promise<void>;
  toggleVoiceChanger: (enabled: boolean) => Promise<void>;
  toggleLeds: (enabled: boolean) => Promise<void>;
  setLedsColor: (color: string) => Promise<void>;
  setLedsEffect: (effect: string) => Promise<void>;
  toggleHotwordDetection: (enabled: boolean) => Promise<void>;
  triggerHotword: () => Promise<void>;
  textToSpeech: (text: string) => Promise<void>;
  toggleExternalCommands: (locked: boolean) => Promise<void>;
  shutdown: () => Promise<void>;
  reboot: () => Promise<void>;
  killSoftware: () => Promise<void>;
}

export function useMQTT(): MQTTState & MQTTActions {
  const [state, setState] = useState<MQTTState>({
    isConnected: false,
    soundEffects: [],
    voiceEffects: [],
    soundDevices: [],
    anydeskId: null,
    bitmap: null,
  });

  const connect = useCallback(async (): Promise<boolean> => {
    try {
      const service = createMQTTService();
      
      // Set up data subscriptions
      service.subscribe('dynamo/data/sound_effects', (data: SoundEffect[]) => {
        setState(prev => ({ ...prev, soundEffects: data }));
      });

      service.subscribe('dynamo/data/voice_effects', (data: VoiceEffect[]) => {
        setState(prev => ({ ...prev, voiceEffects: data }));
      });

      service.subscribe('dynamo/data/sound_devices', (data: string[]) => {
        setState(prev => ({ ...prev, soundDevices: data }));
      });

      service.subscribe('dynamo/data/anydesk_id', (data: { id: string }) => {
        setState(prev => ({ ...prev, anydeskId: data.id }));
      });

      service.subscribe('dynamo/data/bitmap', (data: { bitmap: string }) => {
        setState(prev => ({ ...prev, bitmap: data.bitmap }));
      });

      const connected = await service.connect();
      setState(prev => ({ ...prev, isConnected: connected }));
      return connected;
    } catch (error) {
      console.error('Failed to connect to MQTT:', error);
      setState(prev => ({ ...prev, isConnected: false }));
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    const service = getMQTTService();
    if (service) {
      service.disconnect();
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  const playSoundEffect = useCallback(async (effectId: number) => {
    const service = getMQTTService();
    if (service) {
      await service.playSoundEffect(effectId);
    }
  }, []);

  const setVoiceEffect = useCallback(async (effectId: number) => {
    const service = getMQTTService();
    if (service) {
      await service.setVoiceEffect(effectId);
    }
  }, []);

  const setOutputVolume = useCallback(async (volume: number) => {
    const service = getMQTTService();
    if (service) {
      await service.setOutputVolume(volume);
    }
  }, []);

  const setMicrophoneVolume = useCallback(async (volume: number) => {
    const service = getMQTTService();
    if (service) {
      await service.setMicrophoneVolume(volume);
    }
  }, []);

  const toggleMicrophone = useCallback(async (enabled: boolean) => {
    const service = getMQTTService();
    if (service) {
      await service.toggleMicrophone(enabled);
    }
  }, []);

  const toggleVoiceChanger = useCallback(async (enabled: boolean) => {
    const service = getMQTTService();
    if (service) {
      await service.toggleVoiceChanger(enabled);
    }
  }, []);

  const toggleLeds = useCallback(async (enabled: boolean) => {
    const service = getMQTTService();
    if (service) {
      await service.toggleLeds(enabled);
    }
  }, []);

  const setLedsColor = useCallback(async (color: string) => {
    const service = getMQTTService();
    if (service) {
      await service.setLedsColor(color);
    }
  }, []);

  const setLedsEffect = useCallback(async (effect: string) => {
    const service = getMQTTService();
    if (service) {
      await service.setLedsEffect(effect);
    }
  }, []);

  const toggleHotwordDetection = useCallback(async (enabled: boolean) => {
    const service = getMQTTService();
    if (service) {
      await service.toggleHotwordDetection(enabled);
    }
  }, []);

  const triggerHotword = useCallback(async () => {
    const service = getMQTTService();
    if (service) {
      await service.triggerHotword();
    }
  }, []);

  const textToSpeech = useCallback(async (text: string) => {
    const service = getMQTTService();
    if (service) {
      await service.textToSpeech(text);
    }
  }, []);

  const toggleExternalCommands = useCallback(async (locked: boolean) => {
    const service = getMQTTService();
    if (service) {
      await service.toggleExternalCommands(locked);
    }
  }, []);

  const shutdown = useCallback(async () => {
    const service = getMQTTService();
    if (service) {
      await service.shutdown();
    }
  }, []);

  const reboot = useCallback(async () => {
    const service = getMQTTService();
    if (service) {
      await service.reboot();
    }
  }, []);

  const killSoftware = useCallback(async () => {
    const service = getMQTTService();
    if (service) {
      await service.killSoftware();
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => { connect(); }, [connect]);

  // Monitor connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const service = getMQTTService();
      if (service) {
        const connected = service.getConnectionStatus();
        setState(prev => {
          if (prev.isConnected !== connected) {
            return { ...prev, isConnected: connected };
          }
          return prev;
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    playSoundEffect,
    setVoiceEffect,
    setOutputVolume,
    setMicrophoneVolume,
    toggleMicrophone,
    toggleVoiceChanger,
    toggleLeds,
    setLedsColor,
    setLedsEffect,
    toggleHotwordDetection,
    triggerHotword,
    textToSpeech,
    toggleExternalCommands,
    shutdown,
    reboot,
    killSoftware,
  };
}