'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import Navigation from '@/components/navigation';
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
    onSwipedLeft: () => {
      const currentIndex = pageOrder.indexOf(pathname);
      if (currentIndex < pageOrder.length - 1) {
        router.push(pageOrder[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      const currentIndex = pageOrder.indexOf(pathname);
      if (currentIndex > 0) {
        router.push(pageOrder[currentIndex - 1]);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: false
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <main className="min-h-screen bg-background" {...handlers}>
            {children}
          </main>
          <Navigation />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}