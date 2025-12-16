"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, X, Sparkles, Star } from "lucide-react";

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

type PropertyWithImages = Property & {
  images?: PropertyImage[];
};

const AMENITIES_LIST = [
  "Air Conditioning",
  "Swimming Pool",
  "Central Heating",
  "Laundry Room",
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
        mapUrl: initialData.mapUrl || "",
      }
    : {
        type: "FOR_SALE",
        category: "RESIDENTIAL_HOME",
        status: "ACTIVE",
        amenities: [],
        beds: 0,
        baths: 0,
        sqft: 0,
        title: "",
        price: "",
        location: "",
        content: "",
        shortDescription: "",
        tag: "",
        yearBuilt: undefined,
        mapUrl: "",
        image: undefined,
      };

  const form = useForm<PropertyFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(propertySchema) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: defaultValues as any,
  });

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
    
    // Validate minimum required fields
    if (!values.title || !values.location) {
      toast.error("Vul eerst de titel en locatie in voordat je de content herschrijft.");
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
          content: values.content || "Property beschrijving nog niet beschikbaar.",
          shortDescription: values.shortDescription,
          amenities: values.amenities || [],
          yearBuilt: values.yearBuilt,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to rewrite content");
      }

      // Update form with rewritten content
      if (result.data.contentHtml) {
        form.setValue("content", result.data.contentHtml);
      }
      if (result.data.shortDescription) {
        form.setValue("shortDescription", result.data.shortDescription);
      }
      if (result.data.propertyFeatures && result.data.propertyFeatures.length > 0) {
        setPropertyFeatures(result.data.propertyFeatures);
      }

      toast.success("Content succesvol herschreven met AI! ✨");
    } catch (error) {
      console.error("Rewrite error:", error);
      toast.error("Kon de content niet herschrijven. Probeer opnieuw.");
    } finally {
      setIsRewritingContent(false);
    }
  };

  const onSubmit = async (values: PropertyFormValues) => {
    setIsLoading(true);
    try {
      // Upload main image (hero image)
      // Upload hero image
      let imageUrl = values.image;
      if (typeof values.image === "object" && values.image.length > 0) {
        const formData = new FormData();
        formData.append("file", values.image[0]);
        imageUrl = await uploadToImageKit(formData);
      }

      // Upload all gallery images
      const imageUrls: string[] = [imageUrl as string]; // Position 1 (hero)
      
      // Upload bulk gallery images
      if (galleryImages.length > 0) {
        toast.info(`Uploading ${galleryImages.length} gallery images...`);
        for (let i = 0; i < galleryImages.length; i++) {
          const formData = new FormData();
          formData.append("file", galleryImages[i]);
          const uploadedUrl = await uploadToImageKit(formData);
          imageUrls.push(uploadedUrl);
          
          // Update progress
          if (galleryImages.length > 3) {
            toast.info(`Uploaded ${i + 1} of ${galleryImages.length} gallery images`);
          }
        }
      }

      const propertyData = {
        ...values,
        imageUrl,
        imageUrls: imageUrls.length > 1 ? imageUrls : undefined, // Only include if we have gallery images
        category: values.category,
        shortDescription: values.shortDescription || "",
        yearBuilt: values.yearBuilt ? Number(values.yearBuilt) : undefined,
        mapUrl: values.mapUrl || "",
        propertyFeatures: propertyFeatures.length > 0 ? propertyFeatures : undefined,
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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
                name="yearBuilt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year Built (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 2020" {...field} />
                    </FormControl>
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
                    <Input
                      placeholder="e.g. 123 Palm Street, Miami"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid grid-cols-3 gap-6">
              {(["beds", "baths", "sqft"] as const).map((name) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="capitalize">{name}</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <FormField
              control={form.control}
              name="shortDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short Description (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief overview of the property"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief one-line description that appears in property cards
                  </FormDescription>
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
                          Herschrijven...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Herschrijf met AI
                        </>
                      )}
                    </Button>
                  </div>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Write a detailed property description with formatting..."
                    />
                  </FormControl>
                  <FormDescription>
                    Use the toolbar to format your text with headings, lists, bold, italic, and more. 
                    Klik op &quot;Herschrijf met AI&quot; om automatisch verkoopgerichte content te genereren.
                  </FormDescription>
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
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, item])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value: string) => value !== item
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {item}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property Features</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <FormDescription>
              Add special features that highlight what makes this property unique. These will appear on the property detail page.
            </FormDescription>
            
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
                    placeholder="One of the few homes in the area with a private pool."
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
                    onClick={() => {
                      const newFeatures = propertyFeatures.filter((_, i) => i !== index);
                      setPropertyFeatures(newFeatures);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setPropertyFeatures([
                  ...propertyFeatures,
                  { title: "", description: "", icon: "ph:star" }
                ]);
              }}
            >
              + Add Feature
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Media & Settings</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="space-y-6">
              <FormLabel>Property Images</FormLabel>
              <FormDescription>
                Upload a hero image and multiple gallery images for your property.
              </FormDescription>
              
              {/* Hero Image */}
              <FormField
                control={form.control}
                name="image"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Hero Image (Required)</FormLabel>
                    <FormControl>
                      <Input
                        {...fieldProps}
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          onChange(event.target.files);
                        }}
                      />
                    </FormControl>
                    <FormDescription>This will be the main image displayed prominently on the property page</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              {/* Gallery Images - Bulk Upload */}
              <FormItem>
                <FormLabel>Gallery Images (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files) {
                        const newFiles = Array.from(files);
                        setGalleryImages(prev => [...prev, ...newFiles]);
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Select multiple images at once for the property gallery. You can select as many as you need.
                </FormDescription>
              </FormItem>

              {/* Gallery Preview */}
              {galleryImages.length > 0 && (
                <div className="space-y-2">
                  <FormLabel>Selected Gallery Images ({galleryImages.length})</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {galleryImages.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setGalleryImages(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-center mt-1 text-muted-foreground truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Existing Images Reorder - Only show for existing properties */}
              {initialData && existingImages.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <FormLabel>Manage Image Order</FormLabel>
                      <FormDescription>
                        Drag or use arrows to reorder. The first image is the hero image shown on the homepage.
                      </FormDescription>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {existingImages.map((image, index) => (
                      <div 
                        key={image.id} 
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                          index === 0 
                            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 dark:from-amber-950/30 dark:to-yellow-950/30 dark:border-amber-700' 
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
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
                                // Update positions
                                const imagePositions = newImages.map((img, idx) => ({
                                  id: img.id,
                                  position: idx + 1,
                                }));
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
                                // Update positions
                                const imagePositions = newImages.map((img, idx) => ({
                                  id: img.id,
                                  position: idx + 1,
                                }));
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
                        
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <GripVertical className="h-4 w-4" />
                        </div>
                        
                        <div className="h-16 w-24 rounded-md overflow-hidden flex-shrink-0">
                          {image.url ? (
                            <img
                              src={image.url}
                              alt={image.alt || `Image ${index + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground">No image</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                <Crown className="h-3 w-3" />
                                Hero Image
                              </span>
                            )}
                            <span className="text-sm text-muted-foreground">
                              Position {index + 1}
                            </span>
                          </div>
                          {image.alt && (
                            <p className="text-xs text-muted-foreground truncate mt-1">{image.alt}</p>
                          )}
                        </div>
                        
                        {index !== 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex-shrink-0"
                            disabled={isReorderingImages}
                            onClick={async () => {
                              setIsReorderingImages(true);
                              try {
                                // Move this image to position 1
                                const newImages = [...existingImages];
                                const [movedImage] = newImages.splice(index, 1);
                                newImages.unshift(movedImage);
                                // Update positions
                                const imagePositions = newImages.map((img, idx) => ({
                                  id: img.id,
                                  position: idx + 1,
                                }));
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
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="mapUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Map URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. https://maps.google.com/..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Google Maps embed URL for property location
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            <div className="grid sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="tag"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. New, Featured" {...field} />
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
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

            {/* Highlighted Property Toggle - Only show for existing properties */}
            {initialData && (
              <>
                <Separator />
                <div className="flex items-center justify-between p-4 rounded-lg border bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 border-amber-200 dark:border-amber-800">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Star className={`h-5 w-5 ${isHighlighted ? 'text-amber-500 fill-amber-500' : 'text-amber-400'}`} />
                      <span className="font-medium text-amber-900 dark:text-amber-100">
                        Hero Highlight
                      </span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {isHighlighted 
                        ? "This property is shown in the homepage hero section"
                        : "Show this property in the homepage hero section"}
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-400/70">
                      Note: Only one property can be highlighted at a time
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
                        toast.success(
                          checked 
                            ? "Property is now highlighted on the homepage!" 
                            : "Property highlight removed"
                        );
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
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Discard
          </Button>
          <Button type="submit" className="min-w-[150px]" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {initialData ? "Save Changes" : "Create Property"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
