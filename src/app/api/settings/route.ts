import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export interface QuickLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
}

export interface AppSettings {
  urls: {
    proxmox?: string;
    portainer?: string;
    jellyfin?: string;
    jellyseerr?: string;
    radarr?: string;
    sonarr?: string;
    qbittorrent?: string;
    homeassistant?: string;
    homarr?: string;
    uptimekuma?: string;
    nextcloud?: string;
    proxmoxAdmin?: string;
    updateDashboard?: string;
    pterodactyl?: string;
    nas?: string;
  };
  quickLinks?: QuickLink[];
}

// Default quick links
const defaultQuickLinks: QuickLink[] = [
  { id: '1', name: 'Proxmox', url: '', icon: 'Server', color: 'from-orange-500 to-amber-500' },
  { id: '2', name: 'Portainer', url: '', icon: 'Container', color: 'from-blue-500 to-cyan-500' },
  { id: '3', name: 'Jellyfin', url: '', icon: 'Tv', color: 'from-purple-500 to-pink-500' },
  { id: '4', name: 'Jellyseerr', url: '', icon: 'Search', color: 'from-indigo-500 to-purple-500' },
  { id: '5', name: 'Radarr', url: '', icon: 'Film', color: 'from-amber-500 to-orange-500' },
  { id: '6', name: 'Sonarr', url: '', icon: 'Tv2', color: 'from-cyan-500 to-blue-500' },
  { id: '7', name: 'qBittorrent', url: '', icon: 'Download', color: 'from-green-500 to-emerald-500' },
  { id: '8', name: 'Pterodactyl', url: '', icon: 'Gamepad2', color: 'from-emerald-500 to-teal-500' },
  { id: '9', name: 'NAS', url: '', icon: 'Database', color: 'from-teal-500 to-cyan-500' },
];

const defaultSettings: AppSettings = {
  urls: {},
  quickLinks: defaultQuickLinks,
};

async function ensureDataDir() {
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

async function loadSettings(): Promise<AppSettings> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(SETTINGS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      ...defaultSettings,
      ...parsed,
      quickLinks: parsed.quickLinks || defaultQuickLinks,
    };
  } catch {
    return defaultSettings;
  }
}

async function saveSettings(settings: AppSettings): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const settings = await loadSettings();

    // Merge URLs with environment variables as defaults
    const mergedUrls = {
      proxmox: settings.urls.proxmox || process.env.NEXT_PUBLIC_PROXMOX_HOST || '',
      portainer: settings.urls.portainer || process.env.NEXT_PUBLIC_PORTAINER_HOST || '',
      jellyfin: settings.urls.jellyfin || process.env.NEXT_PUBLIC_JELLYFIN_HOST || '',
      jellyseerr: settings.urls.jellyseerr || process.env.NEXT_PUBLIC_JELLYSEERR_HOST || '',
      radarr: settings.urls.radarr || process.env.NEXT_PUBLIC_RADARR_HOST || '',
      sonarr: settings.urls.sonarr || process.env.NEXT_PUBLIC_SONARR_HOST || '',
      qbittorrent: settings.urls.qbittorrent || process.env.NEXT_PUBLIC_QBITTORRENT_HOST || '',
      homeassistant: settings.urls.homeassistant || process.env.NEXT_PUBLIC_HOMEASSISTANT_HOST || '',
      homarr: settings.urls.homarr || process.env.NEXT_PUBLIC_HOMARR_HOST || '',
      uptimekuma: settings.urls.uptimekuma || process.env.NEXT_PUBLIC_UPTIME_KUMA_HOST || '',
      nextcloud: settings.urls.nextcloud || process.env.NEXT_PUBLIC_NEXTCLOUD_HOST || '',
      proxmoxAdmin: settings.urls.proxmoxAdmin || process.env.NEXT_PUBLIC_PROXMOX_ADMIN_HOST || '',
      updateDashboard: settings.urls.updateDashboard || process.env.NEXT_PUBLIC_UPDATE_DASHBOARD_HOST || '',
      pterodactyl: settings.urls.pterodactyl || process.env.NEXT_PUBLIC_PTERODACTYL_HOST || '',
      nas: settings.urls.nas || process.env.NEXT_PUBLIC_NAS_HOST || '',
    };

    // Merge quick links URLs with settings URLs
    const quickLinks = (settings.quickLinks || defaultQuickLinks).map(link => {
      const urlKey = link.name.toLowerCase().replace(/\s+/g, '') as keyof typeof mergedUrls;
      return {
        ...link,
        url: link.url || mergedUrls[urlKey] || '',
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        urls: mergedUrls,
        quickLinks,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load settings',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { urls, quickLinks } = body;

    // Load existing settings first to merge with new values
    const existingSettings = await loadSettings();

    // Helper: use new value if not empty, otherwise keep existing
    const mergeValue = (newVal: string | undefined, existingVal: string | undefined) => {
      if (newVal && newVal.trim() !== '') return newVal;
      return existingVal || undefined;
    };

    // Merge URLs if provided
    let mergedUrls = existingSettings.urls;
    if (urls && typeof urls === 'object') {
      mergedUrls = {
        proxmox: mergeValue(urls.proxmox, existingSettings.urls.proxmox),
        portainer: mergeValue(urls.portainer, existingSettings.urls.portainer),
        jellyfin: mergeValue(urls.jellyfin, existingSettings.urls.jellyfin),
        jellyseerr: mergeValue(urls.jellyseerr, existingSettings.urls.jellyseerr),
        radarr: mergeValue(urls.radarr, existingSettings.urls.radarr),
        sonarr: mergeValue(urls.sonarr, existingSettings.urls.sonarr),
        qbittorrent: mergeValue(urls.qbittorrent, existingSettings.urls.qbittorrent),
        homeassistant: mergeValue(urls.homeassistant, existingSettings.urls.homeassistant),
        homarr: mergeValue(urls.homarr, existingSettings.urls.homarr),
        uptimekuma: mergeValue(urls.uptimekuma, existingSettings.urls.uptimekuma),
        nextcloud: mergeValue(urls.nextcloud, existingSettings.urls.nextcloud),
        proxmoxAdmin: mergeValue(urls.proxmoxAdmin, existingSettings.urls.proxmoxAdmin),
        updateDashboard: mergeValue(urls.updateDashboard, existingSettings.urls.updateDashboard),
        pterodactyl: mergeValue(urls.pterodactyl, existingSettings.urls.pterodactyl),
        nas: mergeValue(urls.nas, existingSettings.urls.nas),
      };
    }

    // Use new quickLinks if provided, otherwise keep existing
    const mergedQuickLinks = quickLinks && Array.isArray(quickLinks)
      ? quickLinks
      : existingSettings.quickLinks || defaultQuickLinks;

    const settings: AppSettings = {
      urls: mergedUrls,
      quickLinks: mergedQuickLinks,
    };

    await saveSettings(settings);

    return NextResponse.json({
      success: true,
      data: settings,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Settings API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save settings',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
