'use client';

import { useState } from 'react';
import { Server, Cpu, MemoryStick, Clock, Box, Monitor, Activity, Play, StopCircle, RotateCw, Power, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useProxmox, useProxmoxAction, useMetricsHistory, type VMAction, type VMType, type MetricsRange } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { ProxmoxNode, ProxmoxVM } from '@/types';
import {
  ResponsiveContainer,
  Area,
  AreaChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

const RANGE_OPTIONS: { value: MetricsRange; label: string }[] = [
  { value: '1h', label: '1H' },
  { value: '6h', label: '6H' },
  { value: '24h', label: '24H' },
  { value: '7d', label: '7D' },
];

function formatTimeLabel(timestamp: number, range: MetricsRange): string {
  const date = new Date(timestamp);
  if (range === '7d') {
    return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });
  }
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function HistoryChart({ nodeId }: { nodeId?: string }) {
  const [range, setRange] = useState<MetricsRange>('1h');
  const { data, isLoading } = useMetricsHistory(range, nodeId);

  const points = data?.data?.points || [];
  const chartData = points.map(p => ({
    time: p.timestamp,
    cpu: p.cpu_percent,
    ram: p.ram_percent,
    label: formatTimeLabel(p.timestamp, range),
  }));

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            Performance History
          </CardTitle>
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-lg p-0.5">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRange(opt.value)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all',
                  range === opt.value
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[250px] flex items-center justify-center">
            <p className="text-sm text-slate-500">No data yet — metrics are recorded every ~30s</p>
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fb923c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fb923c" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                  minTickGap={50}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value, name) => [
                    `${Number(value).toFixed(1)}%`,
                    name === 'cpu' ? 'CPU' : 'RAM',
                  ]}
                  labelFormatter={(label) => String(label)}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#fb923c"
                  strokeWidth={2}
                  fill="url(#cpuGrad)"
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="ram"
                  stroke="#60a5fa"
                  strokeWidth={2}
                  fill="url(#ramGrad)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-orange-400 rounded" />
            <span className="text-xs text-slate-400">CPU</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-400 rounded" />
            <span className="text-xs text-slate-400">RAM</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function NodeCard({ node }: { node: ProxmoxNode }) {
  const cpuPercent = node.cpu * 100;
  const memPercent = (node.mem / node.maxmem) * 100;

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30">
              <Server className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-100">
                {node.node}
              </CardTitle>
              <p className="text-xs text-slate-500">Proxmox Node</p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'font-mono text-xs border',
              node.status === 'online'
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-red-500/20 text-red-400 border-red-500/50'
            )}
          >
            {node.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <Cpu className="h-4 w-4" />
              <span>CPU</span>
            </div>
            <span className="font-mono text-slate-300">{cpuPercent.toFixed(1)}%</span>
          </div>
          <Progress value={cpuPercent} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-slate-400">
              <MemoryStick className="h-4 w-4" />
              <span>Memory</span>
            </div>
            <span className="font-mono text-slate-300">
              {formatBytes(node.mem)} / {formatBytes(node.maxmem)}
            </span>
          </div>
          <Progress value={memPercent} className="h-2" />
        </div>

        <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="h-4 w-4" />
            <span>Uptime</span>
          </div>
          <span className="font-mono text-slate-300">{formatUptime(node.uptime)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function VMListItem({ vm, nodeName, onAction, isActionPending }: {
  vm: ProxmoxVM;
  nodeName: string;
  onAction: (node: string, vmid: number, type: VMType, action: VMAction) => void;
  isActionPending: boolean;
}) {
  const cpuPercent = vm.cpu * 100;
  const memPercent = vm.maxmem > 0 ? (vm.mem / vm.maxmem) * 100 : 0;
  const isRunning = vm.status === 'running';

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
      <div
        className={cn(
          'flex items-center justify-center h-10 w-10 rounded-lg border shrink-0',
          vm.type === 'lxc'
            ? 'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border-blue-500/30'
            : 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-purple-500/30'
        )}
      >
        {vm.type === 'lxc' ? (
          <Box className="h-5 w-5 text-blue-400" />
        ) : (
          <Monitor className="h-5 w-5 text-purple-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-100 truncate">{vm.name}</span>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] px-1.5 py-0 border shrink-0',
              isRunning
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/50'
            )}
          >
            {vm.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className={vm.type === 'lxc' ? 'text-blue-400' : 'text-purple-400'}>
            {vm.type === 'lxc' ? 'LXC' : 'VM'}
          </span>
          <span>•</span>
          <span>ID: {vm.vmid}</span>
          {isRunning && vm.uptime && (
            <>
              <span>•</span>
              <span>{formatUptime(vm.uptime)}</span>
            </>
          )}
        </div>
      </div>

      {isRunning && (
        <div className="flex items-center gap-4 text-xs shrink-0">
          <div className="text-right">
            <div className="text-slate-500">CPU</div>
            <div className="font-mono text-slate-300">{cpuPercent.toFixed(0)}%</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500">RAM</div>
            <div className="font-mono text-slate-300">{memPercent.toFixed(0)}%</div>
          </div>
        </div>
      )}

      {/* Action Buttons - Inline */}
      <div className="flex items-center gap-1 shrink-0">
        {isActionPending ? (
          <div className="w-24 flex justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : isRunning ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-amber-500/20 text-slate-400 hover:text-amber-400"
              onClick={() => onAction(nodeName, vm.vmid, vm.type, 'shutdown')}
              title="Shutdown"
            >
              <Power className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
              onClick={() => onAction(nodeName, vm.vmid, vm.type, 'stop')}
              title="Stop"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400"
              onClick={() => onAction(nodeName, vm.vmid, vm.type, 'reboot')}
              title="Reboot"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400"
            onClick={() => onAction(nodeName, vm.vmid, vm.type, 'start')}
            title="Start"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-4">
              <Skeleton className="h-8 w-24 bg-slate-800 mb-3" />
              <Skeleton className="h-16 w-full bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ProxmoxPage() {
  const { data: proxmoxData, isLoading: proxmoxLoading, error: proxmoxError } = useProxmox();
  const proxmoxAction = useProxmoxAction();

  const [pendingVmId, setPendingVmId] = useState<string | null>(null);

  const handleAction = (node: string, vmid: number, type: VMType, action: VMAction) => {
    setPendingVmId(`${type}-${vmid}`);
    proxmoxAction.mutate(
      { node, vmid, type, action },
      {
        onSettled: () => setPendingVmId(null),
      }
    );
  };

  const vms = proxmoxData?.data?.vms || [];
  const runningVms = vms.filter(vm => vm.status === 'running' && vm.type === 'qemu');
  const runningContainers = vms.filter(vm => vm.status === 'running' && vm.type === 'lxc');
  const nodeName = proxmoxData?.data?.nodes?.[0]?.node || 'pve';

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center gap-4 h-14 px-6">
          <Server className="h-6 w-6 text-orange-400" />
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Proxmox VE</h1>
            <p className="text-xs text-slate-500">Virtualization Platform</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              <Monitor className="h-3 w-3 mr-1" />
              {runningVms.length} VMs
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              <Box className="h-3 w-3 mr-1" />
              {runningContainers.length} LXC
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {proxmoxLoading && <LoadingSkeleton />}

        {proxmoxError && (
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
            Failed to connect to Proxmox: {proxmoxError.message}
          </div>
        )}

        {proxmoxData?.success && proxmoxData.data && (
          <>
            {/* Node Cards */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {proxmoxData.data.nodes.map((node) => (
                <NodeCard key={node.node} node={node} />
              ))}
            </section>

            {/* Performance History Chart */}
            <section>
              <HistoryChart nodeId={nodeName} />
            </section>

            {/* VMs & Containers List */}
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-400" />
                Virtual Machines & Containers ({vms.length})
              </h2>
              <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
                <CardContent className="p-2 max-h-96 overflow-y-auto">
                  <div className="divide-y divide-slate-800/50">
                    {vms
                      .sort((a, b) => {
                        // Sort: running first, then by type (VMs before LXC), then by name
                        if (a.status !== b.status) return a.status === 'running' ? -1 : 1;
                        if (a.type !== b.type) return a.type === 'qemu' ? -1 : 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((vm) => (
                        <VMListItem
                          key={`${vm.type}-${vm.vmid}`}
                          vm={vm}
                          nodeName={nodeName}
                          onAction={handleAction}
                          isActionPending={pendingVmId === `${vm.type}-${vm.vmid}`}
                        />
                      ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
