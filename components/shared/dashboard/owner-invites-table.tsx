"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Copy,
  ExternalLink,
  Mail,
  Phone,
  Home,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Trash2,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { nl } from "date-fns/locale";

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
  location: string;
  price: string;
  status: string;
}

interface OwnerInvite {
  id: string;
  code: string;
  email: string | null;
  phone: string | null;
  propertyIds: string[];
  listingNumbers: string[];
  maxUses: number;
  usedCount: number;
  usedBy: string | null;
  usedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdBy: string;
  createdByName: string | null;
  note: string | null;
  createdAt: string;
  properties?: Property[];
  registrationUrl?: string;
}

interface PropertyOption {
  id: string;
  title: string;
  listingNumber: string | null;
  location: string;
  ownerUserId: string | null;
}

export function OwnerInvitesTable() {
  const [invites, setInvites] = useState<OwnerInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Create invite modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [availableProperties, setAvailableProperties] = useState<PropertyOption[]>([]);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("30");
  const [creating, setCreating] = useState(false);
  
  // Created invite result
  const [createdInvite, setCreatedInvite] = useState<OwnerInvite | null>(null);

  useEffect(() => {
    fetchInvites();
  }, [statusFilter]);

  const fetchInvites = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/owner-portal/invites?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setInvites(data.invites || []);
      } else {
        toast.error(data.error || "Failed to fetch invites");
      }
    } catch (error) {
      toast.error("Failed to fetch invites");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProperties = async () => {
    try {
      // Fetch properties that don't have an owner account linked yet
      const response = await fetch("/api/properties?limit=500");
      const data = await response.json();

      if (response.ok) {
        // Filter to only properties without ownerUserId
        const available = (data.properties || []).filter(
          (p: PropertyOption) => !p.ownerUserId
        );
        setAvailableProperties(available);
      }
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    }
  };

  const openCreateModal = async () => {
    setCreateModalOpen(true);
    setSelectedPropertyIds([]);
    setInviteEmail("");
    setInvitePhone("");
    setInviteNote("");
    setExpiresInDays("30");
    setCreatedInvite(null);
    await fetchAvailableProperties();
  };

  const handleCreateInvite = async () => {
    if (selectedPropertyIds.length === 0) {
      toast.error("Selecteer minimaal één woning");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/owner-portal/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyIds: selectedPropertyIds,
          email: inviteEmail || null,
          phone: invitePhone || null,
          note: inviteNote || null,
          expiresInDays: parseInt(expiresInDays),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Uitnodiging aangemaakt!");
        setCreatedInvite(data.invite);
        fetchInvites();
      } else {
        toast.error(data.error || "Failed to create invite");
      }
    } catch (error) {
      toast.error("Failed to create invite");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Gekopieerd naar klembord!");
  };

  const handleDeactivate = async (id: string) => {
    try {
      const response = await fetch(`/api/owner-portal/invites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });

      if (response.ok) {
        toast.success("Uitnodiging gedeactiveerd");
        fetchInvites();
      } else {
        toast.error("Failed to deactivate invite");
      }
    } catch (error) {
      toast.error("Failed to deactivate invite");
    }
  };

  const getStatusBadge = (invite: OwnerInvite) => {
    if (invite.usedCount > 0) {
      return <Badge className="bg-green-500">Gebruikt</Badge>;
    }
    if (!invite.isActive) {
      return <Badge variant="secondary">Gedeactiveerd</Badge>;
    }
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      return <Badge variant="destructive">Verlopen</Badge>;
    }
    return <Badge className="bg-blue-500">Actief</Badge>;
  };

  const togglePropertySelection = (propertyId: string) => {
    setSelectedPropertyIds((prev) =>
      prev.includes(propertyId)
        ? prev.filter((id) => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  if (loading && invites.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Zoek op code, email, listing..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchInvites()}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="active">Actief</SelectItem>
              <SelectItem value="used">Gebruikt</SelectItem>
              <SelectItem value="expired">Verlopen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Nieuwe Uitnodiging
        </Button>
      </div>

      {/* Invites List */}
      {invites.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">Geen uitnodigingen gevonden</p>
            <Button onClick={openCreateModal} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Eerste Uitnodiging Aanmaken
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invites.map((invite) => (
            <Card key={invite.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-sm">
                        {invite.code}
                      </code>
                      {getStatusBadge(invite)}
                    </CardTitle>
                    <CardDescription className="mt-2 flex flex-wrap gap-3">
                      {invite.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {invite.email}
                        </span>
                      )}
                      {invite.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {invite.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3" /> {invite.propertyIds.length} woning(en)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{" "}
                        {formatDistanceToNow(new Date(invite.createdAt), {
                          addSuffix: true,
                          locale: nl,
                        })}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          `${window.location.origin}/sign-up/owner?code=${invite.code}`
                        )
                      }
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Link
                    </Button>
                    {invite.isActive && invite.usedCount === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(invite.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {invite.properties && invite.properties.length > 0 && (
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {invite.properties.map((property) => (
                      <Badge key={property.id} variant="outline" className="text-xs">
                        {property.listingNumber || "N/A"} - {property.title}
                      </Badge>
                    ))}
                  </div>
                  {invite.note && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      {invite.note}
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Invite Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nieuwe Eigenaar Uitnodiging</DialogTitle>
            <DialogDescription>
              Maak een uitnodigingscode aan waarmee een woningeigenaar een account kan
              aanmaken om zijn/haar woningen te beheren.
            </DialogDescription>
          </DialogHeader>

          {!createdInvite ? (
            <div className="space-y-6">
              {/* Property Selection */}
              <div className="space-y-2">
                <Label>Selecteer Woning(en) *</Label>
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {availableProperties.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      Geen woningen beschikbaar (al gekoppeld aan eigenaar accounts)
                    </p>
                  ) : (
                    availableProperties.map((property) => (
                      <div
                        key={property.id}
                        className={`flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 ${
                          selectedPropertyIds.includes(property.id)
                            ? "bg-primary/5"
                            : ""
                        }`}
                        onClick={() => togglePropertySelection(property.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {property.listingNumber || "N/A"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              {property.title}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {property.location}
                          </p>
                        </div>
                        <div
                          className={`h-5 w-5 rounded border flex items-center justify-center ${
                            selectedPropertyIds.includes(property.id)
                              ? "bg-primary border-primary"
                              : "border-muted-foreground/30"
                          }`}
                        >
                          {selectedPropertyIds.includes(property.id) && (
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedPropertyIds.length} woning(en) geselecteerd
                </p>
              </div>

              {/* Optional Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (optioneel)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="eigenaar@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoon (optioneel)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+66 XX XXX XXXX"
                    value={invitePhone}
                    onChange={(e) => setInvitePhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Geldig voor</Label>
                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer periode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dagen</SelectItem>
                    <SelectItem value="14">14 dagen</SelectItem>
                    <SelectItem value="30">30 dagen</SelectItem>
                    <SelectItem value="60">60 dagen</SelectItem>
                    <SelectItem value="90">90 dagen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Interne Notitie (optioneel)</Label>
                <Textarea
                  id="note"
                  placeholder="Notities voor intern gebruik..."
                  value={inviteNote}
                  onChange={(e) => setInviteNote(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Annuleren
                </Button>
                <Button
                  onClick={handleCreateInvite}
                  disabled={creating || selectedPropertyIds.length === 0}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Uitnodiging Aanmaken
                </Button>
              </DialogFooter>
            </div>
          ) : (
            // Success State
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-lg">Uitnodiging Aangemaakt!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Deel de onderstaande link met de woningeigenaar
                </p>
              </div>

              <div className="space-y-2">
                <Label>Uitnodigingscode</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdInvite.code}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(createdInvite.code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Registratielink</Label>
                <div className="flex gap-2">
                  <Input
                    value={createdInvite.registrationUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    onClick={() =>
                      copyToClipboard(createdInvite.registrationUrl || "")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Gekoppelde Woningen</Label>
                <div className="flex flex-wrap gap-2">
                  {createdInvite.properties?.map((property) => (
                    <Badge key={property.id} variant="outline">
                      {property.listingNumber} - {property.title}
                    </Badge>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button onClick={() => setCreateModalOpen(false)}>
                  Sluiten
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
