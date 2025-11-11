"use client"

import { PawPrint, Volume2, Mic2, Laugh, Lightbulb, Cookie, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useSoundPlayer } from './SoundPlayer';

const navigation = [
  { name: 'Sound', href: '/sound', icon: Volume2 },
  { name: 'Voice', href: '/voice', icon: Mic2 },
  { name: 'Mood', href: '/expression', icon: Laugh },
  { name: 'Main', href: '/', icon: PawPrint },
  { name: 'Light', href: '/light', icon: Lightbulb },
  { name: 'Assist', href: '/ai', icon: Cookie },
  { name: 'Admin', href: '/admin', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();
  const { playSound } = useSoundPlayer();
  if (pathname === '/') {
    return null;
  }
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg">
      <div className="max-w-screen-xl mx-auto px-2">
        <div className="flex justify-around">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => playSound('minor')}
                className={cn(
                  "flex flex-col items-center py-2 px-1 text-sm font-rajdhani font-medium transition-all duration-200",
                  isActive 
                    ? "text-primary -translate-y-1" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className={cn(
                  "mt-1 transition-opacity duration-200",
                  isActive ? "opacity-100" : "opacity-0"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}