'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, ProxmoxData, DockerContainer, JellyfinData, PterodactylData, StorageData, JellyseerrData, QBittorrentData, UptimeKumaData, CalendarData, QBittorrentTransferInfo, TorrentAction, HomeAssistantData, HomeAssistantAction } from '@/types';
import { config } from '@/config/dashboard';

// ============================================
// CONTAINER ACTION TYPES
// ============================================
export type ContainerAction = 'start' | 'stop' | 'restart';
export type VMAction = 'start' | 'stop' | 'shutdown' | 'reboot';
export type VMType = 'qemu' | 'lxc';

// ============================================
// PROXMOX HOOK
// ============================================
export function useProxmox() {
  return useQuery<ApiResponse<ProxmoxData>>({
    queryKey: ['proxmox'],
    queryFn: async () => {
      const response = await fetch('/api/proxmox');
      if (!response.ok) throw new Error('Failed to fetch Proxmox data');
      return response.json();
    },
    refetchInterval: config.polling.proxmox,
  });
}

// ============================================
// DOCKER HOOK
// ============================================
export function useDocker() {
  return useQuery<ApiResponse<{ containers: DockerContainer[] }>>({
    queryKey: ['docker'],
    queryFn: async () => {
      const response = await fetch('/api/docker');
      if (!response.ok) throw new Error('Failed to fetch Docker data');
      return response.json();
    },
    refetchInterval: config.polling.docker,
  });
}

// ============================================
// JELLYFIN HOOK
// ============================================
export function useJellyfin() {
  return useQuery<ApiResponse<JellyfinData>>({
    queryKey: ['jellyfin'],
    queryFn: async () => {
      const response = await fetch('/api/jellyfin');
      if (!response.ok) throw new Error('Failed to fetch Jellyfin data');
      return response.json();
    },
    refetchInterval: config.polling.jellyfin,
  });
}

// ============================================
// PTERODACTYL HOOK
// ============================================
export function usePterodactyl() {
  return useQuery<ApiResponse<PterodactylData>>({
    queryKey: ['pterodactyl'],
    queryFn: async () => {
      const response = await fetch('/api/pterodactyl');
      if (!response.ok) throw new Error('Failed to fetch Pterodactyl data');
      return response.json();
    },
    refetchInterval: config.polling.pterodactyl,
  });
}

// ============================================
// STORAGE HOOK
// ============================================
export function useStorage() {
  return useQuery<ApiResponse<StorageData>>({
    queryKey: ['storage'],
    queryFn: async () => {
      const response = await fetch('/api/storage');
      if (!response.ok) throw new Error('Failed to fetch Storage data');
      return response.json();
    },
    refetchInterval: config.polling.storage,
  });
}

// ============================================
// JELLYSEERR HOOK
// ============================================
export function useJellyseerr() {
  return useQuery<ApiResponse<JellyseerrData>>({
    queryKey: ['jellyseerr'],
    queryFn: async () => {
      const response = await fetch('/api/jellyseerr');
      if (!response.ok) throw new Error('Failed to fetch Jellyseerr data');
      return response.json();
    },
    refetchInterval: config.polling.jellyfin, // Use same polling as Jellyfin
  });
}

// ============================================
// QBITTORRENT HOOK
// ============================================
export function useQBittorrent() {
  return useQuery<ApiResponse<QBittorrentData>>({
    queryKey: ['qbittorrent'],
    queryFn: async () => {
      const response = await fetch('/api/qbittorrent');
      if (!response.ok) throw new Error('Failed to fetch qBittorrent data');
      return response.json();
    },
    refetchInterval: config.polling.docker, // Use same polling as Docker
  });
}

// ============================================
// UPTIME KUMA HOOK
// ============================================
export function useUptimeKuma() {
  return useQuery<ApiResponse<UptimeKumaData>>({
    queryKey: ['uptime-kuma'],
    queryFn: async () => {
      const response = await fetch('/api/uptime-kuma');
      if (!response.ok) throw new Error('Failed to fetch Uptime Kuma data');
      return response.json();
    },
    refetchInterval: config.polling.default,
  });
}

// ============================================
// DOCKER CONTAINER ACTIONS MUTATION
// ============================================
export function useDockerAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ containerId, action }: { containerId: string; action: ContainerAction }) => {
      const response = await fetch('/api/docker/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ containerId, action }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Action failed');
      return data;
    },
    onSuccess: () => {
      // Invalidate docker query to refresh data
      queryClient.invalidateQueries({ queryKey: ['docker'] });
    },
  });
}

// ============================================
// PROXMOX VM ACTIONS MUTATION
// ============================================
export function useProxmoxAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      node,
      vmid,
      type,
      action,
    }: {
      node: string;
      vmid: number;
      type: VMType;
      action: VMAction;
    }) => {
      const response = await fetch('/api/proxmox/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ node, vmid, type, action }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Action failed');
      return data;
    },
    onSuccess: () => {
      // Invalidate proxmox query to refresh data
      queryClient.invalidateQueries({ queryKey: ['proxmox'] });
    },
  });
}

// ============================================
// CALENDAR HOOK (Sonarr/Radarr)
// ============================================
export function useCalendar() {
  return useQuery<ApiResponse<CalendarData>>({
    queryKey: ['calendar'],
    queryFn: async () => {
      const response = await fetch('/api/calendar');
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      return response.json();
    },
    refetchInterval: config.polling.calendar,
  });
}

// ============================================
// QBITTORRENT TRANSFER HOOK
// ============================================
export function useQBittorrentTransfer() {
  return useQuery<ApiResponse<QBittorrentTransferInfo>>({
    queryKey: ['qbittorrent-transfer'],
    queryFn: async () => {
      const response = await fetch('/api/qbittorrent/transfer');
      if (!response.ok) throw new Error('Failed to fetch transfer info');
      return response.json();
    },
    refetchInterval: config.polling.docker,
  });
}

// ============================================
// QBITTORRENT ALL TORRENTS HOOK
// ============================================
export function useQBittorrentAll() {
  return useQuery<ApiResponse<QBittorrentData>>({
    queryKey: ['qbittorrent-all'],
    queryFn: async () => {
      const response = await fetch('/api/qbittorrent?all=true');
      if (!response.ok) throw new Error('Failed to fetch qBittorrent data');
      return response.json();
    },
    refetchInterval: config.polling.docker,
  });
}

// ============================================
// QBITTORRENT ACTION MUTATION
// ============================================
export function useQBittorrentAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, hash }: { action: TorrentAction; hash: string }) => {
      const response = await fetch('/api/qbittorrent/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, hash }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Action failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['qbittorrent'] });
      queryClient.invalidateQueries({ queryKey: ['qbittorrent-all'] });
      queryClient.invalidateQueries({ queryKey: ['qbittorrent-transfer'] });
    },
  });
}

// ============================================
// DOCKER LOGS HOOK
// ============================================
export function useDockerLogs(containerId: string, tail: number = 100, enabled: boolean = false) {
  return useQuery<ApiResponse<{ logs: string; containerId: string; containerName: string }>>({
    queryKey: ['docker-logs', containerId, tail],
    queryFn: async () => {
      const response = await fetch(`/api/docker/logs?containerId=${containerId}&tail=${tail}`);
      if (!response.ok) throw new Error('Failed to fetch container logs');
      return response.json();
    },
    enabled,
    refetchInterval: false,
  });
}

// ============================================
// METRICS HISTORY HOOK
// ============================================
export type MetricsRange = '1h' | '6h' | '24h' | '7d';

interface MetricsPoint {
  timestamp: number;
  cpu_percent: number;
  ram_percent: number;
}

interface MetricsData {
  nodeId: string;
  range: string;
  points: MetricsPoint[];
}

export function useMetricsHistory(range: MetricsRange, nodeId?: string) {
  const refreshIntervals: Record<MetricsRange, number> = {
    '1h': 30000,
    '6h': 60000,
    '24h': 120000,
    '7d': 300000,
  };

  return useQuery<ApiResponse<MetricsData>>({
    queryKey: ['metrics-history', range, nodeId],
    queryFn: async () => {
      const params = new URLSearchParams({ range });
      if (nodeId) params.set('node', nodeId);
      const response = await fetch(`/api/metrics?${params}`);
      if (!response.ok) throw new Error('Failed to fetch metrics history');
      return response.json();
    },
    refetchInterval: refreshIntervals[range],
  });
}

// ============================================
// HOME ASSISTANT HOOK
// ============================================
export function useHomeAssistant() {
  return useQuery<ApiResponse<HomeAssistantData>>({
    queryKey: ['homeassistant'],
    queryFn: async () => {
      const response = await fetch('/api/homeassistant');
      if (!response.ok) throw new Error('Failed to fetch Home Assistant data');
      return response.json();
    },
    refetchInterval: config.polling.homeassistant,
  });
}

// ============================================
// HOME ASSISTANT ACTION MUTATION
// ============================================
export function useHomeAssistantAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entity_id,
      action,
      brightness,
    }: {
      entity_id: string;
      action: HomeAssistantAction;
      brightness?: number;
    }) => {
      const response = await fetch('/api/homeassistant/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id, action, brightness }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Action failed');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homeassistant'] });
    },
  });
}
