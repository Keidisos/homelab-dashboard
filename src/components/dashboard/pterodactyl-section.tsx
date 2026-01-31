'use client';

import { Gamepad2 } from 'lucide-react';
import { ServiceCard, ServiceCardSkeleton } from '@/components/dashboard/service-card';
import { usePterodactyl } from '@/hooks/use-services';
import type { ServiceStatus, ServiceMetric } from '@/types';

function mapServerStatus(status: string): ServiceStatus {
  switch (status) {
    case 'running':
      return 'online';
    case 'starting':
    case 'stopping':
      return 'warning';
    default:
      return 'offline';
  }
}

export function PterodactylSection() {
  const { data, isLoading, error } = usePterodactyl();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-green-400" />
          Game Servers
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(2)].map((_, i) => (
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
          <Gamepad2 className="h-4 w-4 text-green-400" />
          Game Servers
        </h3>
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
          Failed to connect to Pterodactyl: {error?.message || data?.error || 'Unknown error'}
        </div>
      </section>
    );
  }

  const { servers } = data.data;

  if (servers.length === 0) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Gamepad2 className="h-4 w-4 text-green-400" />
          Game Servers
        </h3>
        <div className="bg-slate-900/20 border border-slate-800/30 rounded-lg p-6 text-center">
          <Gamepad2 className="h-8 w-8 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">No game servers configured</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Gamepad2 className="h-4 w-4 text-green-400" />
        Game Servers
        <span className="text-xs text-slate-600">
          ({servers.filter((s) => s.status === 'running').length}/{servers.length} online)
        </span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {servers.map((server) => {
          const metrics: ServiceMetric[] = [];

          if (server.status === 'running') {
            metrics.push({
              label: 'Memory',
              value: server.memory.current,
              max: server.memory.limit,
              unit: 'MB',
            });
            metrics.push({
              label: 'CPU',
              value: server.cpu.current,
              max: server.cpu.limit || 100,
              unit: '%',
            });
          }

          return (
            <ServiceCard
              key={server.id}
              name={server.name}
              description="Game Server"
              status={mapServerStatus(server.status)}
              icon={Gamepad2}
              metrics={metrics}
              externalUrl={process.env.NEXT_PUBLIC_PTERODACTYL_HOST}
            />
          );
        })}
      </div>
    </section>
  );
}
