'use client';

import { Container, Film, Tv2, Download, Search, Rss } from 'lucide-react';
import { ServiceCard, ServiceCardSkeleton } from '@/components/dashboard/service-card';
import { useDocker } from '@/hooks/use-services';
import type { ServiceStatus } from '@/types';
import type { LucideIcon } from 'lucide-react';

const containerIcons: Record<string, LucideIcon> = {
  radarr: Film,
  sonarr: Tv2,
  qbittorrent: Download,
  jellyseerr: Search,
  prowlarr: Rss,
  bazarr: Container,
  lidarr: Container,
  readarr: Container,
};

// Map container names to their environment variable keys
const containerUrls: Record<string, string | undefined> = {
  radarr: process.env.NEXT_PUBLIC_RADARR_HOST,
  sonarr: process.env.NEXT_PUBLIC_SONARR_HOST,
  qbittorrent: process.env.NEXT_PUBLIC_QBITTORRENT_HOST,
  jellyseerr: process.env.NEXT_PUBLIC_JELLYSEERR_HOST,
};

function getContainerIcon(name: string): LucideIcon {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(containerIcons)) {
    if (lowerName.includes(key)) {
      return icon;
    }
  }
  return Container;
}

function getContainerUrl(name: string): string | undefined {
  const lowerName = name.toLowerCase();
  for (const [key, url] of Object.entries(containerUrls)) {
    if (lowerName.includes(key)) {
      return url;
    }
  }
  return undefined;
}

function mapContainerStatus(status: string): ServiceStatus {
  switch (status) {
    case 'running':
      return 'online';
    case 'paused':
      return 'warning';
    case 'restarting':
      return 'warning';
    default:
      return 'offline';
  }
}

export function DockerSection() {
  const { data, isLoading, error } = useDocker();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Container className="h-4 w-4 text-blue-400" />
          Docker Containers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data?.success || !data.data) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Container className="h-4 w-4 text-blue-400" />
          Docker Containers
        </h3>
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
          Failed to connect to Docker/Portainer: {error?.message || data?.error || 'Unknown error'}
        </div>
      </section>
    );
  }

  const { containers } = data.data;

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Container className="h-4 w-4 text-blue-400" />
        Docker Containers
        <span className="text-xs text-slate-600">
          ({containers.filter((c) => c.status === 'running').length}/{containers.length} running)
        </span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {containers.map((container) => (
          <ServiceCard
            key={container.id}
            name={container.name}
            description={container.image.split(':')[0].split('/').pop()}
            status={mapContainerStatus(container.status)}
            icon={getContainerIcon(container.name)}
            externalUrl={getContainerUrl(container.name)}
          />
        ))}
      </div>
    </section>
  );
}
