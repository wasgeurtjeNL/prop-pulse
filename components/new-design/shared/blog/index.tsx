import React from 'react';
import { Icon } from "@iconify/react";
import Link from 'next/link';
import { getPublishedBlogs } from '@/lib/actions/blog.actions';
import BlogCard from './blogCard';

// Helper to safely convert Date or string to ISO string
function toISOString(date: Date | string | null | undefined): string {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') return date.includes('T') ? date : new Date(date).toISOString();
    if (date instanceof Date && !isNaN(date.getTime())) return date.toISOString();
    return new Date().toISOString();
}

interface Blog {
    title: string;
    date: string;
    excerpt: string;
    coverImage: string;
    coverImageAlt?: string;
    slug: string;
    detail: string;
    tag: string;
}

const BlogSmall: React.FC = async () => {
    // Get published blogs from the database
    const blogs = await getPublishedBlogs();
    
    // Map database blogs to the expected format and take first 3
    const posts: Blog[] = blogs.slice(0, 3).map(blog => ({
        title: blog.title,
        date: toISOString(blog.publishedAt || blog.createdAt),
        excerpt: blog.excerpt,
        coverImage: blog.coverImage || '/images/blog/blog-1.jpg',
        coverImageAlt: blog.coverImageAlt || undefined,
        slug: blog.slug,
        detail: blog.excerpt,
        tag: blog.tag || 'Article',
    }));

    if (posts.length === 0) {
        return null; // Don't render the section if no blogs
    }

    return (
        <section>
            <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
                <div className='flex justify-between md:items-end items-start mb-10 md:flex-row flex-col'>
                    <div>
                        <p className="text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2">
                            <Icon icon="ph:house-simple-fill" className="text-2xl text-primary" aria-label="Home icon" />
                            Blog
                        </p>
                        <h2 className="lg:text-52 text-40 font-medium dark:text-white">
                            Real estate insights
                        </h2>
                        <p className='text-dark/50 dark:text-white/50 text-xm'>
                            Stay ahead in the property market with expert advice and updates
                        </p>
                    </div>
                    <Link href="/blogs" className='bg-dark dark:bg-white text-white dark:text-dark py-4 px-8 rounded-full hover:bg-primary duration-300' aria-label="Read all blog articles">
                        Read all articles
                    </Link>
                </div>
                <div className="grid sm:grid-cols-2 grid-cols-1 lg:grid-cols-3 gap-12">
                    {posts.map((blog, i) => (
                        <div key={i} className="w-full">
                            <BlogCard blog={blog} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default BlogSmall;
