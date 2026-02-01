'use client';

import { Activity, Check, X, Clock, Wrench } from 'lucide-react';
import { ServiceCardSkeleton } from '@/components/dashboard/service-card';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useUptimeKuma } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { UptimeKumaMonitor } from '@/types';

function MonitorCard({ monitor }: { monitor: UptimeKumaMonitor }) {
  const statusConfig = {
    up: {
      label: 'Online',
      icon: Check,
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dotColor: 'bg-emerald-400',
    },
    down: {
      label: 'Offline',
      icon: X,
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
      dotColor: 'bg-red-400',
    },
    pending: {
      label: 'Pending',
      icon: Clock,
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      dotColor: 'bg-amber-400',
    },
    maintenance: {
      label: 'Maintenance',
      icon: Wrench,
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      dotColor: 'bg-blue-400',
    },
  };

  const status = statusConfig[monitor.status];
  const StatusIcon = status.icon;

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50 hover:bg-slate-800/40 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('h-2 w-2 rounded-full', status.dotColor)} />
            <span className="text-sm font-medium text-slate-100 truncate max-w-[150px]">
              {monitor.name}
            </span>
          </div>
          <Badge variant="outline" className={cn('text-[10px] border gap-1', status.color)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Uptime (24h)</span>
            <span className={cn(
              'font-mono',
              monitor.uptime24h >= 99 ? 'text-emerald-400' :
              monitor.uptime24h >= 95 ? 'text-amber-400' : 'text-red-400'
            )}>
              {monitor.uptime24h.toFixed(2)}%
            </span>
          </div>
          <Progress
            value={monitor.uptime24h}
            className="h-1.5"
          />
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800/50">
          <div className="text-xs">
            <span className="text-slate-500">Ping: </span>
            <span className="font-mono text-slate-300">{monitor.avgPing}ms</span>
          </div>
          <div className="text-xs">
            <span className="text-slate-500">30d: </span>
            <span className="font-mono text-slate-300">{monitor.uptime30d.toFixed(2)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OverallStats({
  overallUptime,
  totalMonitors,
  upCount,
  downCount,
}: {
  overallUptime: number;
  totalMonitors: number;
  upCount: number;
  downCount: number;
}) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 mb-4">
      <CardContent className="p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-100">{totalMonitors}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{upCount}</p>
            <p className="text-xs text-slate-500">Online</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{downCount}</p>
            <p className="text-xs text-slate-500">Offline</p>
          </div>
          <div>
            <p className={cn(
              'text-2xl font-bold',
              overallUptime >= 99 ? 'text-emerald-400' :
              overallUptime >= 95 ? 'text-amber-400' : 'text-red-400'
            )}>
              {overallUptime.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500">Uptime</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function UptimeKumaSection() {
  const { data, isLoading, error } = useUptimeKuma();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          Uptime Monitoring
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
          <Activity className="h-4 w-4 text-emerald-400" />
          Uptime Monitoring
        </h3>
        <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
          Failed to connect to Uptime Kuma: {error?.message || data?.error || 'Unknown error'}
        </div>
      </section>
    );
  }

  const { monitors, overallUptime, totalMonitors, upCount, downCount } = data.data;

  return (
    <section className="space-y-4">
      <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <Activity className="h-4 w-4 text-emerald-400" />
        Uptime Monitoring
        <span className="text-xs text-slate-600">
          ({upCount}/{totalMonitors} online)
        </span>
      </h3>

      <OverallStats
        overallUptime={overallUptime}
        totalMonitors={totalMonitors}
        upCount={upCount}
        downCount={downCount}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {monitors
          .sort((a, b) => {
            // Sort: down first, then by name
            if (a.status === 'down' && b.status !== 'down') return -1;
            if (a.status !== 'down' && b.status === 'down') return 1;
            return a.name.localeCompare(b.name);
          })
          .map((monitor) => (
            <MonitorCard key={monitor.id} monitor={monitor} />
          ))}
      </div>
    </section>
  );
}
