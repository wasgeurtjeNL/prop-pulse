"use client";

import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Icon } from "@iconify/react";
import { format, differenceInDays, startOfDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { toast } from "sonner";

interface BlockedDateRange {
  id: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  type: "manual" | "booking";
  status?: string;
}

interface PropertyBlockedDatesProps {
  propertyId: string;
}

export default function PropertyBlockedDates({ propertyId }: PropertyBlockedDatesProps) {
  const [blockedRanges, setBlockedRanges] = useState<BlockedDateRange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Date selection
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  
  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchBlockedDates();
  }, [propertyId]);

  const fetchBlockedDates = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/properties/${propertyId}/blocked-dates`);
      if (res.ok) {
        const data = await res.json();
        setBlockedRanges(
          data.blockedDates.map((bd: any) => ({
            ...bd,
            startDate: new Date(bd.startDate),
            endDate: new Date(bd.endDate),
          }))
        );
      }
    } catch (error) {
      console.error("Failed to fetch blocked dates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(undefined);
    } else if (startDate && !endDate) {
      // Set end date
      if (date < startDate) {
        setStartDate(date);
        setEndDate(startDate);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleAddBlockedDates = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch(`/api/properties/${propertyId}/blocked-dates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: reason || "Blocked by admin",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add blocked dates");
      }

      toast.success("Dates blocked successfully");
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
      fetchBlockedDates();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlockedDate = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      const res = await fetch(
        `/api/properties/${propertyId}/blocked-dates?blockedDateId=${deleteId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        throw new Error("Failed to delete blocked dates");
      }

      toast.success("Blocked dates removed");
      fetchBlockedDates();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  // Get all blocked dates for calendar display
  const getAllBlockedDates = () => {
    const dates: Date[] = [];
    blockedRanges.forEach((range) => {
      let current = new Date(startOfDay(range.startDate));
      const end = startOfDay(range.endDate);
      while (current < end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
    });
    return dates;
  };

  const secondMonth = new Date(calendarMonth);
  secondMonth.setMonth(secondMonth.getMonth() + 1);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon icon="ph:spinner" className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Existing blocked dates list */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Current Blocked Dates</h4>
        {blockedRanges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dates are currently blocked.</p>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {blockedRanges.map((range) => (
              <div
                key={range.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {format(range.startDate, "d MMM yyyy")} → {format(range.endDate, "d MMM yyyy")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {differenceInDays(range.endDate, range.startDate)} nights
                    </span>
                  </div>
                  <Badge
                    variant={range.type === "booking" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {range.type === "booking" ? (
                      <>
                        <Icon icon="ph:user" className="w-3 h-3 mr-1" />
                        {range.reason}
                      </>
                    ) : (
                      <>
                        <Icon icon="ph:lock" className="w-3 h-3 mr-1" />
                        {range.reason}
                      </>
                    )}
                  </Badge>
                </div>
                {range.type === "manual" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteId(range.id)}
                  >
                    <Icon icon="ph:trash" className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add new blocked dates */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-semibold mb-3">Block New Dates</h4>
        
        {/* Selected range display */}
        {(startDate || endDate) && (
          <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">
                  {startDate ? format(startDate, "d MMM yyyy") : "Select start"} 
                  {" → "}
                  {endDate ? format(endDate, "d MMM yyyy") : "Select end"}
                </span>
                {startDate && endDate && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({differenceInDays(endDate, startDate)} nights)
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStartDate(undefined);
                  setEndDate(undefined);
                }}
              >
                <Icon icon="ph:x" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Calendar */}
        <div className="flex gap-4 justify-center mb-4">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <Button
                type="button"
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
              <span className="font-semibold text-sm">
                {format(calendarMonth, "MMMM yyyy", { locale: enUS })}
              </span>
              <div className="w-8" />
            </div>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleDateSelect}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              modifiers={{
                blocked: getAllBlockedDates(),
                range_start: startDate ? [startDate] : [],
                range_end: endDate ? [endDate] : [],
                range_middle: startDate && endDate
                  ? Array.from({ length: differenceInDays(endDate, startDate) - 1 }, (_, i) => {
                      const d = new Date(startDate);
                      d.setDate(d.getDate() + i + 1);
                      return d;
                    })
                  : [],
              }}
              modifiersClassNames={{
                blocked: "bg-red-100 dark:bg-red-900/30 text-red-500 line-through",
                range_start: "bg-orange-500 text-white rounded-full",
                range_end: "bg-orange-500 text-white rounded-full",
                range_middle: "bg-orange-100 dark:bg-orange-900/30",
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

          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8" />
              <span className="font-semibold text-sm">
                {format(secondMonth, "MMMM yyyy", { locale: enUS })}
              </span>
              <Button
                type="button"
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
              mode="single"
              selected={endDate}
              onSelect={handleDateSelect}
              month={secondMonth}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              modifiers={{
                blocked: getAllBlockedDates(),
                range_start: startDate ? [startDate] : [],
                range_end: endDate ? [endDate] : [],
                range_middle: startDate && endDate
                  ? Array.from({ length: differenceInDays(endDate, startDate) - 1 }, (_, i) => {
                      const d = new Date(startDate);
                      d.setDate(d.getDate() + i + 1);
                      return d;
                    })
                  : [],
              }}
              modifiersClassNames={{
                blocked: "bg-red-100 dark:bg-red-900/30 text-red-500 line-through",
                range_start: "bg-orange-500 text-white rounded-full",
                range_end: "bg-orange-500 text-white rounded-full",
                range_middle: "bg-orange-100 dark:bg-orange-900/30",
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

        {/* Reason input */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Input
            id="reason"
            placeholder="e.g., Maintenance, Owner use, Renovation..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Add button */}
        <Button
          onClick={handleAddBlockedDates}
          disabled={!startDate || !endDate || isSaving}
          className="w-full bg-orange-500 hover:bg-orange-600"
        >
          {isSaving ? (
            <>
              <Icon icon="ph:spinner" className="w-4 h-4 mr-2 animate-spin" />
              Blocking Dates...
            </>
          ) : (
            <>
              <Icon icon="ph:calendar-x" className="w-4 h-4 mr-2" />
              Block Selected Dates
            </>
          )}
        </Button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-100 dark:bg-red-900/30 rounded" />
          <span>Blocked/Booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-orange-100 dark:bg-orange-900/30 rounded" />
          <span>Selected to block</span>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove blocked dates?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make these dates available for booking again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBlockedDate}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}







