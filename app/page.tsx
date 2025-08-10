'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { useSoundPlayer } from '@/components/SoundPlayer';

const presets = [
  { id: 1, name: 'Coming soon...', description: 'Presets feature is still in development' },
];

const navigationItems = [
  { id: 'sound', name: 'Sound and Music', path: '/sound' },
  { id: 'voice', name: 'Voice Effects', path: '/voice' },
  { id: 'expression', name: 'Expressions', path: '/expression' },
  { id: 'light', name: 'Lights Control', path: '/light' },
  { id: 'ai', name: 'Assistant and TTS', path: '/ai' },
];

const socialItems = [
  { id: 'instagram', name: '[TOP SECRET PHOTOS]', url: 'https://instagram.com/mekhy_w' },
  { id: 'tiktok', name: '[TOP SECRET VIDEOS]', url: 'https://tiktok.com/@mekhy_w' },
];

export default function Home() {
  const [activePreset, setActivePreset] = useState(1);
  const router = useRouter();
  const { playSound } = useSoundPlayer();

  const handleNavigation = (path: string) => {
    playSound('major');
    router.push(path);
  };

  const handleSocialLink = (url: string) => {
    playSound('major');
    window.open(url, '_blank');
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

      {/* Navigation Menu */}
      <div className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 mb-8">
          {navigationItems.map((item) => (
            <Card 
              key={item.id}
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => handleNavigation(item.path)}
            >
              <CardContent className="p-2">
                <h3 className="font-semibold mb-1 text-center">
                  <DecryptedText 
                    text={item.name}
                    animateOn="view"
                    sequential={true}
                    speed={40}
                    maxIterations={8}
                    className="text-ui"
                    encryptedClassName="text-ui opacity-60"
                  />
                </h3>
              </CardContent>
            </Card>
          ))}
          {socialItems.map((item) => (
            <Card 
              key={item.id}
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => handleSocialLink(item.url)}
            >
              <CardContent className="p-2">
                <h3 className="font-semibold mb-1 text-center">
                  <DecryptedText 
                    text={item.name}
                    animateOn="view"
                    sequential={true}
                    speed={40}
                    maxIterations={8}
                    className="text-ui"
                    encryptedClassName="text-ui opacity-60"
                  />
                </h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}