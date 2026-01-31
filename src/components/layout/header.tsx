'use client';

import { RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: Date;
}

export function Header({ onRefresh, isRefreshing, lastUpdated }: HeaderProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="flex items-center justify-between h-14 px-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Infrastructure Overview
          </h2>
          <p className="text-xs text-slate-500">
            Real-time monitoring of your homelab services
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Last updated indicator */}
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated: {formatTime(lastUpdated)}</span>
            </div>
          )}

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className={cn(
              'bg-slate-800/50 border-slate-700/50',
              'hover:bg-cyan-950/30 hover:border-cyan-700/50',
              'text-slate-400 hover:text-cyan-400',
              'transition-all duration-200'
            )}
          >
            <RefreshCw
              className={cn(
                'h-4 w-4 mr-2',
                isRefreshing && 'animate-spin'
              )}
            />
            Refresh
          </Button>
        </div>
      </div>
    </header>
  );
}
