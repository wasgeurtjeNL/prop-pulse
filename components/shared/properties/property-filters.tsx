"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useDebounce } from "@/hooks/use-debounce";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/url";
import { Icon } from "@iconify/react";

// Type for dynamic area data
interface AreaOption {
  slug: string;
  label: string;
  count: number;
}

// Amenities that actually exist in the database (removed WiFi and Washing Machine)
const AMENITIES_OPTIONS = [
  { label: "Swimming Pool", value: "Swimming Pool", icon: "ph:swimming-pool" },
  { label: "Air Conditioning", value: "Air Conditioning", icon: "ph:thermometer-cold" },
  { label: "Gym", value: "Gym", icon: "ph:barbell" },
];

// Price ranges - dynamic based on listing type
const SALE_PRICE_MIN = 0;
const SALE_PRICE_MAX = 100; // 100 million THB

const RENT_PRICE_MIN = 0;
const RENT_PRICE_MAX = 500; // 500,000 THB per month

// Area ranges in sqm
const AREA_MIN = 0;
const AREA_MAX = 1000;

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

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const current = searchParams.get("amenities")?.split(",").filter(Boolean) || [];
    let newAmenities;

    if (checked) {
      newAmenities = [...current, amenity];
    } else {
      newAmenities = current.filter((a) => a !== amenity);
    }

    updateFilter(
      "amenities",
      newAmenities.length > 0 ? newAmenities.join(",") : null
    );
  };

  // Format price based on mode
  const formatPrice = (value: number) => {
    if (isRentalMode) {
      // Rental mode: prices in thousands THB per month
      if (value >= RENT_PRICE_MAX) return "฿500K+";
      if (value === 0) return "฿0";
      return `฿${value}K`;
    } else {
      // Sale mode: prices in millions THB
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

  return (
    <div className="sticky top-24 space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-medium">
              {activeFilterCount}
            </span>
          )}
        </div>
        <Button
          variant="link"
          className="px-0 text-muted-foreground h-auto text-sm"
          onClick={resetAllFilters}
        >
          Reset
        </Button>
      </div>

      {/* Search Location */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search location..."
          className="pl-9"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <Separator />

      {/* Location Filter - Dynamic */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon icon="ph:map-pin" className="w-4 h-4 text-primary" />
          <Label className="font-medium">Location</Label>
        </div>
        <Select
          value={searchParams.get("area") || "all"}
          onValueChange={(val) => updateFilter("area", val === "all" ? null : val)}
          disabled={locationsLoading}
        >
          <SelectTrigger className="w-full">
            {locationsLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="All Locations" />
            )}
          </SelectTrigger>
          <SelectContent className="w-full max-h-64">
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
      </div>

      <Separator />

      {/* Listing Status - Moved up so price filter can react to it */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon icon="ph:tag" className="w-4 h-4 text-primary" />
          <Label className="font-medium">Listing Status</Label>
        </div>
        <Select
          value={searchParams.get("type") || "all"}
          onValueChange={(val) => updateFilter("type", val === "all" ? null : val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="all">Buy & Rent</SelectItem>
            <SelectItem value="buy">For Sale</SelectItem>
            <SelectItem value="rent">For Rent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price Range - Dynamic based on listing type */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon icon="ph:currency-circle-dollar" className="w-4 h-4 text-primary" />
          <Label className="font-medium">
            Price Range {isRentalMode && <span className="text-xs text-muted-foreground">(monthly)</span>}
          </Label>
        </div>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            min={priceMin}
            max={priceMax}
            step={isRentalMode ? 5 : 1}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatPrice(priceRange[0])}</span>
            <span>{formatPrice(priceRange[1])}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Area Range */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon icon="ph:rulers" className="w-4 h-4 text-primary" />
          <Label className="font-medium">Living Area (m²)</Label>
        </div>
        <div className="px-1">
          <Slider
            value={areaRange}
            onValueChange={(value) => setAreaRange(value as [number, number])}
            min={AREA_MIN}
            max={AREA_MAX}
            step={10}
            className="mb-2"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatArea(areaRange[0])}</span>
            <span>{formatArea(areaRange[1])}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Property Category */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon icon="ph:buildings" className="w-4 h-4 text-primary" />
          <Label className="font-medium">Property Category</Label>
        </div>
        <Select
          value={searchParams.get("category") || "all"}
          onValueChange={(val) => updateFilter("category", val === "all" ? null : val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="luxury-villa">Luxury Villa</SelectItem>
            <SelectItem value="apartment">Apartment</SelectItem>
            <SelectItem value="residential-home">Residential Home</SelectItem>
            <SelectItem value="office-spaces">Office Spaces</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Ownership Type - Important for Thailand */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon icon="ph:scroll" className="w-4 h-4 text-primary" />
          <Label className="font-medium">Ownership Type</Label>
        </div>
        <Select
          value={searchParams.get("ownershipType") || "all"}
          onValueChange={(val) => updateFilter("ownershipType", val === "all" ? null : val)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="w-full">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="FREEHOLD">Freehold</SelectItem>
            <SelectItem value="LEASEHOLD">Leasehold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Bedrooms & Bathrooms */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="ph:bed" className="w-4 h-4 text-primary" />
            <Label className="font-medium">Bedrooms</Label>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Any", "1", "2", "3", "4"].map((b) => {
              const isActive =
                searchParams.get("beds") === b ||
                (b === "Any" && !searchParams.get("beds"));
              return (
                <button
                  key={b}
                  onClick={() => updateFilter("beds", b === "Any" ? null : b)}
                  className={`h-9 w-10 rounded-md border text-sm font-medium transition-colors
                            ${
                              isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-accent border-input"
                            }
                        `}
                >
                  {b === "Any" ? "Any" : `${b}+`}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="ph:bathtub" className="w-4 h-4 text-primary" />
            <Label className="font-medium">Bathrooms</Label>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Any", "1", "2", "3", "4"].map((b) => {
              const isActive =
                searchParams.get("baths") === b ||
                (b === "Any" && !searchParams.get("baths"));
              return (
                <button
                  key={b}
                  onClick={() => updateFilter("baths", b === "Any" ? null : b)}
                  className={`h-9 w-10 rounded-md border text-sm font-medium transition-colors
                            ${
                              isActive
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-accent border-input"
                            }
                        `}
                >
                  {b === "Any" ? "Any" : `${b}+`}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <Separator />

      {/* Amenities */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Icon icon="ph:list-checks" className="w-4 h-4 text-primary" />
          <Label className="font-medium">Amenities</Label>
        </div>
        <div className="space-y-2.5">
          {AMENITIES_OPTIONS.map((item) => {
            const isChecked = searchParams
              .get("amenities")
              ?.split(",")
              .includes(item.value);
            return (
              <div key={item.value} className="flex items-center space-x-3">
                <Checkbox
                  id={item.value}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleAmenityChange(item.value, checked as boolean)
                  }
                />
                <Label htmlFor={item.value} className="font-normal cursor-pointer flex items-center gap-2">
                  <Icon icon={item.icon} className="w-4 h-4 text-muted-foreground" />
                  {item.label}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
