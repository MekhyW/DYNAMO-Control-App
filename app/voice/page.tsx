"use client"

import { useState, useEffect } from 'react';
import { Mic, MicOff, AudioWaveform, AudioLines, WifiOff, Music, Music3, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMQTT } from '@/hooks/useMQTT';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { useSoundPlayer } from '@/components/SoundPlayer';
import Image from 'next/image';

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function VoiceControl() {
  const { playSound } = useSoundPlayer();
  const [isMuted, setIsMuted] = useState(false);
  const [voiceChangerEnabled, setVoiceChangerEnabled] = useState(true);
  const [backgroundSoundEnabled, setBackgroundSoundEnabled] = useState(true);
  const [activeEffect, setActiveEffect] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'modulation' | 'gibberish'>('modulation');
  const [fetchedVoiceEffects, setFetchedVoiceEffects] = useState<any[]>([]);
  const [shuffledEffects, setShuffledEffects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [iconAvailableIds, setIconAvailableIds] = useState<Set<number>>(new Set());
  const [isCheckingIcons, setIsCheckingIcons] = useState(false);

  const {
    isConnected,
    voiceEffects,
    setVoiceEffect,
    toggleMicrophone,
    toggleVoiceChanger,
    toggleBackgroundSound,
  } = useMQTT();

  useEffect(() => {
    if (voiceEffects.length > 0) {
      setFetchedVoiceEffects(voiceEffects);
      setShuffledEffects(shuffleArray(voiceEffects));
    }
  }, [voiceEffects]);

  useEffect(() => {
    let cancelled = false;
    setIsCheckingIcons(true);
    const checkIcons = async () => {
      const ids = new Set<number>();
      const list = shuffledEffects.length > 0 ? shuffledEffects : [];
      await Promise.all(
        list.map(async (effect) => {
          try {
            const res = await fetch(`/voice_icons/${effect.name.toLowerCase()}.png`, { method: 'HEAD' });
            if (res.ok) { ids.add(effect.id); }
          } catch {} // ignore network errors
        })
      );
      if (!cancelled) {
        setIconAvailableIds(ids);
        setIsCheckingIcons(false);
      }
    };
    checkIcons();
    return () => { cancelled = true; };
  }, [shuffledEffects]);

  useEffect(() => {
    if (voiceEffects.length === 0 && shuffledEffects.length === 0) {
      setShuffledEffects([]);
    }
  }, [voiceEffects.length, shuffledEffects.length]);

  const effectsToUse = shuffledEffects.length > 0 ? shuffledEffects : [];
  const filteredEffects = effectsToUse.filter(effect => effect.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredEffectsWithIcons = filteredEffects.filter(effect => iconAvailableIds.has(effect.id));
  const voiceEffectsModulation = filteredEffectsWithIcons.filter(effect => effect.type === 'modulation');
  const voiceEffectsGibberish = filteredEffectsWithIcons.filter(effect => effect.type === 'gibberish');

  const toggleEffect = async (effectId: number) => {
    playSound('major');
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
    playSound('major');
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

  const handleVoiceChangerToggle = async () => {
    playSound('major');
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

  const handleBackgroundSoundToggle = async () => {
    playSound('major');
    const newState = !backgroundSoundEnabled;
    setBackgroundSoundEnabled(newState);
    if (isConnected) {
      try {
        await toggleBackgroundSound(newState);
      } catch (error) {
        console.error('Failed to toggle background sound via MQTT:', error);
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
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search voice effects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Voice Effects Grid */}
        {isCheckingIcons ? (
          <div className="text-center py-8 text-muted-foreground mb-24">
            <p>Loading voice effects...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mb-24">
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
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-12 h-12 flex-shrink-0">
                    <Image
                      src={`/voice_icons/${effect.name.toLowerCase()}.png`}
                      alt={`${effect.name} icon`}
                      fill
                      className="object-cover rounded"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <h3 className="font-medium text-center">
                      <DecryptedText 
                        text={effect.name}
                        animateOn="hover"
                        sequential={true}
                        speed={30}
                        maxIterations={8}
                        className="text-voice-mod"
                        encryptedClassName="text-voice-mod opacity-60"
                        useOriginalCharsOnly={true}
                      />
                    </h3>
                    {activeEffect === effect.id && (
                      <AudioWaveform className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {/* Show message when no effects match search */}
        {searchQuery && !isCheckingIcons && (activeTab === 'modulation' ? voiceEffectsModulation : voiceEffectsGibberish).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No voice effects found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Main Controls */}
        <Card className="fixed bottom-2 left-4 right-4 p-4 bg-background border-t max-w-screen-lg mx-auto mb-8">
          <CardContent className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 w-full">
              <Button
                size="sm"
                variant={isMuted ? "outline" : "default"}
                className="w-full sm:w-48 flex items-center justify-center gap-2"
                onClick={handleMicrophoneToggle}
              >
                {isMuted ? (
                  <><MicOff className="h-5 w-5" /> 
                    Microphone OFF
                  </>
                ) : (
                  <><Mic className="h-5 w-5" /> 
                    Microphone ON
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant={voiceChangerEnabled ? "default" : "outline"}
                className="w-full sm:w-48 flex items-center justify-center gap-2"
                onClick={handleVoiceChangerToggle}
                disabled={isMuted}
              >
                {voiceChangerEnabled ? (
                  <><AudioWaveform className="h-5 w-5" /> 
                    Voice Changer ON
                  </>
                ) : (
                  <><AudioLines className="h-5 w-5" /> 
                    Voice Changer OFF
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant={backgroundSoundEnabled ? "default" : "outline"}
                className="w-full sm:w-48 flex items-center justify-center gap-2"
                onClick={handleBackgroundSoundToggle}
                disabled={isMuted}
              >
                {backgroundSoundEnabled ? (
                  <><Music className="h-5 w-5" /> 
                    Background Sound ON
                  </>
                ) : (
                  <><Music3 className="h-5 w-5" /> 
                    Background Sound OFF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}