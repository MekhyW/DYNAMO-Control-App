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

const inter = Inter({ subsets: ['latin'] });
const pageOrder = ['/sound', '/voice', '/expression', '/', '/light', '/ai', '/admin'];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

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
              <main className="min-h-screen bg-background" {...handlers}>
                {children}
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