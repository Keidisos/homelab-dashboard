'use client';

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
  Globe,
  Database,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface BookmarkItem {
  name: string;
  url: string;
  icon: LucideIcon;
  color: string;
  description?: string;
}

interface BookmarkCategory {
  title: string;
  icon: LucideIcon;
  color: string;
  items: BookmarkItem[];
}

// Configuration des bookmarks - À personnaliser selon tes services
const bookmarkCategories: BookmarkCategory[] = [
  {
    title: 'Infrastructure',
    icon: Server,
    color: 'text-orange-400',
    items: [
      {
        name: 'Proxmox',
        url: process.env.NEXT_PUBLIC_PROXMOX_HOST || '#',
        icon: Server,
        color: 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400',
        description: 'Virtualisation',
      },
      {
        name: 'Portainer',
        url: process.env.NEXT_PUBLIC_PORTAINER_HOST || '#',
        icon: Container,
        color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
        description: 'Docker Management',
      },
    ],
  },
  {
    title: 'Media',
    icon: Tv,
    color: 'text-purple-400',
    items: [
      {
        name: 'Jellyfin',
        url: process.env.NEXT_PUBLIC_JELLYFIN_HOST || '#',
        icon: Tv,
        color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
        description: 'Media Server',
      },
      {
        name: 'Jellyseerr',
        url: process.env.NEXT_PUBLIC_JELLYSEERR_HOST || '#',
        icon: Search,
        color: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/30 text-indigo-400',
        description: 'Requests',
      },
      {
        name: 'Radarr',
        url: process.env.NEXT_PUBLIC_RADARR_HOST || '#',
        icon: Film,
        color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
        description: 'Movies',
      },
      {
        name: 'Sonarr',
        url: process.env.NEXT_PUBLIC_SONARR_HOST || '#',
        icon: Tv2,
        color: 'from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400',
        description: 'TV Shows',
      },
    ],
  },
  {
    title: 'Downloads',
    icon: Download,
    color: 'text-green-400',
    items: [
      {
        name: 'qBittorrent',
        url: process.env.NEXT_PUBLIC_QBITTORRENT_HOST || '#',
        icon: Download,
        color: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
        description: 'Torrent Client',
      },
    ],
  },
  {
    title: 'Gaming',
    icon: Gamepad2,
    color: 'text-green-400',
    items: [
      {
        name: 'Pterodactyl',
        url: process.env.NEXT_PUBLIC_PTERODACTYL_HOST || '#',
        icon: Gamepad2,
        color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400',
        description: 'Game Servers',
      },
    ],
  },
  {
    title: 'Storage',
    icon: HardDrive,
    color: 'text-teal-400',
    items: [
      {
        name: 'NAS',
        url: process.env.NEXT_PUBLIC_NAS_HOST || '#',
        icon: Database,
        color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30 text-teal-400',
        description: 'Ugreen NAS',
      },
    ],
  },
];

function BookmarkCard({ item }: { item: BookmarkItem }) {
  const Icon = item.icon;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <Card
        className={cn(
          'bg-slate-900/40 backdrop-blur-xl border-slate-700/50',
          'transition-all duration-300',
          'hover:bg-slate-900/60 hover:border-slate-600/50',
          'hover:shadow-lg hover:shadow-cyan-500/10',
          'hover:-translate-y-1'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex items-center justify-center h-12 w-12 rounded-lg border bg-gradient-to-br',
                item.color
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-400 transition-colors">
                {item.name}
              </h3>
              {item.description && (
                <p className="text-xs text-slate-500">{item.description}</p>
              )}
            </div>
            <ExternalLink className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
        <div className="flex items-center gap-4 h-14 px-6">
          <Globe className="h-6 w-6 text-cyan-400" />
          <div>
            <h1 className="text-lg font-semibold text-slate-100">HomeLab</h1>
            <p className="text-xs text-slate-500">Quick Access</p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-8">
        {bookmarkCategories.map((category) => {
          const CategoryIcon = category.icon;
          return (
            <section key={category.title} className="space-y-4">
              <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <CategoryIcon className={cn('h-4 w-4', category.color)} />
                {category.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.items.map((item) => (
                  <BookmarkCard key={item.name} item={item} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
