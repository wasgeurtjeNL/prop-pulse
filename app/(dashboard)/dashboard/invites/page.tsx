"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Copy, Plus, Trash2, RefreshCw, Users, Shield, UserPlus } from "lucide-react";
import { generateInviteCode, getInviteCodes, deactivateInviteCode } from "@/lib/actions/invite.actions";
import toast from "react-hot-toast";

interface Invite {
  id: string;
  code: string;
  email: string | null;
  role: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: Date | null;
  note: string | null;
  createdAt: Date;
}

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form state
  const [newInvite, setNewInvite] = useState({
    email: "",
    role: "AGENT" as "AGENT" | "ADMIN",
    maxUses: 1,
    expiresInDays: 7,
    note: "",
  });

  const fetchInvites = async () => {
    setIsLoading(true);
    const result = await getInviteCodes();
    if (result.error) {
      toast.error(result.error);
    } else {
      setInvites(result.invites);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInvites();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const result = await generateInviteCode({
      email: newInvite.email || undefined,
      role: newInvite.role,
      maxUses: newInvite.maxUses,
      expiresInDays: newInvite.expiresInDays,
      note: newInvite.note || undefined,
    });

    if (result.success && result.code) {
      toast.success(`Invite code generated: ${result.code}`);
      navigator.clipboard.writeText(result.code);
      setNewInvite({ email: "", role: "AGENT", maxUses: 1, expiresInDays: 7, note: "" });
      fetchInvites();
    } else {
      toast.error(result.error || "Failed to generate invite code");
    }
    setIsGenerating(false);
  };

  const handleDeactivate = async (id: string) => {
    const result = await deactivateInviteCode(id);
    if (result.success) {
      toast.success("Invite code deactivated");
      fetchInvites();
    } else {
      toast.error(result.error || "Failed to deactivate");
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied to clipboard");
  };

  const copyInviteLink = (code: string) => {
    const link = `${window.location.origin}/sign-up?invite=${code}`;
    navigator.clipboard.writeText(link);
    toast.success("Invite link copied to clipboard");
  };

  const activeCount = invites.filter(i => i.isActive).length;
  const usedCount = invites.filter(i => i.usedCount > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Invites</h1>
        <p className="text-muted-foreground">
          Generate invite codes for new agents and admins
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invites</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invites.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{usedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Generate New Invite */}
      <Card>
        <CardHeader>
          <CardTitle>Generate New Invite</CardTitle>
          <CardDescription>
            Create a new invite code for agent or admin registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input
                placeholder="agent@example.com"
                value={newInvite.email}
                onChange={(e) => setNewInvite(prev => ({ ...prev, email: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">Restrict to specific email</p>
            </div>
            
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={newInvite.role}
                onValueChange={(value: "AGENT" | "ADMIN") => setNewInvite(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AGENT">Agent</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={newInvite.maxUses}
                onChange={(e) => setNewInvite(prev => ({ ...prev, maxUses: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Expires In (days)</Label>
              <Input
                type="number"
                min={1}
                max={365}
                value={newInvite.expiresInDays}
                onChange={(e) => setNewInvite(prev => ({ ...prev, expiresInDays: parseInt(e.target.value) || 7 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Input
                placeholder="For John Doe"
                value={newInvite.note}
                onChange={(e) => setNewInvite(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            className="mt-4"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Generate Invite Code
          </Button>
        </CardContent>
      </Card>

      {/* Invites List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invite Codes</CardTitle>
            <CardDescription>All generated invite codes</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInvites}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invite codes yet. Generate one above.
            </div>
          ) : (
            <div className="space-y-3">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    invite.isActive ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="font-mono text-lg font-semibold">
                      {invite.code}
                    </div>
                    <Badge variant={invite.role === "ADMIN" ? "destructive" : "default"}>
                      {invite.role}
                    </Badge>
                    <Badge variant={invite.isActive ? "outline" : "secondary"}>
                      {invite.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {invite.usedCount}/{invite.maxUses} used
                    </span>
                    {invite.email && (
                      <span className="text-sm text-muted-foreground">
                        For: {invite.email}
                      </span>
                    )}
                    {invite.note && (
                      <span className="text-sm text-muted-foreground italic">
                        "{invite.note}"
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(invite.code)}
                      title="Copy code"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyInviteLink(invite.code)}
                      title="Copy invite link"
                    >
                      Copy Link
                    </Button>
                    {invite.isActive && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeactivate(invite.id)}
                        className="text-red-500 hover:text-red-600"
                        title="Deactivate"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


