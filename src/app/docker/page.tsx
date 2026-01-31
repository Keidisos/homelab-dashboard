'use client';

import {
  Container,
  Film,
  Tv2,
  Download,
  Search,
  Rss,
  ExternalLink,
  Play,
  Square,
  Pause,
  RotateCw,
  Layers,
  Activity,
  Home,
  Cloud,
  LayoutDashboard,
  RefreshCw,
  Gauge,
  Server,
  Shield,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocker } from '@/hooks/use-services';
import { useAppUrls, type AppUrls } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import type { DockerContainer } from '@/types';
import type { LucideIcon } from 'lucide-react';

const containerIcons: Record<string, LucideIcon> = {
  radarr: Film,
  sonarr: Tv2,
  qbittorrent: Download,
  jellyseerr: Search,
  prowlarr: Rss,
  homeassistant: Home,
  homarr: LayoutDashboard,
  nextcloud: Cloud,
  'uptime-kuma': Gauge,
  'update-dashboard': RefreshCw,
  'proxmox-admin': Server,
  portainer: Container,
  flaresolverr: Shield,
};

// Map container names to settings keys
const containerUrlKeys: Record<string, string> = {
  radarr: 'radarr',
  sonarr: 'sonarr',
  qbittorrent: 'qbittorrent',
  jellyseerr: 'jellyseerr',
  homeassistant: 'homeassistant',
  homarr: 'homarr',
  nextcloud: 'nextcloud',
  'uptime-kuma': 'uptimekuma',
  'update-dashboard': 'updateDashboard',
  'proxmox-admin': 'proxmoxAdmin',
  portainer: 'portainer',
};

const containerColors: Record<string, string> = {
  radarr: 'from-amber-500 to-orange-600',
  sonarr: 'from-cyan-500 to-blue-600',
  qbittorrent: 'from-green-500 to-emerald-600',
  jellyseerr: 'from-purple-500 to-indigo-600',
  prowlarr: 'from-pink-500 to-rose-600',
  homeassistant: 'from-sky-500 to-blue-600',
  homarr: 'from-rose-500 to-pink-600',
  nextcloud: 'from-blue-500 to-indigo-600',
  'uptime-kuma': 'from-emerald-500 to-green-600',
  'update-dashboard': 'from-violet-500 to-purple-600',
  'proxmox-admin': 'from-orange-500 to-amber-600',
  portainer: 'from-cyan-500 to-teal-600',
  flaresolverr: 'from-yellow-500 to-orange-600',
};

function getContainerIcon(name: string): LucideIcon {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(containerIcons)) {
    if (lowerName.includes(key)) return icon;
  }
  return Container;
}

function getContainerUrlKey(name: string): string | undefined {
  const lowerName = name.toLowerCase();
  for (const [key, urlKey] of Object.entries(containerUrlKeys)) {
    if (lowerName.includes(key)) return urlKey;
  }
  return undefined;
}

function getContainerColor(name: string): string {
  const lowerName = name.toLowerCase();
  for (const [key, color] of Object.entries(containerColors)) {
    if (lowerName.includes(key)) return color;
  }
  return 'from-blue-500 to-cyan-600';
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

function ContainerRow({ container, urls }: { container: DockerContainer; urls: AppUrls | null }) {
  const Icon = getContainerIcon(container.name);
  const urlKey = getContainerUrlKey(container.name);
  const externalUrl = urlKey && urls ? urls[urlKey as keyof AppUrls] : undefined;
  const gradientColor = getContainerColor(container.name);
  const isRunning = container.status === 'running';
  const isClickable = externalUrl && isRunning;

  const statusConfig = {
    running: {
      label: 'Running',
      icon: Play,
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
    },
    stopped: {
      label: 'Stopped',
      icon: Square,
      className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      dotColor: 'bg-slate-400',
    },
    paused: {
      label: 'Paused',
      icon: Pause,
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400',
    },
    restarting: {
      label: 'Restarting',
      icon: RotateCw,
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      dotColor: 'bg-blue-400 animate-pulse',
    },
  };

  const status = statusConfig[container.status] || statusConfig.stopped;
  const StatusIcon = status.icon;

  const rowContent = (
    <>
      {/* Left accent bar */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 transition-all duration-200',
        'opacity-60 group-hover:opacity-100',
        isRunning ? `bg-gradient-to-b ${gradientColor}` : 'bg-slate-600'
      )} />

      {/* Icon */}
      <div className={cn(
        'relative flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
        'transition-all duration-200 group-hover:scale-105',
        isRunning
          ? `bg-gradient-to-br ${gradientColor} shadow-md`
          : 'bg-slate-800/80 border border-slate-700/50'
      )}>
        <Icon className={cn(
          'h-5 w-5',
          isRunning ? 'text-white' : 'text-slate-500'
        )} />
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900',
          status.dotColor
        )} />
      </div>

      {/* Name & Image */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100 truncate group-hover:text-white transition-colors">
          {container.name}
        </p>
        <p className="text-xs text-slate-500 truncate">
          {container.image.split(':')[0].split('/').pop()}
        </p>
      </div>

      {/* Container ID */}
      <div className="hidden md:block min-w-0 w-32">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">ID</p>
        <p className="text-xs font-mono text-slate-400 truncate">{container.id}</p>
      </div>

      {/* State */}
      <div className="hidden lg:block min-w-0 w-24">
        <p className="text-[10px] text-slate-500 uppercase tracking-wider">State</p>
        <p className="text-xs font-mono text-slate-400 truncate">{container.state}</p>
      </div>

      {/* Status Badge */}
      <Badge
        variant="outline"
        className={cn(
          'shrink-0 font-medium text-xs border gap-1.5 w-24 justify-center',
          status.className
        )}
      >
        <StatusIcon className="h-3 w-3" />
        {status.label}
      </Badge>

      {/* External Link Icon */}
      <div className="w-9 flex items-center justify-center shrink-0">
        {isClickable && (
          <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
        )}
      </div>
    </>
  );

  const rowClasses = cn(
    'group relative flex items-center gap-4 p-4 transition-all duration-200',
    'bg-gradient-to-r from-slate-900/60 to-slate-800/30 backdrop-blur-sm',
    'border-b border-slate-700/30 last:border-b-0',
    'hover:from-slate-800/80 hover:to-slate-700/40',
    'hover:pl-5',
    isClickable && 'cursor-pointer'
  );

  if (isClickable) {
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={rowClasses}
      >
        {rowContent}
      </a>
    );
  }

  return (
    <div className={rowClasses}>
      {rowContent}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <>
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-5">
              <div className="flex justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20 bg-slate-800" />
                  <Skeleton className="h-8 w-16 bg-slate-800" />
                </div>
                <Skeleton className="h-12 w-12 rounded-xl bg-slate-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* List skeleton */}
      <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden">
        <div className="divide-y divide-slate-700/30">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32 bg-slate-800" />
                <Skeleton className="h-3 w-20 bg-slate-800" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-slate-800" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export default function DockerPage() {
  const { data, isLoading, error } = useDocker();
  const urls = useAppUrls();

  const containers = data?.data?.containers || [];
  const runningCount = containers.filter((c) => c.status === 'running').length;
  const stoppedCount = containers.filter((c) => c.status === 'stopped').length;
  const totalCount = containers.length;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-teal-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent" />

        <div className="relative px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
                  <Container className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">Docker Containers</h1>
                  <p className="text-sm text-slate-400">Managed via Portainer</p>
                </div>
              </div>
            </div>
            {data?.success && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-slate-300">{runningCount} active</span>
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <span className="text-sm text-slate-500">{totalCount} total</span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {data?.success && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <StatCard
                title="Total Containers"
                value={totalCount}
                subtitle="All containers"
                icon={Layers}
                color="from-blue-500 to-cyan-500"
              />
              <StatCard
                title="Running"
                value={runningCount}
                subtitle="Active now"
                icon={Play}
                color="from-emerald-500 to-teal-500"
              />
              <StatCard
                title="Stopped"
                value={stoppedCount}
                subtitle="Inactive"
                icon={Square}
                color="from-slate-500 to-slate-600"
              />
              <StatCard
                title="Health"
                value={totalCount > 0 ? `${Math.round((runningCount / totalCount) * 100)}%` : '0%'}
                subtitle="Running ratio"
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
          <Card className="bg-red-950/20 border-red-900/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-400">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/20">
                  <Container className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Connection Failed</p>
                  <p className="text-sm text-red-400/70">
                    Failed to connect to Docker/Portainer: {error.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {data?.success && data.data && (
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden">
            {/* List Header */}
            <div className="flex items-center gap-4 px-4 py-3 bg-slate-800/30 border-b border-slate-700/50">
              <div className="w-10" /> {/* Icon spacer */}
              <p className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider">Container</p>
              <p className="hidden md:block w-32 text-xs font-medium text-slate-500 uppercase tracking-wider">ID</p>
              <p className="hidden lg:block w-24 text-xs font-medium text-slate-500 uppercase tracking-wider">State</p>
              <p className="w-24 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Status</p>
              <div className="w-9" /> {/* Action spacer */}
            </div>

            {/* Scrollable List */}
            <div className="max-h-[calc(100vh-400px)] min-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
              {containers
                .sort((a, b) => {
                  if (a.status === 'running' && b.status !== 'running') return -1;
                  if (a.status !== 'running' && b.status === 'running') return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((container) => (
                  <ContainerRow key={container.id} container={container} urls={urls} />
                ))}
            </div>

            {/* List Footer */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
              <p className="text-xs text-slate-500">
                {containers.length} container{containers.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-400">{runningCount} running</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-slate-500" />
                  <span className="text-xs text-slate-400">{stoppedCount} stopped</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {data?.success && containers.length === 0 && (
          <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800/50 mx-auto mb-4">
                <Container className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">No Containers Found</h3>
              <p className="text-sm text-slate-500">
                No Docker containers are currently available in Portainer.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
