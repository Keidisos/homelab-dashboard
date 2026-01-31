'use client';

import { Gamepad2, Cpu, MemoryStick, HardDrive, Power, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { usePterodactyl } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { PterodactylServer } from '@/types';

function ServerCard({ server }: { server: PterodactylServer }) {
  const isRunning = server.status === 'running';
  const isStarting = server.status === 'starting';
  const isStopping = server.status === 'stopping';

  const statusConfig = {
    running: { label: 'Online', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
    starting: { label: 'Starting', className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
    stopping: { label: 'Stopping', className: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
    offline: { label: 'Offline', className: 'bg-slate-500/20 text-slate-400 border-slate-500/50' },
  };

  const status = statusConfig[server.status] || statusConfig.offline;

  const memPercent = server.memory.limit > 0 ? (server.memory.current / server.memory.limit) * 100 : 0;
  const cpuPercent = server.cpu.limit > 0 ? (server.cpu.current / server.cpu.limit) * 100 : server.cpu.current;
  const diskPercent = server.disk.limit > 0 ? (server.disk.current / server.disk.limit) * 100 : 0;

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center h-12 w-12 rounded-lg border',
                isRunning
                  ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border-green-500/30'
                  : 'bg-gradient-to-br from-slate-500/20 to-slate-600/10 border-slate-500/30'
              )}
            >
              <Gamepad2 className={cn('h-6 w-6', isRunning ? 'text-green-400' : 'text-slate-500')} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-100">
                {server.name}
              </CardTitle>
              <p className="text-xs text-slate-500 font-mono">{server.id}</p>
            </div>
          </div>
          <Badge variant="outline" className={cn('font-mono text-xs border', status.className)}>
            <Power className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resources - only show if running */}
        {(isRunning || isStarting || isStopping) && (
          <>
            {/* CPU */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>CPU</span>
                </div>
                <span className="font-mono text-slate-400">
                  {server.cpu.current}% / {server.cpu.limit || 100}%
                </span>
              </div>
              <Progress value={Math.min(cpuPercent, 100)} className="h-1.5" />
            </div>

            {/* Memory */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <MemoryStick className="h-3.5 w-3.5" />
                  <span>Memory</span>
                </div>
                <span className="font-mono text-slate-400">
                  {server.memory.current} / {server.memory.limit} MB
                </span>
              </div>
              <Progress value={memPercent} className="h-1.5" />
            </div>

            {/* Disk */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <HardDrive className="h-3.5 w-3.5" />
                  <span>Disk</span>
                </div>
                <span className="font-mono text-slate-400">
                  {server.disk.current} / {server.disk.limit} MB
                </span>
              </div>
              <Progress value={diskPercent} className="h-1.5" />
            </div>
          </>
        )}

        {/* Limits when offline */}
        {!isRunning && !isStarting && !isStopping && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-800/30 rounded-lg p-2">
              <p className="text-xs text-slate-500">CPU</p>
              <p className="text-sm font-mono text-slate-400">{server.cpu.limit || 100}%</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-2">
              <p className="text-xs text-slate-500">RAM</p>
              <p className="text-sm font-mono text-slate-400">{server.memory.limit} MB</p>
            </div>
            <div className="bg-slate-800/30 rounded-lg p-2">
              <p className="text-xs text-slate-500">Disk</p>
              <p className="text-sm font-mono text-slate-400">{server.disk.limit} MB</p>
            </div>
          </div>
        )}

        {/* External Link */}
        {process.env.NEXT_PUBLIC_PTERODACTYL_HOST && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full mt-2 bg-slate-800/50 border-slate-700/50 hover:bg-green-950/30 hover:border-green-700/50 text-slate-400 hover:text-green-400"
          >
            <a
              href={`${process.env.NEXT_PUBLIC_PTERODACTYL_HOST}/server/${server.id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Open Console
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(4)].map((_, i) => (
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
          <CardContent className="space-y-3">
            <Skeleton className="h-2 w-full bg-slate-800" />
            <Skeleton className="h-2 w-full bg-slate-800" />
            <Skeleton className="h-2 w-full bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function GamingPage() {
  const { data, isLoading, error } = usePterodactyl();

  const servers = data?.data?.servers || [];
  const onlineCount = servers.filter((s) => s.status === 'running').length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center gap-4 h-14 px-6">
          <Gamepad2 className="h-6 w-6 text-green-400" />
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Game Servers</h1>
            <p className="text-xs text-slate-500">Pterodactyl Panel</p>
          </div>
          {data?.success && (
            <Badge variant="outline" className="ml-auto bg-slate-800/50 text-slate-400 border-slate-700">
              {onlineCount}/{servers.length} online
            </Badge>
          )}
        </div>
      </header>

      <div className="p-6">
        {isLoading && <LoadingSkeleton />}

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
            Failed to connect to Pterodactyl: {error.message}
          </div>
        )}

        {data?.success && data.data && (
          <>
            {servers.length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-800/30 rounded-lg p-12 text-center">
                <Gamepad2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">No Game Servers</h3>
                <p className="text-slate-500 text-sm">
                  No game servers are configured in Pterodactyl
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {servers
                  .sort((a, b) => (a.status === 'running' ? -1 : 1) - (b.status === 'running' ? -1 : 1))
                  .map((server) => (
                    <ServerCard key={server.id} server={server} />
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
