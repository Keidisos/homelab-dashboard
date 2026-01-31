'use client';

import { Server, Cpu, MemoryStick, Clock, Box, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useProxmox } from '@/hooks/use-services';
import { cn } from '@/lib/utils';
import type { ProxmoxNode, ProxmoxVM } from '@/types';

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
        {/* CPU */}
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

        {/* Memory */}
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

        {/* Uptime */}
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

function VMCard({ vm }: { vm: ProxmoxVM }) {
  const cpuPercent = vm.cpu * 100;
  const memPercent = vm.maxmem > 0 ? (vm.mem / vm.maxmem) * 100 : 0;
  const isRunning = vm.status === 'running';

  return (
    <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex items-center justify-center h-10 w-10 rounded-lg border',
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
            <div>
              <CardTitle className="text-base font-semibold text-slate-100">
                {vm.name}
              </CardTitle>
              <p className="text-xs text-slate-500">
                {vm.type === 'lxc' ? 'LXC Container' : 'Virtual Machine'} • ID: {vm.vmid}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'font-mono text-xs border',
              isRunning
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                : 'bg-slate-500/20 text-slate-400 border-slate-500/50'
            )}
          >
            {vm.status}
          </Badge>
        </div>
      </CardHeader>
      {isRunning && (
        <CardContent className="space-y-3">
          {/* CPU */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">CPU</span>
              <span className="font-mono text-slate-400">{cpuPercent.toFixed(1)}%</span>
            </div>
            <Progress value={cpuPercent} className="h-1.5" />
          </div>

          {/* Memory */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Memory</span>
              <span className="font-mono text-slate-400">
                {formatBytes(vm.mem)} / {formatBytes(vm.maxmem)}
              </span>
            </div>
            <Progress value={memPercent} className="h-1.5" />
          </div>

          {/* Uptime */}
          {vm.uptime && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500">Uptime</span>
              <span className="font-mono text-slate-400">{formatUptime(vm.uptime)}</span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <Skeleton className="h-12 w-12 rounded-lg bg-slate-800" />
              <Skeleton className="h-4 w-32 bg-slate-800 mt-2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-2 w-full bg-slate-800" />
              <Skeleton className="h-2 w-full bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ProxmoxPage() {
  const { data, isLoading, error } = useProxmox();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center gap-4 h-14 px-6">
          <Server className="h-6 w-6 text-orange-400" />
          <div>
            <h1 className="text-lg font-semibold text-slate-100">Proxmox VE</h1>
            <p className="text-xs text-slate-500">Virtualization Platform</p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {isLoading && <LoadingSkeleton />}

        {error && (
          <div className="bg-red-950/20 border border-red-900/50 rounded-lg p-4 text-red-400 text-sm">
            Failed to connect to Proxmox: {error.message}
          </div>
        )}

        {data?.success && data.data && (
          <>
            {/* Nodes Section */}
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Nodes ({data.data.nodes.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.data.nodes.map((node) => (
                  <NodeCard key={node.node} node={node} />
                ))}
              </div>
            </section>

            {/* VMs Section */}
            <section className="space-y-4">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
                Virtual Machines & Containers ({data.data.vms.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {data.data.vms
                  .sort((a, b) => (a.status === 'running' ? -1 : 1) - (b.status === 'running' ? -1 : 1))
                  .map((vm) => (
                    <VMCard key={`${vm.type}-${vm.vmid}`} vm={vm} />
                  ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
