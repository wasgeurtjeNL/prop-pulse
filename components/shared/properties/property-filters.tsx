"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
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
import { useDebounce } from "@/hooks/use-debounce";
import { formUrlQuery, removeKeysFromQuery } from "@/lib/url";

export default function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("query") || ""
  );
  const debouncedQuery = useDebounce(searchQuery, 500);

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset page to 1 when filtering
    params.delete("page");

    router.push(`/properties?${params.toString()}`, { scroll: false });
  };

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
    }, 1000);

    return () => clearTimeout(delayDebounceFn);
  }, [debouncedQuery, router, searchParams]);

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    const current = searchParams.get("amenities")?.split(",") || [];
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

  return (
    <div className="sticky top-24 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filters</h3>
        <Button
          variant="link"
          className="px-0 text-muted-foreground h-auto"
          onClick={() => router.push("/properties")}
        >
          Reset
        </Button>
      </div>

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

      <div className="space-y-3">
        <Label>Listing Status</Label>
        <Select
          defaultValue={searchParams.get("type") || "all"}
          onValueChange={(val) => updateFilter("type", val)}
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

      <div className="space-y-4">
        <div>
          <Label className="mb-2 block">Bedrooms</Label>
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
                                ? "bg-primary text-primary-foreground"
                                : "bg-background hover:bg-accent"
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

      <div className="space-y-3">
        <Label>Amenities</Label>
        <div className="space-y-2">
          {["Pool", "Garage", "Air Conditioning", "Gym"].map((item) => {
            const isChecked = searchParams
              .get("amenities")
              ?.split(",")
              .includes(item);
            return (
              <div key={item} className="flex items-center space-x-2">
                <Checkbox
                  id={item}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleAmenityChange(item, checked as boolean)
                  }
                />
                <Label htmlFor={item} className="font-normal cursor-pointer">
                  {item}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
