"use client"

import { useState } from 'react';
import { Search, Play, Pause, SkipForward, Volume2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

const soundPresets = [
  { id: 1, name: 'Startup Sequence', duration: '0:15' },
  { id: 2, name: 'System Ready', duration: '0:05' },
  { id: 3, name: 'Warning Alert', duration: '0:10' },
  { id: 4, name: 'Power Down', duration: '0:08' },
  { id: 5, name: 'Shield Active', duration: '0:03' },
  { id: 6, name: 'Weapon Lock', duration: '0:02' },
];

export default function SoundControl() {
  const [volume, setVolume] = useState(75);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Sound Control</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Search sounds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {soundPresets.map((preset) => (
          <Card key={preset.id} className="cursor-pointer hover:bg-accent">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{preset.name}</h3>
                  <p className="text-sm text-muted-foreground">{preset.duration}</p>
                </div>
                <Button size="icon" variant="ghost">
                  <Play className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Now Playing</h3>
              <p className="text-sm text-muted-foreground">System Ready</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button size="icon" variant="ghost">
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[volume]}
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
              />
              <span className="min-w-[3ch] text-sm">{volume}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">Queue</h3>
          <div className="space-y-2">
            {['Warning Alert', 'Shield Active', 'Power Down'].map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm">{item}</span>
                <Button size="sm" variant="ghost">
                  <Play className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}