'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/navigation';
import { TelegramProvider } from '@/contexts/TelegramContext';
import { AppLockGuard } from '@/components/AppLockGuard';
import { useSwipeable } from 'react-swipeable';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Squares from '@/components/ui/squares-bg';
import Aurora from '@/components/ui/aurora-bg';
import LetterGlitch from '@/components/ui/letter-glitch-bg';
import Noise from '@/components/ui/noise';
import { useState, useEffect } from 'react';

const inter = Inter({ subsets: ['latin'] });
const pageOrder = ['/sound', '/voice', '/expression', '/', '/light', '/ai', '/admin'];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [lightPageColor, setLightPageColor] = useState('#ff0000');

  // Listen for color changes from the light page
  useEffect(() => {
    const handleColorChange = (event: CustomEvent) => {
      setLightPageColor(event.detail.color);
    };

    window.addEventListener('lightColorChange', handleColorChange as EventListener);
    return () => {
      window.removeEventListener('lightColorChange', handleColorChange as EventListener);
    };
  }, []);

  const handlers = useSwipeable({
    onSwipedLeft: (eventData) => {
      const target = eventData.event.target as HTMLElement;
      
      if (
        target.closest('input[type="range"]') || 
        target.closest('.slider') ||
        target.closest('[role="slider"]') ||
        target.tagName.toLowerCase() === 'input' ||
        target.getAttribute('type') === 'range' ||
        Math.abs(eventData.deltaY) > Math.abs(eventData.deltaX) || // Ignore diagonal swipes
        Math.abs(eventData.deltaX) < 50 // Minimum swipe distance
      ) {
        return;
      }

      const currentIndex = pageOrder.indexOf(pathname);
      if (currentIndex < pageOrder.length - 1) {
        router.push(pageOrder[currentIndex + 1]);
      }
    },
    onSwipedRight: (eventData) => {
      const target = eventData.event.target as HTMLElement;
      
      // More comprehensive check for interactive elements
      if (
        target.closest('input[type="range"]') || 
        target.closest('.slider') ||
        target.closest('[role="slider"]') ||
        target.tagName.toLowerCase() === 'input' ||
        target.getAttribute('type') === 'range' ||
        Math.abs(eventData.deltaY) > Math.abs(eventData.deltaX) || // Ignore diagonal swipes
        Math.abs(eventData.deltaX) < 50 // Minimum swipe distance
      ) {
        return;
      }

      const currentIndex = pageOrder.indexOf(pathname);
      if (currentIndex > 0) {
        router.push(pageOrder[currentIndex - 1]);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
    swipeDuration: 500, // Increase the duration threshold
    delta: 50, // Minimum distance required
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TelegramProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <AppLockGuard>
              <main className="min-h-screen bg-background relative" {...handlers}>
                {/* Background Layer */}
                <div className="fixed inset-0 z-0">
                  {pathname === '/light' ? (
                    <Aurora 
                      colorStops={[lightPageColor, '#ffffff', lightPageColor]}
                      amplitude={1.2}
                      blend={0.6}
                      speed={0.8}
                    />
                  ) : pathname === '/ai' ? (
                    <LetterGlitch 
                      glitchColors={['#9d844e', '#3a2601', '#0a0a0a']}
                      glitchSpeed={50}
                      centerVignette={true}
                      outerVignette={true}
                      smooth={true}
                    />
                  ) : (
                    <Squares 
                      speed={0.5} 
                      squareSize={40}
                      direction='right'
                      borderColor='#6c039d'
                      hoverFillColor='#222'
                      />
                  )}
                  <Noise
                    patternSize={250}
                    patternScaleX={5}
                    patternScaleY={5}
                    patternRefreshInterval={2}
                    patternAlpha={20}
                  />
                </div>
                {/* Content Layer */}
                <div className="relative z-10">
                  {children}
                </div>
              </main>
              <Navigation />
            </AppLockGuard>
            <Toaster />
          </ThemeProvider>
        </TelegramProvider>
      </body>
    </html>
  );
}