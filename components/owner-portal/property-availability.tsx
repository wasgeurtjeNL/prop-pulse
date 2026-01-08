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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Calendar,
  Plus,
  Trash2,
  CalendarX,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";
import { getOwnerPortalTranslations, OwnerPortalLanguage } from "@/lib/i18n/owner-portal-translations";

interface PropertyAvailabilityProps {
  propertyId: string;
  propertyTitle: string;
  propertyType: "FOR_SALE" | "FOR_RENT";
  lang: OwnerPortalLanguage;
}

interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  blockedBy: string | null;
  createdAt: string;
}

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  status: string;
  guestName: string | null;
}

export default function PropertyAvailability({
  propertyId,
  propertyTitle,
  propertyType,
  lang,
}: PropertyAvailabilityProps) {
  const t = getOwnerPortalTranslations(lang);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Add block modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (propertyType === "FOR_RENT") {
      fetchAvailability();
    }
  }, [propertyId, propertyType]);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/owner-portal/properties/${propertyId}/availability`);
      const data = await response.json();

      if (response.ok) {
        setBlockedDates(data.blockedDates || []);
        setBookings(data.bookings || []);
      } else {
        toast.error(data.error || t.failedToLoadAvailability);
      }
    } catch (error) {
      toast.error(t.failedToLoadAvailability);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockDates = async () => {
    if (!startDate || !endDate) {
      toast.error(t.startDate + " & " + t.endDate + " required");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/owner-portal/properties/${propertyId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, reason: reason || null }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(t.datesBlocked);
        setAddModalOpen(false);
        setStartDate("");
        setEndDate("");
        setReason("");
        fetchAvailability();
      } else {
        toast.error(data.error || t.failedToBlockDates);
      }
    } catch (error) {
      toast.error(t.failedToBlockDates);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveBlock = async (blockId: string) => {
    try {
      setSubmitting(true);
      const response = await fetch(
        `/api/owner-portal/properties/${propertyId}/availability?blockedDateId=${blockId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(t.blockRemoved);
        setDeleteId(null);
        fetchAvailability();
      } else {
        toast.error(data.error || t.failedToRemoveBlock);
      }
    } catch (error) {
      toast.error(t.failedToRemoveBlock);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const locale = lang === "nl" ? "nl-NL" : "en-US";
    
    return `${startDate.toLocaleDateString(locale, { day: "numeric", month: "short" })} - ${endDate.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
  };

  const getBookingStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return <Badge className="bg-green-500">Confirmed</Badge>;
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Pending</Badge>;
      case "COMPLETED":
        return <Badge className="bg-blue-500">Completed</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Show message for non-rental properties
  if (propertyType !== "FOR_RENT") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="text-lg font-medium mt-4">{t.onlyRentalProperties}</h3>
          <p className="text-muted-foreground mt-2">
            This feature is only available for rental properties.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Blocked Dates Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarX className="h-5 w-5 text-red-500" />
              {t.blockedDates}
            </CardTitle>
            <CardDescription>
              Periods when your property is not available
            </CardDescription>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t.addBlockedDates}
          </Button>
        </CardHeader>
        <CardContent>
          {blockedDates.length > 0 ? (
            <div className="space-y-3">
              {blockedDates.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-red-50/50 dark:bg-red-900/10"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">
                        {formatDateRange(block.startDate, block.endDate)}
                      </p>
                      {block.reason && (
                        <p className="text-sm text-muted-foreground">{block.reason}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-100"
                    onClick={() => setDeleteId(block.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t.noBlockedDates}</p>
          )}
        </CardContent>
      </Card>

      {/* Existing Bookings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-green-500" />
            {t.existingBookings}
          </CardTitle>
          <CardDescription>
            Confirmed and pending bookings for your property
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-green-50/50 dark:bg-green-900/10"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">
                        {formatDateRange(booking.checkIn, booking.checkOut)}
                      </p>
                      {booking.guestName && (
                        <p className="text-sm text-muted-foreground">Guest: {booking.guestName}</p>
                      )}
                    </div>
                  </div>
                  {getBookingStatusBadge(booking.status)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">{t.noBookings}</p>
          )}
        </CardContent>
      </Card>

      {/* Add Block Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.addBlockedDates}</DialogTitle>
            <DialogDescription>
              Block dates when your property is not available for rent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t.startDate} *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">{t.endDate} *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split("T")[0]}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{t.reason}</Label>
              <Input
                id="reason"
                placeholder={t.reasonPlaceholder}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)} disabled={submitting}>
              {t.cancel}
            </Button>
            <Button onClick={handleBlockDates} disabled={submitting || !startDate || !endDate}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t.blockDates}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.confirmRemoveBlock}</DialogTitle>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)} disabled={submitting}>
              {t.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && handleRemoveBlock(deleteId)}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t.removeBlock}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
