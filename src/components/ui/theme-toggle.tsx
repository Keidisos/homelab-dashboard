'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- Required to prevent hydration mismatch with next-themes
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'w-full',
          'text-slate-500',
          collapsed && 'justify-center'
        )}
        disabled
      >
        <Moon className="h-4 w-4" />
        {!collapsed && <span className="text-xs ml-2">Theme</span>}
      </Button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        'w-full',
        'text-slate-500 hover:text-slate-300 dark:text-slate-500 dark:hover:text-slate-300',
        'hover:bg-slate-200 dark:hover:bg-slate-800/50',
        collapsed && 'justify-center'
      )}
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4" />
          {!collapsed && <span className="text-xs ml-2">Light Mode</span>}
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          {!collapsed && <span className="text-xs ml-2">Dark Mode</span>}
        </>
      )}
    </Button>
  );
}
