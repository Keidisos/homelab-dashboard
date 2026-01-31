'use client';

import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { ServiceStatus, ServiceMetric } from '@/types';
import type { LucideIcon } from 'lucide-react';

interface ServiceCardProps {
  name: string;
  status: ServiceStatus;
  description?: string;
  metrics?: ServiceMetric[];
  externalUrl?: string;
  icon?: LucideIcon;
  isLoading?: boolean;
  className?: string;
}

const statusConfig: Record<ServiceStatus, { label: string; className: string; glow: string }> = {
  online: {
    label: 'Online',
    className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
    glow: 'shadow-emerald-500/20',
  },
  offline: {
    label: 'Offline',
    className: 'bg-red-500/20 text-red-400 border-red-500/50',
    glow: 'shadow-red-500/20',
  },
  warning: {
    label: 'Warning',
    className: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
    glow: 'shadow-amber-500/20',
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-slate-500/20 text-slate-400 border-slate-500/50',
    glow: 'shadow-slate-500/20',
  },
};

function MetricBar({ metric }: { metric: ServiceMetric }) {
  const percentage = Math.min((metric.value / metric.max) * 100, 100);
  const colorClass =
    percentage > 90
      ? 'bg-red-500'
      : percentage > 70
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{metric.label}</span>
        <span className="text-slate-300 font-mono">
          {metric.value.toFixed(1)}{metric.unit} / {metric.max}{metric.unit}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24 bg-slate-800" />
              <Skeleton className="h-3 w-16 bg-slate-800" />
            </div>
          </div>
          <Skeleton className="h-5 w-16 rounded-full bg-slate-800" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-6 w-full bg-slate-800" />
        <Skeleton className="h-6 w-full bg-slate-800" />
        <Skeleton className="h-8 w-24 bg-slate-800" />
      </CardContent>
    </Card>
  );
}

export function ServiceCard({
  name,
  status,
  description,
  metrics,
  externalUrl,
  icon: Icon,
  isLoading = false,
  className,
}: ServiceCardProps) {
  if (isLoading) {
    return <ServiceCardSkeleton />;
  }

  const statusStyle = statusConfig[status];

  return (
    <Card
      className={cn(
        // Glassmorphism base
        'relative overflow-hidden',
        'bg-slate-900/40 backdrop-blur-xl',
        'border border-slate-700/50',
        // Cyberpunk glow effect
        'shadow-lg transition-all duration-300',
        'hover:shadow-xl hover:border-slate-600/50',
        'hover:bg-slate-900/60',
        // Glow based on status
        `hover:${statusStyle.glow}`,
        className
      )}
    >
      {/* Gradient accent line */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-px',
          'bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent'
        )}
      />

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Icon container with glow */}
            <div
              className={cn(
                'flex items-center justify-center',
                'h-10 w-10 rounded-lg',
                'bg-gradient-to-br from-slate-800 to-slate-900',
                'border border-slate-700/50',
                'shadow-inner'
              )}
            >
              {Icon && <Icon className="h-5 w-5 text-cyan-400" />}
            </div>

            <div>
              <CardTitle className="text-base font-semibold text-slate-100">
                {name}
              </CardTitle>
              {description && (
                <p className="text-xs text-slate-500 mt-0.5">{description}</p>
              )}
            </div>
          </div>

          {/* Status badge */}
          <Badge
            variant="outline"
            className={cn(
              'font-mono text-xs',
              'border',
              statusStyle.className
            )}
          >
            <span
              className={cn(
                'inline-block w-1.5 h-1.5 rounded-full mr-1.5',
                status === 'online' && 'bg-emerald-400 animate-pulse',
                status === 'offline' && 'bg-red-400',
                status === 'warning' && 'bg-amber-400 animate-pulse',
                status === 'unknown' && 'bg-slate-400'
              )}
            />
            {statusStyle.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Metrics */}
        {metrics && metrics.length > 0 && (
          <div className="space-y-2.5">
            {metrics.map((metric, index) => (
              <MetricBar key={index} metric={metric} />
            ))}
          </div>
        )}

        {/* External link button */}
        {externalUrl && (
          <Button
            variant="outline"
            size="sm"
            asChild
            className={cn(
              'w-full mt-2',
              'bg-slate-800/50 border-slate-700/50',
              'hover:bg-cyan-950/30 hover:border-cyan-700/50',
              'text-slate-400 hover:text-cyan-400',
              'transition-all duration-200'
            )}
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
