"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Gavel,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  FileCheck,
  User,
  Phone,
  Mail,
  Globe,
  Calendar,
  Shield,
  ArrowRightLeft,
  Flame,
} from "lucide-react";
import Image from "next/image";

interface Property {
  id: string;
  title: string;
  listingNumber: string;
  price: string;
  type: string;
  biddingEnabled?: boolean;
}

interface Offer {
  id: string;
  offerAmount: number;
  offerCurrency: string;
  askingPriceAtOffer: number;
  percentageOfAsking: number;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerMessage: string | null;
  status: string;
  passportImageUrl: string | null;
  passportUploadedAt: string | null;
  passportFirstName: string | null;
  passportLastName: string | null;
  passportFullName: string | null;
  passportNationality: string | null;
  passportNumber: string | null;
  passportDateOfBirth: string | null;
  passportExpiry: string | null;
  passportGender: string | null;
  ocrConfidence: number | null;
  expiresAt: string;
  createdAt: string;
  daysRemaining: number;
  hasPassport: boolean;
  property: {
    id: string;
    title: string;
    listingNumber: string;
    price: string;
    image: string;
    location: string;
  };
}

interface OffersTabProps {
  properties: Property[];
  lang: "en" | "nl";
}

const translations = {
  en: {
    title: "Offers",
    subtitle: "Manage offers on your properties",
    noOffers: "No offers yet",
    noOffersDesc: "When buyers place offers on your properties, they will appear here.",
    enableBidding: "Enable bidding",
    disableBidding: "Disable bidding",
    biddingSettings: "Bidding Settings",
    biddingEnabled: "Bidding enabled",
    biddingDisabled: "Bidding disabled",
    pendingPassport: "Waiting for passport",
    active: "Active",
    accepted: "Accepted",
    rejected: "Rejected",
    countered: "Counter offer",
    expired: "Expired",
    cancelled: "Cancelled",
    daysRemaining: "days remaining",
    dayRemaining: "day remaining",
    ofAsking: "of asking price",
    viewPassport: "View Passport",
    accept: "Accept",
    reject: "Reject",
    counterOffer: "Counter Offer",
    cancel: "Cancel",
    buyerInfo: "Buyer Information",
    passportData: "Passport Data",
    confirmAction: "Confirm Action",
    acceptOffer: "Accept this offer?",
    acceptDesc: "The property will be marked as sold and the buyer will be notified.",
    rejectOffer: "Reject this offer?",
    rejectReason: "Reason for rejection",
    counterAmount: "Counter offer amount",
    confirm: "Confirm",
    stats: {
      total: "Total",
      pendingPassport: "Pending Passport",
      active: "Active",
      accepted: "Accepted",
    },
  },
  nl: {
    title: "Biedingen",
    subtitle: "Beheer biedingen op uw woningen",
    noOffers: "Nog geen biedingen",
    noOffersDesc: "Wanneer kopers bieden op uw woningen, verschijnen ze hier.",
    enableBidding: "Biedingen inschakelen",
    disableBidding: "Biedingen uitschakelen",
    biddingSettings: "Bieding Instellingen",
    biddingEnabled: "Biedingen ingeschakeld",
    biddingDisabled: "Biedingen uitgeschakeld",
    pendingPassport: "Wacht op paspoort",
    active: "Actief",
    accepted: "Geaccepteerd",
    rejected: "Afgewezen",
    countered: "Tegenbod",
    expired: "Verlopen",
    cancelled: "Geannuleerd",
    daysRemaining: "dagen resterend",
    dayRemaining: "dag resterend",
    ofAsking: "van vraagprijs",
    viewPassport: "Bekijk Paspoort",
    accept: "Accepteren",
    reject: "Afwijzen",
    counterOffer: "Tegenbod",
    cancel: "Annuleren",
    buyerInfo: "Koper Informatie",
    passportData: "Paspoort Gegevens",
    confirmAction: "Bevestig Actie",
    acceptOffer: "Dit bod accepteren?",
    acceptDesc: "De woning wordt gemarkeerd als verkocht en de koper wordt geïnformeerd.",
    rejectOffer: "Dit bod afwijzen?",
    rejectReason: "Reden voor afwijzing",
    counterAmount: "Tegenbod bedrag",
    confirm: "Bevestigen",
    stats: {
      total: "Totaal",
      pendingPassport: "Wacht op Paspoort",
      active: "Actief",
      accepted: "Geaccepteerd",
    },
  },
};

export default function OffersTab({ properties, lang }: OffersTabProps) {
  const t = translations[lang];
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [biddingSettings, setBiddingSettings] = useState<Record<string, boolean>>({});
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    offerId: string;
    action: "ACCEPT" | "REJECT" | "COUNTER" | "CANCEL" | null;
    offer: Offer | null;
  }>({ open: false, offerId: "", action: null, offer: null });
  const [passportModal, setPassportModal] = useState<{
    open: boolean;
    offerId: string;
    passportData: any;
    passportUrl: string;
  }>({ open: false, offerId: "", passportData: null, passportUrl: "" });
  const [rejectReason, setRejectReason] = useState("");
  const [counterAmount, setCounterAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch offers
  const fetchOffers = async () => {
    try {
      const response = await fetch("/api/owner-portal/offers");
      if (response.ok) {
        const data = await response.json();
        setOffers(data.offers);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch offers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    
    // Initialize bidding settings
    const settings: Record<string, boolean> = {};
    properties.forEach(p => {
      settings[p.id] = p.biddingEnabled || false;
    });
    setBiddingSettings(settings);
  }, [properties]);

  // Toggle bidding
  const toggleBidding = async (propertyId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/owner-portal/properties/${propertyId}/bidding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setBiddingSettings(prev => ({ ...prev, [propertyId]: enabled }));
        toast.success(enabled ? t.biddingEnabled : t.biddingDisabled);
      } else {
        const data = await response.json();
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Failed to update bidding settings");
    }
  };

  // View passport
  const viewPassport = async (offerId: string) => {
    try {
      const response = await fetch(`/api/offers/${offerId}/passport`);
      if (response.ok) {
        const data = await response.json();
        setPassportModal({
          open: true,
          offerId,
          passportData: data.passportData,
          passportUrl: data.passportUrl,
        });
      } else {
        toast.error("Kon paspoort niet laden");
      }
    } catch (error) {
      toast.error("Kon paspoort niet laden");
    }
  };

  // Handle action
  const handleAction = async () => {
    if (!actionModal.action || !actionModal.offerId) return;

    setSubmitting(true);

    try {
      const response = await fetch(`/api/offers/${actionModal.offerId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionModal.action,
          rejectionReason: rejectReason,
          counterOfferAmount: counterAmount ? parseFloat(counterAmount.replace(/,/g, "")) : undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setActionModal({ open: false, offerId: "", action: null, offer: null });
        setRejectReason("");
        setCounterAmount("");
        fetchOffers(); // Refresh
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      toast.error("Actie mislukt");
    } finally {
      setSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_PASSPORT":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700"><Clock className="h-3 w-3 mr-1" />{t.pendingPassport}</Badge>;
      case "ACTIVE":
        return <Badge className="bg-blue-500"><Flame className="h-3 w-3 mr-1" />{t.active}</Badge>;
      case "ACCEPTED":
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />{t.accepted}</Badge>;
      case "REJECTED":
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{t.rejected}</Badge>;
      case "COUNTERED":
        return <Badge className="bg-purple-500"><ArrowRightLeft className="h-3 w-3 mr-1" />{t.countered}</Badge>;
      case "EXPIRED":
        return <Badge variant="outline" className="text-slate-500"><Clock className="h-3 w-3 mr-1" />{t.expired}</Badge>;
      case "CANCELLED":
        return <Badge variant="outline" className="text-red-500"><XCircle className="h-3 w-3 mr-1" />{t.cancelled}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Sale properties only
  const saleProperties = properties.filter(p => p.type === "FOR_SALE");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">{t.stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-amber-600">{stats.pendingPassport}</div>
              <p className="text-xs text-muted-foreground">{t.stats.pendingPassport}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
              <p className="text-xs text-muted-foreground">{t.stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <p className="text-xs text-muted-foreground">{t.stats.accepted}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bidding Settings per Property */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            {t.biddingSettings}
          </CardTitle>
          <CardDescription>{lang === "nl" ? "Schakel biedingen in of uit per woning" : "Enable or disable bidding per property"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {saleProperties.map(property => (
              <div key={property.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{property.title}</p>
                  <p className="text-sm text-muted-foreground">{property.listingNumber} • {property.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`bidding-${property.id}`} className="text-sm">
                    {biddingSettings[property.id] ? t.biddingEnabled : t.biddingDisabled}
                  </Label>
                  <Switch
                    id={`bidding-${property.id}`}
                    checked={biddingSettings[property.id] || false}
                    onCheckedChange={(checked) => toggleBidding(property.id, checked)}
                  />
                </div>
              </div>
            ))}
            {saleProperties.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                {lang === "nl" ? "Geen koopwoningen beschikbaar" : "No sale properties available"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offers List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.title}</CardTitle>
          <CardDescription>{t.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          {offers.length === 0 ? (
            <div className="text-center py-12">
              <Gavel className="h-12 w-12 mx-auto text-slate-300 mb-4" />
              <p className="font-medium">{t.noOffers}</p>
              <p className="text-sm text-muted-foreground">{t.noOffersDesc}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map(offer => (
                <div 
                  key={offer.id}
                  className="border rounded-xl p-4 space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden">
                        <Image
                          src={offer.property.image}
                          alt={offer.property.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium">{offer.property.title}</p>
                        <p className="text-sm text-muted-foreground">{offer.property.listingNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(offer.status)}
                      {offer.status === "ACTIVE" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {offer.daysRemaining} {offer.daysRemaining === 1 ? t.dayRemaining : t.daysRemaining}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Offer Details */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Bod</p>
                        <p className="text-2xl font-bold">฿{offer.offerAmount.toLocaleString()}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={offer.percentageOfAsking >= 90 ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}
                      >
                        {offer.percentageOfAsking.toFixed(1)}% {t.ofAsking}
                      </Badge>
                    </div>
                  </div>

                  {/* Buyer Info */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">{t.buyerInfo}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{offer.hasPassport ? offer.passportFullName || offer.buyerName : offer.buyerName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{offer.buyerPhone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{offer.buyerEmail}</span>
                      </div>
                      {offer.passportNationality && (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{offer.passportNationality}</span>
                        </div>
                      )}
                    </div>
                    {offer.buyerMessage && (
                      <p className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 p-3 rounded-lg mt-2">
                        "{offer.buyerMessage}"
                      </p>
                    )}
                  </div>

                  {/* Passport Status */}
                  {offer.hasPassport ? (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-500">
                        <FileCheck className="h-3 w-3 mr-1" />
                        Paspoort ontvangen
                      </Badge>
                      {offer.passportNumber && (
                        <span className="text-sm text-muted-foreground">
                          #{offer.passportNumber}
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewPassport(offer.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t.viewPassport}
                      </Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700">
                      <Clock className="h-3 w-3 mr-1" />
                      {t.pendingPassport}
                    </Badge>
                  )}

                  {/* Actions */}
                  {offer.status === "ACTIVE" && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => setActionModal({ open: true, offerId: offer.id, action: "ACCEPT", offer })}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {t.accept}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setActionModal({ open: true, offerId: offer.id, action: "REJECT", offer })}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t.reject}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActionModal({ open: true, offerId: offer.id, action: "COUNTER", offer })}
                      >
                        <ArrowRightLeft className="h-4 w-4 mr-2" />
                        {t.counterOffer}
                      </Button>
                      {offer.percentageOfAsking < 90 && (
                        <Button
                          variant="outline"
                          className="text-red-600"
                          onClick={() => setActionModal({ open: true, offerId: offer.id, action: "CANCEL", offer })}
                        >
                          {t.cancel}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Modal */}
      <Dialog open={actionModal.open} onOpenChange={(open) => !open && setActionModal({ open: false, offerId: "", action: null, offer: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmAction}</DialogTitle>
            <DialogDescription>
              {actionModal.action === "ACCEPT" && t.acceptDesc}
              {actionModal.action === "REJECT" && t.rejectOffer}
              {actionModal.action === "COUNTER" && (lang === "nl" ? "Doe een tegenbod aan de koper" : "Make a counter offer to the buyer")}
              {actionModal.action === "CANCEL" && (lang === "nl" ? "Annuleer dit bod (onder 90%)" : "Cancel this offer (under 90%)")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionModal.action === "REJECT" && (
              <div className="space-y-2">
                <Label>{t.rejectReason}</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={lang === "nl" ? "Geef een reden op..." : "Enter a reason..."}
                />
              </div>
            )}

            {actionModal.action === "COUNTER" && (
              <div className="space-y-2">
                <Label>{t.counterAmount}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                  <Input
                    type="text"
                    value={counterAmount}
                    onChange={(e) => setCounterAmount(e.target.value.replace(/[^0-9,]/g, ""))}
                    placeholder={actionModal.offer?.askingPriceAtOffer?.toLocaleString() || ""}
                    className="pl-8"
                  />
                </div>
                {actionModal.offer && (
                  <p className="text-sm text-muted-foreground">
                    Huidig bod: ฿{actionModal.offer.offerAmount.toLocaleString()} | Vraagprijs: ฿{actionModal.offer.askingPriceAtOffer.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionModal({ open: false, offerId: "", action: null, offer: null })}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleAction}
              disabled={submitting || (actionModal.action === "REJECT" && !rejectReason) || (actionModal.action === "COUNTER" && !counterAmount)}
              className={actionModal.action === "ACCEPT" ? "bg-green-600" : actionModal.action === "REJECT" ? "bg-red-600" : ""}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Passport Viewer Modal */}
      <Dialog open={passportModal.open} onOpenChange={(open) => !open && setPassportModal({ open: false, offerId: "", passportData: null, passportUrl: "" })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t.passportData}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {passportModal.passportUrl && (
              <div className="relative aspect-[3/2] rounded-xl overflow-hidden border">
                <Image
                  src={passportModal.passportUrl}
                  alt="Passport"
                  fill
                  className="object-contain"
                />
              </div>
            )}

            {passportModal.passportData && (
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div>
                  <Label className="text-muted-foreground">Volledige naam</Label>
                  <p className="font-medium">{passportModal.passportData.fullName || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Nationaliteit</Label>
                  <p className="font-medium">{passportModal.passportData.nationality || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Paspoort nummer</Label>
                  <p className="font-medium">{passportModal.passportData.passportNumber || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Geboortedatum</Label>
                  <p className="font-medium">
                    {passportModal.passportData.dateOfBirth 
                      ? new Date(passportModal.passportData.dateOfBirth).toLocaleDateString("nl-NL") 
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Geldig tot</Label>
                  <p className="font-medium">
                    {passportModal.passportData.expiry 
                      ? new Date(passportModal.passportData.expiry).toLocaleDateString("nl-NL") 
                      : "-"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Geslacht</Label>
                  <p className="font-medium">
                    {passportModal.passportData.gender === "M" ? "Man" : passportModal.passportData.gender === "F" ? "Vrouw" : "-"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
