"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Icon } from "@iconify/react";
import { format, differenceInDays } from "date-fns";
import { enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  calculateBookingPrice,
  getDefaultPricingConfig,
  formatRentalPrice,
  type PricingConfig,
} from "@/lib/services/rental-pricing";
import { useCurrencyExchange } from "@/hooks/use-currency-exchange";
import BookingCheckoutModal from "./BookingCheckoutModal";

interface BlockedDateRange {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: "manual" | "booking";
}

interface RentalBookingWidgetProps {
  monthlyPrice: number;
  maxGuests?: number;
  allowPets?: boolean;
  pricingConfig?: PricingConfig;
  property: {
    id: string;
    title: string;
    image: string;
    location: string;
  };
  onBookingConfirmed?: (booking: any) => void;
}

const SERVICE_FEE_PERCENT = 0.10; // 10% service fee

export default function RentalBookingWidget({
  monthlyPrice,
  maxGuests = 10,
  allowPets = false,
  pricingConfig = getDefaultPricingConfig(),
  property,
  onBookingConfirmed,
}: RentalBookingWidgetProps) {
  const [checkIn, setCheckIn] = useState<Date | undefined>(undefined);
  const [checkOut, setCheckOut] = useState<Date | undefined>(undefined);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [babies, setBabies] = useState(0);
  const [pets, setPets] = useState(0);
  const [showGuestSelector, setShowGuestSelector] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [blockedDateRanges, setBlockedDateRanges] = useState<BlockedDateRange[]>([]);

  const totalGuests = adults + children + babies;
  const isMaxGuestsReached = totalGuests >= maxGuests;

  // Fetch blocked dates for this property
  useEffect(() => {
    const fetchBlockedDates = async () => {
      try {
        const res = await fetch(`/api/properties/${property.id}/blocked-dates`);
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched blocked dates:", data.blockedDates);
          const ranges = data.blockedDates.map((bd: any) => ({
            ...bd,
            startDate: new Date(bd.startDate),
            endDate: new Date(bd.endDate),
          }));
          console.log("Processed blocked date ranges:", ranges);
          setBlockedDateRanges(ranges);
        } else {
          console.error("Failed to fetch blocked dates:", res.status);
        }
      } catch (error) {
        console.error("Failed to fetch blocked dates:", error);
      }
    };
    fetchBlockedDates();
  }, [property.id]);

  // Helper to get local date string (YYYY-MM-DD) without timezone conversion
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Get all blocked dates as a Set of date strings for fast lookup
  const blockedDatesSet = useMemo(() => {
    const dateSet = new Set<string>();
    blockedDateRanges.forEach((range) => {
      // Use local dates for comparison to avoid timezone issues
      let current = new Date(range.startDate);
      const endDate = new Date(range.endDate);
      
      // Add each day in the range except the last day (checkout is available for new check-in)
      while (current < endDate) {
        // Use local date string (YYYY-MM-DD) for comparison
        dateSet.add(getLocalDateString(current));
        current.setDate(current.getDate() + 1);
      }
    });
    console.log("Blocked dates set:", Array.from(dateSet));
    return dateSet;
  }, [blockedDateRanges]);

  // Get all blocked dates as an array for calendar modifiers
  const blockedDatesArray = useMemo(() => {
    const dates: Date[] = [];
    blockedDateRanges.forEach((range) => {
      let current = new Date(range.startDate);
      const endDate = new Date(range.endDate);
      while (current < endDate) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });
    return dates;
  }, [blockedDateRanges]);

  // Currency exchange
  const { formatMultiPrice, isLoading: currencyLoading } = useCurrencyExchange();

  // Calculate nights
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    return differenceInDays(checkOut, checkIn);
  }, [checkIn, checkOut]);

  // Calculate price
  const priceCalculation = useMemo(() => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      return null;
    }
    return calculateBookingPrice(monthlyPrice, checkIn, checkOut, pricingConfig);
  }, [monthlyPrice, checkIn, checkOut, pricingConfig]);

  // Calculate booking data for checkout
  const bookingData = useMemo(() => {
    if (!checkIn || !checkOut || !priceCalculation) return null;
    
    const subtotal = priceCalculation.total;
    const serviceFee = Math.round(subtotal * SERVICE_FEE_PERCENT);
    const total = subtotal + serviceFee;
    
    return {
      checkIn,
      checkOut,
      adults,
      children,
      babies,
      pets,
      nights,
      pricePerNight: priceCalculation.finalDailyPrice, // Final price per night (with surcharge included)
      subtotal,
      serviceFee,
      total,
      discountPercent: 0, // Don't show any discount/surcharge info to customer
    };
  }, [checkIn, checkOut, adults, children, babies, pets, nights, priceCalculation]);

  // Check if any date in a range is blocked
  const hasBlockedDateInRange = useCallback((start: Date, end: Date): boolean => {
    let current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endDate = new Date(end);
    endDate.setHours(0, 0, 0, 0);
    while (current < endDate) {
      if (blockedDatesSet.has(getLocalDateString(current))) {
        return true;
      }
      current.setDate(current.getDate() + 1);
    }
    return false;
  }, [blockedDatesSet]);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;

    // Don't allow selecting blocked dates
    if (blockedDatesSet.has(getLocalDateString(date))) return;

    if (!checkIn || (checkIn && checkOut)) {
      // Start new selection
      setCheckIn(date);
      setCheckOut(undefined);
    } else if (checkIn && !checkOut) {
      // Select check-out
      if (date <= checkIn) {
        // If selected date is before check-in, make it the new check-in
        setCheckIn(date);
        setCheckOut(undefined);
      } else {
        // Check if there are blocked dates in the range
        if (hasBlockedDateInRange(checkIn, date)) {
          // Find the first blocked date and select up to the day before
          let current = new Date(checkIn);
          current.setHours(0, 0, 0, 0);
          current.setDate(current.getDate() + 1);
          while (current < date) {
            if (blockedDatesSet.has(getLocalDateString(current))) {
              // Select checkout as the blocked date (they check out that day)
              setCheckOut(current);
              setShowCalendar(false);
              return;
            }
            current.setDate(current.getDate() + 1);
          }
        }
        setCheckOut(date);
        setShowCalendar(false);
      }
    }
  };

  const clearDates = () => {
    setCheckIn(undefined);
    setCheckOut(undefined);
  };

  const handleReserve = () => {
    if (!canBook) return;
    setShowCheckoutModal(true);
  };

  const handleConfirmBooking = async (guestInfo: any) => {
    if (!bookingData) return;

    // Submit booking to API
    const response = await fetch('/api/rental-bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: property.id,
        checkIn: bookingData.checkIn.toISOString(),
        checkOut: bookingData.checkOut.toISOString(),
        adults: bookingData.adults,
        children: bookingData.children,
        babies: bookingData.babies,
        pets: bookingData.pets,
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        guestPhone: guestInfo.phone,
        guestCountryCode: guestInfo.countryCode,
        guestMessage: guestInfo.message,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Booking failed');
    }

    const result = await response.json();
    onBookingConfirmed?.(result.booking);
  };

  const canBook = checkIn && checkOut && checkOut > checkIn && totalGuests > 0 && totalGuests <= maxGuests;

  // Get second month for display
  const secondMonth = useMemo(() => {
    const next = new Date(calendarMonth);
    next.setMonth(next.getMonth() + 1);
    return next;
  }, [calendarMonth]);

  return (
    <>
      {/* SHORT-TERM RENTAL WIDGET (1-30 nights) */}
      <div className="w-full bg-white dark:bg-dark rounded-2xl border border-black/10 dark:border-white/20 shadow-lg p-6 space-y-4">
        {/* Header Badge */}
        <div className="flex items-center gap-2 -mt-2 -mx-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
            <Icon icon="ph:calendar-check" className="w-3.5 h-3.5" />
            Short Stay · 1-30 nights
          </span>
        </div>

        {/* Price Display */}
        {priceCalculation ? (
          <div className="pb-4 border-b border-black/10 dark:border-white/20">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {formatRentalPrice(priceCalculation.total)}
              </span>
              <span className="text-sm text-dark/60 dark:text-white/50">
                for {nights} {nights === 1 ? "night" : "nights"}
              </span>
            </div>
            {/* Multi-currency display */}
            {!currencyLoading && (
              <div className="flex items-center gap-2 mt-1 text-xs text-dark/50 dark:text-white/40">
                <span>{formatMultiPrice(priceCalculation.total).eur}</span>
                <span>•</span>
                <span>{formatMultiPrice(priceCalculation.total).usd}</span>
              </div>
            )}
            <p className="text-xs text-dark/50 dark:text-white/40 mt-1">
              {formatRentalPrice(priceCalculation.finalDailyPrice)} per night
            </p>
          </div>
        ) : (
          <div className="pb-4 border-b border-black/10 dark:border-white/20">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {formatRentalPrice(monthlyPrice / 30)}
              </span>
              <span className="text-sm text-dark/60 dark:text-white/50">per night</span>
            </div>
            {/* Multi-currency display */}
            {!currencyLoading && (
              <div className="flex items-center gap-2 mt-1 text-xs text-dark/50 dark:text-white/40">
                <span>{formatMultiPrice(monthlyPrice / 30).eur}</span>
                <span>•</span>
                <span>{formatMultiPrice(monthlyPrice / 30).usd}</span>
              </div>
            )}
            <p className="text-xs text-dark/50 dark:text-white/40 mt-1">
              Longer stays = better rates
            </p>
          </div>
        )}

        {/* Date Selection - Airbnb Style */}
        <Popover open={showCalendar} onOpenChange={setShowCalendar}>
          <PopoverTrigger asChild>
            <div className="grid grid-cols-2 border rounded-lg cursor-pointer hover:border-black dark:hover:border-white transition-colors">
              <div className="p-3 border-r">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Check-in
                </div>
                <div className="text-sm font-medium">
                  {checkIn ? format(checkIn, "d-M-yyyy") : "Add date"}
                </div>
              </div>
              <div className="p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Checkout
                </div>
                <div className="text-sm font-medium">
                  {checkOut ? format(checkOut, "d-M-yyyy") : "Add date"}
                </div>
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" sideOffset={8}>
            <div className="p-4 bg-white dark:bg-dark rounded-xl shadow-xl border">
              {/* Header with nights count */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xl font-bold">
                    {nights > 0 ? `${nights} ${nights === 1 ? "night" : "nights"}` : "Select dates"}
                  </div>
                  {checkIn && checkOut && (
                    <div className="text-sm text-muted-foreground">
                      {format(checkIn, "d MMM yyyy", { locale: enUS })} - {format(checkOut, "d MMM yyyy", { locale: enUS })}
                    </div>
                  )}
                </div>
                
                {/* Date input boxes */}
                <div className="flex border rounded-lg overflow-hidden">
                  <div className={cn(
                    "px-4 py-2 border-r",
                    !checkIn && "text-muted-foreground"
                  )}>
                    <div className="text-[10px] font-bold uppercase tracking-wider">Check-in</div>
                    <div className="text-sm flex items-center gap-2">
                      {checkIn ? format(checkIn, "d-M-yyyy") : "Add date"}
                      {checkIn && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCheckIn(undefined);
                            setCheckOut(undefined);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "px-4 py-2",
                    !checkOut && "text-muted-foreground"
                  )}>
                    <div className="text-[10px] font-bold uppercase tracking-wider">Checkout</div>
                    <div className="text-sm flex items-center gap-2">
                      {checkOut ? format(checkOut, "d-M-yyyy") : "Add date"}
                      {checkOut && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCheckOut(undefined);
                          }}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Two-month calendar */}
              <div className="flex gap-4">
                {/* Navigation */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const prev = new Date(calendarMonth);
                        prev.setMonth(prev.getMonth() - 1);
                        setCalendarMonth(prev);
                      }}
                    >
                      <Icon icon="ph:caret-left" className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold">
                      {format(calendarMonth, "MMMM yyyy", { locale: enUS })}
                    </span>
                    <div className="w-8" /> {/* Spacer */}
                  </div>
                  <Calendar
                    key={`cal1-${blockedDatesSet.size}`}
                    mode="single"
                    selected={checkIn}
                    onSelect={handleDateSelect}
                    month={calendarMonth}
                    onMonthChange={setCalendarMonth}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      return blockedDatesSet.has(getLocalDateString(date));
                    }}
                    modifiers={{
                      range_start: checkIn ? [checkIn] : [],
                      range_end: checkOut ? [checkOut] : [],
                      range_middle: checkIn && checkOut
                        ? Array.from({ length: differenceInDays(checkOut, checkIn) - 1 }, (_, i) => {
                            const d = new Date(checkIn);
                            d.setDate(d.getDate() + i + 1);
                            return d;
                          })
                        : [],
                      blocked: blockedDatesArray,
                    }}
                    modifiersClassNames={{
                      range_start: "bg-black text-white rounded-full",
                      range_end: "bg-black text-white rounded-full",
                      range_middle: "bg-gray-100 dark:bg-gray-800",
                      blocked: "line-through text-muted-foreground/50 cursor-not-allowed",
                    }}
                    className="rounded-md"
                    classNames={{
                      head_cell: "text-muted-foreground font-normal text-[0.8rem] w-10",
                      cell: "h-10 w-10 text-center text-sm p-0 relative",
                      day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full",
                      nav: "hidden",
                    }}
                  />
                </div>

                {/* Second month */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8" /> {/* Spacer */}
                    <span className="font-semibold">
                      {format(secondMonth, "MMMM yyyy", { locale: enUS })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const next = new Date(calendarMonth);
                        next.setMonth(next.getMonth() + 1);
                        setCalendarMonth(next);
                      }}
                    >
                      <Icon icon="ph:caret-right" className="h-4 w-4" />
                    </Button>
                  </div>
                  <Calendar
                    key={`cal2-${blockedDatesSet.size}`}
                    mode="single"
                    selected={checkOut}
                    onSelect={handleDateSelect}
                    month={secondMonth}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) return true;
                      if (checkIn && date <= checkIn) return true;
                      return blockedDatesSet.has(getLocalDateString(date));
                    }}
                    modifiers={{
                      range_start: checkIn ? [checkIn] : [],
                      range_end: checkOut ? [checkOut] : [],
                      range_middle: checkIn && checkOut
                        ? Array.from({ length: differenceInDays(checkOut, checkIn) - 1 }, (_, i) => {
                            const d = new Date(checkIn);
                            d.setDate(d.getDate() + i + 1);
                            return d;
                          })
                        : [],
                      blocked: blockedDatesArray,
                    }}
                    modifiersClassNames={{
                      range_start: "bg-black text-white rounded-full",
                      range_end: "bg-black text-white rounded-full",
                      range_middle: "bg-gray-100 dark:bg-gray-800",
                      blocked: "line-through text-muted-foreground/50 cursor-not-allowed",
                    }}
                    className="rounded-md"
                    classNames={{
                      head_cell: "text-muted-foreground font-normal text-[0.8rem] w-10",
                      cell: "h-10 w-10 text-center text-sm p-0 relative",
                      day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full",
                      nav: "hidden",
                    }}
                  />
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                <Button
                  variant="link"
                  className="text-sm underline"
                  onClick={clearDates}
                >
                  Clear dates
                </Button>
                <Button
                  className="bg-black hover:bg-black/90 text-white px-6"
                  onClick={() => setShowCalendar(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Guest Selection */}
        <Popover open={showGuestSelector} onOpenChange={setShowGuestSelector}>
          <PopoverTrigger asChild>
            <div className="border rounded-lg p-3 cursor-pointer hover:border-black dark:hover:border-white transition-colors">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Guests
              </div>
              <div className="text-sm font-medium">
                {totalGuests} {totalGuests === 1 ? "guest" : "guests"}
                {pets > 0 && `, ${pets} ${pets === 1 ? "pet" : "pets"}`}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="start">
            <div className="space-y-4">
              {/* Adults */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Adults</div>
                  <div className="text-sm text-muted-foreground">Age 13+</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setAdults(Math.max(1, adults - 1))}
                    disabled={adults <= 1}
                  >
                    <Icon icon="ph:minus" className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{adults}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setAdults(Math.min(maxGuests - children - babies, adults + 1))}
                    disabled={isMaxGuestsReached}
                  >
                    <Icon icon="ph:plus" className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Children</div>
                  <div className="text-sm text-muted-foreground">Ages 2–12</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setChildren(Math.max(0, children - 1))}
                    disabled={children <= 0}
                  >
                    <Icon icon="ph:minus" className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{children}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setChildren(Math.min(maxGuests - adults - babies, children + 1))}
                    disabled={isMaxGuestsReached}
                  >
                    <Icon icon="ph:plus" className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Infants */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Infants</div>
                  <div className="text-sm text-muted-foreground">Under 2</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setBabies(Math.max(0, babies - 1))}
                    disabled={babies <= 0}
                  >
                    <Icon icon="ph:minus" className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{babies}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-full"
                    onClick={() => setBabies(Math.min(maxGuests - adults - children, babies + 1))}
                    disabled={isMaxGuestsReached}
                  >
                    <Icon icon="ph:plus" className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Pets */}
              {allowPets && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Pets</div>
                    <div className="text-sm text-muted-foreground">
                      <a href="#" className="underline">Bringing a service animal?</a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setPets(Math.max(0, pets - 1))}
                      disabled={pets <= 0}
                    >
                      <Icon icon="ph:minus" className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{pets}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setPets(pets + 1)}
                    >
                      <Icon icon="ph:plus" className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground pt-2 border-t">
                This place has a maximum of {maxGuests} guests, not including infants.
                {!allowPets && " Pets aren't allowed."}
              </p>

              <Button
                variant="ghost"
                className="w-full mt-2 underline"
                onClick={() => setShowGuestSelector(false)}
              >
                Close
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Cancellation Policy */}
        {checkIn && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-sm text-muted-foreground">
            Free cancellation until {format(new Date(checkIn.getTime() - 24 * 60 * 60 * 1000), "MMMM d", { locale: enUS })}
          </div>
        )}

        {/* Book Button */}
        <Button
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold py-6 text-lg"
          disabled={!canBook}
          onClick={handleReserve}
        >
          Reserve
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          You won&apos;t be charged yet
        </p>
      </div>

      {/* LONG-TERM RENTAL WIDGET (30+ days / Monthly) */}
      <div className="w-full mt-4 bg-white dark:bg-dark rounded-2xl border border-black/10 dark:border-white/20 shadow-lg p-6 space-y-4">
        {/* Header Badge */}
        <div className="flex items-center gap-2 -mt-2 -mx-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
            <Icon icon="ph:house" className="w-3.5 h-3.5" />
            Long Stay · Monthly rental
          </span>
        </div>

        {/* Monthly Price Display */}
        <div className="pb-4 border-b border-black/10 dark:border-white/20">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatRentalPrice(monthlyPrice)}
            </span>
            <span className="text-sm text-dark/60 dark:text-white/50">per month</span>
          </div>
          {/* Multi-currency display */}
          {!currencyLoading && (
            <div className="flex items-center gap-2 mt-1 text-xs text-dark/50 dark:text-white/40">
              <span>{formatMultiPrice(monthlyPrice).eur}</span>
              <span>•</span>
              <span>{formatMultiPrice(monthlyPrice).usd}</span>
            </div>
          )}
          <p className="text-xs text-dark/50 dark:text-white/40 mt-1">
            Minimum 1 month · Best value for extended stays
          </p>
        </div>

        {/* Benefits List */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-dark/70 dark:text-white/60">
            <Icon icon="ph:check-circle" className="w-4 h-4 text-green-500" />
            <span>Flexible lease terms</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-dark/70 dark:text-white/60">
            <Icon icon="ph:check-circle" className="w-4 h-4 text-green-500" />
            <span>No daily surcharges</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-dark/70 dark:text-white/60">
            <Icon icon="ph:check-circle" className="w-4 h-4 text-green-500" />
            <span>Best rates for long-term stays</span>
          </div>
        </div>

        {/* Contact/Inquiry Section */}
        <div className="pt-4 border-t border-black/10 dark:border-white/20 space-y-3">
          <p className="text-xs text-center text-muted-foreground">
            For stays longer than 30 days, please contact us directly
          </p>
          
          <Button
            variant="outline"
            className="w-full border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 font-semibold py-5"
            onClick={() => window.open(`https://wa.me/66986261646?text=Hi, I'm interested in a long-term rental (30+ days) for ${property.title}`, '_blank')}
          >
            <Icon icon="ph:whatsapp-logo" className="w-5 h-5 mr-2" />
            Inquire for Monthly Rental
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => window.open(`tel:+66986261646`, '_blank')}
            >
              <Icon icon="ph:phone" className="w-4 h-4 mr-1" />
              Call
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => window.open(`mailto:info@psmphuket.com?subject=Long-term rental inquiry: ${property.title}`, '_blank')}
            >
              <Icon icon="ph:envelope" className="w-4 h-4 mr-1" />
              Email
            </Button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {bookingData && (
        <BookingCheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          bookingData={bookingData}
          property={property}
          onConfirmBooking={handleConfirmBooking}
        />
      )}
    </>
  );
}
