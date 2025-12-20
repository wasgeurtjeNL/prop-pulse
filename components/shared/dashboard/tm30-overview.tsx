"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { format } from "date-fns";

interface Guest {
  id: string;
  guestNumber: number;
  guestType: string;
  firstName: string | null;
  lastName: string | null;
  nationality: string | null;
  passportNumber: string | null;
  tm30Status: string;
  passportImageUrl: string | null;
  ocrConfidence: number | null;
  passportVerified: boolean;
}

interface TM30Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  tm30Status: string;
  tm30Reference: string | null;
  passportsRequired: number;
  passportsReceived: number;
  property: {
    title: string;
    tm30AccommodationId: string | null;
    tm30AccommodationName: string | null;
  };
  guests: Guest[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PASSPORT_RECEIVED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SUBMITTED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

const STATUS_ICONS: Record<string, string> = {
  PENDING: "ph:clock",
  PASSPORT_RECEIVED: "ph:passport",
  PROCESSING: "ph:spinner",
  SUBMITTED: "ph:check-circle",
  FAILED: "ph:x-circle",
};

export default function TM30Overview() {
  const [bookings, setBookings] = useState<TM30Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<TM30Booking | null>(null);

  useEffect(() => {
    fetchTM30Bookings();
  }, []);

  const fetchTM30Bookings = async () => {
    try {
      const res = await fetch("/api/tm30/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Error fetching TM30 bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendPassportRequest = async (bookingId: string) => {
    try {
      const res = await fetch("/api/tm30/request-passports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (res.ok) {
        alert("Passport request sent successfully!");
        fetchTM30Bookings();
      } else {
        const error = await res.json();
        alert(`Failed: ${error.error}`);
      }
    } catch (error) {
      console.error("Error sending passport request:", error);
      alert("Failed to send passport request");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon icon="ph:spinner" className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">TM30 Immigration</h2>
          <p className="text-muted-foreground">
            Manage TM30 registrations for rental bookings
          </p>
        </div>
        <Button onClick={fetchTM30Bookings} variant="outline" size="sm">
          <Icon icon="ph:arrows-clockwise" className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.tm30Status === "PENDING").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Passports Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bookings.filter((b) => b.tm30Status === "PASSPORT_RECEIVED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {bookings.filter((b) => b.tm30Status === "SUBMITTED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Failed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {bookings.filter((b) => b.tm30Status === "FAILED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Check-ins</CardTitle>
          <CardDescription>
            Bookings that need TM30 registration
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No bookings with TM30 requirements found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Guest</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Passports</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.property.title}</div>
                        {booking.property.tm30AccommodationName && (
                          <div className="text-xs text-muted-foreground">
                            TM30: {booking.property.tm30AccommodationName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{booking.guestName}</div>
                        <div className="text-xs text-muted-foreground">
                          {booking.guestPhone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.checkIn), "dd MMM yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            booking.passportsReceived === booking.passportsRequired
                              ? "text-green-600"
                              : "text-yellow-600"
                          }
                        >
                          {booking.passportsReceived}/{booking.passportsRequired}
                        </span>
                        {booking.passportsReceived === booking.passportsRequired && (
                          <Icon
                            icon="ph:check-circle-fill"
                            className="w-4 h-4 text-green-600"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={STATUS_COLORS[booking.tm30Status] || "bg-gray-100"}
                      >
                        <Icon
                          icon={STATUS_ICONS[booking.tm30Status] || "ph:circle"}
                          className="w-3 h-3 mr-1"
                        />
                        {booking.tm30Status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Icon icon="ph:eye" className="w-4 h-4" />
                        </Button>
                        {booking.tm30Status === "PENDING" &&
                          booking.passportsReceived < booking.passportsRequired && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendPassportRequest(booking.id)}
                            >
                              <Icon icon="ph:paper-plane-tilt" className="w-4 h-4" />
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Guest Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Guest Details</CardTitle>
                <CardDescription>
                  {selectedBooking.property.title} - {selectedBooking.guestName}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBooking(null)}
              >
                <Icon icon="ph:x" className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedBooking.guests.length === 0 ? (
                  <p className="text-muted-foreground">
                    No guest passports registered yet
                  </p>
                ) : (
                  selectedBooking.guests.map((guest) => (
                    <div
                      key={guest.id}
                      className="p-4 border rounded-lg flex items-center gap-4"
                    >
                      {guest.passportImageUrl ? (
                        <img
                          src={guest.passportImageUrl}
                          alt="Passport"
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <Icon
                            icon="ph:user"
                            className="w-8 h-8 text-gray-400"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          Guest {guest.guestNumber} ({guest.guestType})
                        </div>
                        {guest.firstName ? (
                          <div className="text-sm">
                            <span>
                              {guest.firstName} {guest.lastName}
                            </span>
                            {guest.nationality && (
                              <span className="text-muted-foreground">
                                {" "}
                                • {guest.nationality}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Waiting for passport
                          </div>
                        )}
                        {guest.passportNumber && (
                          <div className="text-xs text-muted-foreground">
                            Passport: {guest.passportNumber}
                          </div>
                        )}
                      </div>
                      <Badge className={STATUS_COLORS[guest.tm30Status]}>
                        {guest.tm30Status}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

