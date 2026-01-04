"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";

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

interface FbLeadDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: FbMarketplaceLead;
  onContactClick?: () => void;
}

export function FbLeadDetailModal({
  open,
  onOpenChange,
  lead,
  onContactClick,
}: FbLeadDetailModalProps) {
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

  const getPropertyTypeLabel = (type: string | null) => {
    if (!type) return "Onbekend";
    const types: Record<string, string> = {
      house: "Huis",
      apartment: "Appartement",
      villa: "Villa",
      townhouse: "Rijwoning",
      bungalow: "Bungalow",
      land: "Grond",
      other: "Anders",
    };
    return types[type] || type;
  };

  const getContactMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      phone: "ph:phone-bold",
      email: "ph:envelope-bold",
      whatsapp: "ph:whatsapp-logo-bold",
      messenger: "ph:messenger-logo-bold",
    };
    return icons[method] || "ph:chat-bold";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="ph:user-bold" className="text-primary" width={20} height={20} />
            Lead Details
          </DialogTitle>
          <DialogDescription>
            Bekijk alle informatie over deze Facebook Marketplace lead
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seller Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Icon icon="ph:user-bold" className="text-primary" width={20} height={20} />
              Verkoper Informatie
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <p className="text-sm text-muted-foreground">Naam</p>
                <p className="font-medium">{lead.sellerName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">{getStatusBadge(lead.status)}</div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefoon</p>
                <p className="font-medium">{lead.sellerPhone || "Niet bekend"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{lead.sellerEmail || "Niet bekend"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-medium">{lead.sellerWhatsapp || "Niet bekend"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Line ID</p>
                <p className="font-medium">{lead.sellerLineId || "Niet bekend"}</p>
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Icon icon="ph:house-bold" className="text-primary" width={20} height={20} />
              Woning Details
            </h3>
            <div className="pl-7 space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="font-semibold text-lg">{lead.propertyTitle}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                  {lead.price && (
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                      {lead.price}
                    </span>
                  )}
                  {lead.location && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Icon icon="ph:map-pin" width={14} height={14} />
                      {lead.location}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{getPropertyTypeLabel(lead.propertyType)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Slaapkamers</p>
                  <p className="font-medium">{lead.bedrooms ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Badkamers</p>
                  <p className="font-medium">{lead.bathrooms ?? "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Oppervlakte</p>
                  <p className="font-medium">{lead.sqm ? `${lead.sqm} m²` : "-"}</p>
                </div>
              </div>

              {lead.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Beschrijving</p>
                  <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                    {lead.description}
                  </p>
                </div>
              )}

              <div>
                <a
                  href={lead.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 hover:underline text-sm"
                >
                  <Icon icon="ph:facebook-logo-bold" width={16} height={16} />
                  Bekijk Facebook Listing
                  <Icon icon="ph:arrow-square-out" width={14} height={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Contact History */}
          {lead.contactHistory && lead.contactHistory.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Icon icon="ph:clock-clockwise-bold" className="text-primary" width={20} height={20} />
                Contact Geschiedenis
              </h3>
              <div className="pl-7 space-y-2">
                {lead.contactHistory.map((contact: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <Icon
                      icon={getContactMethodIcon(contact.method)}
                      className="text-primary mt-0.5"
                      width={18}
                      height={18}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium capitalize">{contact.method}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          {format(new Date(contact.date), "d MMM yyyy HH:mm", { locale: nl })}
                        </span>
                        {contact.outcome && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Badge variant="outline" className="text-xs">
                              {contact.outcome}
                            </Badge>
                          </>
                        )}
                      </div>
                      {contact.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{contact.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {lead.contactNotes && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Icon icon="ph:note-bold" className="text-primary" width={20} height={20} />
                Notities
              </h3>
              <div className="pl-7">
                <p className="text-sm bg-muted p-3 rounded-md whitespace-pre-wrap">
                  {lead.contactNotes}
                </p>
              </div>
            </div>
          )}

          {/* Meta Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Icon icon="ph:info-bold" className="text-primary" width={20} height={20} />
              Informatie
            </h3>
            <div className="grid grid-cols-2 gap-4 pl-7">
              <div>
                <p className="text-sm text-muted-foreground">Toegevoegd</p>
                <p className="font-medium">
                  {format(new Date(lead.createdAt), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                </p>
              </div>
              {lead.contactedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Laatst Gecontacteerd</p>
                  <p className="font-medium">
                    {format(new Date(lead.contactedAt), "d MMMM yyyy 'om' HH:mm", { locale: nl })}
                  </p>
                </div>
              )}
              {lead.followUpDate && (
                <div>
                  <p className="text-sm text-muted-foreground">Follow-up Datum</p>
                  <p className="font-medium">
                    {format(new Date(lead.followUpDate), "d MMMM yyyy", { locale: nl })}
                  </p>
                </div>
              )}
              {lead.assignedTo && (
                <div>
                  <p className="text-sm text-muted-foreground">Toegewezen Aan</p>
                  <p className="font-medium">{lead.assignedTo.name}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            {lead.sellerPhone && (
              <Button
                onClick={() => window.location.href = `tel:${lead.sellerPhone}`}
                variant="outline"
                className="bg-blue-50 hover:bg-blue-100 border-blue-200"
              >
                <Icon icon="ph:phone-bold" className="mr-2 text-blue-600" width={18} height={18} />
                Bellen
              </Button>
            )}
            {(lead.sellerWhatsapp || lead.sellerPhone) && (
              <Button
                onClick={() => {
                  const number = (lead.sellerWhatsapp || lead.sellerPhone || "").replace(/[^0-9]/g, "");
                  window.open(`https://wa.me/${number}`, "_blank");
                }}
                variant="outline"
                className="bg-green-50 hover:bg-green-100 border-green-200"
              >
                <Icon icon="ph:whatsapp-logo-bold" className="mr-2 text-green-600" width={18} height={18} />
                WhatsApp
              </Button>
            )}
            {lead.sellerLineId && (
              <Button
                onClick={() => {
                  // Line deep link - opens Line app or web
                  const lineId = lead.sellerLineId?.replace("@", "");
                  window.open(`https://line.me/ti/p/~${lineId}`, "_blank");
                }}
                variant="outline"
                className="bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
              >
                <Icon icon="simple-icons:line" className="mr-2 text-emerald-600" width={18} height={18} />
                Line
              </Button>
            )}
            {lead.sellerEmail && (
              <Button
                onClick={() => window.location.href = `mailto:${lead.sellerEmail}`}
                variant="outline"
              >
                <Icon icon="ph:envelope-bold" className="mr-2" width={18} height={18} />
                Email
              </Button>
            )}
            <Button
              onClick={() => window.open(lead.listingUrl, "_blank")}
              variant="outline"
            >
              <Icon icon="ph:facebook-logo-bold" className="mr-2" width={18} height={18} />
              FB Listing
            </Button>
            <Button onClick={onContactClick}>
              <Icon icon="ph:phone-call-bold" className="mr-2" width={18} height={18} />
              Contact Registreren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
