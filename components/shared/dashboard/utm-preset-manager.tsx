"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  ChannelPreset, 
  DEFAULT_CHANNEL_PRESETS 
} from "@/lib/utils/utm-tracking";

interface CustomPreset extends ChannelPreset {
  isCustom: boolean;
}

const CUSTOM_PRESETS_KEY = 'utm_custom_presets';

export function UtmPresetManager() {
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [newPreset, setNewPreset] = useState({
    name: '',
    icon: '🔗',
    source: '',
    medium: '',
    description: '',
  });

  // Load custom presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (saved) {
      try {
        setCustomPresets(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save custom presets to localStorage
  const savePresets = (presets: CustomPreset[]) => {
    localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
    setCustomPresets(presets);
  };

  const handleAddPreset = () => {
    if (!newPreset.name || !newPreset.source || !newPreset.medium) {
      toast.error('Please fill in all required fields');
      return;
    }

    const preset: CustomPreset = {
      id: `custom_${Date.now()}`,
      name: newPreset.name,
      icon: newPreset.icon || '🔗',
      source: newPreset.source.toLowerCase().replace(/\s+/g, '_'),
      medium: newPreset.medium.toLowerCase().replace(/\s+/g, '_'),
      description: newPreset.description,
      isCustom: true,
    };

    savePresets([...customPresets, preset]);
    setNewPreset({ name: '', icon: '🔗', source: '', medium: '', description: '' });
    setIsAddingNew(false);
    toast.success('Channel preset added!');
  };

  const handleDeletePreset = (id: string) => {
    savePresets(customPresets.filter(p => p.id !== id));
    toast.success('Preset deleted');
  };

  const handleUpdatePreset = (id: string, updates: Partial<CustomPreset>) => {
    savePresets(customPresets.map(p => 
      p.id === id ? { ...p, ...updates } : p
    ));
    setEditingId(null);
    toast.success('Preset updated');
  };

  // All presets (default + custom)
  const allPresets: (ChannelPreset | CustomPreset)[] = [
    ...DEFAULT_CHANNEL_PRESETS,
    ...customPresets,
  ];

  // Common icons for quick selection
  const commonIcons = ['📘', '📸', '🎵', '📺', '💬', '💚', '📧', '🤝', '📱', '🌐', '📰', '💼', '🎯', '🔗'];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Channel Presets</CardTitle>
            <CardDescription>
              Pre-configured UTM settings for quick link generation
            </CardDescription>
          </div>
          <Dialog open={isAddingNew} onOpenChange={setIsAddingNew}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Channel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Custom Channel</DialogTitle>
                <DialogDescription>
                  Create a new channel preset for quick link generation
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Icon</Label>
                  <div className="flex gap-2 flex-wrap">
                    {commonIcons.map(icon => (
                      <Button
                        key={icon}
                        variant={newPreset.icon === icon ? "default" : "outline"}
                        size="sm"
                        className="w-10 h-10 text-lg"
                        onClick={() => setNewPreset({ ...newPreset, icon })}
                      >
                        {icon}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Channel Name *</Label>
                  <Input
                    placeholder="e.g., Twitter, LinkedIn, My Blog"
                    value={newPreset.name}
                    onChange={(e) => setNewPreset({ ...newPreset, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>UTM Source *</Label>
                    <Input
                      placeholder="e.g., twitter"
                      value={newPreset.source}
                      onChange={(e) => setNewPreset({ ...newPreset, source: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>UTM Medium *</Label>
                    <Input
                      placeholder="e.g., social"
                      value={newPreset.medium}
                      onChange={(e) => setNewPreset({ ...newPreset, medium: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="Brief description of this channel"
                    value={newPreset.description}
                    onChange={(e) => setNewPreset({ ...newPreset, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingNew(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPreset}>
                  Add Channel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Default Presets */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Default Channels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DEFAULT_CHANNEL_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{preset.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{preset.name}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {preset.source}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {preset.medium}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{preset.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Presets */}
          {customPresets.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Custom Channels</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {customPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    {editingId === preset.id ? (
                      <div className="space-y-2">
                        <Input
                          value={preset.name}
                          onChange={(e) => handleUpdatePreset(preset.id, { name: e.target.value })}
                          placeholder="Channel name"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={preset.source}
                            onChange={(e) => handleUpdatePreset(preset.id, { source: e.target.value })}
                            placeholder="Source"
                          />
                          <Input
                            value={preset.medium}
                            onChange={(e) => handleUpdatePreset(preset.id, { medium: e.target.value })}
                            placeholder="Medium"
                          />
                        </div>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                          <Button size="sm" onClick={() => setEditingId(null)}>
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{preset.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{preset.name}</p>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {preset.source}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {preset.medium}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditingId(preset.id)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={() => handleDeletePreset(preset.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {preset.description && (
                          <p className="text-xs text-muted-foreground mt-2">{preset.description}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

