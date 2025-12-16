"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { Icon } from "@iconify/react";

interface RelatedBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  coverImageAlt: string | null;
  tag: string | null;
  publishedAt: string | null;
  readTime: number;
  author: {
    name: string | null;
    image: string | null;
  };
}

interface RelatedBlogsProps {
  currentSlug: string;
  limit?: number;
}

export function RelatedBlogs({ currentSlug, limit = 3 }: RelatedBlogsProps) {
  const [blogs, setBlogs] = useState<RelatedBlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRelatedBlogs() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/blogs/related?slug=${encodeURIComponent(currentSlug)}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch related blogs");
        }

        const data = await response.json();
        setBlogs(data.blogs || []);
      } catch (err) {
        console.error("Error fetching related blogs:", err);
        setError("Could not load related articles");
      } finally {
        setLoading(false);
      }
    }

    fetchRelatedBlogs();
  }, [currentSlug, limit]);

  if (loading) {
    return (
      <section className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl md:text-3xl font-bold text-dark dark:text-white mb-8">
          More Articles
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-800 rounded-xl aspect-[16/10]" />
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/4" />
                <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || blogs.length === 0) {
    return null; // Don't show section if there are no related blogs
  }

  return (
    <section className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-dark dark:text-white">
          More Articles
        </h2>
        <Link
          href="/blogs"
          className="text-primary hover:text-primary/80 font-medium flex items-center gap-2 transition-colors"
        >
          View All
          <Icon icon="ph:arrow-right" className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {blogs.map((blog) => (
          <Link
            key={blog.id}
            href={`/blogs/${blog.slug}`}
            className="group block"
          >
            <article className="h-full">
              {/* Cover Image */}
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                {blog.coverImage ? (
                  <Image
                    src={blog.coverImage}
                    alt={blog.coverImageAlt || blog.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon
                      icon="ph:article"
                      className="w-12 h-12 text-gray-400 dark:text-gray-600"
                    />
                  </div>
                )}

                {/* Tag Badge */}
                {blog.tag && (
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-full">
                      {blog.tag}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="mt-4">
                {/* Meta Info */}
                <div className="flex items-center gap-3 text-sm text-dark/60 dark:text-white/60 mb-2">
                  {blog.publishedAt && (
                    <span>
                      {format(new Date(blog.publishedAt), "MMM dd, yyyy")}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Icon icon="ph:clock" className="w-3.5 h-3.5" />
                    {blog.readTime} min read
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-dark dark:text-white group-hover:text-primary transition-colors line-clamp-2">
                  {blog.title}
                </h3>

                {/* Excerpt */}
                <p className="mt-2 text-sm text-dark/70 dark:text-white/70 line-clamp-2">
                  {blog.excerpt}
                </p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}

