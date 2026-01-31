'use client';

import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, ProxmoxData, DockerContainer, JellyfinData, PterodactylData, StorageData, JellyseerrData, QBittorrentData, DashdotData } from '@/types';
import { config } from '@/config/dashboard';

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
// DASHDOT HOOK
// ============================================
export function useDashdot() {
  return useQuery<ApiResponse<DashdotData>>({
    queryKey: ['dashdot'],
    queryFn: async () => {
      const response = await fetch('/api/dashdot');
      if (!response.ok) throw new Error('Failed to fetch Dashdot data');
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds for real-time graphs
  });
}
