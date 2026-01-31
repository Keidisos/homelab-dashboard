'use client';

import { useQuery } from '@tanstack/react-query';

export interface AppUrls {
  proxmox: string;
  portainer: string;
  jellyfin: string;
  jellyseerr: string;
  radarr: string;
  sonarr: string;
  qbittorrent: string;
  homeassistant: string;
  homarr: string;
  uptimekuma: string;
  nextcloud: string;
  proxmoxAdmin: string;
  updateDashboard: string;
  pterodactyl: string;
  nas: string;
}

interface SettingsResponse {
  success: boolean;
  data?: {
    urls: AppUrls;
  };
  error?: string;
}

export function useSettings() {
  return useQuery<SettingsResponse>({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useAppUrls(): AppUrls | null {
  const { data } = useSettings();
  return data?.data?.urls || null;
}
