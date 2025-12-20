"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatRentalPrice } from "@/lib/services/rental-pricing";
import { useCurrencyExchange } from "@/hooks/use-currency-exchange";
import { authClient } from "@/lib/auth-client";

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

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  PENDING: { 
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 border-amber-200 dark:border-amber-800", 
    icon: "ph:clock",
    label: "Pending Confirmation"
  },
  CONFIRMED: { 
    color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800", 
    icon: "ph:check-circle",
    label: "Confirmed"
  },
  CANCELLED: { 
    color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-200 dark:border-red-800", 
    icon: "ph:x-circle",
    label: "Cancelled"
  },
  COMPLETED: { 
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 border-blue-200 dark:border-blue-800", 
    icon: "ph:check-circle-fill",
    label: "Completed"
  },
};

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
  
  const { data: session, isPending: isSessionLoading } = authClient.useSession();
  const { formatMultiPrice, isLoading: currencyLoading } = useCurrencyExchange();

  useEffect(() => {
    const fetchBookings = async () => {
      if (isSessionLoading) return;
      
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

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
  }, [session, isSessionLoading]);

  const now = new Date();
  
  const filteredBookings = bookings.filter((booking) => {
    const checkIn = new Date(booking.checkIn);
    if (filter === "upcoming") return checkIn >= now && booking.status !== "CANCELLED";
    if (filter === "past") return checkIn < now || booking.status === "CANCELLED";
    return true;
  });

  const upcomingCount = bookings.filter(b => new Date(b.checkIn) >= now && b.status !== "CANCELLED").length;
  const pastCount = bookings.filter(b => new Date(b.checkIn) < now || b.status === "CANCELLED").length;

  const formatGuests = (booking: Booking) => {
    const parts = [];
    if (booking.adults > 0) parts.push(`${booking.adults} ${booking.adults === 1 ? "adult" : "adults"}`);
    if (booking.children > 0) parts.push(`${booking.children} ${booking.children === 1 ? "child" : "children"}`);
    if (booking.babies > 0) parts.push(`${booking.babies} ${booking.babies === 1 ? "infant" : "infants"}`);
    if (booking.pets > 0) parts.push(`${booking.pets} ${booking.pets === 1 ? "pet" : "pets"}`);
    return parts.join(", ");
  };

  // Not logged in
  if (!isSessionLoading && !session?.user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="ph:user-circle" className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Sign in to view your trips</h2>
            <p className="text-muted-foreground mb-6">
              You can view and manage your rental reservations after signing in.
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/sign-in?callbackUrl=/my-bookings">
                  Log In
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/sign-up?callbackUrl=/my-bookings">
                  Create Account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || isSessionLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Icon icon="ph:spinner" className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your bookings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <Icon icon="ph:warning-circle" className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">Your Trips</h1>
        <p className="text-muted-foreground">
          Manage your rental reservations
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-8 border-b pb-4">
        <Button
          variant={filter === "upcoming" ? "default" : "ghost"}
          onClick={() => setFilter("upcoming")}
          className="relative"
        >
          Upcoming
          {upcomingCount > 0 && (
            <span className="ml-2 bg-primary-foreground text-primary rounded-full px-2 py-0.5 text-xs font-medium">
              {upcomingCount}
            </span>
          )}
        </Button>
        <Button
          variant={filter === "past" ? "default" : "ghost"}
          onClick={() => setFilter("past")}
        >
          Past
          {pastCount > 0 && (
            <span className="ml-2 text-muted-foreground text-xs">
              ({pastCount})
            </span>
          )}
        </Button>
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icon icon="ph:suitcase" className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {filter === "upcoming" 
              ? "No upcoming trips"
              : filter === "past"
              ? "No past trips"
              : "No trips yet"}
          </h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {filter === "upcoming" 
              ? "Time to dust off your bags and start planning your next adventure!"
              : filter === "past"
              ? "Your past trip memories will appear here."
              : "When you book a trip, it will show up here."}
          </p>
          <Button asChild size="lg">
            <Link href="/properties?type=rent">
              <Icon icon="ph:magnifying-glass" className="w-5 h-5 mr-2" />
              Start Searching
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBookings.map((booking) => {
            const checkIn = new Date(booking.checkIn);
            const checkOut = new Date(booking.checkOut);
            const isUpcoming = checkIn >= now && booking.status !== "CANCELLED";
            const propertyImage = booking.property.images?.[0]?.url;
            const status = statusConfig[booking.status];

            // Calculate days until check-in
            const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            return (
              <Card key={booking.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                <div className="flex flex-col md:flex-row">
                  {/* Property Image */}
                  <Link 
                    href={`/my-bookings/${booking.id}`}
                    className="w-full md:w-72 h-48 md:h-auto relative bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden"
                  >
                    {propertyImage ? (
                      <img
                        src={propertyImage}
                        alt={booking.property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center min-h-[200px]">
                        <Icon icon="ph:house" className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    
                    {/* Days countdown badge for upcoming confirmed trips */}
                    {booking.status === "CONFIRMED" && daysUntilCheckIn > 0 && daysUntilCheckIn <= 14 && (
                      <div className="absolute top-3 left-3 bg-emerald-600 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                        {daysUntilCheckIn === 1 ? "Tomorrow!" : `${daysUntilCheckIn} days to go`}
                      </div>
                    )}
                  </Link>

                  {/* Booking Details */}
                  <div className="flex-1 p-5 md:p-6">
                    <div className="flex flex-col h-full">
                      {/* Top Section */}
                      <div className="flex-1">
                        {/* Status & Date Range */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          <Badge variant="outline" className={status.color}>
                            <Icon icon={status.icon} className="w-3.5 h-3.5 mr-1.5" />
                            {status.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {format(checkIn, "MMM d", { locale: enUS })} – {format(checkOut, "MMM d, yyyy", { locale: enUS })}
                          </span>
                        </div>

                        {/* Property Title */}
                        <Link 
                          href={`/my-bookings/${booking.id}`}
                          className="block"
                        >
                          <h3 className="text-xl font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">
                            {booking.property.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-3">
                          <Icon icon="ph:map-pin" className="w-4 h-4" />
                          {booking.property.location}
                        </p>

                        {/* Status-specific message */}
                        {booking.status === "PENDING" && (
                          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 px-3 py-2 rounded-lg mb-3">
                            <Icon icon="ph:hourglass-medium" className="w-4 h-4 flex-shrink-0" />
                            <span>Awaiting confirmation from host (usually within 24h)</span>
                          </div>
                        )}
                        
                        {booking.status === "CONFIRMED" && isUpcoming && (
                          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 rounded-lg mb-3">
                            <Icon icon="ph:check-circle" className="w-4 h-4 flex-shrink-0" />
                            <span>Your trip is confirmed! Check-in details available.</span>
                          </div>
                        )}

                        {/* Trip Details */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Icon icon="ph:moon" className="w-4 h-4 text-muted-foreground" />
                            <span>{booking.nights} {booking.nights === 1 ? "night" : "nights"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Icon icon="ph:users" className="w-4 h-4 text-muted-foreground" />
                            <span>{formatGuests(booking)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Section - Price & Actions */}
                      <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="text-xl font-bold">
                            {formatRentalPrice(booking.totalPrice)}
                          </div>
                          {!currencyLoading && (
                            <div className="text-xs text-muted-foreground">
                              ≈ {formatMultiPrice(booking.totalPrice).eur} / {formatMultiPrice(booking.totalPrice).usd}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" asChild>
                            <Link href={`/my-bookings/${booking.id}`}>
                              {booking.status === "CONFIRMED" ? (
                                <>
                                  <Icon icon="ph:key" className="w-4 h-4 mr-1.5" />
                                  Check-in Details
                                </>
                              ) : (
                                <>
                                  <Icon icon="ph:receipt" className="w-4 h-4 mr-1.5" />
                                  View Details
                                </>
                              )}
                            </Link>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/listings/${booking.property.slug}`}>
                              <Icon icon="ph:eye" className="w-4 h-4 mr-1.5" />
                              View Property
                            </Link>
                          </Button>
                        </div>
                      </div>
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

