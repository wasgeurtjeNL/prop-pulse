"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, Sparkles, Star, User, Building, Phone, Mail, FileText, Percent, Home, Image as ImageIcon, Settings, Lightbulb, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RichTextEditor from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InfoTooltip } from "@/components/ui/tooltip";
import { CollapsibleCard } from "@/components/ui/collapsible";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { toast } from "sonner";
import { uploadToImageKit } from "@/lib/actions/upload.actions";
import { createProperty, updateProperty, togglePropertyHighlight } from "@/lib/actions/property.actions";
import { propertySchema } from "@/lib/validations";
import { Property, PropertyImage } from "@/lib/generated/prisma/client";
import { updateImagePositions } from "@/lib/actions/property.actions";
import { GripVertical, Crown } from "lucide-react";
import PropertyBlockedDates from "./property-blocked-dates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import SendAgreementSection from "@/components/shared/dashboard/send-agreement-section";

type PropertyWithImages = Property & {
  images?: PropertyImage[];
};

const AMENITIES_LIST = [
  "Air Conditioning",
  "Swimming Pool",
  "Central Heating",
  "Washing machine",
  "Gym",
  "Alarm",
  "Window Coverings",
  "WiFi",
  "TV Cable",
  "Dryer",
  "Microwave",
  "Refrigerator",
];

type PropertyFormValues = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  initialData?: PropertyWithImages | null;
}

export default function AddPropertyForm({ initialData }: PropertyFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRewritingContent, setIsRewritingContent] = useState(false);
  const [isTogglingHighlight, setIsTogglingHighlight] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(initialData?.isHighlighted || false);
  const [galleryImages, setGalleryImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>(
    initialData?.images?.sort((a, b) => a.position - b.position) || []
  );
  const [isReorderingImages, setIsReorderingImages] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [propertyFeatures, setPropertyFeatures] = useState<Array<{
    title: string;
    description: string;
    icon: string;
  }>>(initialData?.propertyFeatures as any || [
    {
      title: "Property details",
      description: "One of the few homes in the area with a private pool.",
      icon: "ph:house"
    },
    {
      title: "Smart home access",
      description: "Easily check yourself in with a modern keypad system.",
      icon: "ph:key"
    },
    {
      title: "Energy efficient",
      description: "Built with sustainable and smart-home features.",
      icon: "ph:lightning"
    }
  ]);

  const defaultValues = initialData
    ? {
        ...initialData,
        image: initialData.image,
        tag: initialData.tag || "",
        shortDescription: initialData.shortDescription || "",
        yearBuilt: initialData.yearBuilt || undefined,
        plotSize: initialData.plotSize || undefined,
        mapUrl: initialData.mapUrl || "",
        ownershipType: initialData.ownershipType || null,
        isResale: initialData.isResale || false,
        enableDailyRental: (initialData as any).enableDailyRental || false,
        monthlyRentalPrice: (initialData as any).monthlyRentalPrice || null,
        maxGuests: (initialData as any).maxGuests || null,
        allowPets: (initialData as any).allowPets || false,
        ownerName: initialData.ownerName || "",
        ownerEmail: initialData.ownerEmail || "",
        ownerPhone: initialData.ownerPhone || "",
        ownerCountryCode: initialData.ownerCountryCode || "+66",
        ownerCompany: initialData.ownerCompany || "",
        ownerNotes: initialData.ownerNotes || "",
        commissionRate: initialData.commissionRate || undefined,
      }
    : {
        type: "FOR_SALE",
        category: "RESIDENTIAL_HOME",
        status: "ACTIVE",
        amenities: [],
        beds: 0,
        baths: 0,
        sqft: 0,
        plotSize: undefined,
        title: "",
        price: "",
        location: "",
        content: "",
        shortDescription: "",
        tag: "",
        yearBuilt: undefined,
        mapUrl: "",
        image: undefined,
        ownershipType: null,
        isResale: false,
        enableDailyRental: false,
        monthlyRentalPrice: null,
        maxGuests: null,
        allowPets: false,
        ownerName: "",
        ownerEmail: "",
        ownerPhone: "",
        ownerCountryCode: "+66",
        ownerCompany: "",
        ownerNotes: "",
        commissionRate: undefined,
      };

  const form = useForm<PropertyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertySchema) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: defaultValues as any,
  });

  // Watch the property type to conditionally show ownership fields
  const propertyType = form.watch("type");

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      galleryImages.forEach(file => {
        URL.revokeObjectURL(URL.createObjectURL(file));
      });
    };
  }, [galleryImages]);

  // AI Content Rewrite Function
  const handleRewriteContent = async () => {
    const values = form.getValues();
    
    if (!values.title || !values.location) {
      toast.error("Please fill in title and location first before rewriting content.");
      return;
    }

    setIsRewritingContent(true);
    try {
      const response = await fetch("/api/properties/rewrite-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          location: values.location,
          price: values.price,
          beds: values.beds,
          baths: values.baths,
          sqft: values.sqft,
          type: values.type,
          category: values.category,
          content: values.content || "Property description not yet available.",
          shortDescription: values.shortDescription,
          amenities: values.amenities || [],
          yearBuilt: values.yearBuilt,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to rewrite content");
      }

      if (result.data.contentHtml) {
        form.setValue("content", result.data.contentHtml);
      }
      if (result.data.shortDescription) {
        form.setValue("shortDescription", result.data.shortDescription);
      }
      if (result.data.propertyFeatures && result.data.propertyFeatures.length > 0) {
        setPropertyFeatures(result.data.propertyFeatures);
      }

      toast.success("Content rewritten with AI! ✨");
    } catch (error) {
      console.error("Rewrite error:", error);
      toast.error("Could not rewrite content. Please try again.");
    } finally {
      setIsRewritingContent(false);
    }
  };

  // Delete image function
  const handleDeleteImage = async (imageId: string) => {
    setIsDeletingImage(imageId);
    try {
      const response = await fetch(`/api/property-images/${imageId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Image deleted successfully");
        // Remove from local state
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
      } else {
        toast.error(data.error || "Failed to delete image");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete image");
    } finally {
      setIsDeletingImage(null);
    }
  };

  // Toggle image selection
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  // Select/deselect all images
  const toggleSelectAll = () => {
    if (selectedImages.size === existingImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(existingImages.map(img => img.id)));
    }
  };

  // Bulk delete selected images
  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    
    setIsBulkDeleting(true);
    const imageIds = Array.from(selectedImages);
    let successCount = 0;
    let failCount = 0;

    for (const imageId of imageIds) {
      try {
        const response = await fetch(`/api/property-images/${imageId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          successCount++;
          setExistingImages(prev => prev.filter(img => img.id !== imageId));
        } else {
          failCount++;
        }
      } catch (error) {
        console.error("Delete error:", error);
        failCount++;
      }
    }

    setSelectedImages(new Set());
    setIsBulkDeleting(false);

    if (failCount === 0) {
      toast.success(`${successCount} image${successCount > 1 ? 's' : ''} deleted successfully`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} deleted, ${failCount} failed`);
    } else {
      toast.error("Failed to delete images");
    }
  };

  const onSubmit = async (values: PropertyFormValues) => {
    setIsLoading(true);
    try {
      let imageUrl = values.image;
      if (typeof values.image === "object" && values.image.length > 0) {
        const formData = new FormData();
        formData.append("file", values.image[0]);
        imageUrl = await uploadToImageKit(formData);
      }

      const imageUrls: string[] = [imageUrl as string];
      
      if (galleryImages.length > 0) {
        toast.info(`Uploading ${galleryImages.length} gallery images...`);
        for (let i = 0; i < galleryImages.length; i++) {
          const formData = new FormData();
          formData.append("file", galleryImages[i]);
          const uploadedUrl = await uploadToImageKit(formData);
          imageUrls.push(uploadedUrl);
          
          if (galleryImages.length > 3) {
            toast.info(`Uploaded ${i + 1} of ${galleryImages.length} gallery images`);
          }
        }
      }

      const propertyData = {
        ...values,
        imageUrl,
        imageUrls: imageUrls.length > 1 ? imageUrls : undefined,
        category: values.category,
        shortDescription: values.shortDescription || "",
        yearBuilt: values.yearBuilt ? Number(values.yearBuilt) : undefined,
        plotSize: values.plotSize ? Number(values.plotSize) : undefined,
        mapUrl: values.mapUrl || "",
        propertyFeatures: propertyFeatures.length > 0 ? propertyFeatures : undefined,
        ownershipType: values.type === "FOR_SALE" ? values.ownershipType : undefined,
        isResale: values.type === "FOR_SALE" ? values.isResale : undefined,
        enableDailyRental: values.type === "FOR_RENT" ? (values.enableDailyRental || false) : false,
        monthlyRentalPrice: values.type === "FOR_RENT" && values.enableDailyRental 
          ? (values.monthlyRentalPrice ? Number(values.monthlyRentalPrice) : null)
          : null,
        maxGuests: values.type === "FOR_RENT" && values.enableDailyRental 
          ? (values.maxGuests ? Number(values.maxGuests) : null)
          : null,
        allowPets: values.type === "FOR_RENT" && values.enableDailyRental 
          ? (values.allowPets || false) 
          : false,
        ownerName: values.ownerName || undefined,
        ownerEmail: values.ownerEmail || undefined,
        ownerPhone: values.ownerPhone || undefined,
        ownerCountryCode: values.ownerCountryCode || "+66",
        ownerCompany: values.ownerCompany || undefined,
        ownerNotes: values.ownerNotes || undefined,
        commissionRate: values.commissionRate ? Number(values.commissionRate) : undefined,
      };

      if (initialData) {
        await updateProperty(initialData.id, propertyData);
        toast.success("Property updated successfully");
      } else {
        await createProperty(propertyData);
        toast.success("Property created successfully");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information - Always Open */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Basic Information
              </div>
              {initialData?.listingNumber && (
                <span className="font-mono text-sm font-normal bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-md text-muted-foreground">
                  {initialData.listingNumber}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Modern Sunset Villa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        <SelectItem value="FOR_SALE">For Sale</SelectItem>
                        <SelectItem value="FOR_RENT">For Rent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        <SelectItem value="LUXURY_VILLA">Luxury Villa</SelectItem>
                        <SelectItem value="APARTMENT">Apartment</SelectItem>
                        <SelectItem value="RESIDENTIAL_HOME">Residential Home</SelectItem>
                        <SelectItem value="OFFICE_SPACES">Office Spaces</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. $1,250,000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="SOLD">Sold</SelectItem>
                        <SelectItem value="RENTED">Rented</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 123 Palm Street, Phuket" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Owner / Agency Contact - Collapsible */}
        <CollapsibleCard
          title="Owner / Agency Contact"
          icon={<User className="h-5 w-5 text-blue-600" />}
          badge={<span className="text-xs font-normal text-muted-foreground bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">Internal Only</span>}
          className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-sky-50/50 dark:from-blue-950/20 dark:to-sky-950/20"
        >
          <FormDescription className="text-blue-700 dark:text-blue-300">
            Contact details of the property owner or agency. Only visible to you.
          </FormDescription>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Company / Agency
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Phuket Real Estate Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="owner@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="ownerCountryCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value || "+66"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="+66" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="+66">+66 🇹🇭</SelectItem>
                        <SelectItem value="+65">+65 🇸🇬</SelectItem>
                        <SelectItem value="+852">+852 🇭🇰</SelectItem>
                        <SelectItem value="+86">+86 🇨🇳</SelectItem>
                        <SelectItem value="+81">+81 🇯🇵</SelectItem>
                        <SelectItem value="+82">+82 🇰🇷</SelectItem>
                        <SelectItem value="+60">+60 🇲🇾</SelectItem>
                        <SelectItem value="+62">+62 🇮🇩</SelectItem>
                        <SelectItem value="+63">+63 🇵🇭</SelectItem>
                        <SelectItem value="+84">+84 🇻🇳</SelectItem>
                        <SelectItem value="+91">+91 🇮🇳</SelectItem>
                        <SelectItem value="+61">+61 🇦🇺</SelectItem>
                        <SelectItem value="+64">+64 🇳🇿</SelectItem>
                        <SelectItem value="+44">+44 🇬🇧</SelectItem>
                        <SelectItem value="+353">+353 🇮🇪</SelectItem>
                        <SelectItem value="+31">+31 🇳🇱</SelectItem>
                        <SelectItem value="+32">+32 🇧🇪</SelectItem>
                        <SelectItem value="+33">+33 🇫🇷</SelectItem>
                        <SelectItem value="+34">+34 🇪🇸</SelectItem>
                        <SelectItem value="+39">+39 🇮🇹</SelectItem>
                        <SelectItem value="+41">+41 🇨🇭</SelectItem>
                        <SelectItem value="+43">+43 🇦🇹</SelectItem>
                        <SelectItem value="+45">+45 🇩🇰</SelectItem>
                        <SelectItem value="+46">+46 🇸🇪</SelectItem>
                        <SelectItem value="+47">+47 🇳🇴</SelectItem>
                        <SelectItem value="+48">+48 🇵🇱</SelectItem>
                        <SelectItem value="+49">+49 🇩🇪</SelectItem>
                        <SelectItem value="+358">+358 🇫🇮</SelectItem>
                        <SelectItem value="+351">+351 🇵🇹</SelectItem>
                        <SelectItem value="+352">+352 🇱🇺</SelectItem>
                        <SelectItem value="+30">+30 🇬🇷</SelectItem>
                        <SelectItem value="+420">+420 🇨🇿</SelectItem>
                        <SelectItem value="+1">+1 🇺🇸</SelectItem>
                        <SelectItem value="+52">+52 🇲🇽</SelectItem>
                        <SelectItem value="+55">+55 🇧🇷</SelectItem>
                        <SelectItem value="+971">+971 🇦🇪</SelectItem>
                        <SelectItem value="+966">+966 🇸🇦</SelectItem>
                        <SelectItem value="+974">+974 🇶🇦</SelectItem>
                        <SelectItem value="+972">+972 🇮🇱</SelectItem>
                        <SelectItem value="+7">+7 🇷🇺</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ownerPhone"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="812345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="commissionRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Commission Rate
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input type="number" step="0.5" min="0" max="100" placeholder="e.g. 3" {...field} className="pr-8" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Internal Notes
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Preferred contact time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {initialData && (
            <SendAgreementSection
              property={{
                id: initialData.id,
                title: initialData.title,
                slug: initialData.slug,
                location: initialData.location,
                price: initialData.price,
                provinceSlug: initialData.provinceSlug,
                areaSlug: initialData.areaSlug,
                ownerName: form.watch("ownerName") || initialData.ownerName,
                ownerEmail: form.watch("ownerEmail") || initialData.ownerEmail,
                ownerPhone: form.watch("ownerPhone") || initialData.ownerPhone,
                ownerCountryCode: form.watch("ownerCountryCode") || initialData.ownerCountryCode,
                ownerCompany: form.watch("ownerCompany") || initialData.ownerCompany,
                commissionRate: initialData.commissionRate,
              }}
              currentCommissionRate={form.watch("commissionRate") as number | undefined}
            />
          )}
        </CollapsibleCard>

        {/* Ownership Details - Collapsible, only for FOR_SALE */}
        {propertyType === "FOR_SALE" && (
          <CollapsibleCard
            title="Ownership Details"
            badge={<span className="text-xs font-normal text-muted-foreground bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">For Sale Only</span>}
            className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20"
          >
            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ownershipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      Ownership Type
                      <InfoTooltip 
                        content={
                          <div className="space-y-2">
                            <p><strong>Freehold:</strong> Full ownership with no time limit.</p>
                            <p><strong>Leasehold:</strong> Ownership for a fixed period (e.g., 30-99 years).</p>
                          </div>
                        }
                        side="right"
                      />
                    </FormLabel>
                    <Select onValueChange={(value) => field.onChange(value === "none" ? null : value)} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select ownership type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full">
                        <SelectItem value="none">Not specified</SelectItem>
                        <SelectItem value="FREEHOLD">Freehold</SelectItem>
                        <SelectItem value="LEASEHOLD">Leasehold</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isResale"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center">
                      Re-sale Property
                      <InfoTooltip 
                        content={<p>A property being sold by the current owner, not by the original developer.</p>}
                        side="right"
                      />
                    </FormLabel>
                    <div className="flex items-center gap-3 pt-2">
                      <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                      <span className="text-sm text-muted-foreground">
                        {field.value ? "Re-sale property" : "New property (from developer)"}
                      </span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleCard>
        )}

        {/* Daily Rental Configuration - Collapsible, only for FOR_RENT */}
        {propertyType === "FOR_RENT" && (
          <CollapsibleCard
            title="Daily Rental Configuration"
            badge={<span className="text-xs font-normal text-muted-foreground bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">For Rent Only</span>}
            className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20"
          >
            <FormDescription className="text-purple-700 dark:text-purple-300 mb-4">
              Configure Airbnb-style daily rental functionality for this property.
            </FormDescription>

            <FormField
              control={form.control}
              name="enableDailyRental"
              render={({ field }) => (
                <FormItem className="flex flex-col mb-6">
                  <FormLabel className="flex items-center">
                    Enable Daily Rental
                    <InfoTooltip 
                      content={
                        <div className="space-y-2">
                          <p>Enable this to allow daily rentals.</p>
                          <p>Guests can book directly through the website with dynamic pricing based on season and stay duration.</p>
                        </div>
                      }
                      side="right"
                    />
                  </FormLabel>
                  <div className="flex items-center gap-3 pt-2">
                    <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                    <span className="text-sm text-muted-foreground">
                      {field.value ? "Daily rental enabled" : "Monthly rental only"}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("enableDailyRental") && (
              <div className="space-y-6 pt-4 border-t">
                <div className="grid sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="monthlyRentalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Monthly Rental Price (Base)
                          <InfoTooltip 
                            content="The base monthly rental price. Daily rate is calculated automatically (monthly / 30)."
                            side="right"
                          />
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type="number" 
                              step="1000" 
                              min="0" 
                              placeholder="e.g. 100000" 
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                              className="pr-8" 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">THB</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Base price for daily rate calculation
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Maximum Guests
                          <InfoTooltip 
                            content="Maximum number of guests allowed in this property (infants not counted)."
                            side="right"
                          />
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1" 
                            max="50" 
                            placeholder="e.g. 10" 
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="allowPets"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="flex items-center">
                        Pets Allowed
                        <InfoTooltip 
                          content="Allow guests to bring pets during their stay."
                          side="right"
                        />
                      </FormLabel>
                      <div className="flex items-center gap-3 pt-2">
                        <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                        <span className="text-sm text-muted-foreground">
                          {field.value ? "Pets allowed" : "No pets"}
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CollapsibleCard>
        )}

        {/* Property Access Details - Collapsible, only for FOR_RENT with daily rental */}
        {propertyType === "FOR_RENT" && form.watch("enableDailyRental") && (
          <CollapsibleCard
            title="Property Access Details"
            badge={<span className="text-xs font-normal text-muted-foreground bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">Guest Info</span>}
            className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50/50 to-sky-50/50 dark:from-blue-950/20 dark:to-sky-950/20"
          >
            <FormDescription className="text-blue-700 dark:text-blue-300 mb-4">
              Default property access information shared with guests after booking confirmation. This data will be pre-filled for each booking.
            </FormDescription>

            <div className="space-y-6">
              {/* Check-in/out times */}
              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="defaultCheckInTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Default Check-in Time
                        <InfoTooltip content="Standard check-in time for guests." side="right" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                          value={field.value || "14:00"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultCheckOutTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Default Check-out Time
                        <InfoTooltip content="Standard check-out time for guests." side="right" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field}
                          value={field.value || "11:00"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Property Address */}
              <FormField
                control={form.control}
                name="defaultPropertyAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Full Property Address
                      <InfoTooltip content="Complete address with building name, unit number, street, etc. This is shared only after booking confirmation." side="right" />
                    </FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                        placeholder="e.g. Villa Sunset, 123/45 Moo 6, Rawai Beach Road, Rawai, Muang Phuket 83100"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* WiFi Details */}
              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="defaultWifiName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        WiFi Network Name
                        <InfoTooltip content="The WiFi network name (SSID) for guests." side="right" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. VillaSunset_Guest" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultWifiPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        WiFi Password
                        <InfoTooltip content="WiFi password for the guest network." side="right" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Password" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Access & Emergency */}
              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="defaultAccessCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Access Code / Key Box
                        <InfoTooltip content="Door code, key box location, or access instructions." side="right" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Gate code: 1234, Key in lockbox by door" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultEmergencyContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Emergency Contact
                        <InfoTooltip content="Local emergency contact number for guests." side="right" />
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. +66 81 234 5678" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Getting There */}
              <FormField
                control={form.control}
                name="defaultPropertyInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Getting There / Arrival Instructions
                      <InfoTooltip content="Directions, parking info, how to find the property, etc." side="right" />
                    </FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                        placeholder="e.g. From Phuket Airport, take Route 402 south towards Rawai. After passing Big Buddha junction, turn left at the Shell gas station. Villa is 500m on the right with a blue gate. Parking available inside the compound."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* House Rules */}
              <FormField
                control={form.control}
                name="defaultHouseRules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      House Rules
                      <InfoTooltip content="Important rules and guidelines for guests during their stay." side="right" />
                    </FormLabel>
                    <FormControl>
                      <textarea
                        className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                        placeholder="e.g. • No smoking inside the property&#10;• Quiet hours: 10 PM - 8 AM&#10;• No parties or events&#10;• Please remove shoes before entering&#10;• Keep gates locked at all times"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CollapsibleCard>
        )}

        {/* Blocked Dates Management - Only for existing rental properties */}
        {propertyType === "FOR_RENT" && form.watch("enableDailyRental") && initialData && (
          <CollapsibleCard
            title="Calendar & Availability"
            badge={<span className="text-xs font-normal text-muted-foreground bg-orange-100 dark:bg-orange-900/50 px-2 py-0.5 rounded">Manage Dates</span>}
            className="border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50/50 to-amber-50/50 dark:from-orange-950/20 dark:to-amber-950/20"
          >
            <FormDescription className="text-orange-700 dark:text-orange-300 mb-4">
              Block dates for maintenance, owner use, or other reasons. Confirmed bookings automatically block their dates.
            </FormDescription>
            <PropertyBlockedDates propertyId={initialData.id} />
          </CollapsibleCard>
        )}

        {/* Property Details - Collapsible */}
        <CollapsibleCard title="Property Details" icon={<Settings className="h-5 w-5" />}>
          <div className="grid grid-cols-3 gap-6">
            {(["beds", "baths", "sqft"] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{name === "sqft" ? "Interior (m²)" : name}</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-6 max-w-[420px]">
            <FormField
              control={form.control}
              name="plotSize"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plot Size (m²)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 500" {...field} />
                  </FormControl>
                  <FormDescription>Land area</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yearBuilt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year Built</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 2020" {...field} />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="shortDescription"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short Description (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Brief overview of the property" {...field} />
                </FormControl>
                <FormDescription>A brief one-line description for property cards</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>Full Description</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRewriteContent}
                    disabled={isRewritingContent || isLoading}
                    className="gap-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-200 text-purple-700 dark:from-purple-950/30 dark:to-pink-950/30 dark:border-purple-800 dark:text-purple-300"
                  >
                    {isRewritingContent ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Rewriting...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Rewrite with AI
                      </>
                    )}
                  </Button>
                </div>
                <FormControl>
                  <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Write a detailed property description..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amenities"
            render={() => (
              <FormItem>
                <FormLabel>Amenities</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  {AMENITIES_LIST.map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="amenities"
                      render={({ field }) => (
                        <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item])
                                  : field.onChange(field.value?.filter((value: string) => value !== item));
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">{item}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CollapsibleCard>

        {/* Property Features - Collapsible */}
        <CollapsibleCard title="Property Features" icon={<Lightbulb className="h-5 w-5" />}>
          <FormDescription>Special features that highlight what makes this property unique.</FormDescription>
          
          {propertyFeatures.map((feature, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border rounded-lg">
              <div className="md:col-span-3">
                <FormLabel>Icon</FormLabel>
                <Input
                  placeholder="ph:house"
                  value={feature.icon}
                  onChange={(e) => {
                    const newFeatures = [...propertyFeatures];
                    newFeatures[index].icon = e.target.value;
                    setPropertyFeatures(newFeatures);
                  }}
                />
                <FormDescription className="text-xs mt-1">
                  <a href="https://icon-sets.iconify.design/ph/" target="_blank" rel="noopener" className="text-primary hover:underline">
                    Browse icons
                  </a>
                </FormDescription>
              </div>
              
              <div className="md:col-span-4">
                <FormLabel>Title</FormLabel>
                <Input
                  placeholder="Property details"
                  value={feature.title}
                  onChange={(e) => {
                    const newFeatures = [...propertyFeatures];
                    newFeatures[index].title = e.target.value;
                    setPropertyFeatures(newFeatures);
                  }}
                />
              </div>
              
              <div className="md:col-span-4">
                <FormLabel>Description</FormLabel>
                <Input
                  placeholder="One of the few homes with a private pool."
                  value={feature.description}
                  onChange={(e) => {
                    const newFeatures = [...propertyFeatures];
                    newFeatures[index].description = e.target.value;
                    setPropertyFeatures(newFeatures);
                  }}
                />
              </div>
              
              <div className="md:col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setPropertyFeatures(propertyFeatures.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => setPropertyFeatures([...propertyFeatures, { title: "", description: "", icon: "ph:star" }])}
          >
            + Add Feature
          </Button>
        </CollapsibleCard>

        {/* Media & Settings - Collapsible */}
        <CollapsibleCard title="Media & Settings" icon={<ImageIcon className="h-5 w-5" />}>
          <FormLabel>Property Images</FormLabel>
          <FormDescription>Upload a hero image and multiple gallery images.</FormDescription>
          
          <FormField
            control={form.control}
            name="image"
            render={({ field: { value, onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Hero Image (Required)</FormLabel>
                <FormControl>
                  <Input {...fieldProps} type="file" accept="image/*" onChange={(event) => onChange(event.target.files)} />
                </FormControl>
                <FormDescription>Main image displayed prominently on the property page</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormItem>
            <FormLabel>Gallery Images (Optional)</FormLabel>
            <FormControl>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = e.target.files;
                  if (files) setGalleryImages(prev => [...prev, ...Array.from(files)]);
                }}
              />
            </FormControl>
            <FormDescription>Select multiple images at once for the property gallery.</FormDescription>
          </FormItem>

          {galleryImages.length > 0 && (
            <div className="space-y-2">
              <FormLabel>Selected Gallery Images ({galleryImages.length})</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages.map((file, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                      <img src={URL.createObjectURL(file)} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <p className="text-xs text-center mt-1 text-muted-foreground truncate">{file.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Existing Images Reorder */}
          {initialData && existingImages.length > 0 && (
            <div className="space-y-3">
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Manage Image Order</FormLabel>
                  <FormDescription>Use arrows to reorder. The first image is the hero image.</FormDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                    disabled={isBulkDeleting}
                  >
                    {selectedImages.size === existingImages.length ? "Deselect All" : "Select All"}
                  </Button>
                  {selectedImages.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isBulkDeleting}
                          className="gap-1"
                        >
                          {isBulkDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4" />
                              Delete ({selectedImages.size})
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {selectedImages.size} Images?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''} will be permanently deleted from your property gallery and storage.
                            {selectedImages.has(existingImages[0]?.id) && existingImages.length > selectedImages.size && (
                              <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                                The hero image is selected. The next unselected image will become the new hero.
                              </span>
                            )}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleBulkDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete {selectedImages.size} Image{selectedImages.size > 1 ? 's' : ''}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
              <div className="space-y-2 w-full overflow-hidden">
                {existingImages.map((image, index) => (
                  <div 
                    key={image.id} 
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors min-w-0 overflow-hidden ${
                      selectedImages.has(image.id)
                        ? 'bg-red-50 border-red-300 dark:bg-red-950/30 dark:border-red-700'
                        : index === 0 
                          ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-700' 
                          : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <Checkbox
                      checked={selectedImages.has(image.id)}
                      onCheckedChange={() => toggleImageSelection(image.id)}
                      disabled={isBulkDeleting}
                      className="shrink-0"
                    />
                    
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0 || isReorderingImages}
                        onClick={async () => {
                          setIsReorderingImages(true);
                          try {
                            const newImages = [...existingImages];
                            [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
                            const imagePositions = newImages.map((img, idx) => ({ id: img.id, position: idx + 1 }));
                            await updateImagePositions(initialData.id, imagePositions);
                            setExistingImages(newImages);
                            toast.success(index === 1 ? "Image set as hero!" : "Image moved up");
                          } catch (error) {
                            console.error(error);
                            toast.error("Failed to reorder images");
                          } finally {
                            setIsReorderingImages(false);
                          }
                        }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === existingImages.length - 1 || isReorderingImages}
                        onClick={async () => {
                          setIsReorderingImages(true);
                          try {
                            const newImages = [...existingImages];
                            [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
                            const imagePositions = newImages.map((img, idx) => ({ id: img.id, position: idx + 1 }));
                            await updateImagePositions(initialData.id, imagePositions);
                            setExistingImages(newImages);
                            toast.success("Image moved down");
                          } catch (error) {
                            console.error(error);
                            toast.error("Failed to reorder images");
                          } finally {
                            setIsReorderingImages(false);
                          }
                        }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    
                    <div className="h-16 w-24 rounded-md overflow-hidden shrink-0">
                      {image.url ? (
                        <img src={image.url} alt={image.alt || `Image ${index + 1}`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 max-w-[300px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        {index === 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 shrink-0">
                            <Crown className="h-3 w-3" />
                            Hero Image
                          </span>
                        )}
                        <span className="text-sm text-muted-foreground shrink-0">Position {index + 1}</span>
                      </div>
                      {image.alt && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words" title={image.alt}>
                          {image.alt.length > 80 ? `${image.alt.substring(0, 80)}...` : image.alt}
                        </p>
                      )}
                    </div>
                    
{index !== 0 && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="shrink-0"
                                        disabled={isReorderingImages}
                                        onClick={async () => {
                                          setIsReorderingImages(true);
                                          try {
                                            const newImages = [...existingImages];
                                            const [movedImage] = newImages.splice(index, 1);
                                            newImages.unshift(movedImage);
                                            const imagePositions = newImages.map((img, idx) => ({ id: img.id, position: idx + 1 }));
                                            await updateImagePositions(initialData.id, imagePositions);
                                            setExistingImages(newImages);
                                            toast.success("Image set as hero!");
                                          } catch (error) {
                                            console.error(error);
                                            toast.error("Failed to set hero image");
                                          } finally {
                                            setIsReorderingImages(false);
                                          }
                                        }}
                                      >
                                        <Crown className="h-4 w-4 mr-1" />
                                        Set as Hero
                                      </Button>
                                    )}
                                    
                                    {/* Delete Image Button */}
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          disabled={isReorderingImages || isDeletingImage === image.id}
                                        >
                                          {isDeletingImage === image.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-4 w-4" />
                                          )}
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            This action cannot be undone. The image will be permanently deleted from your property gallery and storage.
                                            {index === 0 && existingImages.length > 1 && (
                                              <span className="block mt-2 text-amber-600 dark:text-amber-400 font-medium">
                                                This is the hero image. The next image will become the new hero.
                                              </span>
                                            )}
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteImage(image.id)}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )}

          <FormField
            control={form.control}
            name="mapUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Map URL (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. https://maps.google.com/..." {...field} />
                </FormControl>
                <FormDescription>Google Maps embed URL for property location</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <FormField
            control={form.control}
            name="tag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tag (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. New, Featured" {...field} className="max-w-[200px]" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {initialData && (
            <>
              <Separator />
              <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Star className={`h-5 w-5 ${isHighlighted ? 'text-amber-500 fill-amber-500' : 'text-amber-400'}`} />
                    <span className="font-medium text-amber-900 dark:text-amber-100">Hero Highlight</span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {isHighlighted ? "Shown in the homepage hero section" : "Show this property in the homepage hero section"}
                  </p>
                </div>
                <Switch
                  checked={isHighlighted}
                  disabled={isTogglingHighlight}
                  onCheckedChange={async (checked) => {
                    setIsTogglingHighlight(true);
                    try {
                      await togglePropertyHighlight(initialData.id);
                      setIsHighlighted(checked);
                      toast.success(checked ? "Property highlighted on homepage!" : "Property highlight removed");
                    } catch (error) {
                      console.error(error);
                      toast.error("Failed to toggle highlight");
                    } finally {
                      setIsTogglingHighlight(false);
                    }
                  }}
                />
              </div>
            </>
          )}
        </CollapsibleCard>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Discard
          </Button>
          <Button type="submit" className="min-w-[150px]" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {initialData ? "Save Changes" : "Create Property"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
