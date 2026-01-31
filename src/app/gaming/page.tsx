'use client';

import {
  Gamepad2,
  Cpu,
  MemoryStick,
  HardDrive,
  Power,
  ExternalLink,
  Server,
  Activity,
  Zap,
  PowerOff,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { usePterodactyl } from '@/hooks/use-services';
import { useAppUrls } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import type { PterodactylServer } from '@/types';
import type { LucideIcon } from 'lucide-react';

function formatMemory(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
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

function ServerRow({ server, pterodactylUrl }: { server: PterodactylServer; pterodactylUrl?: string }) {
  const isRunning = server.status === 'running';
  const isStarting = server.status === 'starting';
  const isStopping = server.status === 'stopping';
  const isActive = isRunning || isStarting || isStopping;

  const statusConfig = {
    running: {
      label: 'Online',
      icon: Zap,
      className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
      gradient: 'from-emerald-500 to-teal-600',
    },
    starting: {
      label: 'Starting',
      icon: Power,
      className: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      dotColor: 'bg-blue-400 animate-pulse',
      gradient: 'from-blue-500 to-cyan-600',
    },
    stopping: {
      label: 'Stopping',
      icon: Power,
      className: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400 animate-pulse',
      gradient: 'from-amber-500 to-orange-600',
    },
    offline: {
      label: 'Offline',
      icon: PowerOff,
      className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
      dotColor: 'bg-slate-500',
      gradient: 'from-slate-500 to-slate-600',
    },
  };

  const status = statusConfig[server.status] || statusConfig.offline;
  const StatusIcon = status.icon;

  const memPercent = server.memory.limit > 0 ? (server.memory.current / server.memory.limit) * 100 : 0;
  const cpuPercent = server.cpu.limit > 0 ? (server.cpu.current / server.cpu.limit) * 100 : server.cpu.current;

  const serverUrl = pterodactylUrl ? `${pterodactylUrl}/server/${server.id}` : null;

  const rowContent = (
    <>
      {/* Left accent bar */}
      <div className={cn(
        'absolute left-0 top-0 bottom-0 w-1 transition-all duration-200',
        'opacity-60 group-hover:opacity-100',
        `bg-gradient-to-b ${status.gradient}`
      )} />

      {/* Icon */}
      <div className={cn(
        'relative flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
        'transition-all duration-200 group-hover:scale-105',
        isRunning
          ? `bg-gradient-to-br ${status.gradient} shadow-md`
          : 'bg-slate-800/80 border border-slate-700/50'
      )}>
        <Gamepad2 className={cn(
          'h-5 w-5',
          isRunning ? 'text-white' : 'text-slate-500'
        )} />
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-900',
          status.dotColor
        )} />
      </div>

      {/* Name & ID */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-100 truncate group-hover:text-white transition-colors">
          {server.name}
        </p>
        <p className="text-xs text-slate-500 font-mono truncate">
          {server.id}
        </p>
      </div>

      {/* CPU Usage */}
      <div className="hidden md:block w-28">
        {isActive ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-500">
                <Cpu className="h-3 w-3" />
                <span>CPU</span>
              </div>
              <span className="font-mono text-slate-400">{server.cpu.current}%</span>
            </div>
            <Progress value={Math.min(cpuPercent, 100)} className="h-1" />
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Cpu className="h-3 w-3" />
            <span>{server.cpu.limit || 100}%</span>
          </div>
        )}
      </div>

      {/* Memory Usage */}
      <div className="hidden lg:block w-32">
        {isActive ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-slate-500">
                <MemoryStick className="h-3 w-3" />
                <span>RAM</span>
              </div>
              <span className="font-mono text-slate-400">{formatMemory(server.memory.current)}</span>
            </div>
            <Progress value={memPercent} className="h-1" />
          </div>
        ) : (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <MemoryStick className="h-3 w-3" />
            <span>{formatMemory(server.memory.limit)}</span>
          </div>
        )}
      </div>

      {/* Disk */}
      <div className="hidden xl:flex items-center gap-1 w-24 text-xs text-slate-500">
        <HardDrive className="h-3 w-3" />
        <span>{formatMemory(server.disk.limit)}</span>
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
        {serverUrl && (
          <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
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
    serverUrl && 'cursor-pointer'
  );

  if (serverUrl) {
    return (
      <a
        href={serverUrl}
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
          {[...Array(4)].map((_, i) => (
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

export default function GamingPage() {
  const { data, isLoading, error } = usePterodactyl();
  const urls = useAppUrls();

  const servers = data?.data?.servers || [];
  const onlineCount = servers.filter((s) => s.status === 'running').length;
  const offlineCount = servers.filter((s) => s.status === 'offline').length;
  const totalCount = servers.length;

  // Calculate total resources for online servers
  const totalCpu = servers
    .filter((s) => s.status === 'running')
    .reduce((acc, s) => acc + s.cpu.current, 0);
  const totalMemory = servers
    .filter((s) => s.status === 'running')
    .reduce((acc, s) => acc + s.memory.current, 0);

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-green-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />

        <div className="relative px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">Game Servers</h1>
                  <p className="text-sm text-slate-400">Pterodactyl Panel</p>
                </div>
              </div>
            </div>
            {data?.success && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-medium text-slate-300">{onlineCount} online</span>
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
                title="Total Servers"
                value={totalCount}
                subtitle="Game servers"
                icon={Server}
                color="from-emerald-500 to-teal-500"
              />
              <StatCard
                title="Online"
                value={onlineCount}
                subtitle="Running now"
                icon={Zap}
                color="from-green-500 to-emerald-500"
              />
              <StatCard
                title="CPU Usage"
                value={`${totalCpu}%`}
                subtitle="Combined usage"
                icon={Cpu}
                color="from-orange-500 to-amber-500"
              />
              <StatCard
                title="Memory"
                value={formatMemory(totalMemory)}
                subtitle="Combined usage"
                icon={MemoryStick}
                color="from-blue-500 to-cyan-500"
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
                  <Gamepad2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Connection Failed</p>
                  <p className="text-sm text-red-400/70">
                    Failed to connect to Pterodactyl: {error.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {data?.success && data.data && (
          <>
            {servers.length === 0 ? (
              <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-12 text-center">
                  <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800/50 mx-auto mb-4">
                    <Gamepad2 className="h-8 w-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No Game Servers</h3>
                  <p className="text-sm text-slate-500">
                    No game servers are configured in Pterodactyl
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden">
                {/* List Header */}
                <div className="flex items-center gap-4 px-4 py-3 bg-slate-800/30 border-b border-slate-700/50">
                  <div className="w-10" />
                  <p className="flex-1 text-xs font-medium text-slate-500 uppercase tracking-wider">Server</p>
                  <p className="hidden md:block w-28 text-xs font-medium text-slate-500 uppercase tracking-wider">CPU</p>
                  <p className="hidden lg:block w-32 text-xs font-medium text-slate-500 uppercase tracking-wider">Memory</p>
                  <p className="hidden xl:block w-24 text-xs font-medium text-slate-500 uppercase tracking-wider">Disk</p>
                  <p className="w-24 text-xs font-medium text-slate-500 uppercase tracking-wider text-center">Status</p>
                  <div className="w-9" />
                </div>

                {/* Scrollable List */}
                <div className="max-h-[calc(100vh-400px)] min-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {servers
                    .sort((a, b) => {
                      // Sort by status: running first, then starting/stopping, then offline
                      const order = { running: 0, starting: 1, stopping: 2, offline: 3 };
                      return (order[a.status] || 3) - (order[b.status] || 3);
                    })
                    .map((server) => (
                      <ServerRow key={server.id} server={server} pterodactylUrl={urls?.pterodactyl} />
                    ))}
                </div>

                {/* List Footer */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/30 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500">
                    {totalCount} server{totalCount !== 1 ? 's' : ''}
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-xs text-slate-400">{onlineCount} online</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-slate-500" />
                      <span className="text-xs text-slate-400">{offlineCount} offline</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
