'use client';

import { Container, Film, Tv2, Download, Search, Rss, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useDocker } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { DockerContainer } from '@/types';
import type { LucideIcon } from 'lucide-react';

const containerIcons: Record<string, LucideIcon> = {
  radarr: Film,
  sonarr: Tv2,
  qbittorrent: Download,
  jellyseerr: Search,
  prowlarr: Rss,
};

const containerUrls: Record<string, string | undefined> = {
  radarr: process.env.NEXT_PUBLIC_RADARR_HOST,
  sonarr: process.env.NEXT_PUBLIC_SONARR_HOST,
  qbittorrent: process.env.NEXT_PUBLIC_QBITTORRENT_HOST,
  jellyseerr: process.env.NEXT_PUBLIC_JELLYSEERR_HOST,
};

function getContainerIcon(name: string): LucideIcon {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(containerIcons)) {
    if (lowerName.includes(key)) return icon;
  }
  return Container;
}

function getContainerUrl(name: string): string | undefined {
  const lowerName = name.toLowerCase();
  for (const [key, url] of Object.entries(containerUrls)) {
    if (lowerName.includes(key)) return url;
  }
  return undefined;
}

function ContainerCard({ container }: { container: DockerContainer }) {
  const Icon = getContainerIcon(container.name);
  const externalUrl = getContainerUrl(container.name);
  const isRunning = container.status === 'running';

  const statusConfig = {
    running: { label: 'Running', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' },
    stopped: { label: 'Stopped', className: 'bg-slate-500/20 text-slate-400 border-slate-500/50' },
    paused: { label: 'Paused', className: 'bg-amber-500/20 text-amber-400 border-amber-500/50' },
    restarting: { label: 'Restarting', className: 'bg-blue-500/20 text-blue-400 border-blue-500/50' },
  };

  const status = statusConfig[container.status] || statusConfig.stopped;

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center h-12 w-12 rounded-lg border',
                isRunning
                  ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30'
                  : 'bg-gradient-to-br from-slate-500/20 to-slate-600/10 border-slate-500/30'
              )}
            >
              <Icon className={cn('h-6 w-6', isRunning ? 'text-blue-400' : 'text-slate-500')} />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-100">
                {container.name}
              </CardTitle>
              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                {container.image.split(':')[0].split('/').pop()}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={cn('font-mono text-xs border', status.className)}>
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Container ID */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Container ID</span>
          <span className="font-mono text-slate-400">{container.id}</span>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Status</span>
          <span className="font-mono text-slate-400 truncate max-w-[150px]">{container.state}</span>
        </div>

        {/* External Link */}
        {externalUrl && isRunning && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="w-full mt-2 bg-slate-800/50 border-slate-700/50 hover:bg-cyan-950/30 hover:border-cyan-700/50 text-slate-400 hover:text-cyan-400"
          >
            <a href={externalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-2" />
              Open Interface
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg bg-slate-800" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-slate-800" />
                <Skeleton className="h-3 w-16 bg-slate-800" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-3 w-full bg-slate-800" />
            <Skeleton className="h-3 w-full bg-slate-800" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function DockerPage() {
  const { data, isLoading, error } = useDocker();

  const runningCount = data?.data?.containers.filter((c) => c.status === 'running').length || 0;
  const totalCount = data?.data?.containers.length || 0;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center gap-4 h-14 px-6">
          <Container className="h-6 w-6 text-blue-400" />
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Docker Containers</h1>
            <p className="text-xs text-slate-500">Managed via Portainer</p>
          </div>
          {data?.success && (
            <Badge variant="outline" className="ml-auto bg-slate-800/50 text-slate-400 border-slate-700">
              {runningCount}/{totalCount} running
            </Badge>
          )}
        </div>
      </header>

      <div className="p-6">
        {isLoading && <LoadingSkeleton />}

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
            Failed to connect to Docker/Portainer: {error.message}
          </div>
        )}

        {data?.success && data.data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.data.containers
              .sort((a, b) => (a.status === 'running' ? -1 : 1) - (b.status === 'running' ? -1 : 1))
              .map((container) => (
                <ContainerCard key={container.id} container={container} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
