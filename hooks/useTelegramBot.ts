'use client';

import { useCallback } from 'react';
import { telegramBot, COMMAND_TYPES } from '@/lib/telegram';

/**
 * Custom hook for interacting with the Telegram bot
 * Provides easy-to-use methods for sending commands to the bot
 */
export function useTelegramBot() {
  // Sound control hooks
  const requestSoundEffectsList = useCallback(() => {
    telegramBot.requestSoundEffectsList();
  }, []);
  
  const playSoundEffect = useCallback((effectId: number) => {
    telegramBot.playSoundEffect(effectId);
  }, []);
  
  const setOutputVolume = useCallback((volume: number) => {
    telegramBot.setOutputVolume(volume);
  }, []);
  
  // Voice control hooks
  const setVoiceEffect = useCallback((effectId: number) => {
    telegramBot.setVoiceEffect(effectId);
  }, []);
  
  const toggleMicrophone = useCallback((enabled: boolean) => {
    telegramBot.toggleMicrophone(enabled);
  }, []);
  
  const requestVoiceEffectsList = useCallback(() => {
    telegramBot.requestVoiceEffectsList();
  }, []);
  
  const toggleVoiceChanger = useCallback((enabled: boolean) => {
    telegramBot.toggleVoiceChanger(enabled);
  }, []);
  
  const setMicrophoneVolume = useCallback((volume: number) => {
    telegramBot.setMicrophoneVolume(volume);
  }, []);
  
  // Expression control hooks
  const toggleFaceExpressionTracking = useCallback((enabled: boolean) => {
    telegramBot.toggleFaceExpressionTracking(enabled);
  }, []);
  
  const toggleEyeTracking = useCallback((enabled: boolean) => {
    telegramBot.toggleEyeTracking(enabled);
  }, []);
  
  const toggleEyebrows = useCallback((enabled: boolean) => {
    telegramBot.toggleEyebrows(enabled);
  }, []);
  
  const setExpression = useCallback((expressionId: number) => {
    telegramBot.setExpression(expressionId);
  }, []);
  
  // LED control hooks
  const toggleLeds = useCallback((enabled: boolean) => {
    telegramBot.toggleLeds(enabled);
  }, []);
  
  const setLedsBrightness = useCallback((brightness: number) => {
    telegramBot.setLedsBrightness(brightness);
  }, []);
  
  const setLedsColor = useCallback((color: string) => {
    telegramBot.setLedsColor(color);
  }, []);
  
  const setLedsEffect = useCallback((effectId: number) => {
    telegramBot.setLedsEffect(effectId);
  }, []);
  
  // AI control hooks
  const toggleHotwordDetection = useCallback((enabled: boolean) => {
    telegramBot.toggleHotwordDetection(enabled);
  }, []);
  
  const triggerHotword = useCallback(() => {
    telegramBot.triggerHotword();
  }, []);
  
  const textToSpeech = useCallback((text: string) => {
    telegramBot.textToSpeech(text);
  }, []);
  
  // Admin control hooks
  const requestAudioDeviceList = useCallback(() => {
    telegramBot.requestAudioDeviceList();
  }, []);
  
  const toggleExternalCommands = useCallback((locked: boolean) => {
    telegramBot.toggleExternalCommands(locked);
  }, []);
  
  const requestAnydeskKey = useCallback(() => {
    telegramBot.requestAnydeskKey();
  }, []);
  
  const shutdown = useCallback(() => {
    telegramBot.shutdown();
  }, []);
  
  const reboot = useCallback(() => {
    telegramBot.reboot();
  }, []);
  
  const killSoftware = useCallback(() => {
    telegramBot.killSoftware();
  }, []);
  
  return {
    // Sound controls
    requestSoundEffectsList,
    playSoundEffect,
    setOutputVolume,
    
    // Voice controls
    setVoiceEffect,
    toggleMicrophone,
    requestVoiceEffectsList,
    toggleVoiceChanger,
    setMicrophoneVolume,
    
    // Expression controls
    toggleFaceExpressionTracking,
    toggleEyeTracking,
    toggleEyebrows,
    setExpression,
    
    // LED controls
    toggleLeds,
    setLedsBrightness,
    setLedsColor,
    setLedsEffect,
    
    // AI controls
    toggleHotwordDetection,
    triggerHotword,
    textToSpeech,
    
    // Admin controls
    requestAudioDeviceList,
    toggleExternalCommands,
    requestAnydeskKey,
    shutdown,
    reboot,
    killSoftware,
    
    // Direct access to command types for custom usage
    COMMAND_TYPES,
  };
}