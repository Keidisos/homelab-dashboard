'use client';

import {
  Tv,
  Play,
  Pause,
  User,
  Monitor,
  Smartphone,
  Laptop,
  Film,
  Tv2,
  Download,
  ArrowDown,
  ArrowUp,
  Clock,
  Search,
  CheckCircle,
  Users,
  Activity,
  Radio,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useJellyfin, useJellyseerr, useQBittorrent } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { JellyfinSession, JellyseerrRequest, QBittorrentTorrent } from '@/types';
import type { LucideIcon } from 'lucide-react';

function getDeviceIcon(client: string): LucideIcon {
  const lowerClient = client.toLowerCase();
  if (lowerClient.includes('android') || lowerClient.includes('ios') || lowerClient.includes('mobile')) {
    return Smartphone;
  }
  if (lowerClient.includes('web') || lowerClient.includes('browser')) {
    return Laptop;
  }
  return Monitor;
}

function formatTicks(ticks: number): string {
  const seconds = Math.floor(ticks / 10000000);
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(2)} GB`;
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1048576) return `${(bytesPerSec / 1048576).toFixed(1)} MB/s`;
  if (bytesPerSec >= 1024) return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
  return `${bytesPerSec} B/s`;
}

function formatEta(seconds: number): string {
  if (seconds < 0 || seconds === 8640000) return '∞';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
}) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden relative group">
      <div className={cn('absolute inset-0 opacity-5 bg-gradient-to-br', color)} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-100 tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            'flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br shadow-lg',
            color
          )}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionRow({ session }: { session: JellyfinSession }) {
  const isPaused = session.playState?.isPaused;
  const item = session.nowPlayingItem;
  const DeviceIcon = getDeviceIcon(session.client);

  if (!item) return null;

  const title = item.seriesName ? `${item.seriesName}` : item.name;
  const subtitle = item.seriesName ? item.name : null;
  const isMovie = item.type?.toLowerCase() === 'movie';

  return (
    <div className={cn(
      'group relative flex items-center gap-4 p-4 transition-all duration-200',
      'bg-gradient-to-r from-slate-900/60 to-slate-800/30 backdrop-blur-sm',
      'border-b border-slate-700/30 last:border-b-0',
      'hover:from-slate-800/80 hover:to-slate-700/40',
      'hover:pl-5'
    )}>
      {/* Left accent bar */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 transition-all duration-200',
        'opacity-60 group-hover:opacity-100',
        isPaused
          ? 'bg-gradient-to-b from-amber-500 to-orange-600'
          : 'bg-gradient-to-b from-emerald-500 to-teal-600'
      )} />

      {/* Play/Pause Icon */}
      <div className={cn(
        'relative flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
        'transition-all duration-200 group-hover:scale-105',
        isPaused
          ? 'bg-gradient-to-br from-amber-500 to-orange-600 shadow-md'
          : 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md'
      )}>
        {isPaused ? (
          <Pause className="h-5 w-5 text-white" />
        ) : (
          <Play className="h-5 w-5 text-white" />
        )}
      </div>

      {/* Title & Subtitle */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100 truncate group-hover:text-white transition-colors">
          {title}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {subtitle || item.type}
        </p>
      </div>

      {/* User */}
      <div className="hidden md:flex items-center gap-2 min-w-0 w-32">
        <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span className="text-xs text-slate-400 truncate">{session.userName}</span>
      </div>

      {/* Device */}
      <div className="hidden lg:flex items-center gap-2 min-w-0 w-36">
        <DeviceIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span className="text-xs text-slate-400 truncate">{session.deviceName}</span>
      </div>

      {/* Progress */}
      <div className="hidden sm:block w-20 text-right">
        {session.playState && (
          <span className="text-xs font-mono text-slate-400">
            {formatTicks(session.playState.positionTicks)}
          </span>
        )}
      </div>

      {/* Type Badge */}
      <Badge
        variant="outline"
        className={cn(
          'shrink-0 font-medium text-xs border w-16 justify-center',
          isMovie
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
        )}
      >
        {isMovie ? 'Film' : 'Série'}
      </Badge>

      {/* Status Badge */}
      <Badge
        variant="outline"
        className={cn(
          'shrink-0 font-medium text-xs border gap-1.5 w-20 justify-center',
          isPaused
            ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
            : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
        )}
      >
        {isPaused ? (
          <>
            <Pause className="h-3 w-3" />
            Paused
          </>
        ) : (
          <>
            <Play className="h-3 w-3" />
            Playing
          </>
        )}
      </Badge>
    </div>
  );
}

function RequestCard({ request, statusLabels }: { request: JellyseerrRequest; statusLabels: Record<number, string> }) {
  const isMovie = request.type === 'movie';
  const statusLabel = statusLabels[request.status] || 'Unknown';
  const posterUrl = request.posterPath
    ? `https://image.tmdb.org/t/p/w92${request.posterPath}`
    : null;

  const statusConfig: Record<string, { className: string; icon?: typeof CheckCircle }> = {
    'Pending': { className: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
    'Approved': { className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    'Declined': { className: 'bg-red-500/20 text-red-400 border-red-500/50' },
    'Available': { className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50', icon: CheckCircle },
    'Partial': { className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' },
  };

  const config = statusConfig[statusLabel] || { className: 'bg-slate-500/20 text-slate-400 border-slate-500/50' };
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/30 transition-colors">
      {/* Poster */}
      <div className="w-10 h-14 shrink-0 bg-slate-800 rounded overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={request.title || 'Media poster'}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            {isMovie ? (
              <Film className="h-4 w-4 text-slate-600" />
            ) : (
              <Tv2 className="h-4 w-4 text-slate-600" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-100 truncate">
          {request.title || 'Unknown Title'}
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={isMovie ? 'text-amber-400' : 'text-cyan-400'}>
            {isMovie ? 'Film' : 'Série'}
          </span>
          <span>•</span>
          <span className="truncate">{request.requestedBy.displayName}</span>
        </div>
      </div>

      {/* Status */}
      <Badge variant="outline" className={cn('text-[10px] border shrink-0 px-1.5 py-0.5', config.className)}>
        {StatusIcon && <StatusIcon className="h-2.5 w-2.5 mr-1" />}
        {statusLabel}
      </Badge>
    </div>
  );
}

function TorrentRow({ torrent }: { torrent: QBittorrentTorrent }) {
  const progress = Math.round(torrent.progress * 100);
  const isDownloading = torrent.dlspeed > 0;
  const isUploading = torrent.upspeed > 0;
  const isComplete = progress === 100;

  const stateConfig: Record<string, { label: string; className: string }> = {
    downloading: { label: 'Downloading', className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    uploading: { label: 'Seeding', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
    stalledDL: { label: 'Stalled', className: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
    stalledUP: { label: 'Seeding', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
    queuedDL: { label: 'Queued', className: 'bg-slate-500/20 text-slate-400 border-slate-500/50' },
    queuedUP: { label: 'Queued', className: 'bg-slate-500/20 text-slate-400 border-slate-500/50' },
    checkingDL: { label: 'Checking', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' },
    checkingUP: { label: 'Checking', className: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50' },
    metaDL: { label: 'Metadata', className: 'bg-purple-500/20 text-purple-400 border-purple-500/50' },
    forcedDL: { label: 'Forced DL', className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    forcedUP: { label: 'Forced UP', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
  };

  const state = stateConfig[torrent.state] || { label: torrent.state, className: 'bg-slate-500/20 text-slate-400 border-slate-500/50' };

  return (
    <div className={cn(
      'group relative flex items-center gap-4 p-4 transition-all duration-200',
      'bg-gradient-to-r from-slate-900/60 to-slate-800/30 backdrop-blur-sm',
      'border-b border-slate-700/30 last:border-b-0',
      'hover:from-slate-800/80 hover:to-slate-700/40',
      'hover:pl-5'
    )}>
      {/* Left accent bar */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 transition-all duration-200',
        'opacity-60 group-hover:opacity-100',
        isComplete
          ? 'bg-gradient-to-b from-emerald-500 to-teal-600'
          : isDownloading
            ? 'bg-gradient-to-b from-blue-500 to-cyan-600'
            : 'bg-gradient-to-b from-slate-500 to-slate-600'
      )} />

      {/* Icon */}
      <div className={cn(
        'relative flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
        'transition-all duration-200 group-hover:scale-105',
        isComplete
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md'
          : isDownloading
            ? 'bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md'
            : 'bg-slate-800/80 border border-slate-700/50'
      )}>
        {isDownloading ? (
          <ArrowDown className="h-5 w-5 text-white" />
        ) : isUploading ? (
          <ArrowUp className="h-5 w-5 text-white" />
        ) : (
          <Download className={cn('h-5 w-5', isComplete ? 'text-white' : 'text-slate-500')} />
        )}
      </div>

      {/* Name & Size */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100 truncate group-hover:text-white transition-colors">
          {torrent.name}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {formatBytes(torrent.size)}
          {torrent.category && ` • ${torrent.category}`}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="hidden md:block w-32">
        <div className="flex items-center gap-2">
          <Progress value={progress} className="h-1.5 flex-1" />
          <span className="text-xs font-mono text-slate-400 w-8 text-right">{progress}%</span>
        </div>
      </div>

      {/* Speeds */}
      <div className="hidden lg:flex items-center gap-3 w-36">
        {isDownloading && (
          <span className="flex items-center gap-1 text-xs text-blue-400">
            <ArrowDown className="h-3 w-3" />
            {formatSpeed(torrent.dlspeed)}
          </span>
        )}
        {isUploading && (
          <span className="flex items-center gap-1 text-xs text-emerald-400">
            <ArrowUp className="h-3 w-3" />
            {formatSpeed(torrent.upspeed)}
          </span>
        )}
      </div>

      {/* ETA */}
      <div className="hidden sm:block w-16 text-right">
        {torrent.eta > 0 && torrent.eta !== 8640000 && (
          <span className="flex items-center gap-1 text-xs text-slate-500 justify-end">
            <Clock className="h-3 w-3" />
            {formatEta(torrent.eta)}
          </span>
        )}
      </div>

      {/* Status Badge */}
      <Badge variant="outline" className={cn('text-xs border shrink-0 w-24 justify-center', state.className)}>
        {state.label}
      </Badge>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden">
      <div className="divide-y divide-slate-700/30">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48 bg-slate-800" />
              <Skeleton className="h-3 w-24 bg-slate-800" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full bg-slate-800" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function JellyfinPage() {
  const { data: jellyfinData, isLoading: jellyfinLoading, error: jellyfinError } = useJellyfin();
  const { data: jellyseerrData, isLoading: jellyseerrLoading, error: jellyseerrError } = useJellyseerr();
  const { data: qbittorrentData, isLoading: qbittorrentLoading, error: qbittorrentError } = useQBittorrent();

  const activeSessions = jellyfinData?.data?.sessions || [];
  const playingCount = activeSessions.filter((s) => !s.playState?.isPaused).length;
  const pausedCount = activeSessions.filter((s) => s.playState?.isPaused).length;
  const totalSessions = activeSessions.length;

  const requests = jellyseerrData?.data?.requests || [];
  const statusLabels = jellyseerrData?.data?.statusLabels || {};

  const torrents = qbittorrentData?.data?.torrents || [];
  const downloadingCount = torrents.filter((t) => t.dlspeed > 0).length;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-indigo-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />

        <div className="relative px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                  <Tv className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">Media Center</h1>
                  <p className="text-sm text-slate-400">Jellyfin • Jellyseerr • qBittorrent</p>
                </div>
              </div>
            </div>
            {jellyfinData?.success && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
                {playingCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-sm font-medium text-slate-300">{playingCount} playing</span>
                  </div>
                )}
                {playingCount > 0 && pausedCount > 0 && <div className="h-4 w-px bg-slate-700" />}
                {pausedCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-sm text-slate-400">{pausedCount} paused</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {jellyfinData?.success && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <StatCard
                title="Active Streams"
                value={totalSessions}
                subtitle="Currently watching"
                icon={Radio}
                color="from-purple-500 to-pink-500"
              />
              <StatCard
                title="Playing"
                value={playingCount}
                subtitle="In progress"
                icon={Play}
                color="from-emerald-500 to-teal-500"
              />
              <StatCard
                title="Requests"
                value={requests.length}
                subtitle="Media requests"
                icon={Search}
                color="from-indigo-500 to-purple-500"
              />
              <StatCard
                title="Downloads"
                value={downloadingCount}
                subtitle="Active torrents"
                icon={Download}
                color="from-blue-500 to-cyan-500"
              />
            </div>
          )}
        </div>
      </header>

      <div className="p-6 space-y-8">
        {/* Active Streams Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Play className="h-4 w-4 text-purple-400" />
            Active Streams
            {totalSessions > 0 && (
              <span className="text-slate-600 font-normal normal-case">({totalSessions})</span>
            )}
          </h2>

          {jellyfinLoading && <LoadingSkeleton />}

          {jellyfinError && (
            <Card className="bg-red-950/20 border-red-900/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-red-400">
                  <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/20">
                    <Tv className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">Connection Failed</p>
                    <p className="text-sm text-red-400/70">
                      Failed to connect to Jellyfin: {jellyfinError.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {jellyfinData?.success && (
            <>
              {activeSessions.length === 0 ? (
                <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-12 text-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800/50 mx-auto mb-4">
                      <Tv className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No Active Streams</h3>
                    <p className="text-sm text-slate-500">
                      Nothing is currently being played on Jellyfin
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden">
                  {/* List Header */}
                  <div className="flex items-center gap-4 px-4 py-3 bg-slate-800/30 border-b border-slate-700/50">
                    <div className="w-10" />
                    <p className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider">Media</p>
                    <p className="hidden md:block w-32 text-xs font-medium text-slate-500 uppercase tracking-wider">User</p>
                    <p className="hidden lg:block w-36 text-xs font-medium text-slate-500 uppercase tracking-wider">Device</p>
                    <p className="hidden sm:block w-20 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">Time</p>
                    <p className="w-16 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Type</p>
                    <p className="w-20 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Status</p>
                  </div>

                  {/* Scrollable List */}
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {activeSessions.map((session) => (
                      <SessionRow key={session.id} session={session} />
                    ))}
                  </div>

                  {/* List Footer */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500">
                      {totalSessions} stream{totalSessions !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-400" />
                        <span className="text-xs text-slate-400">{playingCount} playing</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-amber-400" />
                        <span className="text-xs text-slate-400">{pausedCount} paused</span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </section>

        {/* Jellyseerr Requests Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Search className="h-4 w-4 text-indigo-400" />
            Recent Requests
            {requests.length > 0 && (
              <span className="text-slate-600 font-normal normal-case">({requests.length})</span>
            )}
          </h2>

          {jellyseerrLoading && (
            <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
              <CardContent className="p-4 space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-14 w-10 rounded bg-slate-800" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4 bg-slate-800" />
                      <Skeleton className="h-3 w-1/2 bg-slate-800" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {jellyseerrError && (
            <Card className="bg-amber-950/20 border-amber-900/50">
              <CardContent className="p-4">
                <p className="text-amber-400 text-sm">Jellyseerr not configured or unavailable</p>
              </CardContent>
            </Card>
          )}

          {jellyseerrData?.success && (
            <>
              {requests.length === 0 ? (
                <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-12 text-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800/50 mx-auto mb-4">
                      <Search className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No Recent Requests</h3>
                    <p className="text-sm text-slate-500">
                      No pending media requests in Jellyseerr
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-2 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    <div className="divide-y divide-slate-800/50">
                      {requests.map((request) => (
                        <RequestCard key={request.id} request={request} statusLabels={statusLabels} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </section>

        {/* qBittorrent Downloads Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Download className="h-4 w-4 text-green-400" />
            Active Downloads
            {torrents.length > 0 && (
              <span className="text-slate-600 font-normal normal-case">({torrents.length})</span>
            )}
          </h2>

          {qbittorrentLoading && <LoadingSkeleton />}

          {qbittorrentError && (
            <Card className="bg-amber-950/20 border-amber-900/50">
              <CardContent className="p-4">
                <p className="text-amber-400 text-sm">qBittorrent not configured or unavailable</p>
              </CardContent>
            </Card>
          )}

          {qbittorrentData?.success && (
            <>
              {torrents.length === 0 ? (
                <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-12 text-center">
                    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800/50 mx-auto mb-4">
                      <Download className="h-8 w-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No Active Downloads</h3>
                    <p className="text-sm text-slate-500">
                      No active torrents in qBittorrent
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden">
                  {/* List Header */}
                  <div className="flex items-center gap-4 px-4 py-3 bg-slate-800/30 border-b border-slate-700/50">
                    <div className="w-10" />
                    <p className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider">Torrent</p>
                    <p className="hidden md:block w-32 text-xs font-medium text-slate-500 uppercase tracking-wider">Progress</p>
                    <p className="hidden lg:block w-36 text-xs font-medium text-slate-500 uppercase tracking-wider">Speed</p>
                    <p className="hidden sm:block w-16 text-xs font-medium text-slate-500 uppercase tracking-wider text-right">ETA</p>
                    <p className="w-24 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Status</p>
                  </div>

                  {/* Scrollable List */}
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                    {torrents.map((torrent) => (
                      <TorrentRow key={torrent.hash} torrent={torrent} />
                    ))}
                  </div>

                  {/* List Footer */}
                  <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
                    <p className="text-xs text-slate-500">
                      {torrents.length} torrent{torrents.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                      <span className="text-xs text-slate-400">{downloadingCount} downloading</span>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
