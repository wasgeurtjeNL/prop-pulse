'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Phone, 
  Mail, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock,
  ExternalLink,
  User,
  Building,
  MessageSquare,
  Users,
  Moon,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatRentalPrice } from '@/lib/services/rental-pricing';

// SWR fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  babies: number;
  pets: number;
  basePrice: number;
  totalPrice: number;
  season: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  paymentStatus: string | null;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountryCode: string;
  guestMessage: string | null;
  createdAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  property: {
    id: string;
    title: string;
    slug: string;
    provinceSlug: string | null;
    areaSlug: string | null;
    location: string;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  _count?: {
    messages: number;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { 
    label: 'Pending', 
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    icon: <Clock className="h-3 w-3" />
  },
  CONFIRMED: { 
    label: 'Confirmed', 
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    icon: <CheckCircle className="h-3 w-3" />
  },
  CANCELLED: { 
    label: 'Cancelled', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    icon: <XCircle className="h-3 w-3" />
  },
  COMPLETED: { 
    label: 'Completed', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icon: <CheckCircle className="h-3 w-3" />
  },
};

export default function BookingsTable() {
  const [filter, setFilter] = useState<string>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // SWR for cached data fetching with automatic revalidation
  const apiUrl = filter === 'all' 
    ? '/api/rental-bookings?admin=true' 
    : `/api/rental-bookings?admin=true&status=${filter}`;
  
  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher, {
    revalidateOnFocus: false,      // Don't refetch on window focus
    dedupingInterval: 30000,       // Dedupe requests within 30 seconds
    refreshInterval: 60000,        // Auto-refresh every 60 seconds
    keepPreviousData: true,        // Show stale data while fetching
  });

  const bookings: Booking[] = data?.bookings || [];
  const loading = isLoading;

  // Show error toast only once
  if (error) {
    console.error('Error fetching bookings:', error);
  }

  const updateBookingStatus = async (bookingId: string, status: 'CONFIRMED' | 'CANCELLED') => {
    // Optimistic update for instant UI feedback
    const optimisticData = {
      bookings: bookings.map(b => 
        b.id === bookingId ? { ...b, status } : b
      )
    };
    
    try {
      setActionLoading(bookingId);
      
      // Update UI immediately (optimistic)
      mutate(optimisticData, false);
      
      const response = await fetch(`/api/rental-bookings/${bookingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking');
      }

      toast.success(`Booking ${status.toLowerCase()} successfully`);
      
      // Revalidate from server to ensure consistency
      mutate();
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking status');
      // Rollback optimistic update on error
      mutate();
    } finally {
      setActionLoading(null);
    }
  };

  const formatGuests = (booking: Booking) => {
    const parts = [];
    if (booking.adults > 0) parts.push(`${booking.adults}A`);
    if (booking.children > 0) parts.push(`${booking.children}C`);
    if (booking.babies > 0) parts.push(`${booking.babies}B`);
    if (booking.pets > 0) parts.push(`${booking.pets}P`);
    return parts.join(' ');
  };

  const getPropertyUrl = (booking: Booking) => {
    if (!booking.property) return '#';
    const { provinceSlug, areaSlug, slug } = booking.property;
    if (provinceSlug && areaSlug) {
      return `/properties/${provinceSlug}/${areaSlug}/${slug}`;
    }
    return `/listings/${slug}`;
  };

  const filterOptions = [
    { value: 'all', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'CANCELLED', label: 'Cancelled' },
    { value: 'COMPLETED', label: 'Completed' },
  ];

  // Count by status
  const counts = {
    all: bookings.length,
    PENDING: bookings.filter(b => b.status === 'PENDING').length,
    CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {filterOptions.map((opt) => (
            <div key={opt.value} className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
        <div className="rounded-lg border bg-white dark:bg-slate-900">
          <div className="p-8 text-center text-muted-foreground">
            Loading bookings...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterOptions.map((opt) => (
          <Button
            key={opt.value}
            variant={filter === opt.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(opt.value)}
            className="gap-1"
          >
            {opt.label}
            <Badge variant="secondary" className="ml-1 text-xs">
              {counts[opt.value as keyof typeof counts] || 0}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Bookings Table */}
      <div className="rounded-lg border bg-white dark:bg-slate-900 overflow-hidden">
        {bookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' 
                ? 'There are no rental bookings yet.'
                : `No ${filter.toLowerCase()} bookings found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <Table className="min-w-[800px] w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead className="hidden sm:table-cell">Property</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead className="hidden md:table-cell">Guests</TableHead>
                <TableHead className="hidden sm:table-cell">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => {
                const status = statusConfig[booking.status];
                const checkIn = new Date(booking.checkIn);
                const checkOut = new Date(booking.checkOut);
                const unreadMessages = booking._count?.messages || 0;

                return (
                  <TableRow key={booking.id}>
                    {/* Guest Info */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {booking.guestName}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {booking.guestEmail}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {booking.guestCountryCode} {booking.guestPhone}
                        </div>
                      </div>
                    </TableCell>

                    {/* Property */}
                    <TableCell className="hidden sm:table-cell">
                      {booking.property ? (
                        <div className="space-y-1">
                          <Link 
                            href={getPropertyUrl(booking)}
                            target="_blank"
                            className="font-medium text-primary hover:underline flex items-center gap-1 line-clamp-1"
                          >
                            <Building className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{booking.property.title}</span>
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {booking.property.location}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Property deleted</span>
                      )}
                    </TableCell>

                    {/* Dates */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {format(checkIn, 'MMM d')} - {format(checkOut, 'MMM d')}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Moon className="h-3 w-3" />
                          {booking.nights} nights
                          <Badge variant="outline" className="text-xs">
                            {booking.season}
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    {/* Guests */}
                    <TableCell className="hidden md:table-cell">
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {formatGuests(booking)}
                      </div>
                    </TableCell>

                    {/* Total */}
                    <TableCell className="hidden sm:table-cell">
                      <div className="font-medium flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        {formatRentalPrice(booking.totalPrice)}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge className={`${status.color} gap-1`}>
                        {status.icon}
                        {status.label}
                      </Badge>
                      {booking.confirmedAt && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(booking.confirmedAt), 'MMM d, HH:mm')}
                        </div>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Chat/Messages button */}
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="relative"
                        >
                          <Link href={`/dashboard/bookings/${booking.id}`}>
                            <MessageSquare className="h-4 w-4" />
                            {unreadMessages > 0 && (
                              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                {unreadMessages}
                              </span>
                            )}
                          </Link>
                        </Button>

                        {/* Confirm/Cancel buttons for pending bookings */}
                        {booking.status === 'PENDING' && (
                          <>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                              disabled={actionLoading === booking.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                              disabled={actionLoading === booking.id}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}

                        {/* Complete button for confirmed bookings */}
                        {booking.status === 'CONFIRMED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link href={`/dashboard/bookings/${booking.id}`}>
                              View Details
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        )}
      </div>

      {/* Message preview for pending bookings */}
      {bookings.filter(b => b.status === 'PENDING' && b.guestMessage).length > 0 && (
        <div className="rounded-lg border bg-white dark:bg-slate-900 p-4">
          <h3 className="font-medium mb-3">Guest Messages</h3>
          <div className="space-y-3">
            {bookings
              .filter(b => b.status === 'PENDING' && b.guestMessage)
              .map((booking) => (
                <div key={booking.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{booking.guestName}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(booking.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{booking.guestMessage}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

