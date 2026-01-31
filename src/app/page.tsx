'use client';

import { useEffect, useState } from 'react';
import {
  Server,
  Container,
  Tv,
  Gamepad2,
  HardDrive,
  Film,
  Tv2,
  Download,
  Search,
  ExternalLink,
  Database,
  Cpu,
  MemoryStick,
  Activity,
  Play,
  Box,
  Monitor,
  Users,
  Clock,
  ArrowUpRight,
  Zap,
  Home,
  Cloud,
  Wifi,
  Shield,
  Settings,
  Globe,
  Mail,
  Music,
  Camera,
  Folder,
  Terminal,
  Code,
  BookOpen,
  MessageSquare,
  Bell,
  Calendar,
  Image,
  Link,
  Star,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useProxmox, useDocker, useJellyfin, usePterodactyl } from '@/hooks/use-services';
import { useQuickLinks } from '@/hooks/use-settings';
import type { LucideIcon } from 'lucide-react';
import type { QuickLink } from '@/hooks/use-settings';

// Icon mapping for dynamic icons
const iconMap: Record<string, LucideIcon> = {
  Server,
  Container,
  Tv,
  Gamepad2,
  HardDrive,
  Film,
  Tv2,
  Download,
  Search,
  Database,
  Home,
  Cloud,
  Wifi,
  Shield,
  Settings,
  Globe,
  Mail,
  Music,
  Camera,
  Folder,
  Terminal,
  Code,
  BookOpen,
  MessageSquare,
  Bell,
  Calendar,
  Image,
  Link,
  Star,
  Monitor,
  Users,
  Play,
  Box,
  Activity,
  Cpu,
  MemoryStick,
  Clock,
  Zap,
};

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(0)} MB`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}j ${hours}h`;
  return `${hours}h`;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden relative group">
      <div className={cn('absolute inset-0 opacity-5 bg-gradient-to-br', color)} />
      <CardContent className="p-5 relative">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
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
        {trend && (
          <div className={cn(
            'absolute bottom-0 left-0 right-0 h-1',
            trend === 'up' ? 'bg-emerald-500' : trend === 'down' ? 'bg-red-500' : 'bg-slate-600'
          )} />
        )}
      </CardContent>
    </Card>
  );
}

function QuickLinkCard({ link }: { link: QuickLink }) {
  const Icon = iconMap[link.icon] || Server;

  if (!link.url) return null;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group"
    >
      <div className={cn(
        'relative flex flex-col items-center justify-center p-4 rounded-2xl',
        'bg-slate-900/40 backdrop-blur-xl border border-slate-700/50',
        'transition-all duration-300 ease-out',
        'hover:bg-slate-800/60 hover:border-slate-600/50',
        'hover:shadow-xl hover:shadow-black/20',
        'hover:-translate-y-1 hover:scale-105'
      )}>
        <div className={cn(
          'flex items-center justify-center h-12 w-12 rounded-xl mb-3',
          'bg-gradient-to-br shadow-lg transition-transform duration-300',
          'group-hover:scale-110 group-hover:rotate-3',
          link.color
        )}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
          {link.name}
        </span>
        <ExternalLink className="absolute top-3 right-3 h-3 w-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </a>
  );
}

function SystemOverview() {
  const { data: proxmoxData } = useProxmox();
  const { data: dockerData } = useDocker();
  const { data: jellyfinData } = useJellyfin();
  const { data: pterodactylData } = usePterodactyl();

  const node = proxmoxData?.data?.nodes?.[0];
  const cpuPercent = node ? node.cpu * 100 : 0;
  const ramPercent = node ? (node.mem / node.maxmem) * 100 : 0;
  const uptime = node?.uptime || 0;

  const vms = proxmoxData?.data?.vms || [];
  const runningVms = vms.filter(vm => vm.status === 'running' && vm.type === 'qemu').length;
  const runningLxc = vms.filter(vm => vm.status === 'running' && vm.type === 'lxc').length;

  const containers = dockerData?.data?.containers || [];
  const runningContainers = containers.filter(c => c.status === 'running').length;

  const activeSessions = jellyfinData?.data?.activeSessions || 0;
  const gameServers = pterodactylData?.data?.servers || [];
  const runningServers = gameServers.filter(s => s.status === 'running').length;

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          System Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resource Usage */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Cpu className="h-4 w-4 text-orange-400" />
                <span>CPU</span>
              </div>
              <span className="font-mono text-slate-200 font-semibold">{cpuPercent.toFixed(0)}%</span>
            </div>
            <Progress value={cpuPercent} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <MemoryStick className="h-4 w-4 text-blue-400" />
                <span>RAM</span>
              </div>
              <span className="font-mono text-slate-200 font-semibold">{ramPercent.toFixed(0)}%</span>
            </div>
            <Progress value={ramPercent} className="h-2" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-purple-500/20">
              <Monitor className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-100">{runningVms}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">VMs</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-blue-500/20">
              <Box className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-100">{runningLxc}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">LXC</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-cyan-500/20">
              <Container className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-100">{runningContainers}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Docker</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/20">
              <Clock className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-100">{formatUptime(uptime)}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Uptime</p>
            </div>
          </div>
        </div>

        {/* Active Services */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-500/20">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">Jellyfin Streams</p>
              <p className="text-xs text-slate-500">{activeSessions} active session{activeSessions !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {activeSessions > 0 && (
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Play className="h-3 w-3 mr-1" />
              Live
            </Badge>
          )}
        </div>

        {runningServers > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-emerald-500/20">
                <Gamepad2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">Game Servers</p>
                <p className="text-xs text-slate-500">{runningServers} server{runningServers !== 1 ? 's' : ''} online</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              <Zap className="h-3 w-3 mr-1" />
              Active
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CurrentTime() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) {
    return (
      <div className="text-right">
        <p className="text-4xl font-bold text-slate-100 font-mono tracking-tight">--:--</p>
        <p className="text-sm text-slate-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="text-right">
      <p className="text-4xl font-bold text-slate-100 font-mono tracking-tight">
        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-sm text-slate-500">
        {time.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const { data: proxmoxData } = useProxmox();
  const { data: dockerData } = useDocker();
  const quickLinks = useQuickLinks();

  const node = proxmoxData?.data?.nodes?.[0];
  const totalRam = node ? node.maxmem : 0;
  const usedRam = node ? node.mem : 0;

  const containers = dockerData?.data?.containers || [];
  const runningContainers = containers.filter(c => c.status === 'running').length;

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-pink-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />

        <div className="relative px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">HomeLab Dashboard</h1>
                  <p className="text-sm text-slate-400">Infrastructure & Services</p>
                </div>
              </div>
            </div>
            <CurrentTime />
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <StatCard
              title="Server Status"
              value={node?.status === 'online' ? 'Online' : 'Offline'}
              subtitle={node?.node || 'Proxmox'}
              icon={Server}
              trend={node?.status === 'online' ? 'up' : 'down'}
              color="from-orange-500 to-amber-500"
            />
            <StatCard
              title="Memory Usage"
              value={formatBytes(usedRam)}
              subtitle={`of ${formatBytes(totalRam)}`}
              icon={MemoryStick}
              color="from-blue-500 to-cyan-500"
            />
            <StatCard
              title="Docker Containers"
              value={runningContainers}
              subtitle={`${containers.length} total`}
              icon={Container}
              color="from-cyan-500 to-teal-500"
            />
            <StatCard
              title="Virtualization"
              value={(proxmoxData?.data?.vms?.filter(vm => vm.status === 'running').length) || 0}
              subtitle="VMs & LXC running"
              icon={Monitor}
              color="from-purple-500 to-pink-500"
            />
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Overview - Takes 2 columns */}
          <div className="lg:col-span-2">
            <SystemOverview />
          </div>

          {/* Quick Access */}
          <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                Quick Access
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {quickLinks.filter(link => link.url).map((link) => (
                  <QuickLinkCard key={link.id} link={link} />
                ))}
              </div>
              {quickLinks.filter(link => link.url).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  Configure quick links in Settings
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
