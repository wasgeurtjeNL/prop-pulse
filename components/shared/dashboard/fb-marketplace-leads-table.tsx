"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { toast } from "sonner";
import { FbLeadImportModal } from "./fb-lead-import-modal";
import { FbLeadDetailModal } from "./fb-lead-detail-modal";
import { FbLeadContactModal } from "./fb-lead-contact-modal";

interface FbMarketplaceLead {
  id: string;
  facebookId: string | null;
  listingUrl: string;
  sellerName: string;
  sellerPhone: string | null;
  sellerWhatsapp: string | null;
  sellerLineId: string | null;
  sellerEmail: string | null;
  sellerFacebookUrl: string | null;
  propertyTitle: string;
  price: string | null;
  location: string | null;
  description: string | null;
  images: string[];
  propertyType: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqm: number | null;
  status: string;
  priority: number;
  score: number | null;
  contactedAt: string | null;
  contactMethod: string | null;
  contactNotes: string | null;
  followUpDate: string | null;
  contactHistory: any[] | null;
  assignedTo: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function FbMarketplaceLeadsTable() {
  const [leads, setLeads] = useState<FbMarketplaceLead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<FbMarketplaceLead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      let url = "/api/fb-marketplace-leads";
      const params = new URLSearchParams();
      
      if (filter !== "all") {
        params.set("status", filter);
      }
      if (search) {
        params.set("search", search);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setLeads(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch leads:", error);
      toast.error("Kon leads niet ophalen");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      NEW: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      CONTACTED: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      RESPONDED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      INTERESTED: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
      NOT_INTERESTED: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
      CONVERTED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      DUPLICATE: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      INVALID: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };

    const labels: Record<string, string> = {
      NEW: "Nieuw",
      CONTACTED: "Gecontacteerd",
      RESPONDED: "Gereageerd",
      INTERESTED: "Geïnteresseerd",
      NOT_INTERESTED: "Niet Geïnteresseerd",
      CONVERTED: "Geconverteerd",
      DUPLICATE: "Duplicaat",
      INVALID: "Ongeldig",
    };

    return (
      <Badge className={variants[status] || variants.NEW}>
        {labels[status] || status}
      </Badge>
    );
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(leadId);
    try {
      const response = await fetch(`/api/fb-marketplace-leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Status bijgewerkt");
        setLeads(leads.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        ));
      } else {
        toast.error("Kon status niet bijwerken");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Kon status niet bijwerken");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Weet je zeker dat je deze lead wilt verwijderen?")) return;

    try {
      const response = await fetch(`/api/fb-marketplace-leads/${leadId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Lead verwijderd");
        fetchLeads();
      } else {
        toast.error("Kon lead niet verwijderen");
      }
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Kon lead niet verwijderen");
    }
  };

  const exportCSV = () => {
    const url = filter !== "all" 
      ? `/api/fb-marketplace-leads/export?status=${filter}`
      : "/api/fb-marketplace-leads/export";
    window.open(url, "_blank");
  };

  const viewLeadDetails = (lead: FbMarketplaceLead) => {
    setSelectedLead(lead);
    setIsDetailsOpen(true);
  };

  const openContactModal = (lead: FbMarketplaceLead) => {
    setSelectedLead(lead);
    setIsContactOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Icon icon="ph:circle-notch" className="animate-spin text-primary" width={32} height={32} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
          >
            Alle
          </Button>
          <Button
            variant={filter === "NEW" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("NEW")}
          >
            Nieuw
          </Button>
          <Button
            variant={filter === "CONTACTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("CONTACTED")}
          >
            Gecontacteerd
          </Button>
          <Button
            variant={filter === "INTERESTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("INTERESTED")}
          >
            Geïnteresseerd
          </Button>
          <Button
            variant={filter === "CONVERTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("CONVERTED")}
          >
            Geconverteerd
          </Button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Icon
              icon="ph:magnifying-glass"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              width={16}
              height={16}
            />
            <Input
              placeholder="Zoeken..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Icon icon="ph:download-simple-bold" className="mr-2" width={16} height={16} />
            CSV
          </Button>
          <Button size="sm" onClick={() => setIsImportOpen(true)}>
            <Icon icon="ph:plus-bold" className="mr-2" width={16} height={16} />
            Toevoegen
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
        <Table className="min-w-[700px] w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Verkoper</TableHead>
              <TableHead>Woning</TableHead>
              <TableHead className="hidden sm:table-cell">Prijs</TableHead>
              <TableHead className="hidden md:table-cell">Locatie</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden sm:table-cell">Datum</TableHead>
              <TableHead className="text-right">Acties</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Geen Facebook Marketplace leads gevonden
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{lead.sellerName}</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {lead.sellerPhone && (
                          <a 
                            href={`tel:${lead.sellerPhone}`}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                            title="Bellen"
                          >
                            <Icon icon="ph:phone" width={12} height={12} />
                            {lead.sellerPhone}
                          </a>
                        )}
                        {(lead.sellerWhatsapp || lead.sellerPhone) && (
                          <a 
                            href={`https://wa.me/${(lead.sellerWhatsapp || lead.sellerPhone || "").replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-green-600 hover:underline flex items-center gap-1"
                            title="WhatsApp"
                          >
                            <Icon icon="ph:whatsapp-logo" width={12} height={12} />
                            WA
                          </a>
                        )}
                        {lead.sellerLineId && (
                          <a 
                            href={`https://line.me/ti/p/~${lead.sellerLineId.replace("@", "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                            title={`Line: ${lead.sellerLineId}`}
                          >
                            <Icon icon="simple-icons:line" width={12} height={12} />
                            {lead.sellerLineId}
                          </a>
                        )}
                      </div>
                      {lead.sellerEmail && (
                        <a 
                          href={`mailto:${lead.sellerEmail}`}
                          className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
                        >
                          <Icon icon="ph:envelope" width={12} height={12} />
                          {lead.sellerEmail}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 max-w-[200px]">
                      <span className="font-medium truncate">{lead.propertyTitle}</span>
                      {(lead.bedrooms || lead.sqm) && (
                        <span className="text-xs text-muted-foreground">
                          {lead.bedrooms && `${lead.bedrooms} slk`}
                          {lead.bedrooms && lead.sqm && " • "}
                          {lead.sqm && `${lead.sqm} m²`}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {lead.price || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-sm">{lead.location || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      onValueChange={(value) => updateLeadStatus(lead.id, value)}
                      disabled={updatingStatus === lead.id}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NEW">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Nieuw
                          </span>
                        </SelectItem>
                        <SelectItem value="CONTACTED">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            Gecontacteerd
                          </span>
                        </SelectItem>
                        <SelectItem value="RESPONDED">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            Gereageerd
                          </span>
                        </SelectItem>
                        <SelectItem value="INTERESTED">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
                            Geïnteresseerd
                          </span>
                        </SelectItem>
                        <SelectItem value="NOT_INTERESTED">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                            Niet Geïnteresseerd
                          </span>
                        </SelectItem>
                        <SelectItem value="CONVERTED">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Geconverteerd
                          </span>
                        </SelectItem>
                        <SelectItem value="DUPLICATE">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            Duplicaat
                          </span>
                        </SelectItem>
                        <SelectItem value="INVALID">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            Ongeldig
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(lead.createdAt), "d MMM yyyy", { locale: nl })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Icon icon="ph:dots-three-vertical-bold" width={20} height={20} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acties</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => viewLeadDetails(lead)}>
                          <Icon icon="ph:eye-bold" className="mr-2" width={16} height={16} />
                          Details Bekijken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openContactModal(lead)}>
                          <Icon icon="ph:phone-call-bold" className="mr-2" width={16} height={16} />
                          Contact Registreren
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.open(lead.listingUrl, "_blank")}>
                          <Icon icon="ph:facebook-logo-bold" className="mr-2" width={16} height={16} />
                          FB Listing Openen
                        </DropdownMenuItem>
                        {lead.sellerPhone && (
                          <>
                            <DropdownMenuItem onClick={() => window.location.href = `tel:${lead.sellerPhone}`}>
                              <Icon icon="ph:phone-bold" className="mr-2" width={16} height={16} />
                              Bellen
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.open(`https://wa.me/${lead.sellerPhone?.replace(/[^0-9]/g, "")}`, "_blank")}>
                              <Icon icon="ph:whatsapp-logo-bold" className="mr-2" width={16} height={16} />
                              WhatsApp
                            </DropdownMenuItem>
                          </>
                        )}
                        {lead.sellerEmail && (
                          <DropdownMenuItem onClick={() => window.location.href = `mailto:${lead.sellerEmail}`}>
                            <Icon icon="ph:envelope-bold" className="mr-2" width={16} height={16} />
                            Email Sturen
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => deleteLead(lead.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Icon icon="ph:trash-bold" className="mr-2" width={16} height={16} />
                          Verwijderen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Modals */}
      <FbLeadImportModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onSuccess={fetchLeads}
      />

      {selectedLead && (
        <>
          <FbLeadDetailModal
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            lead={selectedLead}
            onContactClick={() => {
              setIsDetailsOpen(false);
              setIsContactOpen(true);
            }}
          />
          <FbLeadContactModal
            open={isContactOpen}
            onOpenChange={setIsContactOpen}
            lead={selectedLead}
            onSuccess={() => {
              fetchLeads();
              setIsContactOpen(false);
            }}
          />
        </>
      )}
    </div>
  );
}
