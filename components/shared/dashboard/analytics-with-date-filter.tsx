"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "./date-range-picker";

export function AnalyticsDateFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Parse date range from URL
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");
  
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
    if (fromParam && toParam) {
      return {
        from: parseISO(fromParam),
        to: parseISO(toParam),
      };
    }
    // Default: last 30 days
    return {
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date()),
    };
  });

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    
    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    
    if (range?.from) {
      params.set("from", range.from.toISOString().split("T")[0]);
    } else {
      params.delete("from");
    }
    
    if (range?.to) {
      params.set("to", range.to.toISOString().split("T")[0]);
    } else {
      params.delete("to");
    }
    
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  return (
    <DateRangePicker
      dateRange={dateRange}
      onDateRangeChange={handleDateRangeChange}
    />
  );
}

