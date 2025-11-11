'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { DecryptedText } from '@/components/ui/decrypted-text';
import { useSoundPlayer } from '@/components/SoundPlayer';
import { Volume2, Mic2, Laugh, Lightbulb, Cookie, Settings, History, Instagram, Music2 } from 'lucide-react';

const navigationItems = [
  { id: 'sound', name: 'Sound and Music', path: '/sound' },
  { id: 'voice', name: 'Voice Effects', path: '/voice' },
  { id: 'expression', name: 'Expressions and Eyes', path: '/expression' },
  { id: 'light', name: 'Lights Control', path: '/light' },
  { id: 'ai', name: 'Assistant and TTS', path: '/ai' },
  { id: 'admin', name: 'Administrator Tools', path: '/admin' },
  { id: 'changelog', name: 'Changelog', path: '/changelog' },
];

const socialItems = [
  { id: 'instagram', name: '[TOP SECRET INSTAGRAM]', url: 'https://instagram.com/mekhy_w' },
  { id: 'tiktok', name: '[TOP SECRET TIKTOK]', url: 'https://tiktok.com/@mekhy_w' },
];

export default function Home() {
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
            text="M.E.K.H.Y v1.2" 
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

      {/* Navigation Menu */}
      <div className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 mb-8 pl-14 pr-14">
          {navigationItems.map((item) => (
            <Card 
              key={item.id}
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => handleNavigation(item.path)}
            >
              <CardContent className="p-2">
                <h3 className="font-semibold mb-1 text-justify">
                  {item.id === 'light' && (<Lightbulb className="w-6 h-6 mb-2 inline-block" />)}
                  {item.id === 'ai' && (<Cookie className="w-6 h-6 mb-2 inline-block" />)}
                  {item.id === 'admin' && (<Settings className="w-6 h-6 mb-2 inline-block" />)}
                  {item.id === 'expression' && (<Laugh className="w-6 h-6 mb-2 inline-block" />)}
                  {item.id === 'sound' && (<Volume2 className="w-6 h-6 mb-2 inline-block" />)}
                  {item.id === 'voice' && (<Mic2 className="w-6 h-6 mb-2 inline-block" />)}
                  {item.id === 'changelog' && (<History className="w-6 h-6 mb-2 inline-block" />)}
                  <DecryptedText 
                    text={" " + item.name}
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
                <h3 className="font-semibold mb-1 text-justify">
                  {item.id === 'instagram' && (<Instagram className="w-6 h-6 mb-2 inline-block" />)}
                  {item.id === 'tiktok' && (<Music2 className="w-6 h-6 mb-2 inline-block" />)}
                  <DecryptedText 
                    text={" " + item.name}
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