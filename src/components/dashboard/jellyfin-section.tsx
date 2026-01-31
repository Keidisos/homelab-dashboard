'use client';

import { Tv, Play, Pause, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useJellyfin } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { JellyfinSession } from '@/types';

function SessionCard({ session }: { session: JellyfinSession }) {
  const isPaused = session.playState?.isPaused;
  const item = session.nowPlayingItem;

  if (!item) return null;

  const title = item.seriesName
    ? `${item.seriesName} - ${item.name}`
    : item.name;

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Play/Pause indicator */}
          <div
            className={cn(
              'flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
              isPaused
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-emerald-500/20 text-emerald-400'
            )}
          >
            {isPaused ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <p className="text-sm font-medium text-slate-100 truncate">
              {title}
            </p>

            {/* Type badge */}
            <Badge
              variant="outline"
              className="mt-1 text-xs bg-purple-500/10 text-purple-400 border-purple-500/30"
            >
              {item.type}
            </Badge>

            {/* User info */}
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500">
              <User className="h-3 w-3" />
              <span>{session.userName}</span>
              <span className="text-slate-700">•</span>
              <span>{session.deviceName}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionSkeleton() {
  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 bg-slate-800" />
            <Skeleton className="h-5 w-16 bg-slate-800" />
            <Skeleton className="h-3 w-1/2 bg-slate-800" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function JellyfinSection() {
  const { data, isLoading, error } = useJellyfin();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Tv className="h-4 w-4 text-purple-400" />
          Jellyfin - Now Playing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(2)].map((_, i) => (
            <SessionSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data?.success || !data.data) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Tv className="h-4 w-4 text-purple-400" />
          Jellyfin - Now Playing
        </h3>
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
          Failed to connect to Jellyfin: {error?.message || data?.error || 'Unknown error'}
        </div>
      </section>
    );
  }

  const { activeSessions, sessions } = data.data;

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Tv className="h-4 w-4 text-purple-400" />
        Jellyfin - Now Playing
        <Badge
          variant="outline"
          className={cn(
            'ml-2 text-xs',
            activeSessions > 0
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
          )}
        >
          {activeSessions} active
        </Badge>
      </h3>

      {sessions.length === 0 ? (
        <div className="bg-slate-900/20 border border-slate-800/30 rounded-lg p-6 text-center">
          <Tv className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No active streams</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </section>
  );
}
