import mqtt, { MqttClient } from 'mqtt';

interface MQTTConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  clientId: string;
}

interface SoundEffect {
  id: number;
  name: string;
  filename?: string;
}

interface VoiceEffect {
  id: number;
  name: string;
  type: string;
}

interface DeviceInfo {
  soundEffects: SoundEffect[];
  voiceEffects: VoiceEffect[];
  bitmap?: string;
  anydeskId?: string;
  soundDevices: string[];
}

class MQTTService {
  private client: MqttClient | null = null;
  private config: MQTTConfig;
  private isConnected = false;
  private isConnecting = false;
  private subscribers: Map<string, (data: any) => void> = new Map();

  constructor() {
    this.config = {
      host: process.env.NEXT_PUBLIC_MQTT_HOST || '',
      port: parseInt(process.env.NEXT_PUBLIC_MQTT_PORT || '8884'),
      username: process.env.NEXT_PUBLIC_MQTT_USERNAME || '',
      password: process.env.NEXT_PUBLIC_MQTT_PASSWORD || '',
      clientId: `dynamo-control-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  async connect(): Promise<boolean> {
    if (this.isConnected || this.isConnecting) {
      console.log('MQTT already connected or connecting');
      return this.isConnected;
    }

    if (!this.config.host || !this.config.username || !this.config.password) {
      console.error('MQTT configuration incomplete. Please set NEXT_PUBLIC_MQTT_HOST, NEXT_PUBLIC_MQTT_USERNAME, and NEXT_PUBLIC_MQTT_PASSWORD environment variables.');
      return false;
    }

    this.isConnecting = true;
    
    try {
      const connectUrl = `wss://${this.config.host}:${this.config.port}/mqtt`;
      
      this.client = mqtt.connect(connectUrl, {
        clientId: this.config.clientId,
        username: this.config.username,
        password: this.config.password,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 5000,
        keepalive: 60,
        protocolVersion: 4,
      });

      return new Promise((resolve, reject) => {
        if (!this.client) {
          reject(new Error('Failed to create MQTT client'));
          return;
        }

        let isInitialConnection = true;
        
        this.client.on('connect', () => {
          if (isInitialConnection) {
            console.log('Connected to HiveMQ Cloud');
            isInitialConnection = false;
            this.isConnecting = false;
            resolve(true);
          } else {
            console.log('MQTT reconnected successfully');
          }
          this.isConnected = true;
          this.subscribeToDataTopics();
        });

        this.client.on('error', (error) => {
          console.error('MQTT connection error:', error);
          this.isConnected = false;
          if (isInitialConnection) {
            this.isConnecting = false;
            reject(error);
          }
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message);
        });

        this.client.on('close', () => {
          console.log('MQTT connection closed');
          this.isConnected = false;
        });

        this.client.on('reconnect', () => {
          console.log('MQTT reconnecting...');
          this.isConnected = false;
        });

        this.client.on('offline', () => {
          console.log('MQTT client offline');
          this.isConnected = false;
        });
      });
    } catch (error) {
      console.error('Failed to connect to MQTT:', error);
      this.isConnecting = false;
      return false;
    }
  }

  private subscribeToDataTopics() {
    if (!this.client || !this.isConnected) return;

    const dataTopics = [
      'dynamo/data/sound_effects',
      'dynamo/data/voice_effects', 
      'dynamo/data/bitmap',
      'dynamo/data/anydesk_id',
      'dynamo/data/sound_devices',
      'mekhy/app/lock'
    ];

    dataTopics.forEach(topic => {
      this.client?.subscribe(topic, (err) => {
        if (err) {
          console.error(`Failed to subscribe to ${topic}:`, err);
        } else {
          console.log(`Subscribed to ${topic}`);
        }
      });
    });
  }

  private handleMessage(topic: string, message: Buffer) {
    try {
      const data = JSON.parse(message.toString());
      const callback = this.subscribers.get(topic);
      if (callback) {
        callback(data);
      }
    } catch (error) {
      console.error(`Error parsing message from ${topic}:`, error);
    }
  }

  subscribe(topic: string, callback: (data: any) => void) {
    this.subscribers.set(topic, callback);
  }

  unsubscribe(topic: string) {
    this.subscribers.delete(topic);
  }

  // PUBLISH methods based on commands.txt PUBLISH section
  async playSoundEffect(effectId: number): Promise<void> {
    await this.publish('dynamo/commands/play-sound-effect', { effectId });
  }

  async setVoiceEffect(effectId: number): Promise<void> {
    await this.publish('dynamo/commands/set-voice-effect', { effectId });
  }

  async setOutputVolume(volume: number): Promise<void> {
    await this.publish('dynamo/commands/set-output-volume', { volume });
  }

  async setMicrophoneVolume(volume: number): Promise<void> {
    await this.publish('dynamo/commands/set-microphone-volume', { volume });
  }

  async toggleMicrophone(enabled: boolean): Promise<void> {
    await this.publish('dynamo/commands/microphone-toggle', { enabled });
  }

  async toggleVoiceChanger(enabled: boolean): Promise<void> {
    await this.publish('dynamo/commands/voice-changer-toggle', { enabled });
  }

  async toggleLeds(enabled: boolean): Promise<void> {
    await this.publish('dynamo/commands/leds-toggle', { enabled });
  }

  async setLedsColor(color: string): Promise<void> {
    await this.publish('dynamo/commands/leds-color', { color });
  }

  async setLedsEffect(effect: string): Promise<void> {
    await this.publish('dynamo/commands/leds-effect', { effect });
  }

  async toggleHotwordDetection(enabled: boolean): Promise<void> {
    await this.publish('dynamo/commands/hotword-detection-toggle', { enabled });
  }

  async triggerHotword(): Promise<void> {
    await this.publish('dynamo/commands/hotword-trigger', {});
  }

  async textToSpeech(text: string): Promise<void> {
    await this.publish('dynamo/commands/text-to-speech', { text });
  }

  async setExpression(expression: string): Promise<void> {
    await this.publish('dynamo/commands/set-expression', { expression });
  }

  async toggleFaceExpressionTracking(enabled: boolean): Promise<void> {
    await this.publish('dynamo/commands/face-expression-tracking-toggle', { enabled });
  }

  async toggleEyeTracking(enabled: boolean): Promise<void> {
    await this.publish('dynamo/commands/eye-tracking-toggle', { enabled });
  }

  async toggleEyebrows(enabled: boolean): Promise<void> {
    await this.publish('dynamo/commands/eyebrows-toggle', { enabled });
  }

  async toggleExternalCommands(locked: boolean): Promise<void> {
    await this.publish('dynamo/commands/external-commands-lock', { locked });
  }

  async shutdown(): Promise<void> {
    await this.publish('dynamo/commands/shutdown', {});
  }

  async reboot(): Promise<void> {
    await this.publish('dynamo/commands/reboot', {});
  }

  async killSoftware(): Promise<void> {
    await this.publish('dynamo/commands/kill-software', {});
  }

  async publish(topic: string, payload: any, options: { qos?: number, retain?: boolean } = {}): Promise<void> {
    if (!this.client) {
      console.error('MQTT client not initialized');
      throw new Error('MQTT client not initialized');
    }
    
    if (!this.client.connected) {
      console.error('MQTT client not connected');
      throw new Error('MQTT client not connected');
    }

    const publishOptions = {
      qos: options.qos !== undefined ? options.qos : 1,
      retain: options.retain !== undefined ? options.retain : false
    };

    return new Promise((resolve, reject) => {
      const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      this.client!.publish(topic, payloadStr, { qos: publishOptions.qos as 0 | 1 | 2, retain: publishOptions.retain }, (err) => {
        if (err) {
          console.error(`Failed to publish to ${topic}:`, err);
          reject(err);
        } else {
          console.log(`Successfully published to ${topic}:`, payload, 'with options:', publishOptions);
          resolve();
        }
      });
    });
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      this.isConnecting = false;
    }
  }

  getConnectionStatus(): boolean {
    return this.client?.connected || false;
  }
}

// Singleton instance
let mqttService: MQTTService | null = null;

export function createMQTTService(): MQTTService {
  if (!mqttService) {
    mqttService = new MQTTService();
  }
  return mqttService;
}

export function getMQTTService(): MQTTService | null {
  return mqttService;
}

export type { MQTTConfig, SoundEffect, VoiceEffect, DeviceInfo };