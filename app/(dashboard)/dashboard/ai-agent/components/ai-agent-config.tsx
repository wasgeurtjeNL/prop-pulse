'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2, Save } from 'lucide-react';

interface AgentConfig {
  enabled: boolean;
  autonomousMode: boolean;
  minConfidenceThreshold: number;
  dailyDecisionLimit: number;
  dailyAutoExecuteLimit: number;
  notifyOnDecision: boolean;
  notifyOnAutoExecute: boolean;
  notifyEmail: string | null;
  feedbackLoopDays: number;
  killSwitch: boolean;
}

export function AIAgentConfig() {
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/ai-agent?action=status');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Failed to fetch config:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = (key: keyof AgentConfig, value: unknown) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
    setHasChanges(true);
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/ai-agent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      
      if (response.ok) {
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable */}
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="enabled">Agent Enabled</Label>
          <p className="text-xs text-muted-foreground">Allow the AI to analyze and make decisions</p>
        </div>
        <Switch
          id="enabled"
          checked={config.enabled}
          onCheckedChange={(checked) => updateConfig('enabled', checked)}
          disabled={config.killSwitch}
        />
      </div>

      {/* Autonomous Mode */}
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="autonomousMode">Autonomous Mode</Label>
          <p className="text-xs text-muted-foreground">Auto-execute high-confidence decisions</p>
        </div>
        <Switch
          id="autonomousMode"
          checked={config.autonomousMode}
          onCheckedChange={(checked) => updateConfig('autonomousMode', checked)}
        />
      </div>

      {/* Confidence Threshold */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Confidence Threshold</Label>
          <span className="text-sm text-muted-foreground">{config.minConfidenceThreshold}%</span>
        </div>
        <Slider
          value={[config.minConfidenceThreshold]}
          onValueChange={([value]) => updateConfig('minConfidenceThreshold', value)}
          min={50}
          max={100}
          step={5}
        />
        <p className="text-xs text-muted-foreground">
          Minimum confidence required for auto-execution
        </p>
      </div>

      {/* Daily Limits */}
      <div className="grid gap-4 grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dailyDecisionLimit">Daily Decision Limit</Label>
          <Input
            id="dailyDecisionLimit"
            type="number"
            value={config.dailyDecisionLimit}
            onChange={(e) => updateConfig('dailyDecisionLimit', parseInt(e.target.value))}
            min={1}
            max={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dailyAutoExecuteLimit">Auto-Execute Limit</Label>
          <Input
            id="dailyAutoExecuteLimit"
            type="number"
            value={config.dailyAutoExecuteLimit}
            onChange={(e) => updateConfig('dailyAutoExecuteLimit', parseInt(e.target.value))}
            min={0}
            max={50}
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifyOnDecision">Notify on New Decision</Label>
          <Switch
            id="notifyOnDecision"
            checked={config.notifyOnDecision}
            onCheckedChange={(checked) => updateConfig('notifyOnDecision', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="notifyOnAutoExecute">Notify on Auto-Execute</Label>
          <Switch
            id="notifyOnAutoExecute"
            checked={config.notifyOnAutoExecute}
            onCheckedChange={(checked) => updateConfig('notifyOnAutoExecute', checked)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notifyEmail">Notification Email</Label>
          <Input
            id="notifyEmail"
            type="email"
            placeholder="admin@example.com"
            value={config.notifyEmail || ''}
            onChange={(e) => updateConfig('notifyEmail', e.target.value || null)}
          />
        </div>
      </div>

      {/* Feedback Loop */}
      <div className="space-y-2">
        <Label htmlFor="feedbackLoopDays">Feedback Loop Days</Label>
        <Input
          id="feedbackLoopDays"
          type="number"
          value={config.feedbackLoopDays}
          onChange={(e) => updateConfig('feedbackLoopDays', parseInt(e.target.value))}
          min={1}
          max={30}
        />
        <p className="text-xs text-muted-foreground">
          Days to wait before measuring decision impact
        </p>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <Button onClick={saveConfig} disabled={saving} className="w-full">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      )}
    </div>
  );
}

