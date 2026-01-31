import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

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
}

const defaultSettings: AppSettings = {
  urls: {},
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
    return { ...defaultSettings, ...JSON.parse(data) };
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

    // Merge with environment variables as defaults
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

    return NextResponse.json({
      success: true,
      data: { urls: mergedUrls },
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
    const { urls } = body;

    if (!urls || typeof urls !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          timestamp: Date.now(),
        },
        { status: 400 }
      );
    }

    const settings: AppSettings = {
      urls: {
        proxmox: urls.proxmox || undefined,
        portainer: urls.portainer || undefined,
        jellyfin: urls.jellyfin || undefined,
        jellyseerr: urls.jellyseerr || undefined,
        radarr: urls.radarr || undefined,
        sonarr: urls.sonarr || undefined,
        qbittorrent: urls.qbittorrent || undefined,
        homeassistant: urls.homeassistant || undefined,
        homarr: urls.homarr || undefined,
        uptimekuma: urls.uptimekuma || undefined,
        nextcloud: urls.nextcloud || undefined,
        proxmoxAdmin: urls.proxmoxAdmin || undefined,
        updateDashboard: urls.updateDashboard || undefined,
        pterodactyl: urls.pterodactyl || undefined,
        nas: urls.nas || undefined,
      },
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
