"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Phone,
  Home,
  User,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { nl } from "date-fns/locale";
import Link from "next/link";

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
  location: string;
  price: string;
  status: string;
  slug: string;
}

interface Owner {
  id: string;
  name: string;
  email: string;
}

interface PriceRequest {
  id: string;
  propertyId: string;
  ownerUserId: string;
  currentPrice: string;
  requestedPrice: string;
  percentageChange: number;
  ownerPhone: string | null;
  ownerNote: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "AUTO_APPLIED" | "CANCELLED";
  requiresApproval: boolean;
  reviewedBy: string | null;
  reviewedByName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  appliedAt: string | null;
  createdAt: string;
  property?: Property;
  owner?: Owner;
}

export function OwnerPriceRequestsTable() {
  const [requests, setRequests] = useState<PriceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  // Review modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PriceRequest | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);

      const response = await fetch(`/api/owner-portal/price-requests?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests || []);
        setPendingCount(data.pendingCount || 0);
      } else {
        toast.error(data.error || "Failed to fetch requests");
      }
    } catch (error) {
      toast.error("Failed to fetch requests");
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (request: PriceRequest) => {
    setSelectedRequest(request);
    setReviewNote("");
    setReviewModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      setProcessing(true);
      const response = await fetch(
        `/api/owner-portal/price-requests/${selectedRequest.id}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewNote }),
        }
      );

      if (response.ok) {
        toast.success("Prijswijziging goedgekeurd en toegepast!");
        setReviewModalOpen(false);
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to approve");
      }
    } catch (error) {
      toast.error("Failed to approve");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    if (!reviewNote.trim()) {
      toast.error("Geef een reden voor afwijzing");
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(
        `/api/owner-portal/price-requests/${selectedRequest.id}/reject`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reviewNote }),
        }
      );

      if (response.ok) {
        toast.success("Prijswijziging afgewezen");
        setReviewModalOpen(false);
        fetchRequests();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to reject");
      }
    } catch (error) {
      toast.error("Failed to reject");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge className="bg-yellow-500">
            <Clock className="h-3 w-3 mr-1" /> In Afwachting
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Goedgekeurd
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" /> Afgewezen
          </Badge>
        );
      case "AUTO_APPLIED":
        return (
          <Badge variant="secondary">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Auto-Toegepast
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriceChangeIcon = (percentageChange: number) => {
    if (percentageChange > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    }
    return <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Alert */}
      {pendingCount > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium">
                  {pendingCount} prijswijziging{pendingCount > 1 ? "en" : ""} wacht
                  {pendingCount > 1 ? "en" : ""} op goedkeuring
                </p>
                <p className="text-sm text-muted-foreground">
                  Eigenaren hebben hun telefoonnummer achtergelaten voor contact
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Prijswijziging Verzoeken</h3>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">In Afwachting</SelectItem>
            <SelectItem value="APPROVED">Goedgekeurd</SelectItem>
            <SelectItem value="REJECTED">Afgewezen</SelectItem>
            <SelectItem value="AUTO_APPLIED">Auto-Toegepast</SelectItem>
            <SelectItem value="all">Alle</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              Geen prijswijzigingen gevonden
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <Card
              key={request.id}
              className={
                request.status === "PENDING"
                  ? "border-yellow-500/50"
                  : ""
              }
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      {request.property?.listingNumber || "N/A"} -{" "}
                      {request.property?.title || "Unknown Property"}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {request.owner?.name || "Unknown Owner"}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                          locale: nl,
                        })}
                      </span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-4 items-center">
                  {/* Price Change Display */}
                  <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                    <span className="text-muted-foreground line-through">
                      {request.currentPrice}
                    </span>
                    <span className="text-lg">→</span>
                    <span className="font-semibold">{request.requestedPrice}</span>
                    {getPriceChangeIcon(request.percentageChange)}
                    <Badge
                      variant={
                        Math.abs(request.percentageChange) > 10
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {request.percentageChange > 0 ? "+" : ""}
                      {request.percentageChange.toFixed(1)}%
                    </Badge>
                  </div>

                  {/* Contact Info */}
                  {request.ownerPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={`tel:${request.ownerPhone}`}
                        className="text-primary hover:underline"
                      >
                        {request.ownerPhone}
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  {request.status === "PENDING" && (
                    <div className="flex gap-2 ml-auto">
                      <Button size="sm" onClick={() => openReviewModal(request)}>
                        Beoordelen
                      </Button>
                    </div>
                  )}

                  {request.property?.slug && (
                    <Link
                      href={`/properties/${request.property.slug}`}
                      target="_blank"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Bekijk
                    </Link>
                  )}
                </div>

                {/* Owner Note */}
                {request.ownerNote && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm">
                    <span className="font-medium">Opmerking eigenaar:</span>{" "}
                    {request.ownerNote}
                  </div>
                )}

                {/* Review Note */}
                {request.reviewNote && (
                  <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                    <span className="font-medium">
                      Beoordeeld door {request.reviewedByName}:
                    </span>{" "}
                    {request.reviewNote}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Prijswijziging Beoordelen</DialogTitle>
            <DialogDescription>
              Beoordeel het verzoek van de eigenaar om de prijs aan te passen
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="font-medium mb-2">
                  {selectedRequest.property?.listingNumber} -{" "}
                  {selectedRequest.property?.title}
                </p>
                <div className="flex items-center gap-2">
                  <span className="line-through text-muted-foreground">
                    {selectedRequest.currentPrice}
                  </span>
                  <span>→</span>
                  <span className="font-semibold">
                    {selectedRequest.requestedPrice}
                  </span>
                  <Badge
                    variant={
                      Math.abs(selectedRequest.percentageChange) > 10
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {selectedRequest.percentageChange > 0 ? "+" : ""}
                    {selectedRequest.percentageChange.toFixed(1)}%
                  </Badge>
                </div>
                {selectedRequest.ownerPhone && (
                  <p className="mt-2 text-sm">
                    <Phone className="h-3 w-3 inline mr-1" />
                    Contact: {selectedRequest.ownerPhone}
                  </p>
                )}
              </div>

              {selectedRequest.ownerNote && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <p className="text-sm">
                    <strong>Opmerking eigenaar:</strong> {selectedRequest.ownerNote}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reviewNote">
                  Notitie (verplicht bij afwijzing)
                </Label>
                <Textarea
                  id="reviewNote"
                  placeholder="Voeg een notitie toe..."
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setReviewModalOpen(false)}
                  disabled={processing}
                >
                  Annuleren
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={processing}
                >
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Afwijzen
                </Button>
                <Button onClick={handleApprove} disabled={processing}>
                  {processing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  Goedkeuren
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
