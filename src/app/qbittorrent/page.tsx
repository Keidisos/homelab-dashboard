'use client';

import { useState } from 'react';
import {
  Download,
  Upload,
  Play,
  Pause,
  Trash2,
  Plus,
  ArrowDown,
  ArrowUp,
  Loader2,
  Clock,
  HardDrive,
  Activity,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQBittorrentAll, useQBittorrentTransfer, useQBittorrentAction } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { QBittorrentTorrent } from '@/types';
import type { LucideIcon } from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatSpeed(bytes: number): string {
  return `${formatBytes(bytes)}/s`;
}

function formatEta(seconds: number): string {
  if (seconds <= 0 || seconds === 8640000) return '--';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d`;
}

function getTorrentStatus(state: string): { label: string; color: string; isActive: boolean } {
  switch (state) {
    case 'downloading':
    case 'forcedDL':
      return { label: 'Downloading', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', isActive: true };
    case 'uploading':
    case 'forcedUP':
      return { label: 'Seeding', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', isActive: true };
    case 'stalledDL':
      return { label: 'Stalled', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', isActive: true };
    case 'stalledUP':
      return { label: 'Seeding', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', isActive: false };
    case 'pausedDL':
      return { label: 'Paused', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', isActive: false };
    case 'pausedUP':
      return { label: 'Completed', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30', isActive: false };
    case 'queuedDL':
    case 'queuedUP':
      return { label: 'Queued', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', isActive: false };
    case 'checkingDL':
    case 'checkingUP':
      return { label: 'Checking', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', isActive: true };
    case 'metaDL':
      return { label: 'Metadata', color: 'bg-pink-500/20 text-pink-400 border-pink-500/30', isActive: true };
    case 'error':
    case 'missingFiles':
      return { label: 'Error', color: 'bg-red-500/20 text-red-400 border-red-500/30', isActive: false };
    default:
      return { label: state, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', isActive: false };
  }
}

function isPaused(state: string): boolean {
  return state === 'pausedDL' || state === 'pausedUP';
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
    <Card className="bg-gradient-to-br from-slate-900/80 dark:from-slate-900/80 from-white/80 to-slate-800/40 dark:to-slate-800/40 to-slate-100/40 backdrop-blur-xl border-slate-700/50 dark:border-slate-700/50 border-slate-300/50 overflow-hidden relative group">
      <div className={cn('absolute inset-0 opacity-5 bg-gradient-to-br', color)} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-400 dark:text-slate-400 text-slate-500 font-medium">{title}</p>
            <p className="text-3xl font-bold text-slate-100 dark:text-slate-100 text-slate-800 tracking-tight">{value}</p>
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

function TorrentRow({
  torrent,
  onAction,
  isPending,
}: {
  torrent: QBittorrentTorrent;
  onAction: (action: 'pause' | 'resume' | 'delete', hash: string) => void;
  isPending: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const status = getTorrentStatus(torrent.state);
  const paused = isPaused(torrent.state);
  const progressPercent = Math.round(torrent.progress * 100);

  return (
    <div className="group relative flex items-center gap-4 p-4 transition-all duration-200 bg-gradient-to-r from-slate-900/60 dark:from-slate-900/60 from-white/60 to-slate-800/30 dark:to-slate-800/30 to-slate-100/30 backdrop-blur-sm border-b border-slate-700/30 dark:border-slate-700/30 border-slate-300/30 last:border-b-0 hover:from-slate-800/80 dark:hover:from-slate-800/80 hover:from-slate-200/80 hover:to-slate-700/40 dark:hover:to-slate-700/40 hover:to-slate-100/40">
      {/* Left accent */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 opacity-60 group-hover:opacity-100 transition-all',
        status.isActive ? 'bg-gradient-to-b from-blue-500 to-cyan-500' : 'bg-slate-600'
      )} />

      {/* Name & Progress */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100 dark:text-slate-100 text-slate-800 truncate">{torrent.name}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-xs font-mono text-slate-400 dark:text-slate-400 text-slate-500 w-12 text-right">{progressPercent}%</span>
        </div>
        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
          <span>{formatBytes(torrent.size)}</span>
          {torrent.dlspeed > 0 && (
            <span className="flex items-center gap-1 text-blue-400">
              <ArrowDown className="h-3 w-3" />
              {formatSpeed(torrent.dlspeed)}
            </span>
          )}
          {torrent.upspeed > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <ArrowUp className="h-3 w-3" />
              {formatSpeed(torrent.upspeed)}
            </span>
          )}
          {torrent.eta > 0 && torrent.eta !== 8640000 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatEta(torrent.eta)}
            </span>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <Badge variant="outline" className={cn('shrink-0 text-xs border w-24 justify-center', status.color)}>
        {status.label}
      </Badge>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isPending ? (
          <div className="w-16 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : showDeleteConfirm ? (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/20"
              onClick={() => {
                onAction('delete', torrent.hash);
                setShowDeleteConfirm(false);
              }}
            >
              Confirm
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-slate-400 hover:text-slate-300 hover:bg-slate-500/20"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'h-7 w-7 p-0',
                paused
                  ? 'hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400'
                  : 'hover:bg-amber-500/20 text-slate-400 hover:text-amber-400'
              )}
              onClick={() => onAction(paused ? 'resume' : 'pause', torrent.hash)}
              title={paused ? 'Resume' : 'Pause'}
            >
              {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
              onClick={() => setShowDeleteConfirm(true)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-900/40 dark:bg-slate-900/40 bg-white/40 backdrop-blur-xl border-slate-700/50 dark:border-slate-700/50 border-slate-300/50">
            <CardContent className="p-5">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-slate-800 dark:bg-slate-800 bg-slate-300" />
                  <Skeleton className="h-8 w-16 bg-slate-800 dark:bg-slate-800 bg-slate-300" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl bg-slate-800 dark:bg-slate-800 bg-slate-300" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="bg-gradient-to-br from-slate-900/80 dark:from-slate-900/80 from-white/80 to-slate-800/40 dark:to-slate-800/40 to-slate-100/40 backdrop-blur-xl border-slate-700/50 dark:border-slate-700/50 border-slate-300/50 overflow-hidden">
        <div className="divide-y divide-slate-700/30 dark:divide-slate-700/30 divide-slate-300/30">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-64 bg-slate-800 dark:bg-slate-800 bg-slate-300" />
                <Skeleton className="h-1.5 w-full bg-slate-800 dark:bg-slate-800 bg-slate-300" />
                <Skeleton className="h-3 w-40 bg-slate-800 dark:bg-slate-800 bg-slate-300" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-slate-800 dark:bg-slate-800 bg-slate-300" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export default function QBittorrentPage() {
  const { data, isLoading, error } = useQBittorrentAll();
  const { data: transferData } = useQBittorrentTransfer();
  const qbAction = useQBittorrentAction();
  const [pendingHash, setPendingHash] = useState<string | null>(null);
  const [magnetInput, setMagnetInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAction = (action: 'pause' | 'resume' | 'delete', hash: string) => {
    setPendingHash(hash);
    qbAction.mutate(
      { action, hash },
      { onSettled: () => setPendingHash(null) }
    );
  };

  const handleAddMagnet = () => {
    if (!magnetInput.trim()) return;
    setIsAdding(true);
    qbAction.mutate(
      { action: 'add', magnetUrl: magnetInput.trim() },
      {
        onSuccess: () => setMagnetInput(''),
        onSettled: () => setIsAdding(false),
      }
    );
  };

  const torrents = data?.data?.torrents || [];
  const downloadingCount = torrents.filter((t) =>
    ['downloading', 'forcedDL', 'stalledDL', 'metaDL', 'queuedDL'].includes(t.state)
  ).length;
  const seedingCount = torrents.filter((t) =>
    ['uploading', 'forcedUP', 'stalledUP', 'queuedUP'].includes(t.state)
  ).length;
  const dlSpeed = transferData?.data?.dl_info_speed || 0;
  const upSpeed = transferData?.data?.up_info_speed || 0;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-transparent to-transparent" />

        <div className="relative px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100 dark:text-slate-100 text-slate-800">Torrent Manager</h1>
                  <p className="text-sm text-slate-400 dark:text-slate-400 text-slate-500">qBittorrent</p>
                </div>
              </div>
            </div>
            {data?.success && (
              <div className="flex items-center gap-4 px-4 py-2 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 bg-white/60 backdrop-blur-sm border border-slate-700/50 dark:border-slate-700/50 border-slate-300/50">
                <div className="flex items-center gap-2">
                  <ArrowDown className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-mono font-medium text-slate-300 dark:text-slate-300 text-slate-600">{formatSpeed(dlSpeed)}</span>
                </div>
                <div className="h-4 w-px bg-slate-700 dark:bg-slate-700 bg-slate-300" />
                <div className="flex items-center gap-2">
                  <ArrowUp className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-mono font-medium text-slate-300 dark:text-slate-300 text-slate-600">{formatSpeed(upSpeed)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Add Magnet */}
          {data?.success && (
            <div className="flex gap-3 mt-6">
              <input
                type="text"
                placeholder="Paste magnet link..."
                value={magnetInput}
                onChange={(e) => setMagnetInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddMagnet()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 bg-white/60 backdrop-blur-sm border border-slate-700/50 dark:border-slate-700/50 border-slate-300/50 text-sm text-slate-200 dark:text-slate-200 text-slate-700 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30"
              />
              <Button
                onClick={handleAddMagnet}
                disabled={!magnetInput.trim() || isAdding}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl px-6"
              >
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Stats */}
          {data?.success && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <StatCard
                title="Total Torrents"
                value={torrents.length}
                subtitle="All torrents"
                icon={HardDrive}
                color="from-amber-500 to-orange-500"
              />
              <StatCard
                title="Downloading"
                value={downloadingCount}
                subtitle="Active downloads"
                icon={Download}
                color="from-blue-500 to-cyan-500"
              />
              <StatCard
                title="Seeding"
                value={seedingCount}
                subtitle="Uploading"
                icon={Upload}
                color="from-emerald-500 to-teal-500"
              />
              <StatCard
                title="Transfer"
                value={formatSpeed(dlSpeed)}
                subtitle={`UP: ${formatSpeed(upSpeed)}`}
                icon={Activity}
                color="from-purple-500 to-pink-500"
              />
            </div>
          )}
        </div>
      </header>

      <div className="p-6">
        {isLoading && <LoadingSkeleton />}

        {error && (
          <Card className="bg-red-950/20 dark:bg-red-950/20 bg-red-50 border-red-900/50 dark:border-red-900/50 border-red-200/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-400">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/20">
                  <Download className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Connection Failed</p>
                  <p className="text-sm text-red-400/70">
                    Failed to connect to qBittorrent: {error.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {data?.success && data.data && (
          <Card className="bg-gradient-to-br from-slate-900/80 dark:from-slate-900/80 from-white/80 to-slate-800/40 dark:to-slate-800/40 to-slate-100/40 backdrop-blur-xl border-slate-700/50 dark:border-slate-700/50 border-slate-300/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 px-4 py-3 bg-slate-800/30 dark:bg-slate-800/30 bg-slate-200/30 border-b border-slate-700/50 dark:border-slate-700/50 border-slate-300/50">
              <p className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider">Torrent</p>
              <p className="w-24 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Status</p>
              <p className="w-20 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Actions</p>
            </div>

            {/* Torrent List */}
            <div className="max-h-[calc(100vh-500px)] min-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {torrents.length > 0 ? (
                torrents.map((torrent) => (
                  <TorrentRow
                    key={torrent.hash}
                    torrent={torrent}
                    onAction={handleAction}
                    isPending={pendingHash === torrent.hash}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Download className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No torrents found</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 dark:bg-slate-800/30 bg-slate-200/30 border-t border-slate-700/50 dark:border-slate-700/50 border-slate-300/50">
              <p className="text-xs text-slate-500">
                {torrents.length} torrent{torrents.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-blue-400" />
                  <span className="text-xs text-slate-400">{downloadingCount} downloading</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-400">{seedingCount} seeding</span>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
