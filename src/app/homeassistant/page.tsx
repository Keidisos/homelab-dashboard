'use client';

import { useState } from 'react';
import {
  Home,
  Lightbulb,
  Plug,
  Power,
  Zap,
  Activity,
  Loader2,
  Sun,
  MapPin,
  Thermometer,
  BatteryCharging,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useHomeAssistant, useHomeAssistantAction } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { HomeAssistantEntity, HomeAssistantArea } from '@/types';
import type { LucideIcon } from 'lucide-react';

// --- StatCard ---
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

// --- Temperature Sensor Card ---
function TemperatureCard({ entity }: { entity: HomeAssistantEntity }) {
  const temp = entity.temperature;
  const unit = entity.unit_of_measurement || '°C';

  // Color based on temperature
  const getTempColor = (t: number | undefined) => {
    if (t === undefined) return 'text-slate-400';
    if (t >= 28) return 'text-red-400';
    if (t >= 22) return 'text-amber-400';
    if (t >= 16) return 'text-emerald-400';
    return 'text-blue-400';
  };

  const getTempGradient = (t: number | undefined) => {
    if (t === undefined) return 'from-slate-800/50 to-slate-900/30 border-slate-700/50';
    if (t >= 28) return 'from-red-500/15 to-orange-600/10 border-red-500/30';
    if (t >= 22) return 'from-amber-500/15 to-orange-600/10 border-amber-500/30';
    if (t >= 16) return 'from-emerald-500/15 to-teal-600/10 border-emerald-500/30';
    return 'from-blue-500/15 to-cyan-600/10 border-blue-500/30';
  };

  const getTempIconGradient = (t: number | undefined) => {
    if (t === undefined) return 'bg-slate-800/80 border-slate-700/50';
    if (t >= 28) return 'bg-gradient-to-br from-red-500 to-orange-600 border-transparent shadow-md';
    if (t >= 22) return 'bg-gradient-to-br from-amber-500 to-orange-600 border-transparent shadow-md';
    if (t >= 16) return 'bg-gradient-to-br from-emerald-500 to-teal-600 border-transparent shadow-md';
    return 'bg-gradient-to-br from-blue-500 to-cyan-600 border-transparent shadow-md';
  };

  return (
    <Card className={cn(
      'bg-gradient-to-br backdrop-blur-xl border transition-all duration-300',
      getTempGradient(temp),
      'hover:shadow-xl hover:scale-[1.02]'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center h-10 w-10 rounded-lg border',
              getTempIconGradient(temp)
            )}>
              <Thermometer className={cn('h-5 w-5', temp !== undefined ? 'text-white' : 'text-slate-500')} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-slate-100">
                {entity.friendly_name}
              </p>
              <Badge
                variant="outline"
                className="text-[10px] mt-1 border bg-slate-500/20 text-slate-400 border-slate-500/50"
              >
                Capteur
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <p className={cn('text-2xl font-bold font-mono', getTempColor(temp))}>
              {temp !== undefined ? temp.toFixed(1) : '--'}
            </p>
            <p className="text-xs text-slate-500">{unit}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// --- EntityCard (lights & switches) ---
function EntityCard({
  entity,
  onToggle,
  isPending,
}: {
  entity: HomeAssistantEntity;
  onToggle: (entityId: string) => void;
  isPending: boolean;
}) {
  const isOn = entity.state === 'on';
  const isLight = entity.domain === 'light';
  const brightnessPercent = entity.brightness !== undefined
    ? Math.round((entity.brightness / 255) * 100)
    : undefined;

  const gradientOn = isLight
    ? 'from-amber-500/20 to-yellow-600/10 border-amber-500/30'
    : 'from-sky-500/20 to-teal-600/10 border-sky-500/30';
  const gradientOff = 'from-slate-800/50 to-slate-900/30 border-slate-700/50';

  return (
    <Card className={cn(
      'bg-gradient-to-br backdrop-blur-xl border transition-all duration-300',
      isOn ? gradientOn : gradientOff,
      'hover:shadow-xl hover:scale-[1.02]'
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex items-center justify-center h-10 w-10 rounded-lg border',
              isOn
                ? `bg-gradient-to-br ${isLight ? 'from-amber-500 to-yellow-600' : 'from-sky-500 to-teal-600'} border-transparent shadow-md`
                : 'bg-slate-800/80 border-slate-700/50'
            )}>
              {isLight
                ? <Lightbulb className={cn('h-5 w-5', isOn ? 'text-white' : 'text-slate-500')} />
                : <Plug className={cn('h-5 w-5', isOn ? 'text-white' : 'text-slate-500')} />
              }
            </div>
            <div className="min-w-0">
              <p className={cn(
                'text-sm font-medium truncate',
                isOn ? 'text-slate-100' : 'text-slate-400'
              )}>
                {entity.friendly_name}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] mt-1 border',
                  isOn
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                    : 'bg-slate-500/20 text-slate-400 border-slate-500/50'
                )}
              >
                {isOn ? 'Allumé' : 'Éteint'}
              </Badge>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-9 w-9 p-0 rounded-lg',
              isOn
                ? 'hover:bg-red-500/20 text-slate-300 hover:text-red-400'
                : 'hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400'
            )}
            onClick={() => onToggle(entity.entity_id)}
            disabled={isPending}
            title={isOn ? 'Éteindre' : 'Allumer'}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Brightness bar (lights only) */}
        {isLight && isOn && brightnessPercent !== undefined && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <Sun className="h-3 w-3" />
                Luminosité
              </span>
              <span className="font-mono text-slate-400">{brightnessPercent}%</span>
            </div>
            <Progress value={brightnessPercent} className="h-1.5" />
          </div>
        )}

        {/* Power consumption & monthly energy */}
        {(entity.power_consumption !== undefined || entity.monthly_energy !== undefined) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
            {entity.power_consumption !== undefined && entity.power_consumption > 0 && (
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" />
                <span className="font-mono">{entity.power_consumption.toFixed(1)} W</span>
              </span>
            )}
            {entity.monthly_energy !== undefined && entity.monthly_energy > 0 && (
              <span className="flex items-center gap-1">
                <BatteryCharging className="h-3 w-3 text-emerald-400" />
                <span className="font-mono">{entity.monthly_energy.toFixed(1)} kWh/mois</span>
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- AreaSection ---
function AreaSection({
  area,
  onToggle,
  pendingEntityId,
}: {
  area: HomeAssistantArea;
  onToggle: (entityId: string) => void;
  pendingEntityId: string | null;
}) {
  const controllable = area.entities.filter((e) => e.domain !== 'sensor');
  const onCount = controllable.filter((e) => e.state === 'on').length;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
        <MapPin className="h-4 w-4 text-sky-400" />
        {area.area_name}
        <span className="text-slate-600 font-normal normal-case">
          ({onCount}/{controllable.length} {onCount <= 1 ? 'actif' : 'actifs'})
        </span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {area.entities
          .sort((a, b) => {
            // lights first, then switches, then sensors
            const domainOrder = { light: 0, switch: 1, sensor: 2 };
            const orderA = domainOrder[a.domain] ?? 3;
            const orderB = domainOrder[b.domain] ?? 3;
            if (orderA !== orderB) return orderA - orderB;
            return a.friendly_name.localeCompare(b.friendly_name, 'fr');
          })
          .map((entity) =>
            entity.domain === 'sensor' ? (
              <TemperatureCard key={entity.entity_id} entity={entity} />
            ) : (
              <EntityCard
                key={entity.entity_id}
                entity={entity}
                onToggle={onToggle}
                isPending={pendingEntityId === entity.entity_id}
              />
            )
          )}
      </div>
    </section>
  );
}

// --- Loading Skeleton ---
function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
      {[...Array(3)].map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-5 w-32 bg-slate-800" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, j) => (
              <Card key={j} className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="h-10 w-10 rounded-lg bg-slate-800" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-24 bg-slate-800" />
                      <Skeleton className="h-4 w-12 bg-slate-800 rounded-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Page ---
export default function HomeAssistantPage() {
  const { data, isLoading, error } = useHomeAssistant();
  const haAction = useHomeAssistantAction();
  const [pendingEntityId, setPendingEntityId] = useState<string | null>(null);

  const handleToggle = (entityId: string) => {
    setPendingEntityId(entityId);
    haAction.mutate(
      { entity_id: entityId, action: 'toggle' },
      { onSettled: () => setPendingEntityId(null) },
    );
  };

  const summary = data?.data?.summary;
  const areas = data?.data?.areas || [];

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-teal-500/5 to-cyan-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-500/20 via-transparent to-transparent" />

        <div className="relative px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-sky-500 to-teal-600 shadow-lg shadow-sky-500/25">
                  <Home className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">Home Assistant</h1>
                  <p className="text-sm text-slate-400">Lumières & Prises connectées</p>
                </div>
              </div>
            </div>
            {summary && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 backdrop-blur-sm border border-slate-700/50">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-sm font-medium text-slate-300">
                    {summary.lightsOn + summary.switchesOn} actifs
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <span className="text-sm text-slate-500">
                  {summary.totalLights + summary.totalSwitches} total
                </span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <StatCard
                title="Lumières"
                value={`${summary.lightsOn}/${summary.totalLights}`}
                subtitle="allumées"
                icon={Lightbulb}
                color="from-amber-500 to-yellow-500"
              />
              <StatCard
                title="Prises"
                value={`${summary.switchesOn}/${summary.totalSwitches}`}
                subtitle="allumées"
                icon={Plug}
                color="from-sky-500 to-teal-500"
              />
              <StatCard
                title="Consommation"
                value={`${summary.totalPowerConsumption.toFixed(0)}W`}
                subtitle="puissance actuelle"
                icon={Zap}
                color="from-orange-500 to-amber-500"
              />
              <StatCard
                title="Énergie"
                value={`${summary.totalMonthlyEnergy.toFixed(1)} kWh`}
                subtitle="ce mois-ci"
                icon={BatteryCharging}
                color="from-emerald-500 to-teal-500"
              />
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-6 space-y-8">
        {isLoading && <LoadingSkeleton />}

        {error && (
          <Card className="bg-red-950/20 border-red-900/50">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-400">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-red-500/20">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium">Connexion échouée</p>
                  <p className="text-sm text-red-400/70">
                    Impossible de se connecter à Home Assistant : {error.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {data?.success && areas.length === 0 && (
          <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-slate-800/50 mx-auto mb-4">
                <Home className="h-8 w-8 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-300 mb-2">Aucune entité trouvée</h3>
              <p className="text-sm text-slate-500">
                Aucune lumière ou prise connectée n&apos;a été trouvée dans Home Assistant.
              </p>
            </CardContent>
          </Card>
        )}

        {data?.success && areas.map((area) => (
          <AreaSection
            key={area.area_id}
            area={area}
            onToggle={handleToggle}
            pendingEntityId={pendingEntityId}
          />
        ))}
      </div>
    </div>
  );
}
