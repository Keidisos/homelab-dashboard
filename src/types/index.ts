// Types pour le dashboard Homelab

// ============================================
// SERVICE STATUS
// ============================================
export type ServiceStatus = 'online' | 'offline' | 'warning' | 'unknown';

export interface ServiceMetric {
  label: string;
  value: number;
  max: number;
  unit: string;
  color?: 'default' | 'success' | 'warning' | 'danger';
}

export interface ServiceData {
  id: string;
  name: string;
  status: ServiceStatus;
  description?: string;
  metrics?: ServiceMetric[];
  externalUrl?: string;
  icon?: string;
  lastUpdated?: Date;
}

// ============================================
// PROXMOX TYPES
// ============================================
export interface ProxmoxNode {
  node: string;
  status: 'online' | 'offline';
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  uptime: number;
}

export interface ProxmoxVM {
  vmid: number;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  type: 'qemu' | 'lxc';
  cpu: number;
  maxcpu: number;
  mem: number;
  maxmem: number;
  uptime?: number;
  netin?: number;
  netout?: number;
}

export interface ProxmoxData {
  nodes: ProxmoxNode[];
  vms: ProxmoxVM[];
}

// ============================================
// DOCKER / PORTAINER TYPES
// ============================================
export interface DockerContainer {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'paused' | 'restarting';
  image: string;
  created: string;
  state: string;
}

export interface PortainerEndpoint {
  id: number;
  name: string;
  status: number;
  containers: DockerContainer[];
}

// ============================================
// JELLYFIN TYPES
// ============================================
export interface JellyfinSession {
  id: string;
  userName: string;
  client: string;
  deviceName: string;
  nowPlayingItem?: {
    name: string;
    seriesName?: string;
    type: string;
  };
  playState?: {
    isPaused: boolean;
    positionTicks: number;
  };
}

export interface JellyfinData {
  activeSessions: number;
  sessions: JellyfinSession[];
}

// ============================================
// PTERODACTYL TYPES
// ============================================
export interface PterodactylServer {
  id: string;
  name: string;
  status: 'running' | 'starting' | 'stopping' | 'offline';
  memory: {
    current: number;
    limit: number;
  };
  cpu: {
    current: number;
    limit: number;
  };
  disk: {
    current: number;
    limit: number;
  };
}

export interface PterodactylData {
  servers: PterodactylServer[];
}

// ============================================
// STORAGE (UGREEN NAS) TYPES
// ============================================
export interface StorageVolume {
  name: string;
  path: string;
  total: number;
  used: number;
  available: number;
  usagePercent: number;
}

export interface StorageData {
  volumes: StorageVolume[];
  health: 'healthy' | 'degraded' | 'failed';
}

// ============================================
// JELLYSEERR TYPES
// ============================================
export interface JellyseerrRequest {
  id: number;
  type: 'movie' | 'tv';
  status: number;
  mediaStatus: number;
  media: {
    id: number;
    tmdbId: number;
    tvdbId?: number;
    mediaType: string;
    status: number;
  };
  requestedBy: {
    id: number;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  title?: string;
  posterPath?: string;
}

export interface JellyseerrData {
  requests: JellyseerrRequest[];
  statusLabels: Record<number, string>;
}

// ============================================
// QBITTORRENT TYPES
// ============================================
export interface QBittorrentTorrent {
  hash: string;
  name: string;
  size: number;
  progress: number;
  dlspeed: number;
  upspeed: number;
  state: string;
  eta: number;
  category: string;
  added_on: number;
}

export interface QBittorrentData {
  torrents: QBittorrentTorrent[];
}

// ============================================
// DASHDOT TYPES
// ============================================
export interface DashdotData {
  cpu: {
    brand: string;
    model: string;
    cores: number;
    threads: number;
    frequency: number;
  };
  ram: {
    total: number;
    used: number;
  };
  storage: {
    total: number;
    used: number;
  };
  network: {
    speedUp: number;
    speedDown: number;
  };
  gpu?: {
    brand: string;
    model: string;
  };
  os: {
    platform: string;
    distro: string;
    release: string;
    uptime: number;
  };
  temps: {
    cpu: number;
    gpu?: number;
  };
  cpuHistory: number[];
  ramHistory: number[];
  tempHistory: number[];
}

// ============================================
// API RESPONSE WRAPPER
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
