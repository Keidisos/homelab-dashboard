'use client';

import { Calendar, Film, Tv2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useCalendar } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { CalendarItem } from '@/types';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CalendarCard({ item }: { item: CalendarItem }) {
  const isMovie = item.type === 'movie';

  return (
    <div className="flex-shrink-0 w-40 group">
      <div className="relative rounded-xl overflow-hidden bg-slate-800/50 dark:bg-slate-800/50 bg-slate-200/50 border border-slate-700/30 dark:border-slate-700/30 border-slate-300/30 transition-all duration-200 hover:border-slate-500/50 hover:shadow-lg">
        {/* Poster */}
        <div className="relative aspect-[2/3] bg-slate-700/30 dark:bg-slate-700/30 bg-slate-300/30">
          {item.posterUrl ? (
            <img
              src={item.posterUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              {isMovie ? (
                <Film className="h-8 w-8 text-slate-500" />
              ) : (
                <Tv2 className="h-8 w-8 text-slate-500" />
              )}
            </div>
          )}

          {/* Type badge */}
          <Badge
            className={cn(
              'absolute top-2 left-2 text-[10px] px-1.5 py-0.5 border',
              isMovie
                ? 'bg-amber-500/80 text-white border-amber-500/50'
                : 'bg-blue-500/80 text-white border-blue-500/50'
            )}
          >
            {isMovie ? 'Movie' : 'TV'}
          </Badge>

          {/* Date badge */}
          <Badge className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 bg-black/60 text-white border-white/20">
            {formatDate(item.releaseDate)}
          </Badge>
        </div>

        {/* Info */}
        <div className="p-3 space-y-1">
          <p className="text-sm font-medium text-slate-100 dark:text-slate-100 text-slate-800 truncate group-hover:text-white dark:group-hover:text-white group-hover:text-slate-900 transition-colors">
            {item.title}
          </p>
          {item.episodeTitle && (
            <p className="text-xs text-slate-400 dark:text-slate-400 text-slate-500 truncate">
              S{String(item.seasonNumber).padStart(2, '0')}E{String(item.episodeNumber).padStart(2, '0')} - {item.episodeTitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-shrink-0 w-40">
          <div className="rounded-xl overflow-hidden bg-slate-800/30 dark:bg-slate-800/30 bg-slate-200/30 border border-slate-700/30 dark:border-slate-700/30 border-slate-300/30">
            <Skeleton className="aspect-[2/3] bg-slate-700/30 dark:bg-slate-700/30 bg-slate-300/30" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-4 w-28 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-300/30" />
              <Skeleton className="h-3 w-20 bg-slate-700/30 dark:bg-slate-700/30 bg-slate-300/30" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReleaseCalendarSection() {
  const { data, isLoading, error } = useCalendar();

  // Don't render if service isn't configured
  if (error || (data && !data.success)) return null;

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 dark:from-slate-900/80 from-white/80 to-slate-800/40 dark:to-slate-800/40 to-slate-100/40 backdrop-blur-xl border-slate-700/50 dark:border-slate-700/50 border-slate-300/50 overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-slate-100 dark:text-slate-100 text-slate-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-pink-400" />
          Upcoming Releases
          {data?.data?.items && data.data.items.length > 0 && (
            <Badge className="ml-2 bg-pink-500/20 text-pink-300 dark:text-pink-300 text-pink-600 border-pink-500/30 text-xs">
              {data.data.items.length} upcoming
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <LoadingSkeleton />}

        {data?.success && data.data && data.data.items.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
            {data.data.items.map((item: CalendarItem) => (
              <CalendarCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {data?.success && data.data && data.data.items.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No upcoming releases in the next 14 days</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
