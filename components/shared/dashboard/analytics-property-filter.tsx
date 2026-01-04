"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Home, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  title: string;
  listingNumber: string | null;
  location: string;
}

export function AnalyticsPropertyFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPropertyId = searchParams.get("property") || "all";
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const response = await fetch("/api/properties?limit=500");
        if (response.ok) {
          const data = await response.json();
          setProperties(data.properties || []);
        }
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const filteredProperties = useMemo(() => {
    if (!searchTerm) return properties;
    const term = searchTerm.toLowerCase();
    return properties.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        p.listingNumber?.toLowerCase().includes(term) ||
        p.location?.toLowerCase().includes(term)
    );
  }, [properties, searchTerm]);

  const handlePropertyChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("property");
    } else {
      params.set("property", value);
    }
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const clearFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("property");
    router.push(`/dashboard/analytics?${params.toString()}`);
  };

  const selectedProperty = properties.find((p) => p.id === currentPropertyId);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">Property:</span>
      </div>
      <Select value={currentPropertyId} onValueChange={handlePropertyChange}>
        <SelectTrigger className="w-[200px] sm:w-[280px]">
          <SelectValue placeholder={loading ? "Loading..." : "All Properties"}>
            {currentPropertyId === "all"
              ? "All Properties"
              : selectedProperty
              ? `${selectedProperty.listingNumber || ""} ${selectedProperty.title}`.trim().substring(0, 35)
              : "All Properties"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            <SelectItem value="all">
              <span className="font-medium">All Properties</span>
            </SelectItem>
            {filteredProperties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {property.listingNumber
                      ? `${property.listingNumber} - ${property.title.substring(0, 30)}`
                      : property.title.substring(0, 40)}
                  </span>
                  {property.location && (
                    <span className="text-xs text-muted-foreground">
                      {property.location}
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
            {filteredProperties.length === 0 && searchTerm && (
              <div className="py-4 text-center text-sm text-muted-foreground">
                No properties found
              </div>
            )}
          </div>
        </SelectContent>
      </Select>
      {currentPropertyId !== "all" && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={clearFilter}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

