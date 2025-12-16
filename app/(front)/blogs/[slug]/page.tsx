import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Icon } from '@iconify/react'
import { getPublishedBlogBySlug, getPublishedBlogs } from "@/lib/actions/blog.actions";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { BlogSections } from "@/components/new-design/blog/BlogSections";
import { RelatedBlogs } from "@/components/new-design/blog/RelatedBlogs";
import { generateArticleSchema, generateFAQSchema, generateBreadcrumbSchema, renderJsonLd } from "@/lib/utils/structured-data";
import { calculateReadTime, formatReadTime } from "@/lib/utils";
import Breadcrumb from "@/components/new-design/breadcrumb";
import AdminEditButton from "@/components/shared/admin-edit-button";

// Allow dynamic rendering for slugs not generated at build time
export const dynamicParams = true;

// Revalidate every hour for ISR
export const revalidate = 3600;

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const blog = await getPublishedBlogBySlug(slug);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    if (blog) {
        return {
            // Don't add site name here - layout template handles it
            title: blog.metaTitle || blog.title,
            description: blog.metaDescription || blog.excerpt,
            authors: [{ name: blog.author.name || "Real Estate Pulse" }],
            ...(baseUrl && {
                alternates: {
                    canonical: `${baseUrl}/blogs/${blog.slug}`,
                },
            }),
            openGraph: {
                title: blog.metaTitle || blog.title,
                description: blog.metaDescription || blog.excerpt,
                type: "article",
                publishedTime: blog.publishedAt?.toISOString(),
                modifiedTime: blog.updatedAt?.toISOString(),
                authors: [blog.author.name || "Real Estate Pulse"],
                images: blog.coverImage ? [{ 
                    url: blog.coverImage,
                    alt: blog.coverImageAlt || blog.title,
                }] : [],
            },
            twitter: {
                card: "summary_large_image",
                title: blog.metaTitle || blog.title,
                description: blog.metaDescription || blog.excerpt,
                images: blog.coverImage ? [blog.coverImage] : [],
            },
            robots: {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                    "max-video-preview": -1,
                    "max-image-preview": "large",
                    "max-snippet": -1,
                },
            },
        };
    }

    return {
        title: "Not Found",
        description: "No blog article has been found",
        robots: {
            index: false,
            follow: false,
        },
    };
}

// Generate static paths for all published blogs
export async function generateStaticParams() {
    const blogs = await getPublishedBlogs();
    return blogs.map((blog) => ({
        slug: blog.slug,
    }));
}

export default async function Post({ params }: Props) {
    const { slug } = await params;
    const blog = await getPublishedBlogBySlug(slug);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";

    if (!blog) {
        notFound();
    }

    // Generate JSON-LD structured data for SEO
    const articleSchema = generateArticleSchema({
        headline: blog.title,
        description: blog.metaDescription || blog.excerpt,
        image: blog.coverImage || `${baseUrl}/images/hero/heroBanner.png`,
        datePublished: blog.publishedAt || blog.createdAt,
        dateModified: blog.updatedAt,
        author: blog.author.name || "Real Estate Pulse",
        url: `${baseUrl}/blogs/${blog.slug}`,
    });

    // Try to extract FAQ from structured content for FAQ schema
    let faqData: Array<{ question: string; answer: string }> | null = null;
    try {
        const parsed = JSON.parse(blog.content);
        if (parsed.faq && Array.isArray(parsed.faq)) {
            faqData = parsed.faq;
        }
    } catch {
        // Not structured content, no FAQ schema
    }

    // Calculate read time
    const readTime = calculateReadTime(blog.content);

    return (
        <>
            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
            />
            {faqData && faqData.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={renderJsonLd(generateFAQSchema(faqData))}
                />
            )}
            
            <section className="relative pt-20 sm:pt-24 lg:pt-28 pb-0">
                <div className="container max-w-6xl mx-auto md:px-0 px-4">
                    {/* Breadcrumbs */}
                    <div className="mb-6">
                        <Breadcrumb 
                            items={[
                                { name: 'Blog', href: '/blogs' },
                                { name: blog.title, href: `/blogs/${blog.slug}` }
                            ]} 
                        />
                    </div>
                    
                    <div>
                        <div>
                            <h1 className="text-dark dark:text-white md:text-5xl text-3xl leading-[1.2] font-bold pt-7">
                                {blog.title}
                            </h1>
                            <p className="text-lg mt-4 text-dark/70 dark:text-white/70 max-w-3xl">
                                {blog.excerpt}
                            </p>
                        </div>
                        <div className="flex items-center justify-between gap-6 mt-8 flex-wrap">
                            <div className="flex items-center gap-4">
                                {blog.author.image ? (
                                    <Image
                                        src={blog.author.image}
                                        alt={blog.author.name || "Author"}
                                        className="bg-no-repeat bg-contain inline-block rounded-full !w-12 !h-12"
                                        width={48}
                                        height={48}
                                        quality={100}
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-primary font-semibold">
                                            {blog.author.name?.charAt(0) || "A"}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <span className="text-base text-dark dark:text-white font-medium">
                                        {blog.author.name || "Anonymous"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-7 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <Icon
                                        icon={'ph:calendar'}
                                        width={18}
                                        height={18}
                                        className='text-dark/60 dark:text-white/60'
                                    />
                                    <span className="text-sm text-dark/70 dark:text-white/70">
                                        {format(new Date(blog.publishedAt || blog.createdAt), "MMM dd, yyyy")}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Icon
                                        icon={'ph:clock'}
                                        width={18}
                                        height={18}
                                        className='text-dark/60 dark:text-white/60'
                                    />
                                    <span className="text-sm text-dark/70 dark:text-white/70">
                                        {formatReadTime(readTime)}
                                    </span>
                                </div>
                                {blog.tag && (
                                    <div className="py-2 px-4 bg-primary/10 rounded-full">
                                        <p className="text-sm font-medium text-primary">{blog.tag}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {blog.coverImage && (
                        <div className="z-20 mt-10 overflow-hidden rounded-2xl aspect-[16/9] relative shadow-lg">
                            <Image
                                src={blog.coverImage}
                                alt={blog.coverImageAlt || blog.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 1170px"
                                quality={85}
                                priority
                                className="object-cover object-center"
                            />
                        </div>
                    )}
                </div>
            </section>
            
            {/* Blog Content with Alternating Sections */}
            <section className="pt-12 pb-16">
                <div className="container max-w-6xl mx-auto px-4">
                    <BlogSections content={blog.content} showFaq={true} />
                    
                    {/* Related Blogs Section */}
                    <RelatedBlogs currentSlug={blog.slug} limit={3} />
                </div>
            </section>
            
            {/* Admin Edit Button */}
            <AdminEditButton editType="blog" editId={blog.id} />
        </>
    );
}
