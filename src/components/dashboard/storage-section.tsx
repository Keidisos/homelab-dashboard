'use client';

import { HardDrive, Database, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useStorage } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { StorageVolume } from '@/types';

function formatBytes(bytes: number): string {
  const tb = bytes / (1024 * 1024 * 1024 * 1024);
  if (tb >= 1) {
    return `${tb.toFixed(1)} TB`;
  }
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(1)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function VolumeCard({ volume }: { volume: StorageVolume }) {
  const usageColor =
    volume.usagePercent > 90
      ? 'bg-red-500'
      : volume.usagePercent > 70
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  const textColor =
    volume.usagePercent > 90
      ? 'text-red-400'
      : volume.usagePercent > 70
        ? 'text-amber-400'
        : 'text-emerald-400';

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50">
              <Database className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-slate-100">
                {volume.name}
              </CardTitle>
              <p className="text-xs text-slate-500 font-mono">{volume.path}</p>
            </div>
          </div>
          <span className={cn('text-lg font-bold font-mono', textColor)}>
            {volume.usagePercent}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', usageColor)}
            style={{ width: `${volume.usagePercent}%` }}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-slate-500">Used</p>
            <p className="text-slate-300 font-mono">{formatBytes(volume.used)}</p>
          </div>
          <div>
            <p className="text-slate-500">Available</p>
            <p className="text-slate-300 font-mono">{formatBytes(volume.available)}</p>
          </div>
          <div>
            <p className="text-slate-500">Total</p>
            <p className="text-slate-300 font-mono">{formatBytes(volume.total)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VolumeSkeleton() {
  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24 bg-slate-800" />
            <Skeleton className="h-3 w-16 bg-slate-800" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-2 w-full bg-slate-800" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-8 w-full bg-slate-800" />
          <Skeleton className="h-8 w-full bg-slate-800" />
          <Skeleton className="h-8 w-full bg-slate-800" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StorageSection() {
  const { data, isLoading, error } = useStorage();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-teal-400" />
          NAS Storage
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(2)].map((_, i) => (
            <VolumeSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }

  if (error || !data?.success || !data.data) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <HardDrive className="h-4 w-4 text-teal-400" />
          NAS Storage
        </h3>
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
          Failed to connect to NAS: {error?.message || data?.error || 'Unknown error'}
        </div>
      </section>
    );
  }

  const { volumes, health } = data.data;

  const healthConfig = {
    healthy: {
      icon: CheckCircle,
      label: 'Healthy',
      className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    degraded: {
      icon: AlertTriangle,
      label: 'Degraded',
      className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    failed: {
      icon: XCircle,
      label: 'Failed',
      className: 'bg-red-500/10 text-red-400 border-red-500/30',
    },
  };

  const healthInfo = healthConfig[health];
  const HealthIcon = healthInfo.icon;

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <HardDrive className="h-4 w-4 text-teal-400" />
        NAS Storage
        <Badge variant="outline" className={cn('ml-2 text-xs', healthInfo.className)}>
          <HealthIcon className="h-3 w-3 mr-1" />
          {healthInfo.label}
        </Badge>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {volumes.map((volume, index) => (
          <VolumeCard key={volume.path || index} volume={volume} />
        ))}
      </div>
    </section>
  );
}
