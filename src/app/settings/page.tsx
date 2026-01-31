'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  ExternalLink,
  Server,
  Container,
  Tv,
  Film,
  Tv2,
  Download,
  Search,
  Home,
  LayoutDashboard,
  Gauge,
  Cloud,
  RefreshCw,
  Gamepad2,
  HardDrive,
  Check,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface UrlConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  placeholder: string;
  category: 'infrastructure' | 'media' | 'home' | 'apps' | 'gaming';
}

const urlConfigs: UrlConfig[] = [
  // Infrastructure
  { key: 'proxmox', label: 'Proxmox VE', icon: Server, color: 'from-orange-500 to-amber-500', placeholder: 'https://192.168.1.1:8006', category: 'infrastructure' },
  { key: 'portainer', label: 'Portainer', icon: Container, color: 'from-blue-500 to-cyan-500', placeholder: 'https://192.168.1.1:9443', category: 'infrastructure' },
  { key: 'nas', label: 'NAS', icon: HardDrive, color: 'from-teal-500 to-cyan-500', placeholder: 'http://192.168.1.1:9999', category: 'infrastructure' },

  // Media
  { key: 'jellyfin', label: 'Jellyfin', icon: Tv, color: 'from-purple-500 to-pink-500', placeholder: 'http://192.168.1.1:8096', category: 'media' },
  { key: 'jellyseerr', label: 'Jellyseerr', icon: Search, color: 'from-indigo-500 to-purple-500', placeholder: 'http://192.168.1.1:5055', category: 'media' },
  { key: 'radarr', label: 'Radarr', icon: Film, color: 'from-amber-500 to-orange-500', placeholder: 'http://192.168.1.1:7878', category: 'media' },
  { key: 'sonarr', label: 'Sonarr', icon: Tv2, color: 'from-cyan-500 to-blue-500', placeholder: 'http://192.168.1.1:8989', category: 'media' },
  { key: 'qbittorrent', label: 'qBittorrent', icon: Download, color: 'from-green-500 to-emerald-500', placeholder: 'http://192.168.1.1:8080', category: 'media' },

  // Home Automation
  { key: 'homeassistant', label: 'Home Assistant', icon: Home, color: 'from-sky-500 to-blue-500', placeholder: 'http://192.168.1.1:8123', category: 'home' },
  { key: 'homarr', label: 'Homarr', icon: LayoutDashboard, color: 'from-rose-500 to-pink-500', placeholder: 'http://192.168.1.1:7575', category: 'home' },
  { key: 'uptimekuma', label: 'Uptime Kuma', icon: Gauge, color: 'from-emerald-500 to-green-500', placeholder: 'http://192.168.1.1:3001', category: 'home' },

  // Apps
  { key: 'nextcloud', label: 'Nextcloud', icon: Cloud, color: 'from-blue-500 to-indigo-500', placeholder: 'http://192.168.1.1:8080', category: 'apps' },
  { key: 'proxmoxAdmin', label: 'Proxmox Admin', icon: Server, color: 'from-orange-500 to-amber-500', placeholder: 'http://192.168.1.1:5173', category: 'apps' },
  { key: 'updateDashboard', label: 'Update Dashboard', icon: RefreshCw, color: 'from-violet-500 to-purple-500', placeholder: 'http://192.168.1.1:8081', category: 'apps' },

  // Gaming
  { key: 'pterodactyl', label: 'Pterodactyl', icon: Gamepad2, color: 'from-emerald-500 to-teal-500', placeholder: 'https://panel.example.com', category: 'gaming' },
];

const categories = [
  { key: 'infrastructure', label: 'Infrastructure', color: 'text-orange-400' },
  { key: 'media', label: 'Media', color: 'text-purple-400' },
  { key: 'home', label: 'Home Automation', color: 'text-sky-400' },
  { key: 'apps', label: 'Applications', color: 'text-blue-400' },
  { key: 'gaming', label: 'Gaming', color: 'text-emerald-400' },
];

interface UrlInputProps {
  config: UrlConfig;
  value: string;
  onChange: (value: string) => void;
}

function UrlInput({ config, value, onChange }: UrlInputProps) {
  const Icon = config.icon;

  return (
    <div className="group relative flex items-center gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 hover:border-slate-600/50 transition-all">
      <div className={cn(
        'flex items-center justify-center h-10 w-10 rounded-lg shrink-0',
        'bg-gradient-to-br shadow-md',
        config.color
      )}>
        <Icon className="h-5 w-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <label className="block text-sm font-medium text-slate-300 mb-1">
          {config.label}
        </label>
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={config.placeholder}
          className={cn(
            'w-full px-3 py-2 rounded-lg text-sm',
            'bg-slate-900/50 border border-slate-700/50',
            'text-slate-100 placeholder-slate-500',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50',
            'transition-all'
          )}
        />
      </div>

      {value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50 transition-all"
          title="Open in new tab"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [originalUrls, setOriginalUrls] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setIsLoading(true);
      const response = await fetch('/api/settings');
      const data = await response.json();

      if (data.success && data.data?.urls) {
        setUrls(data.data.urls);
        setOriginalUrls(data.data.urls);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings() {
    try {
      setIsSaving(true);
      setSaveStatus('idle');

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });

      const data = await response.json();

      if (data.success) {
        setOriginalUrls(urls);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }

  function resetSettings() {
    setUrls(originalUrls);
  }

  const hasChanges = JSON.stringify(urls) !== JSON.stringify(originalUrls);

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 via-gray-500/5 to-zinc-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-500/20 via-transparent to-transparent" />

        <div className="relative px-6 py-8">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-slate-500 to-zinc-600 shadow-lg shadow-slate-500/25">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
                  <p className="text-sm text-slate-400">Configure application URLs</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetSettings}
                  className="border-slate-700 text-slate-400 hover:text-slate-100"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button
                size="sm"
                onClick={saveSettings}
                disabled={!hasChanges || isSaving}
                className={cn(
                  'transition-all',
                  saveStatus === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-cyan-600 hover:bg-cyan-700'
                )}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : saveStatus === 'success' ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {isLoading ? (
          <Card className="bg-slate-900/40 backdrop-blur-xl border-slate-700/50">
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 text-slate-500 mx-auto animate-spin" />
              <p className="text-slate-400 mt-4">Loading settings...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Info banner */}
            <Card className="bg-cyan-950/20 border-cyan-900/30">
              <CardContent className="p-4">
                <p className="text-sm text-cyan-400">
                  Configure the URLs for your services below. These URLs are used for quick access links in the dashboard.
                  API keys and credentials remain securely stored in your <code className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">.env</code> file.
                </p>
              </CardContent>
            </Card>

            {/* Settings by category */}
            {categories.map((category) => {
              const categoryConfigs = urlConfigs.filter((c) => c.category === category.key);

              return (
                <section key={category.key} className="space-y-4">
                  <h2 className={cn('text-sm font-medium uppercase tracking-wider flex items-center gap-2', category.color)}>
                    {category.label}
                    <Badge variant="outline" className="text-slate-500 border-slate-700">
                      {categoryConfigs.length}
                    </Badge>
                  </h2>

                  <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 backdrop-blur-xl border-slate-700/50 overflow-hidden">
                    <CardContent className="p-4 space-y-3">
                      {categoryConfigs.map((config) => (
                        <UrlInput
                          key={config.key}
                          config={config}
                          value={urls[config.key] || ''}
                          onChange={(value) => setUrls((prev) => ({ ...prev, [config.key]: value }))}
                        />
                      ))}
                    </CardContent>
                  </Card>
                </section>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
