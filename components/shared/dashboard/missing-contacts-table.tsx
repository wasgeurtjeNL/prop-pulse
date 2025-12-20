import Link from "next/link";
import { Phone, Mail, User, Building2, Edit, ExternalLink, AlertTriangle, Tag, Key } from "lucide-react";
import { unstable_cache } from "next/cache";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import prisma from "@/lib/prisma";
import { getPropertyUrl } from "@/lib/property-url";

// Cached properties with missing contacts - revalidates every 60 seconds
export const getPropertiesWithMissingContacts = unstable_cache(
  async () => {
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          // Only show properties without a phone number
          {
            OR: [
              { ownerPhone: null },
              { ownerPhone: "" },
            ],
          },
          // And missing name or email
          {
            OR: [
              { ownerName: null },
              { ownerName: "" },
              { ownerEmail: null },
              { ownerEmail: "" },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        type: true,
        status: true,
        ownerName: true,
        ownerEmail: true,
        ownerPhone: true,
        ownerCompany: true,
        provinceSlug: true,
        areaSlug: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return properties;
  },
  ["properties-missing-contacts"],
  { revalidate: 60, tags: ["properties"] }
);

// Cached missing contacts count - revalidates every 60 seconds
export const getMissingContactsCount = unstable_cache(
  async () => {
    const count = await prisma.property.count({
      where: {
        AND: [
          // Only count properties without a phone number
          {
            OR: [
              { ownerPhone: null },
              { ownerPhone: "" },
            ],
          },
          // And missing name or email
          {
            OR: [
              { ownerName: null },
              { ownerName: "" },
              { ownerEmail: null },
              { ownerEmail: "" },
            ],
          },
        ],
      },
    });
    return count;
  },
  ["missing-contacts-count"],
  { revalidate: 60, tags: ["properties"] }
);

function getMissingFields(property: {
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
}) {
  const missing: string[] = [];
  if (!property.ownerName || property.ownerName.trim() === "") missing.push("Name");
  if (!property.ownerEmail || property.ownerEmail.trim() === "") missing.push("Email");
  if (!property.ownerPhone || property.ownerPhone.trim() === "") missing.push("Phone");
  return missing;
}

function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "INACTIVE":
      return "secondary";
    case "SOLD":
    case "RENTED":
      return "outline";
    default:
      return "secondary";
  }
}

type PropertyWithMissingContacts = Awaited<ReturnType<typeof getPropertiesWithMissingContacts>>[number];

function PropertiesTable({ properties }: { properties: PropertyWithMissingContacts[] }) {
  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
          <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">All Complete! 🎉</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          All properties have complete contact details.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Property</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Missing</TableHead>
            <TableHead>Current Data</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {properties.map((property) => {
            const missingFields = getMissingFields(property);
            return (
              <TableRow key={property.id}>
                <TableCell>
                  <div className="font-medium max-w-[200px] truncate" title={property.title}>
                    {property.title}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-[150px] truncate text-sm" title={property.location}>
                    {property.location}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(property.status)}>
                    {property.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {missingFields.map((field) => (
                      <Badge key={field} variant="destructive" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm space-y-1">
                    {property.ownerName && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{property.ownerName}</span>
                      </div>
                    )}
                    {property.ownerEmail && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{property.ownerEmail}</span>
                      </div>
                    )}
                    {property.ownerPhone && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>{property.ownerPhone}</span>
                      </div>
                    )}
                    {property.ownerCompany && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate max-w-[120px]">{property.ownerCompany}</span>
                      </div>
                    )}
                    {!property.ownerName && !property.ownerEmail && !property.ownerPhone && (
                      <span className="text-muted-foreground italic">No data</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={getPropertyUrl(property)} target="_blank">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/edit/${property.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export async function MissingContactsTable() {
  const properties = await getPropertiesWithMissingContacts();

  // Split properties by type
  const forSaleProperties = properties.filter(p => p.type === "FOR_SALE");
  const forRentProperties = properties.filter(p => p.type === "FOR_RENT");

  const stats = {
    total: properties.length,
    forSale: forSaleProperties.length,
    forRent: forRentProperties.length,
    missingName: properties.filter(p => !p.ownerName || p.ownerName.trim() === "").length,
    missingEmail: properties.filter(p => !p.ownerEmail || p.ownerEmail.trim() === "").length,
    missingPhone: properties.filter(p => !p.ownerPhone || p.ownerPhone.trim() === "").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Incomplete</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              properties with missing data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">For Sale</CardTitle>
            <Tag className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.forSale}</div>
            <p className="text-xs text-muted-foreground">
              missing contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">For Rent</CardTitle>
            <Key className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.forRent}</div>
            <p className="text-xs text-muted-foreground">
              missing contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missing Fields</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-bold">{stats.missingName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-bold">{stats.missingEmail}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span className="font-bold">{stats.missingPhone}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Properties Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Properties with Missing Contact Details</CardTitle>
          <CardDescription>
            Click &quot;Edit&quot; to add the missing contact information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="for-sale" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="for-sale" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                For Sale
                {stats.forSale > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {stats.forSale}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="for-rent" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                For Rent
                {stats.forRent > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {stats.forRent}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="for-sale" className="mt-4">
              <PropertiesTable properties={forSaleProperties} />
            </TabsContent>
            <TabsContent value="for-rent" className="mt-4">
              <PropertiesTable properties={forRentProperties} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
