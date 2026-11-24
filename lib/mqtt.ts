// Browser-side device service. It never talks to the MQTT broker directly:
// commands go through /api/mqtt/command and device data arrives from
// /api/mqtt/stream, both of which verify the Telegram user on the server.
import { telegramAuthHeaders } from './telegram-client';

/** @deprecated Broker settings are server-side only; kept for type compatibility. */
interface MQTTConfig {
  [key: string]: unknown;
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
  private isConnected = false;
  private isConnecting = false;
  private streamOpen = false;
  private abortController: AbortController | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelayMs = 1000;
  private stopped = false;
  private subscribers: Map<string, (data: any) => void> = new Map();
  private authenticatedUser: TelegramUser | null = null;
  private commandThrottleMap: Map<string, number> = new Map();
  private readonly THROTTLE_DELAY_MS = 2000;

  private persistentData: {
    soundEffects: SoundEffect[];
    voiceEffects: VoiceEffect[];
    soundDevices: string[];
    bitmap: string | null;
    chatLogs: ChatLogMessage[];
  } = {
    soundEffects: [],
    voiceEffects: [],
    soundDevices: [],
    bitmap: null,
    chatLogs: [],
  };

  async connect(): Promise<boolean> {
    if (this.isConnected || this.isConnecting) {
      console.log('Device stream already connected or connecting');
      return this.isConnected;
    }
    if (typeof window === 'undefined') return false;
    // A retry is already scheduled with backoff; don't bypass it.
    if (this.reconnectTimer || this.streamOpen) return this.isConnected;

    this.stopped = false;
    this.isConnecting = true;
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const settle = (value: boolean) => {
        if (settled) return;
        settled = true;
        this.isConnecting = false;
        resolve(value);
      };
      setTimeout(() => settle(this.isConnected), 10000);
      this.openStream((connected) => settle(connected));
    });
  }

  private scheduleReconnect(delayMs = this.reconnectDelayMs) {
    if (this.stopped || this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openStream();
    }, delayMs);
    this.reconnectDelayMs = Math.min(this.reconnectDelayMs * 2, 15000);
  }

  private async openStream(onFirstStatus?: (connected: boolean) => void) {
    if (this.stopped || this.streamOpen) return;
    const controller = new AbortController();
    this.abortController = controller;
    this.streamOpen = true;
    let reported = false;
    const report = (connected: boolean) => {
      this.isConnected = connected;
      if (!reported) {
        reported = true;
        onFirstStatus?.(connected);
      }
    };

    try {
      const response = await fetch('/api/mqtt/stream', {
        headers: { Accept: 'text/event-stream', ...telegramAuthHeaders() },
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok || !response.body) {
        console.error(`Device stream rejected (${response.status})`);
        this.streamOpen = false;
        report(false);
        // Auth failures will not fix themselves quickly; back off harder.
        this.scheduleReconnect(response.status === 401 || response.status === 403 ? 30000 : undefined);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary: number;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const rawEvent = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          let eventName = 'message';
          const dataLines: string[] = [];
          for (const line of rawEvent.split('\n')) {
            if (line.startsWith('event:')) eventName = line.slice(6).trim();
            else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
          }
          if (dataLines.length === 0) continue;
          let payload: any;
          try {
            payload = JSON.parse(dataLines.join('\n'));
          } catch {
            continue;
          }
          if (eventName === 'status') {
            report(!!payload.connected);
            if (payload.connected) {
              this.reconnectDelayMs = 1000;
              console.log('Device stream connected');
            }
          } else if (eventName === 'message' && typeof payload.topic === 'string') {
            await this.handleMessage(payload.topic, payload.data);
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) console.error('Device stream error:', error);
    }

    this.streamOpen = false;
    this.isConnected = false;
    report(false);
    if (!controller.signal.aborted) this.scheduleReconnect();
  }

  private async handleMessage(topic: string, data: any) {
    try {
      // The server substitutes persisted lists when the device sends an empty one.
      switch (topic) {
        case 'dynamo/data/sound_effects':
          if (Array.isArray(data)) this.persistentData.soundEffects = data;
          break;
        case 'dynamo/data/voice_effects':
          if (Array.isArray(data)) this.persistentData.voiceEffects = data;
          break;
        case 'dynamo/data/sound_devices':
          if (Array.isArray(data)) this.persistentData.soundDevices = data;
          break;
        case 'dynamo/data/bitmap':
          this.persistentData.bitmap = data?.bitmap ?? null;
          break;
        case 'dynamo/data/chat_logs':
          this.persistentData.chatLogs = data;
          break;
        case 'dynamo/spotify':
          this.handleSpotifyCommand(data);
          break;
      }
      const callback = this.subscribers.get(topic);
      if (callback) {
        callback(data);
      }
    } catch (error) {
      console.error(`Error handling message from ${topic}:`, error);
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

  /** Sends a command through the server, which verifies the user and publishes it. */
  private async sendCommand(command: string, params: Record<string, unknown> = {}): Promise<void> {
    const response = await fetch('/api/mqtt/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...telegramAuthHeaders() },
      body: JSON.stringify({ command, params }),
    });
    if (!response.ok) {
      let message = `Command failed (${response.status})`;
      try {
        const body = await response.json();
        if (body?.error) message = body.error;
      } catch {
        // keep default message
      }
      console.error(`Command ${command} rejected:`, message);
      throw new Error(message);
    }
    console.log(`Command sent: ${command}`, params);
  }

  /** Owner only: sets the global app lock (retained on the broker). */
  async setAppLock(locked: boolean): Promise<void> {
    await this.sendCommand('app-lock', { locked });
  }

  async playSoundEffect(effectId: number | string): Promise<void> {
    const commandKey = `play_sound_effect_${effectId}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('play-sound-effect', { effectId });
  }

  async setVoiceEffect(effectId: number): Promise<void> {
    const commandKey = `set_voice_effect_${effectId}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('set-voice-effect', { effectId });
  }

  async setOutputVolume(volume: number): Promise<void> {
    const commandKey = `set_output_volume_${volume}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('set-output-volume', { volume });
  }

  async toggleMicrophone(enabled: boolean): Promise<void> {
    const commandKey = `toggle_microphone_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('microphone-toggle', { enabled });
  }

  async toggleVoiceChanger(enabled: boolean): Promise<void> {
    const commandKey = `toggle_voice_changer_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('voice-changer-toggle', { enabled });
  }

  async toggleBackgroundSound(enabled: boolean): Promise<void> {
    const commandKey = `toggle_background_sound_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('background-sound-toggle', { enabled });
  }

  async toggleLeds(enabled: boolean): Promise<void> {
    const commandKey = `toggle_leds_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('leds-toggle', { enabled });
  }

  async setLedsBrightness(brightness: number): Promise<void> {
    const commandKey = `set_leds_brightness_${brightness}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('leds-brightness', { brightness });
  }

  async setEyesBrightness(brightness: number): Promise<void> {
    const commandKey = `set_eyes_brightness_${brightness}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('eyes-brightness', { brightness });
  }

  async setLedsColor(color: string): Promise<void> {
    const commandKey = `set_leds_color_${color}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('leds-color', { color });
  }

  async setLedsEffect(effect: string): Promise<void> {
    const commandKey = `set_leds_effect_${effect}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('leds-effect', { effect });
  }

  async toggleHotwordDetection(enabled: boolean): Promise<void> {
    const commandKey = `toggle_hotword_detection_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('hotword-detection-toggle', { enabled });
  }

  async triggerHotword(): Promise<void> {
    const commandKey = 'trigger_hotword';
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('hotword-trigger');
  }

  async textToSpeech(text: string): Promise<void> {
    const commandKey = `text_to_speech_${text.substring(0, 20)}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('text-to-speech', { text });
  }

  async setExpression(expression: string): Promise<void> {
    const commandKey = `set_expression_${expression}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('set-expression', { expression });
  }

  async toggleFaceExpressionTracking(enabled: boolean): Promise<void> {
    const commandKey = `toggle_face_expression_tracking_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('face-expression-tracking-toggle', { enabled });
  }

  async toggleEyeTracking(enabled: boolean): Promise<void> {
    const commandKey = `toggle_eye_tracking_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('eye-tracking-toggle', { enabled });
  }

  async toggleMotors(enabled: boolean): Promise<void> {
    const commandKey = `toggle_motors_${enabled}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('motors-toggle', { enabled });
  }

  async toggleExternalCommands(locked: boolean): Promise<void> {
    const commandKey = `toggle_external_commands_${locked}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('external-commands-lock', { locked });
  }

  async sendEyesVideo(videoUrl: string): Promise<void> {
    const commandKey = `send_eyes_video_${videoUrl}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('eyes-video', { url: videoUrl });
  }

  async shutdown(): Promise<void> {
    const commandKey = 'shutdown';
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('shutdown');
  }

  async reboot(): Promise<void> {
    const commandKey = 'reboot';
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('reboot');
  }

  async killSoftware(): Promise<void> {
    const commandKey = 'kill_software';
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('kill-software');
  }

  async setSoundDevice(deviceType: 'input' | 'output', deviceName: string): Promise<void> {
    const commandKey = `set_sound_device_${deviceType}_${deviceName}`;
    if (this.isCommandThrottled(commandKey)) {
      console.log(`Command throttled: ${commandKey}`);
      return;
    }
    await this.sendCommand('set-sound-device', { deviceType, deviceName });
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

  private async handleSpotifyCommand(data: any) {
    try {
      const { action, query, uris, device_id } = data;
      switch (action) {
        case 'search_and_play':
          if (query) {
            await this.searchAndPlaySpotify(query, device_id);
          }
          break;
        case 'play':
          await this.playSpotify(uris, device_id);
          break;
        case 'pause':
          await this.pauseSpotify();
          break;
        default:
          console.warn(`Unknown Spotify action: ${action}`);
      }
    } catch (error) {
      console.error('Error handling Spotify command:', error);
    }
  }

  private async searchAndPlaySpotify(query: string, deviceId?: string) {
    try {
      const searchResponse = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`); // Search for tracks
      if (!searchResponse.ok) { throw new Error(`Search failed: ${searchResponse.statusText}`); }
      const searchData = await searchResponse.json();
      if (searchData.tracks && searchData.tracks.items && searchData.tracks.items.length > 0) {
        const firstTrack = searchData.tracks.items[0]; // Play the first track found
        const playPayload: any = { uris: [firstTrack.uri] };
        if (deviceId) { playPayload.device_id = deviceId; }
        const playResponse = await fetch('/api/spotify/play', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(playPayload)
        });
        if (!playResponse.ok) { throw new Error(`Play failed: ${playResponse.statusText}`); }
        console.log(`Successfully played track: ${firstTrack.name} by ${firstTrack.artists[0].name}`);
      } else {
        console.warn(`No tracks found for query: ${query}`);
      }
    } catch (error) {
      console.error('Error in searchAndPlaySpotify:', error);
    }
  }

  private async playSpotify(uris?: string[], deviceId?: string) {
    try {
      const playPayload: any = {};
      if (uris && uris.length > 0) { playPayload.uris = uris; }
      if (deviceId) { playPayload.device_id = deviceId; }
      const response = await fetch('/api/spotify/play', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playPayload)
      });
      if (!response.ok) { throw new Error(`Play failed: ${response.statusText}`); }
      console.log('Successfully resumed/started Spotify playback');
    } catch (error) {
      console.error('Error in playSpotify:', error);
    }
  }

  private async pauseSpotify() {
    try {
      const response = await fetch('/api/spotify/pause', {method: 'PUT'});
      if (!response.ok) { throw new Error(`Pause failed: ${response.statusText}`); }
      console.log('Successfully paused Spotify playback');
    } catch (error) {
      console.error('Error in pauseSpotify:', error);
    }
  }

  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.abortController?.abort();
    this.abortController = null;
    this.streamOpen = false;
    this.isConnected = false;
    this.isConnecting = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
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