// Configuration centralisée du dashboard

export const config = {
  // Intervalles de polling (en ms)
  polling: {
    default: parseInt(process.env.NEXT_PUBLIC_POLLING_INTERVAL || '30000'),
    proxmox: 15000,
    docker: 30000,
    jellyfin: 10000,
    pterodactyl: 20000,
    storage: 60000,
  },

  // Services disponibles
  services: {
    proxmox: {
      name: 'Proxmox VE',
      icon: 'Server',
      color: 'orange',
    },
    docker: {
      name: 'Docker',
      icon: 'Container',
      color: 'blue',
    },
    jellyfin: {
      name: 'Jellyfin',
      icon: 'Tv',
      color: 'purple',
    },
    pterodactyl: {
      name: 'Pterodactyl',
      icon: 'Gamepad2',
      color: 'green',
    },
    storage: {
      name: 'NAS Storage',
      icon: 'HardDrive',
      color: 'cyan',
    },
  },

  // Mapping des containers Docker aux services
  dockerServices: [
    { name: 'radarr', displayName: 'Radarr', icon: 'Film' },
    { name: 'sonarr', displayName: 'Sonarr', icon: 'Tv2' },
    { name: 'qbittorrent', displayName: 'qBittorrent', icon: 'Download' },
    { name: 'jellyseerr', displayName: 'Jellyseerr', icon: 'Search' },
  ],
} as const;

export type ServiceKey = keyof typeof config.services;
