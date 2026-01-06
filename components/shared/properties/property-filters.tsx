"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/use-debounce";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/url";
import { Icon } from "@iconify/react";
import { AMENITY_FILTER_OPTIONS } from "@/lib/amenity-mapping";
import { cn } from "@/lib/utils";

// Type for dynamic area data
interface AreaOption {
  slug: string;
  label: string;
  count: number;
}

// Price ranges - dynamic based on listing type
const SALE_PRICE_MIN = 0;
const SALE_PRICE_MAX = 100; // 100 million THB

const RENT_PRICE_MIN = 0;
const RENT_PRICE_MAX = 500; // 500,000 THB per month

// Area ranges in sqm
const AREA_MIN = 0;
const AREA_MAX = 1000;

// Collapsible Section Component
function FilterSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = true,
  badge
}: { 
  title: string; 
  icon: string; 
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/50 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-3.5 text-left hover:bg-slate-100/80 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon icon={icon} className="w-4 h-4 text-primary" />
          </div>
          <span className="font-medium text-sm">{title}</span>
          {badge && (
            <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )} 
        />
      </button>
      <div className={cn(
        "overflow-hidden transition-all duration-200",
        isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="px-3.5 pb-3.5">
          {children}
        </div>
      </div>
    </div>
  );
}

// Pill button for beds/baths
function PillButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-10 px-4 rounded-full text-sm font-medium transition-all duration-200",
        "border-2 min-w-[3rem]",
        active 
          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25" 
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5"
      )}
    >
      {children}
    </button>
  );
}

// Amenity Chip Component
function AmenityChip({ 
  label, 
  icon, 
  active, 
  onClick 
}: { 
  label: string; 
  icon: string; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200",
        "border-2",
        active 
          ? "bg-primary/10 border-primary text-primary font-medium" 
          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/50"
      )}
    >
      <Icon icon={icon} className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

export default function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get current listing type
  const listingType = searchParams.get("type") || "all";
  const isRentalMode = listingType === "rent";

  // Dynamic price limits based on listing type
  const priceMin = isRentalMode ? RENT_PRICE_MIN : SALE_PRICE_MIN;
  const priceMax = isRentalMode ? RENT_PRICE_MAX : SALE_PRICE_MAX;

  // Search query state
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("query") || ""
  );
  const debouncedQuery = useDebounce(searchQuery, 500);

  // Price range state - reset when mode changes
  const [priceRange, setPriceRange] = useState<[number, number]>([
    priceMin,
    priceMax,
  ]);
  const debouncedPriceRange = useDebounce(priceRange, 500);

  // Area range state
  const [areaRange, setAreaRange] = useState<[number, number]>([
    parseInt(searchParams.get("minArea") || "0"),
    parseInt(searchParams.get("maxArea") || "1000"),
  ]);
  const debouncedAreaRange = useDebounce(areaRange, 500);

  // Dynamic location/area options
  const [locationOptions, setLocationOptions] = useState<AreaOption[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(true);

  // Fetch locations on mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await fetch('/api/properties/areas');
        const data = await response.json();
        if (data.success && data.areas) {
          setLocationOptions(data.areas);
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLocationsLoading(false);
      }
    };
    
    fetchLocations();
  }, []);

  // Reset price range when listing type changes
  useEffect(() => {
    setPriceRange([priceMin, priceMax]);
  }, [isRentalMode, priceMin, priceMax]);

  const updateFilter = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset page to 1 when filtering
    params.delete("page");
    
    // Reset price filters when changing listing type
    if (key === "type") {
      params.delete("minPrice");
      params.delete("maxPrice");
    }

    router.push(`/properties?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const updateMultipleFilters = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    params.delete("page");
    router.push(`/properties?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Search query effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (debouncedQuery) {
        const newUrl = formUrlQuery({
          params: searchParams.toString(),
          key: "query",
          value: debouncedQuery,
        });
        router.push(newUrl, { scroll: false });
      } else {
        const newUrl = removeKeysFromQuery({
          params: searchParams.toString(),
          keysToRemove: ["query"],
        });
        router.push(newUrl, { scroll: false });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Price range effect
  useEffect(() => {
    const [min, max] = debouncedPriceRange;
    const updates: Record<string, string | null> = {};
    
    if (min > priceMin) {
      updates.minPrice = min.toString();
    } else {
      updates.minPrice = null;
    }
    
    if (max < priceMax) {
      updates.maxPrice = max.toString();
    } else {
      updates.maxPrice = null;
    }
    
    if (Object.keys(updates).length > 0) {
      updateMultipleFilters(updates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPriceRange]);

  // Area range effect
  useEffect(() => {
    const [min, max] = debouncedAreaRange;
    const updates: Record<string, string | null> = {};
    
    if (min > AREA_MIN) {
      updates.minArea = min.toString();
    } else {
      updates.minArea = null;
    }
    
    if (max < AREA_MAX) {
      updates.maxArea = max.toString();
    } else {
      updates.maxArea = null;
    }
    
    if (Object.keys(updates).length > 0) {
      updateMultipleFilters(updates);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAreaRange]);

  const handleAmenityChange = (amenity: string) => {
    const current = searchParams.get("amenities")?.split(",").filter(Boolean) || [];
    let newAmenities;

    if (current.includes(amenity)) {
      newAmenities = current.filter((a) => a !== amenity);
    } else {
      newAmenities = [...current, amenity];
    }

    updateFilter(
      "amenities",
      newAmenities.length > 0 ? newAmenities.join(",") : null
    );
  };

  // Format price based on mode
  const formatPrice = (value: number) => {
    if (isRentalMode) {
      if (value >= RENT_PRICE_MAX) return "฿500K+";
      if (value === 0) return "฿0";
      return `฿${value}K`;
    } else {
      if (value >= SALE_PRICE_MAX) return "฿100M+";
      if (value === 0) return "฿0";
      return `฿${value}M`;
    }
  };

  const formatArea = (value: number) => {
    if (value >= 1000) return "1000+ m²";
    if (value === 0) return "0 m²";
    return `${value} m²`;
  };

  const resetAllFilters = () => {
    setSearchQuery("");
    setPriceRange([priceMin, priceMax]);
    setAreaRange([AREA_MIN, AREA_MAX]);
    router.push("/properties");
  };

  // Count active filters
  const countActiveFilters = () => {
    let count = 0;
    if (searchParams.get("query")) count++;
    if (searchParams.get("category")) count++;
    if (searchParams.get("type")) count++;
    if (searchParams.get("beds")) count++;
    if (searchParams.get("baths")) count++;
    if (searchParams.get("amenities")) count++;
    if (searchParams.get("minPrice") || searchParams.get("maxPrice")) count++;
    if (searchParams.get("minArea") || searchParams.get("maxArea")) count++;
    if (searchParams.get("ownershipType")) count++;
    if (searchParams.get("area")) count++;
    return count;
  };

  const activeFilterCount = countActiveFilters();
  const selectedAmenities = searchParams.get("amenities")?.split(",") || [];

  return (
    <div className="space-y-3 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1 mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              {activeFilterCount}
            </span>
          )}
        </h3>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2"
            onClick={resetAllFilters}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search location, title..."
          className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quick Filters: Buy/Rent */}
      <div className="flex gap-2 p-1">
        {[
          { value: "all", label: "All" },
          { value: "buy", label: "Buy" },
          { value: "rent", label: "Rent" },
        ].map((type) => {
          const isActive = searchParams.get("type") === type.value || 
            (type.value === "all" && !searchParams.get("type"));
          return (
            <button
              key={type.value}
              onClick={() => updateFilter("type", type.value === "all" ? null : type.value)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25" 
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              )}
            >
              {type.label}
            </button>
          );
        })}
      </div>

      {/* Location */}
      <FilterSection title="Location" icon="ph:map-pin-fill" defaultOpen={true}>
        <Select
          value={searchParams.get("area") || "all"}
          onValueChange={(val) => updateFilter("area", val === "all" ? null : val)}
          disabled={locationsLoading}
        >
          <SelectTrigger className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            {locationsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="All Locations" />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value="all">All Locations</SelectItem>
            {locationOptions.map((area) => (
              <SelectItem key={area.slug} value={area.slug}>
                <span className="flex items-center justify-between w-full gap-2">
                  {area.label}
                  <span className="text-xs text-muted-foreground">({area.count})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Price Range */}
      <FilterSection 
        title={isRentalMode ? "Monthly Rent" : "Price"} 
        icon="ph:currency-circle-dollar-fill" 
        defaultOpen={true}
        badge={
          (searchParams.get("minPrice") || searchParams.get("maxPrice")) 
            ? "Active" 
            : undefined
        }
      >
        <div className="space-y-4">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={priceMin}
            max={priceMax}
            step={isRentalMode ? 5 : 1}
            className="mt-2"
          />
          <div className="flex items-center justify-between">
            <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium">
              {formatPrice(priceRange[0])}
            </div>
            <span className="text-muted-foreground text-sm">to</span>
            <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium">
              {formatPrice(priceRange[1])}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Property Type */}
      <FilterSection title="Property Type" icon="ph:buildings-fill" defaultOpen={true}>
        <Select
          value={searchParams.get("category") || "all"}
          onValueChange={(val) => updateFilter("category", val === "all" ? null : val)}
        >
          <SelectTrigger className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="luxury-villa">🏡 Luxury Villa</SelectItem>
            <SelectItem value="apartment">🏢 Apartment</SelectItem>
            <SelectItem value="residential-home">🏠 Residential Home</SelectItem>
            <SelectItem value="office-spaces">🏬 Office Spaces</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Bedrooms & Bathrooms */}
      <FilterSection title="Rooms" icon="ph:bed-fill" defaultOpen={true}>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Bedrooms</Label>
            <div className="flex gap-2 flex-wrap">
              {["Any", "1", "2", "3", "4"].map((b) => {
                const isActive =
                  searchParams.get("beds") === b ||
                  (b === "Any" && !searchParams.get("beds"));
                return (
                  <PillButton
                    key={b}
                    active={isActive}
                    onClick={() => updateFilter("beds", b === "Any" ? null : b)}
                  >
                    {b === "Any" ? "Any" : `${b}+`}
                  </PillButton>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Bathrooms</Label>
            <div className="flex gap-2 flex-wrap">
              {["Any", "1", "2", "3", "4"].map((b) => {
                const isActive =
                  searchParams.get("baths") === b ||
                  (b === "Any" && !searchParams.get("baths"));
                return (
                  <PillButton
                    key={b}
                    active={isActive}
                    onClick={() => updateFilter("baths", b === "Any" ? null : b)}
                  >
                    {b === "Any" ? "Any" : `${b}+`}
                  </PillButton>
                );
              })}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Ownership */}
      <FilterSection title="Ownership" icon="ph:scroll-fill" defaultOpen={true}>
        <Select
          value={searchParams.get("ownershipType") || "all"}
          onValueChange={(val) => updateFilter("ownershipType", val === "all" ? null : val)}
        >
          <SelectTrigger className="w-full h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="FREEHOLD">✅ Freehold</SelectItem>
            <SelectItem value="LEASEHOLD">📋 Leasehold</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Living Area */}
      <FilterSection 
        title="Living Area" 
        icon="ph:ruler-fill" 
        defaultOpen={false}
        badge={
          (searchParams.get("minArea") || searchParams.get("maxArea")) 
            ? "Active" 
            : undefined
        }
      >
        <div className="space-y-4">
          <Slider
            value={areaRange}
            onValueChange={(value) => setAreaRange(value as [number, number])}
            min={AREA_MIN}
            max={AREA_MAX}
            step={10}
            className="mt-2"
          />
          <div className="flex items-center justify-between">
            <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium">
              {formatArea(areaRange[0])}
            </div>
            <span className="text-muted-foreground text-sm">to</span>
            <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium">
              {formatArea(areaRange[1])}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Amenities */}
      <FilterSection 
        title="Amenities" 
        icon="ph:star-fill" 
        defaultOpen={true}
        badge={selectedAmenities.length > 0 ? selectedAmenities.length : undefined}
      >
        <div className="flex flex-wrap gap-2">
          {AMENITY_FILTER_OPTIONS.map((item) => (
            <AmenityChip
              key={item.value}
              label={item.label}
              icon={item.icon}
              active={selectedAmenities.includes(item.value)}
              onClick={() => handleAmenityChange(item.value)}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}
