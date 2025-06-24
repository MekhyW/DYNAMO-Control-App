'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';

const presets = [
  { id: 1, name: 'Combat Mode', description: 'Enhanced mobility and defense systems' },
  { id: 2, name: 'Stealth Mode', description: 'Minimal emissions and sound signature' },
  { id: 3, name: 'Power Save', description: 'Optimized for extended operation' },
  { id: 4, name: 'Custom Mode', description: 'User-defined parameters' },
];

export default function Home() {
  const [activePreset, setActivePreset] = useState(1);
  const [macroSequence, setMacroSequence] = useState<number[]>([]);

  const handleKeypadPress = (digit: number) => {
    setMacroSequence(prev => [...prev, digit]);
  };

  const clearSequence = () => {
    setMacroSequence([]);
  };

  const processSequence = () => {
    setMacroSequence([]);
    console.log('Processing macro sequence:', macroSequence);
    // Add your macro processing logic here
  };

  return (
    <div className="container mx-auto px-4 pb-safe pt-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-2">M.E.K.H.Y</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Mechanism Execution Kernel of Heinous Yapper</p>
      </div>

      <div className="relative h-[60vh] min-h-[300px] max-h-[500px] mb-8 flex items-center justify-center">
        <div className="w-[100vw] max-w-[240px] min-w-[180px] h-full bg-muted rounded-lg relative p-4">
          {/* Macro Input Display */}
          <div className="mb-4">
            <div className="text-center mb-2">
              <span className="text-xs text-muted-foreground">Macro Sequence</span>
            </div>
            <div className="bg-background rounded p-2 min-h-[40px] border">
              <span className="text-sm font-mono">
                {macroSequence.length > 0 ? macroSequence.join('') : 'Enter sequence...'}
              </span>
            </div>
          </div>

          {/* Numerical Keypad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Button key={digit} variant="outline" size="sm" className="aspect-square text-sm" onClick={() => handleKeypadPress(digit)}>
                {digit}
              </Button>
            ))}
          </div>

          {/* Zero and Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={clearSequence}>
              Clear
            </Button>
            <Button variant="outline" size="sm" className="aspect-square text-sm" onClick={() => handleKeypadPress(0)}>
              0
            </Button>
            <Button variant="default" size="sm" className="text-xs" onClick={processSequence} disabled={macroSequence.length === 0}>
              Run
            </Button>
          </div>
        </div>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button className="w-full mb-4">Select Preset Mode</Button>
        </SheetTrigger>
        <SheetContent 
          side="bottom" 
          className="h-[50vh] sm:h-[60vh] max-h-[600px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>System Presets</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pb-8 sm:pb-12">
            {presets.map((preset) => (
              <Card 
                key={preset.id}
                className={`cursor-pointer transition-colors ${
                  activePreset === preset.id ? 'border-primary' : ''
                }`}
                onClick={() => setActivePreset(preset.id)}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">{preset.name}</h3>
                  <p className="text-sm text-muted-foreground">{preset.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}