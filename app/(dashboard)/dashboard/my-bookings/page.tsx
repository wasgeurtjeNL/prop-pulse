"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatRentalPrice } from "@/lib/services/rental-pricing";
import { useCurrencyExchange } from "@/hooks/use-currency-exchange";

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  babies: number;
  pets: number;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  paymentStatus: string | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    location: string;
    slug: string;
    images: { url: string | null }[];
  };
}

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  CONFIRMED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  COMPLETED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

const statusIcons: Record<string, string> = {
  PENDING: "ph:clock",
  CONFIRMED: "ph:check-circle",
  CANCELLED: "ph:x-circle",
  COMPLETED: "ph:check-circle-fill",
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  
  const { formatMultiPrice, isLoading: currencyLoading } = useCurrencyExchange();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch("/api/rental-bookings");
        if (!response.ok) {
          if (response.status === 401) {
            setError("Please log in to view your bookings");
          } else {
            throw new Error("Failed to fetch bookings");
          }
          return;
        }
        const data = await response.json();
        setBookings(data.bookings || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError("Failed to load your bookings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const now = new Date();
  
  const filteredBookings = bookings.filter((booking) => {
    const checkIn = new Date(booking.checkIn);
    if (filter === "upcoming") return checkIn >= now;
    if (filter === "past") return checkIn < now;
    return true;
  });

  const upcomingCount = bookings.filter(b => new Date(b.checkIn) >= now).length;
  const pastCount = bookings.filter(b => new Date(b.checkIn) < now).length;

  const formatGuests = (booking: Booking) => {
    const parts = [];
    if (booking.adults > 0) parts.push(`${booking.adults} ${booking.adults === 1 ? "adult" : "adults"}`);
    if (booking.children > 0) parts.push(`${booking.children} ${booking.children === 1 ? "child" : "children"}`);
    if (booking.babies > 0) parts.push(`${booking.babies} ${booking.babies === 1 ? "infant" : "infants"}`);
    if (booking.pets > 0) parts.push(`${booking.pets} ${booking.pets === 1 ? "pet" : "pets"}`);
    return parts.join(", ");
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Icon icon="ph:spinner" className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Icon icon="ph:warning-circle" className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button asChild>
              <Link href="/sign-in">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">
          View and manage your rental reservations
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          size="sm"
        >
          All ({bookings.length})
        </Button>
        <Button
          variant={filter === "upcoming" ? "default" : "outline"}
          onClick={() => setFilter("upcoming")}
          size="sm"
        >
          Upcoming ({upcomingCount})
        </Button>
        <Button
          variant={filter === "past" ? "default" : "outline"}
          onClick={() => setFilter("past")}
          size="sm"
        >
          Past ({pastCount})
        </Button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon icon="ph:calendar-blank" className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-6">
              {filter === "upcoming" 
                ? "You don't have any upcoming reservations."
                : filter === "past"
                ? "You don't have any past reservations."
                : "You haven't made any reservations yet."}
            </p>
            <Button asChild>
              <Link href="/properties?type=rent">
                <Icon icon="ph:house" className="w-4 h-4 mr-2" />
                Browse Rentals
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            const isUpcoming = checkIn >= now;
            const propertyImage = booking.property.images?.[0]?.url;

            return (
              <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  {/* Property Image */}
                  <div className="w-full sm:w-48 h-40 sm:h-auto relative bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    {propertyImage ? (
                      <img
                        src={propertyImage}
                        alt={booking.property.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon icon="ph:house" className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {/* Status Badge on Image */}
                    <Badge 
                      className={`absolute top-3 left-3 ${statusColors[booking.status]}`}
                    >
                      <Icon icon={statusIcons[booking.status]} className="w-3 h-3 mr-1" />
                      {booking.status.charAt(0) + booking.status.slice(1).toLowerCase()}
                    </Badge>
                  </div>

                  {/* Booking Details */}
                  <div className="flex-1 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <Link 
                          href={`/properties/${booking.property.slug}`}
                          className="text-lg font-semibold hover:text-primary transition-colors line-clamp-1"
                        >
                          {booking.property.title}
                        </Link>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Icon icon="ph:map-pin" className="w-4 h-4" />
                          {booking.property.location}
                        </p>

                        {/* Dates & Guests */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Icon icon="ph:calendar" className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {format(checkIn, "MMM d", { locale: enUS })} – {format(checkOut, "MMM d, yyyy", { locale: enUS })}
                              </span>
                            </div>
                            <span className="text-muted-foreground">
                              ({booking.nights} {booking.nights === 1 ? "night" : "nights"})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Icon icon="ph:users" className="w-4 h-4" />
                            <span>{formatGuests(booking)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-xl font-bold">
                          {formatRentalPrice(booking.totalPrice)}
                        </div>
                        {!currencyLoading && (
                          <div className="text-xs text-muted-foreground">
                            ≈ {formatMultiPrice(booking.totalPrice).eur}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          Booked {format(new Date(booking.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/properties/${booking.property.slug}`}>
                          <Icon icon="ph:eye" className="w-4 h-4 mr-1" />
                          View Property
                        </Link>
                      </Button>
                      {isUpcoming && booking.status === "PENDING" && (
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Icon icon="ph:x" className="w-4 h-4 mr-1" />
                          Cancel Booking
                        </Button>
                      )}
                      {booking.status === "CONFIRMED" && (
                        <Button variant="outline" size="sm">
                          <Icon icon="ph:download" className="w-4 h-4 mr-1" />
                          Download Confirmation
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}


