"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { HeroImageData } from "@/lib/actions/hero-image.actions";

interface HeroImageManagerProps {
  initialImages?: HeroImageData[];
}

const PAGES = [
  { value: "home", label: "Homepage" },
  { value: "properties", label: "Properties Page" },
  { value: "contact", label: "Contact Page" },
  { value: "about", label: "About Page" },
];

const DEVICE_TYPES = [
  { value: "DESKTOP", label: "Desktop", dimensions: "1920x1080 (16:9)" },
  { value: "MOBILE", label: "Mobile", dimensions: "750x1334 (9:16)" },
  { value: "TABLET", label: "Tablet", dimensions: "1024x1024 (1:1)" },
];

const STYLES = [
  { value: "professional", label: "Professional" },
  { value: "luxury", label: "Luxury" },
  { value: "modern", label: "Modern" },
  { value: "tropical", label: "Tropical" },
];

export default function HeroImageManager({
  initialImages = [],
}: HeroImageManagerProps) {
  const [images, setImages] = useState<HeroImageData[]>(initialImages);
  const [selectedPage, setSelectedPage] = useState("home");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingImage, setEditingImage] = useState<HeroImageData | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states for upload/generate
  const [uploadForm, setUploadForm] = useState({
    deviceType: "DESKTOP",
    alt: "",
    file: null as File | null,
  });

  const [generateForm, setGenerateForm] = useState({
    deviceType: "DESKTOP",
    style: "professional",
    customPrompt: "",
    quality: "standard",
  });

  // Fetch images for selected page
  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/hero-images?page=${selectedPage}`);
      const data = await response.json();
      if (data.success) {
        setImages(data.data);
      }
    } catch (error) {
      console.error("Error fetching hero images:", error);
      toast.error("Failed to load hero images");
    } finally {
      setIsLoading(false);
    }
  }, [selectedPage]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm((prev) => ({ ...prev, file }));
    }
  };

  // Handle manual upload
  const handleUpload = async () => {
    if (!uploadForm.file) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadForm.file);
      formData.append("page", selectedPage);
      formData.append("deviceType", uploadForm.deviceType);
      if (uploadForm.alt) {
        formData.append("alt", uploadForm.alt);
      }

      const response = await fetch("/api/hero-images", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Hero image uploaded successfully", {
          description: `Compressed: ${data.stats.compressedSize} (${data.stats.savings} saved)`,
        });
        setShowUploadDialog(false);
        setUploadForm({ deviceType: "DESKTOP", alt: "", file: null });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchImages();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle AI generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/hero-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: selectedPage,
          deviceType: generateForm.deviceType,
          generateWithAi: true,
          style: generateForm.style,
          customPrompt: generateForm.customPrompt || undefined,
          quality: generateForm.quality,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Hero image generated successfully", {
          description: `Generated in ${data.stats.generationTime}`,
        });
        setShowGenerateDialog(false);
        setGenerateForm({
          deviceType: "DESKTOP",
          style: "professional",
          customPrompt: "",
          quality: "standard",
        });
        fetchImages();
      } else {
        toast.error(data.error || "Generation failed");
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle alt text update
  const handleUpdateAlt = async (id: string, alt: string) => {
    try {
      const response = await fetch(`/api/hero-images/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alt }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Alt text updated");
        setEditingImage(null);
        fetchImages();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (error) {
      toast.error("Failed to update alt text");
    }
  };

  // Handle restore to original
  const handleRestore = async (id: string) => {
    try {
      const response = await fetch(`/api/hero-images/${id}?action=restore`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Hero image restored to original");
        fetchImages();
      } else {
        toast.error(data.error || "Restore failed");
      }
    } catch (error) {
      toast.error("Failed to restore image");
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/hero-images/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Hero image deleted");
        fetchImages();
      } else {
        toast.error(data.error || "Delete failed");
      }
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  // Get image for specific device type
  const getImageForDevice = (deviceType: string) => {
    return images.find((img) => img.deviceType === deviceType);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Hero Image Manager
          </h2>
          <p className="text-muted-foreground">
            Manage hero images for different pages and device types
          </p>
        </div>
        <div className="flex gap-2">
          {/* Upload Dialog */}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Icon icon="ph:upload" className="h-4 w-4" />
                Upload Image
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Hero Image</DialogTitle>
                <DialogDescription>
                  Upload a custom hero image. It will be optimized to WebP
                  format automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Device Type</Label>
                  <Select
                    value={uploadForm.deviceType}
                    onValueChange={(value) =>
                      setUploadForm((prev) => ({ ...prev, deviceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_TYPES.map((device) => (
                        <SelectItem key={device.value} value={device.value}>
                          {device.label} ({device.dimensions})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Image File</Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {uploadForm.file && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {uploadForm.file.name} (
                      {(uploadForm.file.size / 1024).toFixed(0)}KB)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Alt Text (SEO)</Label>
                  <Input
                    value={uploadForm.alt}
                    onChange={(e) =>
                      setUploadForm((prev) => ({ ...prev, alt: e.target.value }))
                    }
                    placeholder="Describe the image for SEO..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for auto-generated alt text
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Icon
                        icon="ph:spinner"
                        className="h-4 w-4 animate-spin mr-2"
                      />
                      Uploading...
                    </>
                  ) : (
                    "Upload"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Generate Dialog */}
          <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Icon icon="ph:magic-wand" className="h-4 w-4" />
                Generate with AI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Generate Hero Image with AI</DialogTitle>
                <DialogDescription>
                  Use DALL-E 3 to generate a professional hero image optimized
                  for SEO.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Device Type</Label>
                  <Select
                    value={generateForm.deviceType}
                    onValueChange={(value) =>
                      setGenerateForm((prev) => ({ ...prev, deviceType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEVICE_TYPES.map((device) => (
                        <SelectItem key={device.value} value={device.value}>
                          {device.label} ({device.dimensions})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Style</Label>
                  <Select
                    value={generateForm.style}
                    onValueChange={(value) =>
                      setGenerateForm((prev) => ({ ...prev, style: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STYLES.map((style) => (
                        <SelectItem key={style.value} value={style.value}>
                          {style.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select
                    value={generateForm.quality}
                    onValueChange={(value) =>
                      setGenerateForm((prev) => ({ ...prev, quality: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">
                        Standard (~$0.04)
                      </SelectItem>
                      <SelectItem value="hd">HD (~$0.08)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Custom Prompt (Optional)</Label>
                  <Textarea
                    value={generateForm.customPrompt}
                    onChange={(e) =>
                      setGenerateForm((prev) => ({
                        ...prev,
                        customPrompt: e.target.value,
                      }))
                    }
                    placeholder="Leave empty for auto-generated prompt based on page and style..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowGenerateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Icon
                        icon="ph:spinner"
                        className="h-4 w-4 animate-spin mr-2"
                      />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon icon="ph:magic-wand" className="h-4 w-4 mr-2" />
                      Generate
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Page Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Page</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPage} onValueChange={setSelectedPage}>
            <TabsList className="grid w-full grid-cols-4">
              {PAGES.map((page) => (
                <TabsTrigger key={page.value} value={page.value}>
                  {page.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Device Images Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {DEVICE_TYPES.map((device) => {
          const image = getImageForDevice(device.value);

          return (
            <Card key={device.value} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{device.label}</CardTitle>
                    <CardDescription>{device.dimensions}</CardDescription>
                  </div>
                  {image && (
                    <div className="flex gap-1">
                      {image.isAiGenerated && (
                        <Badge variant="secondary" className="gap-1">
                          <Icon icon="ph:magic-wand" className="h-3 w-3" />
                          AI
                        </Badge>
                      )}
                      {image.originalUrl && (
                        <Badge variant="outline" className="gap-1">
                          <Icon icon="ph:clock-counter-clockwise" className="h-3 w-3" />
                          Modified
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="aspect-video bg-muted animate-pulse rounded-lg flex items-center justify-center">
                    <Icon
                      icon="ph:spinner"
                      className="h-8 w-8 animate-spin text-muted-foreground"
                    />
                  </div>
                ) : image ? (
                  <>
                    <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                      <Image
                        src={image.imageUrl}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Size:{" "}
                          {image.optimizedSize
                            ? `${(image.optimizedSize / 1024).toFixed(0)}KB`
                            : "N/A"}
                        </span>
                        <span>
                          {image.width}x{image.height}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        <strong>Alt:</strong> {image.alt}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {/* Edit Alt Dialog */}
                      <Dialog
                        open={editingImage?.id === image.id}
                        onOpenChange={(open) =>
                          setEditingImage(open ? image : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-1">
                            <Icon icon="ph:pencil" className="h-3 w-3" />
                            Edit Alt
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Alt Text</DialogTitle>
                            <DialogDescription>
                              Update the SEO alt text for this hero image
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <Label>Alt Text</Label>
                            <Textarea
                              value={editingImage?.alt || ""}
                              onChange={(e) =>
                                setEditingImage((prev) =>
                                  prev ? { ...prev, alt: e.target.value } : null
                                )
                              }
                              rows={3}
                            />
                          </div>
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setEditingImage(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={() =>
                                editingImage &&
                                handleUpdateAlt(
                                  editingImage.id,
                                  editingImage.alt
                                )
                              }
                            >
                              Save
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      {/* Restore Button */}
                      {image.originalUrl && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1"
                            >
                              <Icon
                                icon="ph:clock-counter-clockwise"
                                className="h-3 w-3"
                              />
                              Restore
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Restore Original Image?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will restore the hero image to its original
                                version. The current image will be lost.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRestore(image.id)}
                              >
                                Restore
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {/* Delete Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive hover:text-destructive"
                          >
                            <Icon icon="ph:trash" className="h-3 w-3" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Hero Image?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. The hero image will
                              be permanently deleted.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(image.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-3 border-2 border-dashed">
                    <Icon
                      icon="ph:image-broken"
                      className="h-10 w-10 text-muted-foreground/50"
                    />
                    <p className="text-sm text-muted-foreground">
                      No image uploaded
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setUploadForm((prev) => ({
                            ...prev,
                            deviceType: device.value,
                          }));
                          setShowUploadDialog(true);
                        }}
                      >
                        <Icon icon="ph:upload" className="h-3 w-3 mr-1" />
                        Upload
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setGenerateForm((prev) => ({
                            ...prev,
                            deviceType: device.value,
                          }));
                          setShowGenerateDialog(true);
                        }}
                      >
                        <Icon icon="ph:magic-wand" className="h-3 w-3 mr-1" />
                        Generate
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* SEO Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon icon="ph:info" className="h-5 w-5" />
            SEO Tips for Hero Images
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Icon icon="ph:check-circle" className="h-4 w-4 mt-0.5 text-green-500" />
              <span>
                <strong>Priority Loading:</strong> Hero images automatically get{" "}
                <code className="bg-muted px-1 rounded">priority=true</code> and{" "}
                <code className="bg-muted px-1 rounded">fetchPriority=&quot;high&quot;</code>{" "}
                for faster LCP scores.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="ph:check-circle" className="h-4 w-4 mt-0.5 text-green-500" />
              <span>
                <strong>WebP Optimization:</strong> All images are automatically
                converted to WebP format with optimal compression.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="ph:check-circle" className="h-4 w-4 mt-0.5 text-green-500" />
              <span>
                <strong>Alt Text:</strong> Descriptive alt text improves
                accessibility and SEO. Include relevant keywords naturally.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Icon icon="ph:check-circle" className="h-4 w-4 mt-0.5 text-green-500" />
              <span>
                <strong>Device-Specific Images:</strong> Different images for
                desktop/mobile ensures optimal display on all devices.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

