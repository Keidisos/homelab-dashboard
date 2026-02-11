'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDockerLogs } from '@/hooks/use-services';
import { cn } from '@/lib/utils';

interface LogsModalProps {
  containerId: string;
  containerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function colorLine(line: string): { text: string; className: string } {
  const lower = line.toLowerCase();
  if (lower.includes('error') || lower.includes('fatal') || lower.includes('panic')) {
    return { text: line, className: 'text-red-400' };
  }
  if (lower.includes('warn') || lower.includes('warning')) {
    return { text: line, className: 'text-amber-400' };
  }
  return { text: line, className: 'text-slate-300 dark:text-slate-300 text-slate-600' };
}

export function LogsModal({ containerId, containerName, open, onOpenChange }: LogsModalProps) {
  const [tail, setTail] = useState(100);
  const [search, setSearch] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, refetch } = useDockerLogs(containerId, tail, open);

  useEffect(() => {
    if (data?.success && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [data]);

  const logs = data?.data?.logs || '';
  const lines = logs.split('\n').filter((l) => l.trim());

  const filteredLines = search
    ? lines.filter((l) => l.toLowerCase().includes(search.toLowerCase()))
    : lines;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col bg-slate-950 dark:bg-slate-950 bg-white border-slate-800 dark:border-slate-800 border-slate-300">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-100 dark:text-slate-100 text-slate-800">
            <Terminal className="h-5 w-5 text-emerald-400" />
            Logs: {containerName}
          </DialogTitle>
          <DialogDescription className="text-slate-400 dark:text-slate-400 text-slate-500">
            Container logs (last {tail} lines)
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/60 dark:bg-slate-900/60 bg-slate-100 border border-slate-700/50 dark:border-slate-700/50 border-slate-300/50 text-sm text-slate-200 dark:text-slate-200 text-slate-700 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Tail selector */}
          <div className="flex items-center gap-1">
            {[50, 100, 500].map((n) => (
              <Button
                key={n}
                variant="ghost"
                size="sm"
                onClick={() => setTail(n)}
                className={cn(
                  'text-xs px-2.5 h-8',
                  tail === n
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 dark:text-slate-400 dark:hover:text-slate-200 text-slate-500 hover:text-slate-700'
                )}
              >
                {n}
              </Button>
            ))}
          </div>

          {/* Refresh */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 w-8 p-0 text-slate-400 hover:text-emerald-400"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Log output */}
        <div className="flex-1 min-h-0 rounded-lg bg-slate-900 dark:bg-slate-900 bg-slate-100 border border-slate-800 dark:border-slate-800 border-slate-300 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
            </div>
          )}

          {!isLoading && data?.success && (
            <pre className="p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap break-all">
              {filteredLines.length > 0 ? (
                filteredLines.map((line, i) => {
                  const { className } = colorLine(line);
                  return (
                    <div key={i} className={cn('py-0.5 hover:bg-slate-800/50 dark:hover:bg-slate-800/50 hover:bg-slate-200/50', className)}>
                      {search ? (
                        <HighlightedLine line={line} search={search} />
                      ) : (
                        line
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-500 text-center py-8">
                  {search ? 'No matching log lines' : 'No logs available'}
                </div>
              )}
              <div ref={logsEndRef} />
            </pre>
          )}

          {!isLoading && data && !data.success && (
            <div className="flex items-center justify-center py-12 text-red-400 text-sm">
              Failed to load logs: {data.error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function HighlightedLine({ line, search }: { line: string; search: string }) {
  if (!search) return <>{line}</>;

  const parts = line.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <span key={i} className="bg-amber-500/30 text-amber-200 dark:text-amber-200 text-amber-700 rounded px-0.5">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
