"use client";

import { useState, useEffect, useMemo } from "react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Loader2,
  Building2,
  Link2,
  Link2Off,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Home,
  MapPin,
  RefreshCw,
  Filter,
  Info,
  CloudDownload,
  Users,
  Passport,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import TM30Overview from "@/components/shared/dashboard/tm30-overview";

// Types
interface TM30Accommodation {
  id: string;
  tm30Id: string | null;
  name: string;
  address: string;
  status: string;
  isLinked: boolean;
  linkedProperty: { id: string; title: string } | null;
}

interface PropertyWithTM30 {
  id: string;
  title: string;
  address: string | null;
  enableDailyRental: boolean;
  monthlyRentalPrice: number | null;
  tm30AccommodationId: string | null;
  tm30AccommodationName: string | null;
  isLinked: boolean;
  canBeRented: boolean;
  thumbnail: string | null;
}

interface Stats {
  totalRentalProperties: number;
  linkedRentalProperties: number;
  unlinkedRentalProperties: number;
  readyToRent: number;
  needsLinking: number;
}

export default function TM30LinkagePage() {
  // State
  const [accommodations, setAccommodations] = useState<TM30Accommodation[]>([]);
  const [properties, setProperties] = useState<PropertyWithTM30[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncConfigured, setSyncConfigured] = useState<boolean | null>(null);

  // Filters
  const [searchAccommodation, setSearchAccommodation] = useState("");
  const [searchProperty, setSearchProperty] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "linked" | "unlinked">("all");

  // Dialog state
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithTM30 | null>(null);
  const [selectedAccommodation, setSelectedAccommodation] = useState<string>("");

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, propRes, syncRes] = await Promise.all([
        fetch("/api/tm30/accommodations"),
        fetch("/api/tm30/properties?rentalOnly=true"),
        fetch("/api/tm30/sync"), // Check sync status
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccommodations(accData.accommodations || []);
      }

      if (propRes.ok) {
        const propData = await propRes.json();
        setProperties(propData.properties || []);
        setStats(propData.stats || null);
      }

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        setSyncConfigured(syncData.isConfigured === true);
      } else {
        setSyncConfigured(false);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Sync TM30 data from Thailand Immigration
  const handleSyncTM30 = async () => {
    setSyncing(true);
    try {
      const response = await fetch("/api/tm30/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Sync triggered!");
        toast.info("Make sure your self-hosted runner is active. Refresh in ~30 seconds.", {
          duration: 8000,
        });
      } else {
        toast.error(data.error || "Failed to trigger sync");
        if (data.message) {
          toast.info(data.message, { duration: 5000 });
        }
      }
    } catch (error) {
      toast.error("Failed to trigger sync");
    } finally {
      setSyncing(false);
    }
  };

  // Filter properties
  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchProperty.toLowerCase()) ||
        (p.address?.toLowerCase().includes(searchProperty.toLowerCase()) ?? false);

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "linked" && p.isLinked) ||
        (filterStatus === "unlinked" && !p.isLinked);

      return matchesSearch && matchesFilter;
    });
  }, [properties, searchProperty, filterStatus]);

  // Filter accommodations for dropdown
  const availableAccommodations = useMemo(() => {
    return accommodations.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchAccommodation.toLowerCase()) ||
        a.address.toLowerCase().includes(searchAccommodation.toLowerCase());
      // Show unlinked or currently linked to this property
      const isAvailable = !a.isLinked || a.linkedProperty?.id === selectedProperty?.id;
      return matchesSearch && isAvailable;
    });
  }, [accommodations, searchAccommodation, selectedProperty]);

  // Handle link property
  const handleLinkProperty = async () => {
    if (!selectedProperty || !selectedAccommodation) return;

    setLinking(true);
    try {
      const response = await fetch("/api/tm30/accommodations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          tm30AccommodationId: selectedAccommodation,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Property linked successfully!");
        setLinkDialogOpen(false);
        setSelectedProperty(null);
        setSelectedAccommodation("");
        fetchData(); // Refresh
      } else {
        toast.error(data.error || "Failed to link property");
      }
    } catch (error) {
      toast.error("Failed to link property");
    } finally {
      setLinking(false);
    }
  };

  // Handle unlink property
  const handleUnlinkProperty = async (propertyId: string, propertyTitle: string) => {
    if (!confirm(`Remove TM30 link from "${propertyTitle}"? This property won't be rentable until linked again.`)) {
      return;
    }

    try {
      const response = await fetch("/api/tm30/accommodations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Link removed");
        fetchData();
      } else {
        toast.error(data.error || "Failed to remove link");
      }
    } catch (error) {
      toast.error("Failed to remove link");
    }
  };

  // Open link dialog
  const openLinkDialog = (property: PropertyWithTM30) => {
    setSelectedProperty(property);
    setSelectedAccommodation("");
    setSearchAccommodation("");
    setLinkDialogOpen(true);
  };

  // State for active tab
  const [activeTab, setActiveTab] = useState("bookings");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-7 h-7 text-primary" />
            TM30 Immigration Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage TM30 registrations, passports, and property linkage
          </p>
        </div>
        <div className="flex gap-2">
          {syncConfigured === true ? (
            <Button 
              onClick={handleSyncTM30} 
              variant="default" 
              className="gap-2"
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudDownload className="w-4 h-4" />
              )}
              {syncing ? "Syncing..." : "Sync TM30"}
            </Button>
          ) : syncConfigured === false ? (
            <Button 
              variant="outline" 
              className="gap-2 text-muted-foreground"
              disabled
              title="GitHub integration not configured. Data is already synced in the database."
            >
              <Info className="w-4 h-4" />
              Manual Sync Only
            </Button>
          ) : null}
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="bookings" className="gap-2">
            <Users className="w-4 h-4" />
            Bookings & Passports
          </TabsTrigger>
          <TabsTrigger value="properties" className="gap-2">
            <Building2 className="w-4 h-4" />
            Property Linkage
          </TabsTrigger>
        </TabsList>

        {/* Bookings Tab - Passport Management */}
        <TabsContent value="bookings" className="mt-6">
          <TM30Overview />
        </TabsContent>

        {/* Properties Tab - Property Linkage */}
        <TabsContent value="properties" className="mt-6 space-y-6">
          {/* Stats Cards */}
          {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Rental Properties</p>
                  <p className="text-3xl font-bold">{stats.totalRentalProperties}</p>
                </div>
                <Home className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ready to Rent</p>
                  <p className="text-3xl font-bold text-green-600">{stats.readyToRent}</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Needs Linking</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.needsLinking}</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">Why is TM30 linking required?</p>
            <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
              <li>Thai law requires foreign guests to be registered with Immigration within 24 hours</li>
              <li>Each rental property must be linked to a TM30 registered address</li>
              <li><strong>Properties without a TM30 link cannot accept bookings</strong></li>
              <li>Once linked, passport collection and TM30 submission become automatic</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter Properties
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchProperty}
                onChange={(e) => setSearchProperty(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={filterStatus}
              onValueChange={(value: "all" | "linked" | "unlinked") => setFilterStatus(value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="linked">✅ Linked (Ready)</SelectItem>
                <SelectItem value="unlinked">⚠️ Unlinked (Needs Action)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Properties List */}
      <Card>
        <CardHeader>
          <CardTitle>Rental Properties ({filteredProperties.length})</CardTitle>
          <CardDescription>
            Click "Link TM30" to connect a property to its TM30 registered address
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProperties.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Home className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rental properties found</p>
              <p className="text-sm">Enable daily rental on properties to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredProperties.map((property) => (
                <div
                  key={property.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                    property.isLinked
                      ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                      : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900"
                  }`}
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* Thumbnail */}
                    {property.thumbnail ? (
                      <img
                        src={property.thumbnail}
                        alt={property.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <Home className="w-6 h-6 text-slate-400" />
                      </div>
                    )}

                    {/* Property Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                        {property.title}
                      </h3>
                      {property.address && (
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {property.address}
                        </p>
                      )}
                      {property.monthlyRentalPrice && (
                        <p className="text-sm text-muted-foreground">
                          ฿{property.monthlyRentalPrice.toLocaleString()}/month
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {property.isLinked ? (
                      <>
                        <div className="hidden sm:block text-right">
                          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Linked
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1 max-w-48 truncate">
                            {property.tm30AccommodationName}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlinkProperty(property.id, property.title)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Link2Off className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                          <XCircle className="w-3 h-3 mr-1" />
                          Not Linked
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => openLinkDialog(property)}
                          className="gap-1"
                        >
                          <Link2 className="w-4 h-4" />
                          Link TM30
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* TM30 Accommodations Overview */}
      <Card>
        <CardHeader>
          <CardTitle>TM30 Registered Addresses ({accommodations.length})</CardTitle>
          <CardDescription>
            All addresses registered in the TM30 immigration system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {accommodations.slice(0, 12).map((acc) => (
              <div
                key={acc.id}
                className={`p-3 rounded-lg border text-sm ${
                  acc.isLinked
                    ? "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{acc.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{acc.address}</p>
                  </div>
                  {acc.isLinked ? (
                    <Badge variant="secondary" className="flex-shrink-0 text-xs">
                      In Use
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="flex-shrink-0 text-xs text-green-600 border-green-300">
                      Available
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          {accommodations.length > 12 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              And {accommodations.length - 12} more addresses...
            </p>
          )}
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Property to TM30 Address</DialogTitle>
            <DialogDescription>
              Select the TM30 registered address for "{selectedProperty?.title}"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search TM30 addresses..."
                value={searchAccommodation}
                onChange={(e) => setSearchAccommodation(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Accommodation List */}
            <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
              {availableAccommodations.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No matching TM30 addresses found
                </p>
              ) : (
                availableAccommodations.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccommodation(acc.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedAccommodation === acc.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-slate-200 dark:border-slate-700 hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium">{acc.name}</p>
                    <p className="text-xs text-muted-foreground">{acc.address}</p>
                    <Badge
                      variant="outline"
                      className={`mt-2 text-xs ${
                        acc.status === "Approved"
                          ? "text-green-600 border-green-300"
                          : "text-amber-600 border-amber-300"
                      }`}
                    >
                      {acc.status}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkProperty}
              disabled={!selectedAccommodation || linking}
            >
              {linking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4 mr-2" />
                  Link Property
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

