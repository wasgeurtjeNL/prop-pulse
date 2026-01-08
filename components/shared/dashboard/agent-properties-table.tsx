"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Edit, Trash, Eye, Star, Loader2, X, UserPlus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import Link from "next/link";
import { PropertyType, Status } from "@prisma/client";
import { formatType } from "@/lib/utils";
import { getStatusConfig } from "@/lib/utils/property-status";
import { deleteProperty, bulkDeleteProperties } from "@/lib/actions/property.actions";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Building2 } from "lucide-react";
import ViewLiveButton from "./view-live-button";
import { getPropertyUrl } from "@/lib/property-url";
import { RegisterLeadModal } from "./register-lead-modal";

interface AgentProperty {
  id: string;
  listingNumber: string | null;
  title: string;
  slug: string;
  provinceSlug: string | null;
  areaSlug: string | null;
  location: string;
  price: string;
  status: Status;
  type: PropertyType;
  image: string;
  createdAt: Date;
  isHighlighted: boolean;
}

export function AgentPropertiesTable({ data }: { data: AgentProperty[] }) {
  const { data: session } = authClient.useSession();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [registerLeadModal, setRegisterLeadModal] = useState<{
    open: boolean;
    property: AgentProperty | null;
  }>({ open: false, property: null });

  // Toggle single selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Toggle all selection
  const toggleSelectAll = () => {
    if (selectedIds.size === data.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(p => p.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedIds.size} properties? This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await bulkDeleteProperties(Array.from(selectedIds));
      
      if (result.success) {
        toast.success(`Successfully deleted ${result.deletedCount} properties`);
        setSelectedIds(new Set());
      } else {
        toast.error(result.error || "Failed to delete properties");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No properties found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try using different search terms or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedIds.size} {selectedIds.size === 1 ? "property" : "properties"} selected
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-7 text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={isDeleting}
            className="h-8"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash className="h-4 w-4 mr-2" />
                Delete {selectedIds.size} {selectedIds.size === 1 ? "Property" : "Properties"}
              </>
            )}
          </Button>
        </div>
      )}

      <div className="rounded-md border bg-white dark:bg-slate-900">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] hidden sm:table-cell">
                <Checkbox
                  checked={data.length > 0 && selectedIds.size === data.length}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead className="w-[50px] sm:w-[70px]">Image</TableHead>
              <TableHead className="w-[70px] sm:w-[85px] hidden sm:table-cell">Listing #</TableHead>
              <TableHead className="w-auto">Title</TableHead>
              <TableHead className="hidden lg:table-cell w-[80px]">Status</TableHead>
              <TableHead className="hidden xl:table-cell w-[80px]">Type</TableHead>
              <TableHead className="hidden lg:table-cell w-[120px]">Price</TableHead>
              <TableHead className="text-right w-[70px] sm:w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((property) => (
              <TableRow 
                key={property.id}
                className={selectedIds.has(property.id) ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}
              >
                <TableCell className="hidden sm:table-cell">
                  <Checkbox
                    checked={selectedIds.has(property.id)}
                    onCheckedChange={() => toggleSelection(property.id)}
                    aria-label={`Select ${property.title}`}
                  />
                </TableCell>
                <TableCell className="p-1 sm:p-2">
                  <div className="relative h-9 w-9 sm:h-10 sm:w-14 overflow-hidden rounded-md">
                    <Image
                      src={property.image}
                      alt={property.title}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {property.listingNumber ? (
                    <span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {property.listingNumber}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="font-medium overflow-hidden">
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="truncate text-sm sm:text-base">{property.title}</span>
                    {property.isHighlighted && (
                      <span className="shrink-0 inline-flex items-center gap-0.5 px-1 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" title="Featured on Homepage">
                        <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                        Hero
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground truncate">
                    {property.location}
                  </div>
                  {/* Mobile-only: show status and price */}
                  <div className="flex items-center gap-1.5 mt-0.5 lg:hidden">
                    <Badge className={`${getStatusConfig(property.status).badgeClass} text-[10px] px-1.5 py-0`}>
                      {getStatusConfig(property.status).label}
                    </Badge>
                    <span className="text-[11px] font-semibold text-emerald-600 truncate">{property.price}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <Badge
                    className={getStatusConfig(property.status).badgeClass}
                  >
                    {getStatusConfig(property.status).label}
                  </Badge>
                </TableCell>
                <TableCell className="hidden xl:table-cell">
                  <span className="capitalize">{formatType(property.type)}</span>
                </TableCell>
                <TableCell className="hidden lg:table-cell">{property.price}</TableCell>
                <TableCell className="text-right p-1 sm:p-2">
                <div className="flex items-center justify-end gap-0">
                  {/* Register Lead Button - hidden on mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Register Lead"
                    onClick={() => setRegisterLeadModal({ open: true, property })}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 hidden sm:inline-flex h-8 w-8"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                  
                  {/* Direct View Live Button - hidden on mobile */}
                  <span className="hidden sm:inline-flex">
                    <ViewLiveButton href={getPropertyUrl(property)} variant="icon" />
                  </span>
                  
                  {/* Edit Button - always visible */}
                  <Link href={`/dashboard/edit/${property.id}`}>
                    <Button variant="ghost" size="icon" title="Edit Property" className="h-7 w-7 sm:h-8 sm:w-8">
                      <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </Link>
                  
                  {/* More Actions - always visible */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                        <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => setRegisterLeadModal({ open: true, property })}
                      className="text-blue-600"
                    >
                      <UserPlus className="mr-2 h-4 w-4" /> Register Lead
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={getPropertyUrl(property)}>
                        <Eye className="mr-2 h-4 w-4" /> View Live
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/dashboard/edit/${property.id}`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={async () => {
                        if (!session?.user) return;
                        if (
                          confirm(
                            "Are you sure you want to delete this property?"
                          )
                        ) {
                          try {
                            await deleteProperty(
                              property.id,
                              session?.user.id as string
                            );
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : String(error)
                            );
                          }
                        }
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                  </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Register Lead Modal */}
      {registerLeadModal.property && (
        <RegisterLeadModal
          open={registerLeadModal.open}
          onOpenChange={(open) => setRegisterLeadModal({ ...registerLeadModal, open })}
          property={{
            id: registerLeadModal.property.id,
            title: registerLeadModal.property.title,
            slug: registerLeadModal.property.slug,
            provinceSlug: registerLeadModal.property.provinceSlug,
            areaSlug: registerLeadModal.property.areaSlug,
            location: registerLeadModal.property.location,
            price: registerLeadModal.property.price,
            type: registerLeadModal.property.type,
          }}
        />
      )}
    </div>
  );
}
