"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { createBlog, updateBlog } from "@/lib/actions/blog.actions";
import { uploadBlogImage } from "@/lib/actions/upload.actions";
import { blogSchema } from "@/lib/validations/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextEditor from "@/components/ui/rich-text-editor";
import SEOPanel from "./seo-panel";
import { toast } from "react-hot-toast";
import { ArrowLeft, Save, Eye, Loader2, Upload, X, ImageIcon, Sparkles, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type BlogFormData = z.infer<typeof blogSchema>;

interface BlogFormProps {
  blog?: {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string | null;
    coverImageAlt: string | null;
    tag: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    published: boolean;
  };
}

export default function BlogForm({ blog }: BlogFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    blog?.coverImage || null
  );
  const isEditing = !!blog;

  // AI Image Generation State
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiImageStyle, setAiImageStyle] = useState<"professional" | "luxury" | "modern" | "lifestyle">("professional");
  const [aiImageStats, setAiImageStats] = useState<{
    generationTime: string;
    compressedSize: string;
    savings: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BlogFormData>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      title: blog?.title || "",
      slug: blog?.slug || "",
      excerpt: blog?.excerpt || "",
      content: blog?.content || "",
      coverImage: blog?.coverImage || "",
      coverImageAlt: blog?.coverImageAlt || "",
      tag: blog?.tag || "",
      metaTitle: blog?.metaTitle || "",
      metaDescription: blog?.metaDescription || "",
      published: blog?.published || false,
    },
  });

  const title = watch("title");
  const slug = watch("slug");
  const content = watch("content");
  const coverImageAlt = watch("coverImageAlt");
  const metaTitle = watch("metaTitle");
  const metaDescription = watch("metaDescription");
  const published = watch("published");

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (coverImagePreview && coverImageFile) {
        URL.revokeObjectURL(coverImagePreview);
      }
    };
  }, [coverImagePreview, coverImageFile]);

  // Auto-generate alt text from title if empty
  useEffect(() => {
    if (title && !coverImageAlt) {
      setValue("coverImageAlt", `Cover image for: ${title}`);
    }
  }, [title, coverImageAlt, setValue]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }

      setCoverImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverImagePreview(previewUrl);

      // Auto-suggest alt text based on filename
      const filenameWithoutExt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      if (!coverImageAlt) {
        setValue("coverImageAlt", filenameWithoutExt);
      }
    }
  };

  const handleRemoveImage = () => {
    if (coverImagePreview && coverImageFile) {
      URL.revokeObjectURL(coverImagePreview);
    }
    setCoverImageFile(null);
    setCoverImagePreview(null);
    setValue("coverImage", "");
    setAiImageStats(null);
  };

  // Generate AI Cover Image with DALL-E 3
  const handleGenerateAICover = async () => {
    const currentTitle = title;
    if (!currentTitle || currentTitle.trim().length < 3) {
      toast.error("Voer eerst een titel in om een afbeelding te genereren");
      return;
    }

    setIsGeneratingAI(true);
    setAiImageStats(null);

    try {
      const response = await fetch("/api/generate-blog-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: currentTitle,
          style: aiImageStyle,
          quality: "standard",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      // Update the form with the generated image
      setCoverImagePreview(data.imageUrl);
      setValue("coverImage", data.imageUrl);
      setValue("coverImageAlt", data.alt);
      setCoverImageFile(null); // Clear any uploaded file
      setAiImageStats(data.stats);

      toast.success("Cover image gegenereerd met AI! ✨");
    } catch (error: any) {
      console.error("AI image generation error:", error);
      toast.error(error.message || "Kon cover image niet genereren");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const onSubmit = async (data: BlogFormData) => {
    setIsSubmitting(true);
    try {
      let coverImageUrl = data.coverImage as string;

      // Upload new image if selected
      if (coverImageFile) {
        toast.loading("Uploading cover image...", { id: "upload" });
        const formData = new FormData();
        formData.append("file", coverImageFile);
        coverImageUrl = await uploadBlogImage(formData);
        toast.success("Cover image uploaded!", { id: "upload" });
      }

      const blogData = {
        ...data,
        coverImage: coverImageUrl || undefined,
        coverImageAlt: data.coverImageAlt || undefined,
      };

      if (isEditing) {
        await updateBlog(blog.id, blogData);
        toast.success("Blog post updated successfully!");
      } else {
        await createBlog(blogData);
        toast.success("Blog post created successfully!");
      }
      router.push("/dashboard/blogs");
      router.refresh();
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(isEditing ? `Failed to update blog post: ${errorMessage}` : `Failed to create blog post: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Back Button */}
      <Link href="/dashboard/blogs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Blog Posts
      </Link>

      {/* Main Content Card */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <h3 className="text-lg font-semibold">Post Content</h3>
        
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="Enter blog post title"
            {...register("title")}
            className={errors.title ? "border-red-500" : ""}
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt *</Label>
          <Textarea
            id="excerpt"
            placeholder="Brief summary of the post (displayed in blog listings)"
            rows={3}
            {...register("excerpt")}
            className={errors.excerpt ? "border-red-500" : ""}
          />
          {errors.excerpt && (
            <p className="text-sm text-red-500">{errors.excerpt.message}</p>
          )}
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label>Content *</Label>
          <RichTextEditor
            value={content}
            onChange={(value) => setValue("content", value)}
            placeholder="Write your blog post content here..."
          />
          {errors.content && (
            <p className="text-sm text-red-500">{errors.content.message}</p>
          )}
        </div>
      </div>

      {/* Media Card - Updated with Image Upload */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Cover Image</h3>
        </div>
        
        {/* Cover Image Upload */}
        <div className="space-y-4">
          {/* Preview Area */}
          {coverImagePreview ? (
            <div className="relative group">
              <div className="relative aspect-video w-full max-w-2xl rounded-lg overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50">
                <Image
                  src={coverImagePreview}
                  alt={coverImageAlt || "Cover image preview"}
                  fill
                  className="object-cover"
                  unoptimized={coverImagePreview.startsWith("blob:")}
                />
                {/* Overlay with remove button */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Verwijderen
                  </Button>
                  <Label
                    htmlFor="coverImageUpload"
                    className="cursor-pointer inline-flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                  >
                    <Upload className="h-4 w-4" />
                    Vervangen
                  </Label>
                </div>
              </div>
              {coverImageFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nieuw bestand: {coverImageFile.name} ({(coverImageFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          ) : (
            <Label
              htmlFor="coverImageUpload"
              className="flex flex-col items-center justify-center w-full max-w-2xl aspect-video rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="flex flex-col items-center justify-center py-6">
                <Upload className="h-12 w-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-600">
                  Klik om een cover afbeelding te uploaden
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WebP tot 5MB
                </p>
              </div>
            </Label>
          )}
          
          <Input
            id="coverImageUpload"
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Alt Text Input */}
          <div className="space-y-2 max-w-2xl">
            <Label htmlFor="coverImageAlt" className="flex items-center gap-2">
              Alt Tekst
              <span className="text-xs font-normal text-muted-foreground">(SEO & Toegankelijkheid)</span>
            </Label>
            <Input
              id="coverImageAlt"
              placeholder="Beschrijf de afbeelding voor zoekmachines en schermlezers"
              {...register("coverImageAlt")}
            />
            <p className="text-xs text-muted-foreground">
              Een goede alt tekst beschrijft wat er op de afbeelding te zien is. Dit helpt met SEO en maakt je site toegankelijker.
            </p>
          </div>

          {/* Or enter URL manually */}
          <div className="relative max-w-2xl">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Of voer een URL in</span>
            </div>
          </div>

          <div className="space-y-2 max-w-2xl">
            <Label htmlFor="coverImageUrl">Afbeelding URL</Label>
            <Input
              id="coverImageUrl"
              placeholder="https://example.com/image.jpg"
              value={!coverImageFile ? (coverImagePreview || "") : ""}
              onChange={(e) => {
                const url = e.target.value;
                if (url && !coverImageFile) {
                  setCoverImagePreview(url);
                  setValue("coverImage", url);
                } else if (!url) {
                  setCoverImagePreview(null);
                  setValue("coverImage", "");
                }
              }}
              disabled={!!coverImageFile}
            />
            {coverImageFile && (
              <p className="text-xs text-muted-foreground">
                URL invoer is uitgeschakeld omdat er een bestand is geselecteerd
              </p>
            )}
          </div>

          {/* AI Image Generation */}
          <div className="relative max-w-2xl">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Of genereer met AI</span>
            </div>
          </div>

          <div className="space-y-4 max-w-2xl p-4 rounded-lg border border-dashed border-purple-300 bg-purple-50/50 dark:bg-purple-950/20">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">AI Cover Image Generator</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Genereer automatisch een professionele cover image gebaseerd op de blog titel met DALL-E 3.
              De afbeelding wordt geoptimaliseerd naar WebP formaat met SEO-geoptimaliseerde ALT tekst.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              {/* Style Selector */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Stijl:</Label>
                <Select
                  value={aiImageStyle}
                  onValueChange={(v: "professional" | "luxury" | "modern" | "lifestyle") => setAiImageStyle(v)}
                  disabled={isGeneratingAI}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">🏢 Professional</SelectItem>
                    <SelectItem value="luxury">✨ Luxury</SelectItem>
                    <SelectItem value="modern">🏗️ Modern</SelectItem>
                    <SelectItem value="lifestyle">🌴 Lifestyle</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generate Button */}
              <Button
                type="button"
                onClick={handleGenerateAICover}
                disabled={isGeneratingAI || !title || title.trim().length < 3}
                className="gap-2 bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingAI ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Genereren...
                  </>
                ) : coverImagePreview && !coverImageFile ? (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Nieuwe Image
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Genereer Cover
                  </>
                )}
              </Button>
            </div>

            {/* Stats */}
            {aiImageStats && (
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
                <span>⏱️ {aiImageStats.generationTime}</span>
                <span>📦 {aiImageStats.compressedSize} WebP</span>
                <span>💾 {aiImageStats.savings} bespaard</span>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              💡 Kosten: ~$0.04 per afbeelding. Vereist een geldige blog titel.
            </p>
          </div>
        </div>

        {/* Tag */}
        <div className="space-y-2 max-w-md">
          <Label htmlFor="tag">Tag / Categorie</Label>
          <Input
            id="tag"
            placeholder="e.g., Tips, Market Update, Investment"
            {...register("tag")}
          />
        </div>
      </div>

      {/* SEO Panel - Yoast Style */}
      <SEOPanel
        title={title || ""}
        slug={slug || ""}
        excerpt={watch("excerpt") || ""}
        content={content || ""}
        metaTitle={metaTitle || ""}
        metaDescription={metaDescription || ""}
        onSlugChange={(value) => setValue("slug", value)}
        onMetaTitleChange={(value) => setValue("metaTitle", value)}
        onMetaDescriptionChange={(value) => setValue("metaDescription", value)}
        siteUrl="https://psmphuket.com"
        siteName="PSM Phuket"
      />

      {/* Publish Settings Card */}
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <h3 className="text-lg font-semibold">Publish Settings</h3>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="published"
            checked={published}
            onCheckedChange={(checked) => setValue("published", checked as boolean)}
          />
          <Label htmlFor="published" className="cursor-pointer">
            Publish this post
          </Label>
        </div>
        <p className="text-sm text-muted-foreground">
          {published 
            ? "This post will be visible on the website" 
            : "This post will be saved as a draft"}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Link href="/dashboard/blogs">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        
        {isEditing && blog.published && (
          <Link href={`/blogs/${blog.slug}`} target="_blank">
            <Button type="button" variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              View Post
            </Button>
          </Link>
        )}
        
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEditing ? "Update Post" : "Create Post"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
