'use client';

import { Tv, Play, Pause, User, Monitor, Smartphone, Laptop, Film, Tv2, Download, ArrowDown, ArrowUp, Clock, Search, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useJellyfin, useJellyseerr, useQBittorrent } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { JellyfinSession, JellyseerrRequest, QBittorrentTorrent } from '@/types';

function getDeviceIcon(client: string) {
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

function SessionCard({ session }: { session: JellyfinSession }) {
  const isPaused = session.playState?.isPaused;
  const item = session.nowPlayingItem;
  const DeviceIcon = getDeviceIcon(session.client);

  if (!item) return null;

  const title = item.seriesName ? `${item.seriesName}` : item.name;
  const subtitle = item.seriesName ? item.name : null;

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center h-12 w-12 rounded-lg border',
                isPaused
                  ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/10 border-amber-500/30'
                  : 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30'
              )}
            >
              {isPaused ? (
                <Pause className="h-6 w-6 text-amber-400" />
              ) : (
                <Play className="h-6 w-6 text-emerald-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base font-semibold text-slate-100 truncate">
                {title}
              </CardTitle>
              {subtitle && (
                <p className="text-sm text-slate-400 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <Badge
            variant="outline"
            className="bg-purple-500/10 text-purple-400 border-purple-500/30 text-xs shrink-0"
          >
            {item.type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {session.playState && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Progress</span>
              <span className="font-mono text-slate-400">
                {formatTicks(session.playState.positionTicks)}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-400 pt-2 border-t border-slate-800">
          <User className="h-4 w-4 text-slate-500" />
          <span>{session.userName}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <DeviceIcon className="h-4 w-4 text-slate-500" />
          <span className="truncate">{session.deviceName}</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-500 text-xs">{session.client}</span>
        </div>
      </CardContent>
    </Card>
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

function TorrentCard({ torrent }: { torrent: QBittorrentTorrent }) {
  const progress = Math.round(torrent.progress * 100);
  const isDownloading = torrent.dlspeed > 0;
  const isUploading = torrent.upspeed > 0;

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
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-100 truncate">
              {torrent.name}
            </p>
            <p className="text-xs text-slate-500">
              {formatBytes(torrent.size)}
              {torrent.category && ` • ${torrent.category}`}
            </p>
          </div>
          <Badge variant="outline" className={cn('text-xs border shrink-0', state.className)}>
            {state.label}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Progress</span>
            <span className="font-mono text-slate-400">{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {isDownloading && (
              <span className="flex items-center gap-1 text-blue-400">
                <ArrowDown className="h-3 w-3" />
                {formatSpeed(torrent.dlspeed)}
              </span>
            )}
            {isUploading && (
              <span className="flex items-center gap-1 text-emerald-400">
                <ArrowUp className="h-3 w-3" />
                {formatSpeed(torrent.upspeed)}
              </span>
            )}
          </div>
          {torrent.eta > 0 && torrent.eta !== 8640000 && (
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="h-3 w-3" />
              {formatEta(torrent.eta)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg bg-slate-800" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4 bg-slate-800" />
                <Skeleton className="h-3 w-1/2 bg-slate-800" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full bg-slate-800" />
            <Skeleton className="h-3 w-2/3 bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function JellyfinPage() {
  const { data: jellyfinData, isLoading: jellyfinLoading, error: jellyfinError } = useJellyfin();
  const { data: jellyseerrData, isLoading: jellyseerrLoading, error: jellyseerrError } = useJellyseerr();
  const { data: qbittorrentData, isLoading: qbittorrentLoading, error: qbittorrentError } = useQBittorrent();

  const activeSessions = jellyfinData?.data?.sessions || [];
  const playingCount = activeSessions.filter((s) => !s.playState?.isPaused).length;
  const pausedCount = activeSessions.filter((s) => s.playState?.isPaused).length;

  const requests = jellyseerrData?.data?.requests || [];
  const statusLabels = jellyseerrData?.data?.statusLabels || {};

  const torrents = qbittorrentData?.data?.torrents || [];
  const downloadingCount = torrents.filter((t) => t.dlspeed > 0).length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center gap-4 h-14 px-6">
          <Tv className="h-6 w-6 text-purple-400" />
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Media Center</h1>
            <p className="text-xs text-slate-500">Jellyfin • Jellyseerr • qBittorrent</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {playingCount > 0 && (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                <Play className="h-3 w-3 mr-1" />
                {playingCount} playing
              </Badge>
            )}
            {pausedCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                <Pause className="h-3 w-3 mr-1" />
                {pausedCount} paused
              </Badge>
            )}
            {downloadingCount > 0 && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                <Download className="h-3 w-3 mr-1" />
                {downloadingCount} downloading
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {/* Active Streams Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Play className="h-4 w-4 text-purple-400" />
            Active Streams
          </h2>

          {jellyfinLoading && <LoadingSkeleton />}

          {jellyfinError && (
            <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
              Failed to connect to Jellyfin: {jellyfinError.message}
            </div>
          )}

          {jellyfinData?.success && (
            <>
              {activeSessions.length === 0 ? (
                <div className="bg-slate-900/20 border border-slate-800/30 rounded-lg p-8 text-center">
                  <Tv className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-medium text-slate-400 mb-1">No Active Streams</h3>
                  <p className="text-slate-500 text-sm">
                    Nothing is currently being played on Jellyfin
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
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
            <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 text-amber-400 text-sm">
              Jellyseerr not configured or unavailable
            </div>
          )}

          {jellyseerrData?.success && (
            <>
              {requests.length === 0 ? (
                <div className="bg-slate-900/20 border border-slate-800/30 rounded-lg p-8 text-center">
                  <Search className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-medium text-slate-400 mb-1">No Recent Requests</h3>
                  <p className="text-slate-500 text-sm">
                    No pending media requests in Jellyseerr
                  </p>
                </div>
              ) : (
                <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-2 max-h-80 overflow-y-auto">
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
          </h2>

          {qbittorrentLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4 bg-slate-800" />
                        <Skeleton className="h-3 w-1/2 bg-slate-800" />
                      </div>
                    </div>
                    <Skeleton className="h-2 w-full bg-slate-800" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {qbittorrentError && (
            <div className="bg-amber-950/20 border border-amber-900/50 rounded-lg p-4 text-amber-400 text-sm">
              qBittorrent not configured or unavailable
            </div>
          )}

          {qbittorrentData?.success && (
            <>
              {torrents.length === 0 ? (
                <div className="bg-slate-900/20 border border-slate-800/30 rounded-lg p-8 text-center">
                  <Download className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                  <h3 className="text-base font-medium text-slate-400 mb-1">No Active Downloads</h3>
                  <p className="text-slate-500 text-sm">
                    No active torrents in qBittorrent
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {torrents.map((torrent) => (
                    <TorrentCard key={torrent.hash} torrent={torrent} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
