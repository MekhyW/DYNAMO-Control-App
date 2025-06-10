"use client"

import { useState } from 'react';
import { Search, Play, Pause, SkipForward, Volume2, ListMusic, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSpotify } from '@/hooks/useSpotify';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useTelegramBot } from '@/hooks/useTelegramBot';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const soundPresets = [
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
  
  const {
    requestSoundEffectsList,
    playSoundEffect,
    setOutputVolume,
  } = useTelegramBot();
  
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
  
  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0];
    setVolume(volumeValue);
    setOutputVolume(volumeValue);
  };
  
  const handlePlaySoundEffect = (effectId: number) => {
    playSoundEffect(effectId);
  };
  
  const handleRequestSoundEffects = () => {
    requestSoundEffectsList();
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      
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
              <h3 className="font-medium">Now Playing</h3>
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
                    <SheetTitle>Queue</SheetTitle>
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
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
              />
              <span className="min-w-[3ch] text-sm">{volume}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Sound Effects</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestSoundEffects}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Effects
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {soundPresets.map((preset) => (
              <Card key={preset.id} className="cursor-pointer hover:bg-accent" onClick={() => handlePlaySoundEffect(preset.id)}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{preset.name}</h3>
                    </div>
                    <Button size="icon" variant="ghost" onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySoundEffect(preset.id);
                    }}>
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}