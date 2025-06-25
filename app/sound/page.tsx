"use client"

import { useState, useRef, useCallback } from 'react';
import { Search, Play, Pause, SkipForward, Volume2, ListMusic, WifiOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSpotify } from '@/hooks/useSpotify';
import { useMQTT } from '@/hooks/useMQTT';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DecryptedText } from '@/components/ui/decrypted-text';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Fallback mock data when MQTT is not connected
const fallbackSoundPresets = [
  {id: 1, name: 'Startup Sequence'},
  {id: 2, name: 'System Ready'},
  {id: 3, name: 'Warning Alert'},
  {id: 4, name: 'Power Down'},
  {id: 5, name: 'Shield Active'},
  {id: 6, name: 'Weapon Lock' },
];

export default function SoundControl() {
  const [volume, setVolume] = useState(75);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isVolumeSliderActive, setIsVolumeSliderActive] = useState(false);
  const {
    searchResults,
    currentTrack,
    isPlaying,
    queue,
    searchTracks,
    playTrack,
    togglePlayback,
    addToQueue,
    skipTrack,
  } = useSpotify();

  const {
    isConnected,
    soundEffects,
    playSoundEffect,
    setOutputVolume,
  } = useMQTT();
  const soundPresets = isConnected && soundEffects.length > 0 ? soundEffects : fallbackSoundPresets;
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (volumeTimeoutRef.current) {
      clearTimeout(volumeTimeoutRef.current);
    }
    if (!isVolumeSliderActive && isConnected) {
      volumeTimeoutRef.current = setTimeout(async () => {
        try {
          await setOutputVolume(newVolume);
        } catch (error) {
          console.error('Failed to set volume via MQTT:', error);
        }
      }, 100);
    }
  }, [isConnected, setOutputVolume, isVolumeSliderActive]);

  const handleVolumeSliderStart = useCallback(() => {
    setIsVolumeSliderActive(true);
  }, []);

  const handleVolumeSliderEnd = useCallback(async () => {
    setIsVolumeSliderActive(false);
    if (isConnected) {
      try {
        await setOutputVolume(volume);
      } catch (error) {
        console.error('Failed to set volume via MQTT:', error);
      }
    }
  }, [isConnected, setOutputVolume, volume]);

  const handlePlaySoundEffect = async (effectId: number) => {
    if (isConnected) {
      try {
        await playSoundEffect(effectId);
      } catch (error) {
        console.error('Failed to play sound effect via MQTT:', error);
      }
    } else {
      console.log('Playing sound effect (mock):', effectId);
    }
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      
      {/* MQTT Connection Status */}
      {!isConnected && (
        <Alert className="mb-4">
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            MQTT not connected. Using mock data. Configure MQTT connection in the header to enable real-time control.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Search music..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchTracks(e.target.value);
              setShowSearchResults(true);
            }}
          />
          {showSearchResults && searchResults.length > 0 && (
            <Card className="absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
              <CardContent className="p-2">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    className="flex justify-between items-center p-2 hover:bg-accent cursor-pointer"
                    onClick={() => {
                      addToQueue(track);
                      setShowSearchResults(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {track.album.images[0] && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.album.name}
                          className="w-10 h-10 rounded"
                        />
                      )}
                      <div>
                        <p className="font-medium">{track.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {track.artists.map(a => a.name).join(', ')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        addToQueue(track);
                      }}
                    >
                      <ListMusic className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">
                <DecryptedText 
                  text="Now Playing" 
                  animateOn="view" 
                  speed={50} 
                  maxIterations={7}
                  className="font-medium"
                />
              </h3>
              <p className="text-sm text-muted-foreground">
                {currentTrack ? `${currentTrack.name} - ${currentTrack.artists[0].name}` : 'No track playing'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={togglePlayback}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={skipTrack}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Sheet>
                <SheetTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <ListMusic className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>
                      <DecryptedText 
                        text="Queue" 
                        animateOn="view" 
                        speed={50} 
                        maxIterations={7}
                      />
                    </SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-4">
                    {queue.map((track, index) => (
                      <div key={track.id} className="flex justify-between items-center py-2 border-b">
                        <div className="flex items-center gap-2">
                          {track.album.images[0] && (
                            <img
                              src={track.album.images[0].url}
                              alt={track.album.name}
                              className="w-8 h-8 rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{track.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {track.artists.map(a => a.name).join(', ')}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => playTrack(track.uri, true)}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <div 
                onMouseDown={handleVolumeSliderStart}
                onMouseUp={handleVolumeSliderEnd}
                onTouchStart={handleVolumeSliderStart}
                onTouchEnd={handleVolumeSliderEnd}
                className="flex-1"
              >
                <Slider
                  value={[volume]}
                  onValueChange={(value) => handleVolumeChange(value[0])}
                  max={100}
                  step={1}
                />
              </div>
              <span className="min-w-[3ch] text-sm">{volume}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {soundPresets.map((preset) => (
          <Card key={preset.id} className="cursor-pointer hover:bg-accent">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{preset.name}</h3>
                </div>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={() => handlePlaySoundEffect(preset.id)}
                >
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}