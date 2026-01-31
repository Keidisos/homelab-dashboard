'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Server,
  Container,
  Tv,
  Gamepad2,
  LayoutDashboard,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  name: string;
  href: string;
  icon: typeof Server;
  color: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, color: 'text-cyan-400' },
  { name: 'Proxmox', href: '/proxmox', icon: Server, color: 'text-orange-400' },
  { name: 'Docker', href: '/docker', icon: Container, color: 'text-blue-400' },
  { name: 'Jellyfin', href: '/jellyfin', icon: Tv, color: 'text-purple-400' },
  { name: 'Gaming', href: '/gaming', icon: Gamepad2, color: 'text-green-400' },
];

const settingsItem: NavItem = { name: 'Settings', href: '/settings', icon: Settings, color: 'text-slate-400' };

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen',
          'flex flex-col',
          'bg-slate-950/80 backdrop-blur-xl',
          'border-r border-slate-800/50',
          'transition-all duration-300 ease-in-out',
          collapsed ? 'w-16' : 'w-56',
          className
        )}
      >
        {/* Logo area */}
        <div
          className={cn(
            'flex items-center gap-3 p-4',
            'border-b border-slate-800/50',
            collapsed && 'justify-center'
          )}
        >
          <div className="relative">
            <Activity className="h-8 w-8 text-cyan-400" />
            <div className="absolute inset-0 h-8 w-8 bg-cyan-400/20 blur-lg" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                HomeLab
              </h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                Dashboard
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const button = (
              <Button
                key={item.name}
                variant="ghost"
                asChild
                className={cn(
                  'w-full justify-start gap-3',
                  'text-slate-400 hover:text-slate-100',
                  'hover:bg-slate-800/50',
                  'transition-all duration-200',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Link href={item.href}>
                  <Icon className={cn('h-5 w-5 shrink-0', item.color)} />
                  {!collapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              </Button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-2 border-t border-slate-800/50 space-y-1">
          {/* Settings button */}
          {(() => {
            const Icon = settingsItem.icon;
            const button = (
              <Button
                variant="ghost"
                asChild
                className={cn(
                  'w-full justify-start gap-3',
                  'text-slate-400 hover:text-slate-100',
                  'hover:bg-slate-800/50',
                  'transition-all duration-200',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Link href={settingsItem.href}>
                  <Icon className={cn('h-5 w-5 shrink-0', settingsItem.color)} />
                  {!collapsed && (
                    <span className="truncate">{settingsItem.name}</span>
                  )}
                </Link>
              </Button>
            );

            if (collapsed) {
              return (
                <Tooltip>
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                    {settingsItem.name}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })()}

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full',
              'text-slate-500 hover:text-slate-300',
              'hover:bg-slate-800/50',
              collapsed && 'justify-center'
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
