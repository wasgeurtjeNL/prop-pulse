"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  MoreHorizontal,
  Target,
  Handshake,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Eye,
  Filter,
  Search,
  TrendingUp,
  Award,
  Home,
  Ban,
} from "lucide-react";

interface Subscription {
  id: string;
  userId: string;
  propertyId: string;
  packageType: "MARKETING_FEE" | "EXCLUSIVE_CONTRACT" | "STANDARD";
  marketingPercentage: number | null;
  commissionPercentage: number | null;
  calculatedAmount: number | null;
  propertyPrice: number;
  status: string;
  signedAt: string | null;
  expiresAt: string | null;
  ownerNote: string | null;
  adminNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  property: {
    id: string;
    title: string;
    listingNumber: string | null;
    price: string;
  };
}

// Format number as THB
function formatTHB(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function OwnerMarketingTable() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [packageFilter, setPackageFilter] = useState<string>("all");
  
  // Action modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "view">("view");
  const [adminNote, setAdminNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter, packageFilter]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (packageFilter !== "all") params.append("packageType", packageFilter);

      const response = await fetch(`/api/owner-portal/marketing-subscription?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
      } else {
        toast.error(data.error || "Failed to fetch subscriptions");
      }
    } catch (error) {
      toast.error("Failed to fetch subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (subscription: Subscription, action: "approve" | "reject" | "view") => {
    setSelectedSubscription(subscription);
    setActionType(action);
    setAdminNote(subscription.adminNote || "");
    setActionModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedSubscription) return;

    try {
      setSubmitting(true);
      const newStatus = actionType === "approve" ? "ACTIVE" : "CANCELLED";

      const response = await fetch(`/api/owner-portal/marketing-subscription/${selectedSubscription.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          adminNote,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setActionModalOpen(false);
        fetchSubscriptions();
      } else {
        toast.error(data.error || "Failed to update subscription");
      }
    } catch (error) {
      toast.error("Failed to update subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            In Behandeling
          </Badge>
        );
      case "ACTIVE":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Actief
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-blue-500">
            <Award className="h-3 w-3 mr-1" />
            Voltooid
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Geannuleerd
          </Badge>
        );
      case "EXPIRED":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600">
            Verlopen
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPackageBadge = (packageType: string) => {
    switch (packageType) {
      case "MARKETING_FEE":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Target className="h-3 w-3 mr-1" />
            Marketing 0.25%/mnd
          </Badge>
        );
      case "EXCLUSIVE_CONTRACT":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            <Handshake className="h-3 w-3 mr-1" />
            Exclusief 15%
          </Badge>
        );
      case "STANDARD":
        return (
          <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
            <Home className="h-3 w-3 mr-1" />
            Standaard (geen marketing)
          </Badge>
        );
      default:
        return <Badge variant="outline">{packageType}</Badge>;
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      sub.user.name.toLowerCase().includes(searchLower) ||
      sub.user.email.toLowerCase().includes(searchLower) ||
      sub.property.title.toLowerCase().includes(searchLower) ||
      (sub.property.listingNumber?.toLowerCase() || "").includes(searchLower)
    );
  });

  // Stats
  const pendingCount = subscriptions.filter((s) => s.status === "PENDING").length;
  const activeCount = subscriptions.filter((s) => s.status === "ACTIVE" && s.packageType !== "STANDARD").length;
  const marketingTotal = subscriptions
    .filter((s) => s.status === "ACTIVE" && s.packageType === "MARKETING_FEE")
    .reduce((sum, s) => sum + (s.calculatedAmount || 0), 0);
  const exclusiveCount = subscriptions.filter(
    (s) => s.status === "ACTIVE" && s.packageType === "EXCLUSIVE_CONTRACT"
  ).length;
  const standardCount = subscriptions.filter(
    (s) => s.packageType === "STANDARD"
  ).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Behandeling</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Actieve Pakketten</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Marketing/mnd</p>
                <p className="text-2xl font-bold">฿{formatTHB(marketingTotal)}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exclusief</p>
                <p className="text-2xl font-bold">{exclusiveCount}</p>
              </div>
              <Handshake className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700">Geen Marketing</p>
                <p className="text-2xl font-bold text-amber-600">{standardCount}</p>
              </div>
              <Ban className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Marketing Subscriptions
              </CardTitle>
              <CardDescription>
                Beheer marketing pakketten en exclusiviteitscontracten
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchSubscriptions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Vernieuwen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Zoek op naam, email of woning..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Statussen</SelectItem>
                <SelectItem value="PENDING">In Behandeling</SelectItem>
                <SelectItem value="ACTIVE">Actief</SelectItem>
                <SelectItem value="COMPLETED">Voltooid</SelectItem>
                <SelectItem value="CANCELLED">Geannuleerd</SelectItem>
              </SelectContent>
            </Select>
            <Select value={packageFilter} onValueChange={setPackageFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Pakket" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Pakketten</SelectItem>
                <SelectItem value="MARKETING_FEE">Marketing 0.25%/mnd</SelectItem>
                <SelectItem value="EXCLUSIVE_CONTRACT">Exclusief 15%</SelectItem>
                <SelectItem value="STANDARD">Geen Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Geen marketing subscriptions gevonden
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Eigenaar</TableHead>
                    <TableHead>Woning</TableHead>
                    <TableHead>Pakket</TableHead>
                    <TableHead>Bedrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sub.user.name}</div>
                          <div className="text-sm text-muted-foreground">{sub.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sub.property.listingNumber}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {sub.property.title}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPackageBadge(sub.packageType)}</TableCell>
                      <TableCell>
                        {sub.packageType === "STANDARD" ? (
                          <div className="text-slate-500 italic">
                            Geen investering
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium">
                              ฿{formatTHB(sub.calculatedAmount || 0)}
                              {sub.packageType === "MARKETING_FEE" && <span className="text-xs text-muted-foreground">/mnd</span>}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {sub.packageType === "MARKETING_FEE" ? "0.25%/mnd" : "15%"} van ฿{formatTHB(sub.propertyPrice)}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(sub.createdAt).toLocaleDateString("nl-NL")}
                        </div>
                        {sub.signedAt && (
                          <div className="text-xs text-muted-foreground">
                            Actief: {new Date(sub.signedAt).toLocaleDateString("nl-NL")}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openActionModal(sub, "view")}>
                              <Eye className="h-4 w-4 mr-2" />
                              Bekijken
                            </DropdownMenuItem>
                            {sub.status === "PENDING" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => openActionModal(sub, "approve")}
                                  className="text-green-600"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Goedkeuren
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openActionModal(sub, "reject")}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Afwijzen
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={actionModalOpen} onOpenChange={setActionModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {actionType === "approve" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {actionType === "reject" && <XCircle className="h-5 w-5 text-red-600" />}
              {actionType === "view" && <Eye className="h-5 w-5" />}
              {actionType === "approve" && "Subscription Goedkeuren"}
              {actionType === "reject" && "Subscription Afwijzen"}
              {actionType === "view" && "Subscription Details"}
            </DialogTitle>
          </DialogHeader>

          {selectedSubscription && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Eigenaar</Label>
                  <div className="font-medium">{selectedSubscription.user.name}</div>
                  <div className="text-sm text-muted-foreground">{selectedSubscription.user.email}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Woning</Label>
                  <div className="font-medium">{selectedSubscription.property.listingNumber}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {selectedSubscription.property.title}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Pakket</Label>
                  <div>{getPackageBadge(selectedSubscription.packageType)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Bedrag</Label>
                  <div className="font-bold text-lg">
                    ฿{formatTHB(selectedSubscription.calculatedAmount || 0)}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Woningprijs</Label>
                <div className="font-medium">฿{formatTHB(selectedSubscription.propertyPrice)}</div>
              </div>

              {selectedSubscription.ownerNote && (
                <div>
                  <Label className="text-muted-foreground">Opmerking Eigenaar</Label>
                  <div className="mt-1 p-3 bg-muted rounded-lg text-sm">
                    {selectedSubscription.ownerNote}
                  </div>
                </div>
              )}

              {actionType !== "view" && (
                <div className="space-y-2">
                  <Label>Admin Notitie</Label>
                  <Textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Voeg een notitie toe..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModalOpen(false)} disabled={submitting}>
              {actionType === "view" ? "Sluiten" : "Annuleren"}
            </Button>
            {actionType !== "view" && (
              <Button
                onClick={handleAction}
                disabled={submitting}
                className={
                  actionType === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {actionType === "approve" ? "Goedkeuren" : "Afwijzen"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
