import { z } from "zod";

// Validation schema for blog posts
export const blogSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  slug: z.string().optional(), // Custom slug, auto-generated if empty
  excerpt: z.string().min(1, "Excerpt is required").max(500),
  content: z.string().min(1, "Content is required"),
  coverImage: z.any().optional(), // Can be File, FileList, or URL string
  coverImageAlt: z.string().max(200).optional(), // Alt text for SEO
  tag: z.string().optional(),
  metaTitle: z.string().max(70).optional(), // Increased to 70 for flexibility
  metaDescription: z.string().max(160).optional(),
  published: z.boolean().default(false),
});

export type BlogFormData = z.infer<typeof blogSchema>;

