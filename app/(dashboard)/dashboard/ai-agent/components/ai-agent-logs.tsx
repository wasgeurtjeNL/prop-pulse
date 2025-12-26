'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  category: string;
  message: string;
  createdAt: string;
}

const levelColors: Record<string, string> = {
  DEBUG: 'bg-gray-500',
  INFO: 'bg-blue-500',
  WARN: 'bg-yellow-500',
  ERROR: 'bg-red-500',
  CRITICAL: 'bg-red-700',
};

const levelBadgeVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DEBUG: 'secondary',
  INFO: 'default',
  WARN: 'outline',
  ERROR: 'destructive',
  CRITICAL: 'destructive',
};

export function AIAgentLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-agent?action=logs&limit=50');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {logs.length} recent entries
        </span>
        <Button size="sm" variant="ghost" onClick={fetchLogs}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-2 pr-4">
          {logs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No logs yet
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className={`w-2 h-2 mt-1.5 rounded-full ${levelColors[log.level]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={levelBadgeVariants[log.level]} className="text-xs">
                      {log.level}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {log.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">{log.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

