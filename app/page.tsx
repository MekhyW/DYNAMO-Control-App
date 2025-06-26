'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { useSoundPlayer } from '@/components/SoundPlayer';

const presets = [
  { id: 1, name: 'Coming soon...', description: 'Presets feature is still in development' },
];

export default function Home() {
  const [activePreset, setActivePreset] = useState(1);
  const [macroSequence, setMacroSequence] = useState<number[]>([]);
  const { playSound } = useSoundPlayer();

  const handleKeypadPress = (digit: number) => {
    playSound('minor');
    setMacroSequence(prev => [...prev, digit]);
  };

  const clearSequence = () => {
    playSound('minor');
    setMacroSequence([]);
  };

  const processSequence = () => {
    playSound('major');
    setMacroSequence([]);
    console.log('Processing macro sequence:', macroSequence);
    // Add your macro processing logic here
  };

  return (
    <div className="container mx-auto px-4 pb-safe pt-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tighter mb-2">
          <DecryptedText 
            text="M.E.K.H.Y" 
            animateOn="view"
            sequential={true}
            revealDirection="center"
            speed={60}
            maxIterations={15}
            className="text-brand"
            encryptedClassName="text-brand opacity-70"
          />
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          <DecryptedText 
            text="Mechanism Execution Kernel of Heinous Yapper" 
            animateOn="view"
            sequential={true}
            speed={40}
            maxIterations={12}
            className="text-muted-foreground"
            encryptedClassName="text-muted-foreground opacity-50"
          />
        </p>
      </div>

      <div className="relative h-[60vh] min-h-[400px] max-h-[600px] mb-8 flex items-center justify-center">
        <div className="w-full max-w-[320px] h-full bg-muted rounded-lg relative p-6 flex flex-col">
          {/* Macro Input Display */}
          <div className="mb-6 flex-shrink-0">
            <div className="text-center mb-3">
              <span className="text-sm text-muted-foreground">
                <DecryptedText 
                  text="Macro Sequence"
                  animateOn="view"
                  sequential={true}
                  speed={40}
                  maxIterations={8}
                  className="text-muted-foreground"
                  encryptedClassName="text-muted-foreground opacity-40"
                />
              </span>
            </div>
            <div className="bg-background rounded p-3 min-h-[48px] border flex items-center justify-center">
              <span className="text-base font-mono">
                {macroSequence.length > 0 ? macroSequence.join('') : (
                  <DecryptedText 
                    text="Enter sequence..."
                    animateOn="view"
                    sequential={true}
                    speed={40}
                    maxIterations={7}
                    className="text-terminal"
                    encryptedClassName="text-terminal opacity-50"
                  />
                )}
              </span>
            </div>
          </div>

          {/* Numerical Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4 flex-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
              <Button key={digit} variant="outline" className="aspect-square text-lg font-semibold h-full min-h-[60px]" onClick={() => handleKeypadPress(digit)}>
                {digit}
              </Button>
            ))}
          </div>

          {/* Zero and Action Buttons */}
          <div className="grid grid-cols-3 gap-3 flex-shrink-0">
            <Button variant="outline" className="text-sm h-[60px]" onClick={clearSequence}>
              Clear
            </Button>
            <Button variant="outline" className="aspect-square text-lg font-semibold h-[60px]" onClick={() => handleKeypadPress(0)}>
              0
            </Button>
            <Button variant="default" className="text-sm h-[60px]" onClick={processSequence} disabled={macroSequence.length === 0}>
              Run
            </Button>
          </div>
        </div>
      </div>

      <Sheet>
        <SheetTrigger asChild>
          <Button className="w-full mb-4">
            <DecryptedText 
              text="Select Preset Mode"
              animateOn="view"
              sequential={true}
              speed={40}
              maxIterations={10}
              className="text-ui"
              encryptedClassName="text-ui opacity-60"
            />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="bottom" 
          className="h-[50vh] sm:h-[60vh] max-h-[600px] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>
              <DecryptedText 
                text="System Presets"
                animateOn="view"
                sequential={true}
                speed={40}
                maxIterations={10}
                className="text-heading"
                encryptedClassName="text-heading opacity-60"
              />
            </SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pb-8 sm:pb-12">
            {presets.map((preset) => (
              <Card 
                key={preset.id}
                className={`cursor-pointer transition-colors ${
                  activePreset === preset.id ? 'border-primary' : ''
                }`}
                onClick={() => {
                  playSound('major');
                  setActivePreset(preset.id);
                }}
              >
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1">
                    <DecryptedText 
                      text={preset.name}
                      animateOn="view"
                      sequential={true}
                      speed={40}
                      maxIterations={8}
                      className="text-ui"
                      encryptedClassName="text-ui opacity-60"
                    />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    <DecryptedText 
                      text={preset.description}
                      animateOn="view"
                      sequential={true}
                      speed={40}
                      maxIterations={7}
                      className="text-muted-foreground"
                      encryptedClassName="text-muted-foreground opacity-40"
                    />
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}