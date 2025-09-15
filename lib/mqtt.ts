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

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface ChatLogMessage {
  id: string;
  content: string;
  type: 'prompt' | 'response';
  timestamp: string;
}

class MQTTService {
  private client: MqttClient | null = null;
  private config: MQTTConfig;
  private isConnected = false;
  private isConnecting = false;
  private subscribers: Map<string, (data: any) => void> = new Map();
  private authenticatedUser: TelegramUser | null = null;
  private commandThrottleMap: Map<string, number> = new Map();
  private readonly THROTTLE_DELAY_MS = 2000;
  
  private persistentData: {
    soundEffects: SoundEffect[];
    voiceEffects: VoiceEffect[];
    soundDevices: string[];
    anydeskId: string | null;
    bitmap: string | null;
    chatLogs: ChatLogMessage[];
  } = {
    soundEffects: [],
    voiceEffects: [],
    soundDevices: [],
    anydeskId: null,
    bitmap: null,
    chatLogs: [],
  };

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
      'dynamo/data/chat_logs',
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
      switch (topic) {
        case 'dynamo/data/sound_effects':
          this.persistentData.soundEffects = data;
          break;
        case 'dynamo/data/voice_effects':
          this.persistentData.voiceEffects = data;
          break;
        case 'dynamo/data/sound_devices':
          this.persistentData.soundDevices = data;
          break;
        case 'dynamo/data/anydesk_id':
          this.persistentData.anydeskId = data.id;
          break;
        case 'dynamo/data/bitmap':
          this.persistentData.bitmap = data.bitmap;
          break;
        case 'dynamo/data/chat_logs':
          this.persistentData.chatLogs = data;
          break;
      }
      const callback = this.subscribers.get(topic);
      if (callback) {
        callback(data);
      }
    } catch (error) {
      console.error(`Error parsing message from ${topic}:`, error);
    }
  }

  getCurrentData() {
    return { ...this.persistentData, isConnected: this.isConnected };
  }

  subscribe(topic: string, callback: (data: any) => void) {
    this.subscribers.set(topic, callback);
  }

  unsubscribe(topic: string) {
    this.subscribers.delete(topic);
  }

  setAuthenticatedUser(user: TelegramUser | null) {
    this.authenticatedUser = user;
  }

  getAuthenticatedUser(): TelegramUser | null {
    return this.authenticatedUser;
  }

  private addUserDataToPayload(payload: any): any {
    if (!this.authenticatedUser) {
      return {
        ...payload,
        user: {
          id: 0,
          first_name: 'Unauthenticated'
        }
      };
    }
    return {
      ...payload,
      user: {
        id: this.authenticatedUser.id,
        first_name: this.authenticatedUser.first_name
      }
    };
  }

  async playSoundEffect(effectId: number | string): Promise<void> {
    const commandKey = `play_sound_effect_${effectId}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ effectId });
    await this.publish('dynamo/commands/play-sound-effect', payload);
  }

  async setVoiceEffect(effectId: number): Promise<void> {
    const commandKey = `set_voice_effect_${effectId}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ effectId });
    await this.publish('dynamo/commands/set-voice-effect', payload);
  }

  async setOutputVolume(volume: number): Promise<void> {
    const commandKey = `set_output_volume_${volume}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ volume });
    await this.publish('dynamo/commands/set-output-volume', payload);
  }

  async toggleMicrophone(enabled: boolean): Promise<void> {
    const commandKey = `toggle_microphone_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ enabled });
    await this.publish('dynamo/commands/microphone-toggle', payload);
  }

  async toggleVoiceChanger(enabled: boolean): Promise<void> {
    const commandKey = `toggle_voice_changer_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ enabled });
    await this.publish('dynamo/commands/voice-changer-toggle', payload);
  }

  async toggleBackgroundSound(enabled: boolean): Promise<void> {
    const commandKey = `toggle_background_sound_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ enabled });
    await this.publish('dynamo/commands/background-sound-toggle', payload);
  }

  async toggleLeds(enabled: boolean): Promise<void> {
    const commandKey = `toggle_leds_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ enabled });
    await this.publish('dynamo/commands/leds-toggle', payload);
  }

  async setLedsBrightness(brightness: number): Promise<void> {
    const commandKey = `set_leds_brightness_${brightness}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ brightness });
    await this.publish('dynamo/commands/leds-brightness', payload);
  }

  async setEyesBrightness(brightness: number): Promise<void> {
    const commandKey = `set_eyes_brightness_${brightness}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ brightness });
    await this.publish('dynamo/commands/eyes-brightness', payload);
  }

  async setLedsColor(color: string): Promise<void> {
    const commandKey = `set_leds_color_${color}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ color });
    await this.publish('dynamo/commands/leds-color', payload);
  }

  async setLedsEffect(effect: string): Promise<void> {
    const commandKey = `set_leds_effect_${effect}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ effect });
    await this.publish('dynamo/commands/leds-effect', payload);
  }

  async toggleHotwordDetection(enabled: boolean): Promise<void> {
    const commandKey = `toggle_hotword_detection_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ enabled });
    await this.publish('dynamo/commands/hotword-detection-toggle', payload);
  }

  async triggerHotword(): Promise<void> {
    const commandKey = 'trigger_hotword';
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({});
    await this.publish('dynamo/commands/hotword-trigger', payload);
  }

  async textToSpeech(text: string): Promise<void> {
    const commandKey = `text_to_speech_${text.substring(0, 20)}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ text });
    await this.publish('dynamo/commands/text-to-speech', payload);
  }

  async setExpression(expression: string): Promise<void> {
    const commandKey = `set_expression_${expression}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ expression });
    await this.publish('dynamo/commands/set-expression', payload);
  }

  async toggleFaceExpressionTracking(enabled: boolean): Promise<void> {
    const commandKey = `toggle_face_expression_tracking_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ enabled });
    await this.publish('dynamo/commands/face-expression-tracking-toggle', payload);
  }

  async toggleEyeTracking(enabled: boolean): Promise<void> {
    const commandKey = `toggle_eye_tracking_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ enabled });
    await this.publish('dynamo/commands/eye-tracking-toggle', payload);
  }

  async toggleEyebrows(enabled: boolean): Promise<void> {
    const commandKey = `toggle_eyebrows_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ enabled });
    await this.publish('dynamo/commands/eyebrows-toggle', payload);
  }

  async toggleExternalCommands(locked: boolean): Promise<void> {
    const commandKey = `toggle_external_commands_${locked}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ locked });
    await this.publish('dynamo/commands/external-commands-lock', payload);
  }

  async shutdown(): Promise<void> {
    const commandKey = 'shutdown';
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({});
    await this.publish('dynamo/commands/shutdown', payload);
  }

  async reboot(): Promise<void> {
    const commandKey = 'reboot';
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({});
    await this.publish('dynamo/commands/reboot', payload);
  }

  async killSoftware(): Promise<void> {
    const commandKey = 'kill_software';
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({});
    await this.publish('dynamo/commands/kill-software', payload);
  }

  async setSoundDevice(deviceType: 'input' | 'output', deviceName: string): Promise<void> {
    const commandKey = `set_sound_device_${deviceType}_${deviceName}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    const payload = this.addUserDataToPayload({ deviceType, deviceName });
    await this.publish('dynamo/commands/set-sound-device', payload);
  }

  private isCommandThrottled(commandKey: string): boolean {
    const now = Date.now();
    const lastExecuted = this.commandThrottleMap.get(commandKey);
    if (lastExecuted && (now - lastExecuted) < this.THROTTLE_DELAY_MS) {
      return true;
    }
    this.commandThrottleMap.set(commandKey, now);
    return false;
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

export type { MQTTConfig, SoundEffect, VoiceEffect, DeviceInfo, ChatLogMessage };