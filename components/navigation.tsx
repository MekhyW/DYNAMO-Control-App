"use client"

import { Home, Volume2, Mic, Smile, Lightbulb, Bot, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Sound', href: '/sound', icon: Volume2 },
  { name: 'Voice', href: '/voice', icon: Mic },
  { name: 'Expression', href: '/expression', icon: Smile },
  { name: 'Light', href: '/light', icon: Lightbulb },
  { name: 'AI', href: '/ai', icon: Bot },
  { name: 'Admin', href: '/admin', icon: Settings },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-around">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center py-2 px-3 text-sm font-medium transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <Icon className="h-6 w-6" />
                <span className="mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}