"use client"

import { useState } from 'react';
import { Mic, MicOff, Volume2, AudioWaveform, AudioLines, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useTelegramBot } from '@/hooks/useTelegramBot';

const voiceEffectsModulation = [
  {id: 1, name: 'Mekhy'},
  {id: 2, name: 'Robot'},
  {id: 3, name: 'Ghostface'},
  {id: 4, name: 'Autotune'},
  {id: 5, name: 'Alastor'},
  {id: 6, name: 'Minion'},
];

const voiceEffectsGibberish = [
  {id: 7, name: 'Isabelle'},
  {id: 8, name: 'Canine'},
  {id: 9, name: 'Alphys'},
  {id: 10, name: 'Censored'},
];

export default function VoiceControl() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(75);
  const [voiceChangerEnabled, setVoiceChangerEnabled] = useState(true);
  const [activeEffect, setActiveEffect] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'modulation' | 'gibberish'>('modulation');
  
  const {
    setVoiceEffect,
    toggleMicrophone,
    requestVoiceEffectsList,
    toggleVoiceChanger,
    setMicrophoneVolume,
  } = useTelegramBot();

  const toggleEffect = (effectId: number) => {
    const newActiveEffect = activeEffect === effectId ? null : effectId;
    setActiveEffect(newActiveEffect);
    
    if (newActiveEffect !== null) {
      setVoiceEffect(effectId);
    }
  };
  
  const handleMicrophoneToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    toggleMicrophone(!newMutedState);
  };
  
  const handleVoiceChangerToggle = () => {
    const newVoiceChangerState = !voiceChangerEnabled;
    setVoiceChangerEnabled(newVoiceChangerState);
    toggleVoiceChanger(newVoiceChangerState);
  };
  
  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    setVolume(volumeValue);
    setMicrophoneVolume(volumeValue);
  };
  
  const handleRequestVoiceEffects = () => {
    requestVoiceEffectsList();
  };

  return (
    <div className="container mx-auto px-4 pb-32 pt-6">
      <div className="mb-6">
        {/* Voice Effects Header */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voice Effects</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestVoiceEffects}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Effects
            </Button>
          </CardHeader>
        </Card>
        
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
                onValueChange={handleVolumeChange}
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