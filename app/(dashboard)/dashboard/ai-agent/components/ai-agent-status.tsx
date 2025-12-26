'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Pause, AlertOctagon } from 'lucide-react';

interface AgentState {
  isRunning: boolean;
  lastRunAt: string | null;
  decisionsToday: number;
  autoExecutesToday: number;
  pendingDecisions: number;
  currentTask: string | null;
}

interface AgentConfig {
  enabled: boolean;
  autonomousMode: boolean;
  killSwitch: boolean;
  pausedUntil: string | null;
  pauseReason: string | null;
}

export function AIAgentStatus() {
  const [state, setState] = useState<AgentState | null>(null);
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/ai-agent?action=status');
      if (response.ok) {
        const data = await response.json();
        setState(data.state);
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to fetch agent status:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', type: 'full' }),
      });
      
      if (response.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to run analysis:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAgent = async () => {
    if (!config) return;
    
    setActionLoading(true);
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !config.enabled }),
      });
      
      if (response.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to toggle agent:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const emergencyStop = async () => {
    if (!confirm('Are you sure you want to activate emergency stop? This will disable all AI operations.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'emergency-stop', reason: 'Manual emergency stop from dashboard' }),
      });
      
      if (response.ok) {
        await fetchStatus();
      }
    } catch (error) {
      console.error('Failed to emergency stop:', error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin" />;
  }

  if (!state || !config) {
    return <span className="text-red-500">Error loading status</span>;
  }

  const getStatusBadge = () => {
    if (config.killSwitch) {
      return <Badge variant="destructive">Emergency Stop</Badge>;
    }
    if (!config.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    if (state.isRunning) {
      return <Badge variant="default" className="bg-blue-500">Running</Badge>;
    }
    if (config.autonomousMode) {
      return <Badge variant="default" className="bg-green-500">Autonomous</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {getStatusBadge()}
        {state.currentTask && (
          <span className="text-xs text-muted-foreground animate-pulse">
            {state.currentTask}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={runAnalysis}
          disabled={actionLoading || config.killSwitch}
        >
          {actionLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Run Analysis
        </Button>

        <Button
          size="sm"
          variant={config.enabled ? 'outline' : 'default'}
          onClick={toggleAgent}
          disabled={actionLoading || config.killSwitch}
        >
          {config.enabled ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Enable
            </>
          )}
        </Button>

        {!config.killSwitch ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={emergencyStop}
            disabled={actionLoading}
          >
            <AlertOctagon className="mr-2 h-4 w-4" />
            Emergency Stop
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              setActionLoading(true);
              try {
                await fetch('/api/ai-agent', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'resume' }),
                });
                await fetchStatus();
              } finally {
                setActionLoading(false);
              }
            }}
            disabled={actionLoading}
          >
            Resume Agent
          </Button>
        )}
      </div>

      {state.lastRunAt && (
        <p className="text-xs text-muted-foreground">
          Last run: {new Date(state.lastRunAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

