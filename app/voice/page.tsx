"use client"

import { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

const voiceEffects = [
  { id: 1, name: 'Robot Voice', description: 'Mechanical voice effect' },
  { id: 2, name: 'Echo', description: 'Echo and reverb effect' },
  { id: 3, name: 'Pitch Shift', description: 'Adjust voice pitch' },
  { id: 4, name: 'Distortion', description: 'Voice distortion effect' },
  { id: 5, name: 'Harmonizer', description: 'Add harmonics to voice' },
  { id: 6, name: 'Modulator', description: 'Frequency modulation' },
];

export default function VoiceControl() {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(75);
  const [activeEffects, setActiveEffects] = useState<number[]>([]);

  const toggleEffect = (effectId: number) => {
    setActiveEffects(prev =>
      prev.includes(effectId)
        ? prev.filter(id => id !== effectId)
        : [...prev, effectId]
    );
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Voice Modification</h1>
        
        {/* Main Controls */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Switch
                  checked={!isMuted}
                  onCheckedChange={(checked) => setIsMuted(!checked)}
                />
                {isMuted ? (
                  <MicOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Mic className="h-5 w-5 text-primary" />
                )}
                <span className="font-medium">Voice Changer</span>
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
                  disabled={isMuted}
                />
                <span className="min-w-[3ch] text-sm">{volume}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Voice Effects Grid */}
        <div className="grid grid-cols-2 gap-4">
          {voiceEffects.map((effect) => (
            <Card 
              key={effect.id} 
              className={cn(
                "cursor-pointer transition-all",
                activeEffects.includes(effect.id) && "border-primary bg-accent"
              )}
              onClick={() => toggleEffect(effect.id)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{effect.name}</h3>
                    <p className="text-sm text-muted-foreground">{effect.description}</p>
                  </div>
                  <Switch
                    checked={activeEffects.includes(effect.id)}
                    onCheckedChange={() => toggleEffect(effect.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}