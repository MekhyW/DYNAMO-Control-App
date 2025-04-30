"use client"

import { useState } from 'react';
import { Search, Play, Pause, SkipForward, Volume2, ListMusic } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Search music..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium">Now Playing</h3>
              <p className="text-sm text-muted-foreground">Never Be Alone</p>
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
                    {['Devil Swing', 'T.N.T', 'Illusion'].map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 border-b">
                        <span>{item}</span>
                        <Button size="sm" variant="ghost">
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
                onValueChange={(value) => setVolume(value[0])}
                max={100}
                step={1}
              />
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
                <Button size="icon" variant="ghost">
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