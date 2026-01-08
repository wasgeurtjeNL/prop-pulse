import AddPropertyForm from "@/components/shared/forms/add-property-form";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { PropertyTasksWidget } from "@/components/shared/dashboard/property-tasks-widget";

// Helper functie om vorige en volgende property te vinden
async function getAdjacentProperties(currentId: string, userId: string) {
  // Haal alle properties op in dezelfde volgorde als de dashboard tabel
  const allProperties = await prisma.property.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  const currentIndex = allProperties.findIndex((p) => p.id === currentId);

  return {
    prevId: currentIndex > 0 ? allProperties[currentIndex - 1].id : null,
    nextId:
      currentIndex < allProperties.length - 1
        ? allProperties[currentIndex + 1].id
        : null,
    currentPosition: currentIndex + 1,
    totalCount: allProperties.length,
  };
}

export default async function EditPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const property = await prisma.property.findFirst({
    where: { id },
    include: {
      images: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!property) return notFound();

  // Haal vorige/volgende property info op
  const adjacent = await getAdjacentProperties(id, property.userId);

  // Bepaal de thumbnail (eerste image of fallback)
  const thumbnailUrl = property.images[0]?.url || property.image;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header met thumbnail, titel en navigatie */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {/* Terug naar dashboard */}
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" title="Back to Dashboard">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          {/* Property Thumbnail */}
          {thumbnailUrl && (
            <div className="relative h-16 w-24 overflow-hidden rounded-lg border shadow-sm flex-shrink-0">
              <Image
                src={thumbnailUrl}
                alt={property.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          )}

          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight">Edit Property</h2>
            <p className="text-sm text-muted-foreground truncate max-w-[300px]">
              {property.title}
            </p>
          </div>
        </div>

        {/* Navigatie pijlen */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">
            {adjacent.currentPosition} / {adjacent.totalCount}
          </span>

          <Link
            href={adjacent.prevId ? `/dashboard/edit/${adjacent.prevId}` : "#"}
            className={!adjacent.prevId ? "pointer-events-none" : ""}
          >
            <Button
              variant="outline"
              size="icon"
              disabled={!adjacent.prevId}
              title="Previous Property"
              className={!adjacent.prevId ? "opacity-50" : ""}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>

          <Link
            href={adjacent.nextId ? `/dashboard/edit/${adjacent.nextId}` : "#"}
            className={!adjacent.nextId ? "pointer-events-none" : ""}
          >
            <Button
              variant="outline"
              size="icon"
              disabled={!adjacent.nextId}
              title="Next Property"
              className={!adjacent.nextId ? "opacity-50" : ""}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tasks Widget */}
      <div className="mb-6">
        <PropertyTasksWidget propertyId={id} />
      </div>

      <AddPropertyForm initialData={property} />
    </div>
  );
}
