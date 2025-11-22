import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Bed, Bath, Square } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "./property-feed";

const PropertyListCard = ({
  title,
  slug,
  location,
  price,
  beds,
  baths,
  sqft,
  image,
}: Property) => {
  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row p-0">
      <div className="relative overflow-hidden bg-slate-100 w-full sm:w-72 md:w-80 sm:shrink-0 h-64 sm:h-auto">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-col flex-1 p-2">
        <CardHeader className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="line-clamp-1 text-lg">{title}</CardTitle>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="mr-1 h-3.5 w-3.5" />
                {location}
              </div>
            </div>
            <div className="text-xl font-bold text-primary text-right hidden sm:block">
              {price}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 flex-1">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            Beautifully designed property featuring modern amenities and
            spacious living areas.
          </p>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Bed className="h-4 w-4" />
              <span className="font-medium text-foreground">{beds}</span> Beds
            </div>
            <div className="flex items-center gap-1">
              <Bath className="h-4 w-4" />
              <span className="font-medium text-foreground">{baths}</span> Baths
            </div>
            <div className="flex items-center gap-1">
              <Square className="h-4 w-4" />
              <span className="font-medium text-foreground">{sqft}</span> SqFt
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button className="w-full" variant="default" asChild>
            <Link href={`/listings/${slug}`}>View Property</Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default PropertyListCard;
