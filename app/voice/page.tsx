"use client"

import { useState } from 'react';
import { Mic, MicOff, Volume2, AudioWaveform, AudioLines, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useMQTT } from '@/hooks/useMQTT';

// Fallback mock data when MQTT is not connected
const fallbackVoiceEffectsModulation = [
  {id: 1, name: 'Mekhy', type: 'modulation'},
  {id: 2, name: 'Robot', type: 'modulation'},
  {id: 3, name: 'Ghostface', type: 'modulation'},
  {id: 4, name: 'Autotune', type: 'modulation'},
  {id: 5, name: 'Alastor', type: 'modulation'},
  {id: 6, name: 'Minion', type: 'modulation'},
];

const fallbackVoiceEffectsGibberish = [
  {id: 7, name: 'Isabelle', type: 'gibberish'},
  {id: 8, name: 'Canine', type: 'gibberish'},
  {id: 9, name: 'Alphys', type: 'gibberish'},
  {id: 10, name: 'Censored', type: 'gibberish'},
];

export default function VoiceControl() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(75);
  const [voiceChangerEnabled, setVoiceChangerEnabled] = useState(true);
  const [activeEffect, setActiveEffect] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'modulation' | 'gibberish'>('modulation');

  const {
    isConnected,
    voiceEffects,
    setVoiceEffect,
    setMicrophoneVolume,
    toggleMicrophone,
    toggleVoiceChanger,
  } = useMQTT();

  // Use MQTT voice effects if connected, otherwise fallback to mock data
  const voiceEffectsModulation = isConnected && voiceEffects.length > 0 
    ? voiceEffects.filter(effect => effect.type === 'modulation')
    : fallbackVoiceEffectsModulation;
    
  const voiceEffectsGibberish = isConnected && voiceEffects.length > 0
    ? voiceEffects.filter(effect => effect.type === 'gibberish')
    : fallbackVoiceEffectsGibberish;

  const toggleEffect = async (effectId: number) => {
    const newActiveEffect = activeEffect === effectId ? null : effectId;
    setActiveEffect(newActiveEffect);
    
    if (isConnected && newActiveEffect !== null) {
      try {
        await setVoiceEffect(newActiveEffect);
      } catch (error) {
        console.error('Failed to set voice effect via MQTT:', error);
      }
    }
  };

  const handleMicrophoneToggle = async () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (isConnected) {
      try {
        await toggleMicrophone(!newMutedState);
      } catch (error) {
        console.error('Failed to toggle microphone via MQTT:', error);
      }
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    
    if (isConnected) {
      try {
        await setMicrophoneVolume(newVolume);
      } catch (error) {
        console.error('Failed to set microphone volume via MQTT:', error);
      }
    }
  };

  const handleVoiceChangerToggle = async () => {
    const newState = !voiceChangerEnabled;
    setVoiceChangerEnabled(newState);
    
    if (isConnected) {
      try {
        await toggleVoiceChanger(newState);
      } catch (error) {
        console.error('Failed to toggle voice changer via MQTT:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 pb-32 pt-6">
      
      {/* MQTT Connection Status */}
      {!isConnected && (
        <Alert className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            MQTT not connected. Using mock data. Configure MQTT connection in the header to enable real-time voice control.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        {/* Tab Buttons */}
        <div className="flex gap-4 mb-6">
          <Button
            variant={activeTab === 'modulation' ? 'default' : 'outline'}
            onClick={() => setActiveTab('modulation')}
            className="flex-1"
          >
            Modulation Effects
          </Button>
          <Button
            variant={activeTab === 'gibberish' ? 'default' : 'outline'}
            onClick={() => setActiveTab('gibberish')}
            className="flex-1"
          >
            Gibberish Effects
          </Button>
        </div>

        {/* Voice Effects Grid */}
        <div className="grid grid-cols-2 gap-4 mb-24">
          {(activeTab === 'modulation' ? voiceEffectsModulation : voiceEffectsGibberish).map((effect) => (
            <Card 
              key={effect.id} 
              className={cn(
                "cursor-pointer transition-all",
                activeEffect === effect.id && "border-primary bg-accent",
                (isMuted || !voiceChangerEnabled) && "opacity-50 pointer-events-none"
              )}
              onClick={() => toggleEffect(effect.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{effect.name}</h3>
                  </div>
                  {activeEffect === effect.id && (
                    <AudioWaveform className="h-4 w-4 text-primary" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Controls */}
        <Card className="fixed bottom-4 left-4 right-4 p-4 bg-background border-t max-w-screen-lg mx-auto mb-8">
          <CardContent className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={(value) => handleVolumeChange(value[0])}
                max={100}
                step={1}
                disabled={isMuted}
                className={cn(isMuted && "opacity-50")}
              />
              <span className="min-w-[3ch] text-sm">{volume}%</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
              <Button
                size="lg"
                variant={isMuted ? "outline" : "default"}
                className="w-full sm:w-48 flex items-center justify-center gap-2"
                onClick={handleMicrophoneToggle}
              >
                {isMuted ? (
                  <><MicOff className="h-5 w-5" /> Microphone OFF</>
                ) : (
                  <><Mic className="h-5 w-5" /> Microphone ON</>
                )}
              </Button>
              
              <Button
                size="lg"
                variant={voiceChangerEnabled ? "default" : "outline"}
                className="w-full sm:w-48 flex items-center justify-center gap-2"
                onClick={handleVoiceChangerToggle}
                disabled={isMuted}
              >
                {voiceChangerEnabled ? (
                  <><AudioWaveform className="h-5 w-5" /> Voice Changer ON</>
                ) : (
                  <><AudioLines className="h-5 w-5" /> Voice Changer OFF</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}