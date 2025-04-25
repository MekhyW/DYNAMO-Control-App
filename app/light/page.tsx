"use client"

import { useState } from 'react';
import { Sun, Moon, Lightbulb } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { HexColorPicker } from 'react-colorful';

const lightEffects = [
  { id: 1, name: 'Solid', description: 'Single color light' },
  { id: 2, name: 'Pulse', description: 'Smooth pulsing effect' },
  { id: 3, name: 'Rainbow', description: 'Color cycling effect' },
  { id: 4, name: 'Strobe', description: 'Quick flashing effect' },
  { id: 5, name: 'Wave', description: 'Flowing wave pattern' },
  { id: 6, name: 'Sparkle', description: 'Random twinkling effect' },
];

export default function LightControl() {
  const [isOn, setIsOn] = useState(true);
  const [color, setColor] = useState("#ff0000");
  const [mainBrightness, setMainBrightness] = useState(75);
  const [accentBrightness, setAccentBrightness] = useState(50);
  const [activeEffect, setActiveEffect] = useState<number | null>(null);

  const handleEffectSelect = (effectId: number) => {
    setActiveEffect(effectId === activeEffect ? null : effectId);
  };

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Light Control</h1>

        {/* Master Control */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {isOn ? (
                  <Lightbulb className="h-5 w-5 text-primary" />
                ) : (
                  <Lightbulb className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">Master Light Control</span>
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={setIsOn}
              />
            </div>

            {/* Brightness Controls */}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Main Brightness</label>
                  <span className="text-sm text-muted-foreground">{mainBrightness}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[mainBrightness]}
                    onValueChange={(value) => setMainBrightness(value[0])}
                    max={100}
                    step={1}
                    disabled={!isOn}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Accent Brightness</label>
                  <span className="text-sm text-muted-foreground">{accentBrightness}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <Moon className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[accentBrightness]}
                    onValueChange={(value) => setAccentBrightness(value[0])}
                    max={100}
                    step={1}
                    disabled={!isOn}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Color Wheel */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="text-lg font-medium mb-4">Color Selection</h2>
            <div className="flex justify-center mb-4">
              <HexColorPicker
                color={color}
                onChange={setColor}
                style={{ width: '100%', maxWidth: '300px' }}
              />
            </div>
            <div className="flex justify-center items-center gap-4">
              <div
                className="w-8 h-8 rounded-full border"
                style={{ backgroundColor: color }}
              />
              <span className="text-sm font-mono uppercase">{color}</span>
            </div>
          </CardContent>
        </Card>

        {/* Light Effects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {lightEffects.map((effect) => (
            <Card 
              key={effect.id}
              className={cn(
                "cursor-pointer transition-all",
                activeEffect === effect.id && "border-primary bg-accent"
              )}
              onClick={() => handleEffectSelect(effect.id)}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-medium">{effect.name}</h3>
                  <p className="text-sm text-muted-foreground">{effect.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}