import React from 'react';
import BlogCard from '../shared/blog/blogCard';
import { getPublishedBlogs } from '@/lib/actions/blog.actions';

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

const BlogList: React.FC = async () => {
    // Get all published blogs from the database
    const blogs = await getPublishedBlogs();
    
    // Map database blogs to the expected format
    const posts: Blog[] = blogs.map(blog => ({
        title: blog.title,
        date: toISOString(blog.publishedAt || blog.createdAt),
        excerpt: blog.excerpt,
        coverImage: blog.coverImage || '/images/blog/blog-1.jpg',
        coverImageAlt: blog.coverImageAlt || undefined,
        slug: blog.slug,
        detail: blog.excerpt,
        tag: blog.tag || 'Article',
    }));

    return (
        <section className='pt-0!'>
            <div className="container max-w-8xl mx-auto px-5 2xl:px-0">
                {posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No blog posts available yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                        {posts.map((blog, i) => (
                            <div key={i} className="w-full">
                                <BlogCard blog={blog} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

export default BlogList;
