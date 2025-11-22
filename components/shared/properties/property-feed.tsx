"use client";

import { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PropertyType } from "@/lib/generated/prisma/enums";
import PropertyListCard from "./property-list-card";
import PropertyCard from "./property-card";

export interface Property {
  id: string;
  title: string;
  slug: string;
  location: string;
  price: string;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  type: PropertyType;
  tag?: string | null;
  status: "ACTIVE" | "INACTIVE" | "SOLD" | "RENTED";
  amenities?: string[];
}

export default function PropertyFeed({
  properties,
}: {
  properties: Property[];
}) {
  const [isGridView, setIsGridView] = useState(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-medium text-foreground">
            {properties.length}
          </span>{" "}
          results
        </p>

        <div className="flex items-center gap-4">
          <div className="flex items-center border rounded-md bg-background">
            <Button
              variant={isGridView ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none rounded-l-md"
              onClick={() => setIsGridView(true)}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant={!isGridView ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-none rounded-r-md"
              onClick={() => setIsGridView(false)}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div
        className={
          isGridView
            ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            : "flex flex-col gap-6"
        }
      >
        {properties.map((property) => {
          return isGridView ? (
            <PropertyCard key={property.id} {...property} />
          ) : (
            <PropertyListCard key={property.id} {...property} />
          );
        })}
      </div>
    </div>
  );
}
