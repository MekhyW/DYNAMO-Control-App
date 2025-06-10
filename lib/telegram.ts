'use client';

import { postEvent } from '@telegram-apps/sdk-react';

export interface TelegramCommand {
  type: string;
  payload?: any;
}

export const COMMAND_TYPES = {
  // Sound commands
  REQUEST_SOUND_EFFECTS_LIST: 'request_sound_effects_list',
  PLAY_SOUND_EFFECT: 'play_sound_effect',
  SET_OUTPUT_VOLUME: 'set_output_volume',
  
  // Voice commands
  SET_VOICE_EFFECT: 'set_voice_effect',
  MICROPHONE_TOGGLE: 'microphone_toggle',
  REQUEST_VOICE_EFFECTS_LIST: 'request_voice_effects_list',
  VOICE_CHANGER_TOGGLE: 'voice_changer_toggle',
  SET_MICROPHONE_VOLUME: 'set_microphone_volume',
  
  // Expression commands
  FACE_EXPRESSION_TRACKING_TOGGLE: 'face_expression_tracking_toggle',
  EYE_TRACKING_TOGGLE: 'eye_tracking_toggle',
  EYEBROWS_TOGGLE: 'eyebrows_toggle',
  SET_EXPRESSION: 'set_expression',
  
  // LED commands
  LEDS_TOGGLE: 'leds_toggle',
  SET_LEDS_BRIGHTNESS: 'set_leds_brightness',
  SET_LEDS_COLOR: 'set_leds_color',
  SET_LEDS_EFFECT: 'set_leds_effect',
  
  // AI commands
  HOTWORD_DETECTION_TOGGLE: 'hotword_detection_toggle',
  HOTWORD_TRIGGER: 'hotword_trigger',
  TEXT_TO_SPEECH: 'text_to_speech',
  
  // Admin commands
  REQUEST_AUDIO_DEVICE_LIST: 'request_audio_device_list',
  LOCK_UNLOCK_EXTERNAL_COMMANDS: 'lock_unlock_external_commands',
  REQUEST_ANYDESK_KEY: 'request_anydesk_key',
  SHUTDOWN: 'shutdown',
  REBOOT: 'reboot',
  KILL_SOFTWARE: 'kill_software',
} as const;

export class TelegramBotAPI {
  private static instance: TelegramBotAPI;
  
  private constructor() {}
  
  public static getInstance(): TelegramBotAPI {
    if (!TelegramBotAPI.instance) {
      TelegramBotAPI.instance = new TelegramBotAPI();
    }
    return TelegramBotAPI.instance;
  }
  
  /**
   * Send a command to the Telegram bot
   */
  public sendCommand(command: TelegramCommand): void {
    try {
      postEvent('web_app_data_send', {data: JSON.stringify(command)});
      console.log('Command sent to bot:', command);
    } catch (error) {
      console.error('Failed to send command to bot:', error);
      // Fallback: try using window.Telegram.WebApp if available
      if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
        try {
          window.Telegram.WebApp.sendData(JSON.stringify(command));
          console.log('Command sent via fallback method:', command);
        } catch (fallbackError) {
          console.error('Fallback method also failed:', fallbackError);
        }
      }
    }
  }
  
  // Sound control methods
  public requestSoundEffectsList(): void {
    this.sendCommand({ type: COMMAND_TYPES.REQUEST_SOUND_EFFECTS_LIST });
  }
  
  public playSoundEffect(effectId: number): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.PLAY_SOUND_EFFECT, 
      payload: { effectId } 
    });
  }
  
  public setOutputVolume(volume: number): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.SET_OUTPUT_VOLUME, 
      payload: { volume } 
    });
  }
  
  // Voice control methods
  public setVoiceEffect(effectId: number): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.SET_VOICE_EFFECT, 
      payload: { effectId } 
    });
  }
  
  public toggleMicrophone(enabled: boolean): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.MICROPHONE_TOGGLE, 
      payload: { enabled } 
    });
  }
  
  public requestVoiceEffectsList(): void {
    this.sendCommand({ type: COMMAND_TYPES.REQUEST_VOICE_EFFECTS_LIST });
  }
  
  public toggleVoiceChanger(enabled: boolean): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.VOICE_CHANGER_TOGGLE, 
      payload: { enabled } 
    });
  }
  
  public setMicrophoneVolume(volume: number): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.SET_MICROPHONE_VOLUME, 
      payload: { volume } 
    });
  }
  
  // Expression control methods
  public toggleFaceExpressionTracking(enabled: boolean): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.FACE_EXPRESSION_TRACKING_TOGGLE, 
      payload: { enabled } 
    });
  }
  
  public toggleEyeTracking(enabled: boolean): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.EYE_TRACKING_TOGGLE, 
      payload: { enabled } 
    });
  }
  
  public toggleEyebrows(enabled: boolean): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.EYEBROWS_TOGGLE, 
      payload: { enabled } 
    });
  }
  
  public setExpression(expressionId: number): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.SET_EXPRESSION, 
      payload: { expressionId } 
    });
  }
  
  // LED control methods
  public toggleLeds(enabled: boolean): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.LEDS_TOGGLE, 
      payload: { enabled } 
    });
  }
  
  public setLedsBrightness(brightness: number): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.SET_LEDS_BRIGHTNESS, 
      payload: { brightness } 
    });
  }
  
  public setLedsColor(color: string): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.SET_LEDS_COLOR, 
      payload: { color } 
    });
  }
  
  public setLedsEffect(effectId: number): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.SET_LEDS_EFFECT, 
      payload: { effectId } 
    });
  }
  
  // AI control methods
  public toggleHotwordDetection(enabled: boolean): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.HOTWORD_DETECTION_TOGGLE, 
      payload: { enabled } 
    });
  }
  
  public triggerHotword(): void {
    this.sendCommand({ type: COMMAND_TYPES.HOTWORD_TRIGGER });
  }
  
  public textToSpeech(text: string): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.TEXT_TO_SPEECH, 
      payload: { text } 
    });
  }
  
  // Admin control methods
  public requestAudioDeviceList(): void {
    this.sendCommand({ type: COMMAND_TYPES.REQUEST_AUDIO_DEVICE_LIST });
  }
  
  public toggleExternalCommands(locked: boolean): void {
    this.sendCommand({ 
      type: COMMAND_TYPES.LOCK_UNLOCK_EXTERNAL_COMMANDS, 
      payload: { locked } 
    });
  }
  
  public requestAnydeskKey(): void {
    this.sendCommand({ type: COMMAND_TYPES.REQUEST_ANYDESK_KEY });
  }
  
  public shutdown(): void {
    this.sendCommand({ type: COMMAND_TYPES.SHUTDOWN });
  }
  
  public reboot(): void {
    this.sendCommand({ type: COMMAND_TYPES.REBOOT });
  }
  
  public killSoftware(): void {
    this.sendCommand({ type: COMMAND_TYPES.KILL_SOFTWARE });
  }
}

export const telegramBot = TelegramBotAPI.getInstance();

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        sendData: (data: string) => void;
        ready: () => void;
        expand: () => void;
        close: () => void;
      };
    };
  }
}