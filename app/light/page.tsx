"use client"

import { useState } from 'react';
import { Sun, Monitor, Lightbulb, LightbulbOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { HexColorPicker } from 'react-colorful';
import { useMQTT } from '@/hooks/useMQTT';

const lightEffects = [
  { id: 1, name: 'Solid Color', description: '' },
  { id: 2, name: 'Fade', description: '' },
  { id: 3, name: 'Wipe', description: '' },
  { id: 4, name: 'Theater Chase', description: '' },
  { id: 5, name: 'Rainbow', description: '' },
  { id: 6, name: 'Strobe', description: '' },
];

export default function LightControl() {
  const mqtt = useMQTT();
  const [isOn, setIsOn] = useState(true);
  const [color, setColor] = useState("#ff0000");
  const [mainBrightness, setMainBrightness] = useState(75);
  const [eyesBrightness, setEyesBrightness] = useState(100);
  const [activeEffect, setActiveEffect] = useState<number | null>(null);

  const handleToggleLeds = async (enabled: boolean) => {
    setIsOn(enabled);
    try {
      await mqtt.toggleLeds(enabled);
    } catch (error) {
      console.error('Failed to toggle LEDs:', error);
    }
  };

  const handleColorChange = async (newColor: string) => {
    setColor(newColor);
    if (isOn) {
      try {
        await mqtt.setLedsColor(newColor);
      } catch (error) {
        console.error('Failed to set LED color:', error);
      }
    }
  };

  const handleEffectSelect = async (effectId: number) => {
    if (!isOn) return;
    const newActiveEffect = effectId === activeEffect ? null : effectId;
    setActiveEffect(newActiveEffect);
    if (newActiveEffect !== null) {
      const effectName = lightEffects.find(e => e.id === effectId)?.name || 'unknown';
      try {
        await mqtt.setLedsEffect(effectName.toLowerCase().replace(' ', '_'));
      } catch (error) {
        console.error('Failed to set LED effect:', error);
      }
    }
  };

  const handleLEDsBrightnessChange = async (newBrightness: number) => {
    setMainBrightness(newBrightness);
    try {
      await mqtt.setLedsBrightness(newBrightness);
    } catch (error) {
      console.error('Failed to set LED brightness:', error);
    }
  }

  const handleEyesBrightnessChange = async (newBrightness: number) => {
    setEyesBrightness(newBrightness);
    try {
      await mqtt.setEyesBrightness(newBrightness);
    } catch (error) {
      console.error('Failed to set eyes brightness:', error);
    }
  }

  return (
    <div className="container mx-auto px-4 pb-20 pt-6">
      <div className="mb-6">

        {/* Master Control */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {isOn ? (
                  <Lightbulb className="h-5 w-5 text-primary" />
                ) : (
                  <LightbulbOff className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="font-medium">Master Light Control</span>
              </div>
              <Switch
                checked={isOn}
                onCheckedChange={handleToggleLeds}
              />
            </div>

            {/* Brightness Controls */}
            <div className={cn("space-y-6", !isOn && "opacity-50")}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">LEDs Brightness</label>
                  <span className="text-sm text-muted-foreground">{mainBrightness}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <Sun className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[mainBrightness]}
                    onValueChange={(value) => handleLEDsBrightnessChange(value[0])}
                    max={100}
                    step={1}
                    disabled={!isOn}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Eyes Brightness</label>
                  <span className="text-sm text-muted-foreground">{eyesBrightness}%</span>
                </div>
                <div className="flex items-center gap-4">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[eyesBrightness]}
                    onValueChange={(value) => handleEyesBrightnessChange(value[0])}
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
        <Card className={cn("mb-6", !isOn && "opacity-50 pointer-events-none")}>
          <CardContent className="p-4">
            <h2 className="text-lg font-medium mb-4">Color Selection</h2>
            <div className="flex justify-center mb-4">
              <HexColorPicker
                color={color}
                onChange={handleColorChange}
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
        <div className={cn(
          "grid grid-cols-2 md:grid-cols-3 gap-4",
          !isOn && "opacity-50 pointer-events-none"
        )}>
          {lightEffects.map((effect) => (
            <Card 
              key={effect.id}
              className={cn(
                "cursor-pointer transition-all",
                activeEffect === effect.id && "border-primary bg-accent",
                !isOn && "cursor-not-allowed"
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