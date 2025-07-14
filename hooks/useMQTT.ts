"use client"

import { useState, useCallback, useEffect } from 'react';
import { createMQTTService, getMQTTService, MQTTConfig, SoundEffect, VoiceEffect } from '@/lib/mqtt';
import { useTelegram, TelegramUser } from '@/contexts/TelegramContext';

interface ChatLogMessage {
  id: string;
  content: string;
  type: 'prompt' | 'response';
  timestamp: string;
}

interface MQTTState {
  isConnected: boolean;
  soundEffects: SoundEffect[];
  voiceEffects: VoiceEffect[];
  soundDevices: string[];
  anydeskId: string | null;
  bitmap: string | null;
  chatLogs: ChatLogMessage[];
}

interface MQTTActions {
  connect: (config: MQTTConfig) => Promise<boolean>;
  disconnect: () => void;
  playSoundEffect: (effectId: number | string) => Promise<void>;
  setVoiceEffect: (effectId: number) => Promise<void>;
  setOutputVolume: (volume: number) => Promise<void>;
  toggleMicrophone: (enabled: boolean) => Promise<void>;
  toggleVoiceChanger: (enabled: boolean) => Promise<void>;
  toggleLeds: (enabled: boolean) => Promise<void>;
  setLedsBrightness: (brightness: number) => Promise<void>;
  setEyesBrightness: (brightness: number) => Promise<void>;
  setLedsColor: (color: string) => Promise<void>;
  setLedsEffect: (effect: string) => Promise<void>;
  toggleHotwordDetection: (enabled: boolean) => Promise<void>;
  triggerHotword: () => Promise<void>;
  textToSpeech: (text: string) => Promise<void>;
  setExpression: (expression: string) => Promise<void>;
  toggleFaceExpressionTracking: (enabled: boolean) => Promise<void>;
  toggleEyeTracking: (enabled: boolean) => Promise<void>;
  toggleEyebrows: (enabled: boolean) => Promise<void>;
  toggleExternalCommands: (locked: boolean) => Promise<void>;
  setSoundDevice: (deviceType: 'input' | 'output', deviceName: string) => Promise<void>;
  shutdown: () => Promise<void>;
  reboot: () => Promise<void>;
  killSoftware: () => Promise<void>;
}

export function useMQTT(): MQTTState & MQTTActions {
  let user: TelegramUser | null = null;
  try {
    const telegramContext = useTelegram();
    user = telegramContext.user;
  } catch (error) {
    console.log('TelegramProvider not available yet, proceeding without user context');
  }

  const [state, setState] = useState<MQTTState>(() => {
    const service = getMQTTService();
    if (service) {
      const currentData = service.getCurrentData();
      return {
        isConnected: currentData.isConnected,
        soundEffects: currentData.soundEffects,
        voiceEffects: currentData.voiceEffects,
        soundDevices: currentData.soundDevices,
        anydeskId: currentData.anydeskId,
        bitmap: currentData.bitmap,
        chatLogs: [],
      };
    }
    return {
      isConnected: false,
      soundEffects: [],
      voiceEffects: [],
      soundDevices: [],
      anydeskId: null,
      bitmap: null,
      chatLogs: [],
    };
  });
  
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const service = getMQTTService();
    if (service) {
      service.setAuthenticatedUser(user);
    }
  }, [user]);

  const connect = useCallback(async (): Promise<boolean> => {
    if (isConnecting) {
      console.log('Connection attempt already in progress');
      return false;
    }
    
    try {
      const service = createMQTTService();
      
      if (service.getConnectionStatus()) {
        console.log('MQTT already connected');
        const currentData = service.getCurrentData();
        setState(prev => ({ 
          ...prev, 
          ...currentData
        }));
        return true;
      }

      service.subscribe('dynamo/data/sound_effects', (data: SoundEffect[]) => {
        console.log('Received sound effects data:', data);
        setState(prev => ({ ...prev, soundEffects: data }));
      });

      service.subscribe('dynamo/data/voice_effects', (data: VoiceEffect[]) => {
        console.log('Received voice effects data:', data);
        setState(prev => ({ ...prev, voiceEffects: data }));
      });

      service.subscribe('dynamo/data/sound_devices', (data: string[]) => {
        console.log('Received sound devices data:', data);
        setState(prev => ({ ...prev, soundDevices: data }));
      });

      service.subscribe('dynamo/data/anydesk_id', (data: { id: string }) => {
        console.log('Received anydesk ID data:', data);
        setState(prev => ({ ...prev, anydeskId: data.id }));
      });

      service.subscribe('dynamo/data/bitmap', (data: { bitmap: string }) => {
        console.log('Received bitmap data:', data);
        setState(prev => ({ ...prev, bitmap: data.bitmap }));
      });

      service.subscribe('dynamo/data/chat_logs', (data: ChatLogMessage) => {
        console.log('Received chat log data:', data);
        setState(prev => {
          const messageExists = prev.chatLogs.some(msg => msg.id === data.id);
          if (messageExists) {
            return prev;
          }
          return {
            ...prev, 
            chatLogs: [...prev.chatLogs, data]
          };
        });
      });
      
      setIsConnecting(true);
      console.log('Attempting MQTT connection...');
      const success = await service.connect();
      
      if (success) {
        console.log('MQTT connection successful');
        const currentData = service.getCurrentData();
        setState(prev => ({ 
          ...prev, 
          ...currentData
        }));
        setIsConnecting(false);
        return true;
      } else {
        console.log('MQTT connection failed');
        setState(prev => ({ ...prev, isConnected: false }));
        setIsConnecting(false);
        return false;
      }
    } catch (error) {
      console.error('Failed to connect to MQTT:', error);
      setState(prev => ({ ...prev, isConnected: false }));
      setIsConnecting(false);
      return false;
    }
  }, [isConnecting]);

  const disconnect = useCallback(() => {
    const service = getMQTTService();
    if (service) {
      service.disconnect();
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  const playSoundEffect = useCallback(async (effectId: number | string) => {
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

  const setLedsBrightness = useCallback(async (brightness: number) => {
    const service = getMQTTService();
    if (service) {
      await service.setLedsBrightness(brightness);
    }
  }, []);

  const setEyesBrightness = useCallback(async (brightness: number) => {
    const service = getMQTTService();
    if (service) {
      await service.setEyesBrightness(brightness);
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

  const setExpression = useCallback(async (expression: string) => {
    const service = getMQTTService();
    if (service) {
      await service.setExpression(expression);
    }
  }, []);

  const toggleFaceExpressionTracking = useCallback(async (enabled: boolean) => {
    const service = getMQTTService();
    if (service) {
      await service.toggleFaceExpressionTracking(enabled);
    }
  }, []);

  const toggleEyeTracking = useCallback(async (enabled: boolean) => {
    const service = getMQTTService();
    if (service) {
      await service.toggleEyeTracking(enabled);
    }
  }, []);

  const toggleEyebrows = useCallback(async (enabled: boolean) => {
    const service = getMQTTService();
    if (service) {
      await service.toggleEyebrows(enabled);
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

  const setSoundDevice = useCallback(async (deviceType: 'input' | 'output', deviceName: string) => {
    const service = getMQTTService();
    if (service) {
      await service.setSoundDevice(deviceType, deviceName);
    }
  }, []);

  // Auto-connect on mount (only once)
  useEffect(() => {
    let mounted = true;
    const attemptConnection = async () => {
      if (mounted && !isConnecting) {
        await connect();
      }
    };
    attemptConnection();
    return () => {
      mounted = false;
    };
  }, [connect, isConnecting]);

  // Monitor connection status with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let lastStatus: boolean | null = null;
    
    const checkConnection = () => {
      const service = getMQTTService();
      if (service) {
        const connected = service.getConnectionStatus();
        if (lastStatus !== connected) {
          console.log('MQTT connection status changed:', lastStatus, '->', connected);
          lastStatus = connected;
          setState(prev => ({ ...prev, isConnected: connected }));
        }
      }
      timeoutId = setTimeout(checkConnection, 5000); // Check every 5 seconds
    };

    timeoutId = setTimeout(checkConnection, 1000);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup subscriptions on unmount
      const service = getMQTTService();
      if (service) {
        service.unsubscribe('dynamo/data/sound_effects');
        service.unsubscribe('dynamo/data/voice_effects');
        service.unsubscribe('dynamo/data/sound_devices');
        service.unsubscribe('dynamo/data/anydesk_id');
        service.unsubscribe('dynamo/data/bitmap');
        service.unsubscribe('dynamo/data/chat_logs');
      }
    };
  }, []);

  return {
    ...state,
    connect,
    disconnect,
    playSoundEffect,
    setVoiceEffect,
    setOutputVolume,
    toggleMicrophone,
    toggleVoiceChanger,
    toggleLeds,
    setLedsBrightness,
    setEyesBrightness,
    setLedsColor,
    setLedsEffect,
    toggleHotwordDetection,
    triggerHotword,
    textToSpeech,
    setExpression,
    toggleFaceExpressionTracking,
    toggleEyeTracking,
    toggleEyebrows,
    toggleExternalCommands,
    setSoundDevice,
    shutdown,
    reboot,
    killSoftware,
  };
}