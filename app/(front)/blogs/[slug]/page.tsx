import { format } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { Icon } from '@iconify/react'
import { getPublishedBlogBySlug, getPublishedBlogs } from "@/lib/actions/blog.actions";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { BlogSections } from "@/components/new-design/blog/BlogSections";
import { extractTocItems } from "@/lib/blog-utils";
import { TableOfContents } from "@/components/new-design/blog/TableOfContents";
import { RelatedBlogs } from "@/components/new-design/blog/RelatedBlogs";
import { PoiPropertyGrid } from "@/components/new-design/blog/PoiPropertyGrid";
import { generateArticleSchema, generateFAQSchema, generateBreadcrumbSchema, renderJsonLd } from "@/lib/utils/structured-data";
import { calculateReadTime, formatReadTime } from "@/lib/utils";
import Breadcrumb from "@/components/new-design/breadcrumb";
import AdminEditButton from "@/components/shared/admin-edit-button";
import { 
    ReadingProgress, 
    KeyTakeaways, 
    SocialShare, 
    AuthorBio,
    InlineCTA,
    LastUpdated 
} from "@/components/new-design/blog/BlogEnhancements";

// Type for blog with author relation (matching Prisma return type)
type BlogWithAuthor = {
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
    publishedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    has_dynamic_properties: boolean;
    poi_query_params: string | null;
    poi_template_id: string | null;
    author: {
        name: string | null;
        image: string | null;
    };
};

// Helper to safely convert Date or string to ISO string
function toISOString(date: Date | string | null | undefined): string | undefined {
    if (!date) return undefined;
    if (typeof date === 'string') return date.includes('T') ? date : new Date(date).toISOString();
    if (date instanceof Date && !isNaN(date.getTime())) return date.toISOString();
    return undefined;
}

// Allow dynamic rendering for slugs not generated at build time
export const dynamicParams = true;

// Revalidate every hour for ISR
export const revalidate = 3600;

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const blog = await getPublishedBlogBySlug(slug) as BlogWithAuthor | null;

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
                publishedTime: toISOString(blog.publishedAt),
                modifiedTime: toISOString(blog.updatedAt),
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
    const blogs = await getPublishedBlogs() as BlogWithAuthor[];
    return blogs.map((blog) => ({
        slug: blog.slug,
    }));
}

export default async function Post({ params }: Props) {
    const { slug } = await params;
    const blog = await getPublishedBlogBySlug(slug) as BlogWithAuthor | null;
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
    
    // Extract Table of Contents items
    const tocItems = extractTocItems(blog.content);
    const hasToc = tocItems.length >= 3; // Only show ToC if 3+ sections

    // Generate BreadcrumbList schema
    const breadcrumbSchema = generateBreadcrumbSchema([
        { name: 'Home', url: '/' },
        { name: 'Blog', url: '/blogs' },
        { name: blog.title, url: `/blogs/${blog.slug}` }
    ], baseUrl);

    // Extract key takeaways from content (first 3-5 bullet points or section summaries)
    let keyTakeaways: Array<{ text: string }> = [];
    try {
        const parsed = JSON.parse(blog.content);
        if (parsed.sections && Array.isArray(parsed.sections)) {
            // Extract key points from section headings
            keyTakeaways = parsed.sections.slice(0, 5).map((section: { heading: string }) => ({
                text: section.heading
            }));
        }
    } catch {
        // Not structured content
    }

    return (
        <>
            {/* Reading Progress Indicator */}
            <ReadingProgress />

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
            {/* BreadcrumbList Schema for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={renderJsonLd(breadcrumbSchema)}
            />
            
            {/* Hero Section */}
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
                    
                    {/* Article Header */}
                    <header>
                        {/* Tag Badge */}
                        {blog.tag && (
                            <div className="mb-4">
                                <span className="inline-flex items-center py-1.5 px-4 bg-primary/10 rounded-full text-sm font-semibold text-primary">
                                    {blog.tag}
                                </span>
                            </div>
                        )}
                        
                        {/* Title - H1 for SEO */}
                        <h1 className="text-dark dark:text-white md:text-5xl text-3xl leading-[1.15] font-bold">
                            {blog.title}
                        </h1>
                        
                        {/* Excerpt/Subheadline */}
                        <p className="text-lg md:text-xl mt-5 text-dark/70 dark:text-white/70 max-w-3xl leading-relaxed">
                            {blog.excerpt}
                        </p>
                        
                        {/* Author & Meta Info - EEAT Optimized */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
                            {/* Author Info - Enhanced for EEAT */}
                            <div className="flex items-center gap-4" itemScope itemType="https://schema.org/Person">
                                {blog.author.image ? (
                                    <Image
                                        src={blog.author.image}
                                        alt={blog.author.name || "Author"}
                                        className="rounded-full ring-2 ring-primary/20"
                                        width={56}
                                        height={56}
                                        quality={100}
                                        itemProp="image"
                                    />
                                ) : (
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-2 ring-primary/20">
                                        <span className="text-primary font-bold text-xl">
                                            {blog.author.name?.charAt(0) || "A"}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <p className="text-base text-dark dark:text-white font-semibold" itemProp="name">
                                        {blog.author.name || "Anonymous"}
                                    </p>
                                    <p className="text-sm text-dark/60 dark:text-white/60">
                                        Real Estate Expert
                                    </p>
                                </div>
                            </div>
                            
                            {/* Article Metadata */}
                            <div className="flex items-center gap-5 flex-wrap text-sm">
                                <time 
                                    dateTime={toISOString(blog.publishedAt || blog.createdAt)}
                                    className="flex items-center gap-2 text-dark/70 dark:text-white/70"
                                >
                                    <Icon
                                        icon={'ph:calendar'}
                                        width={18}
                                        height={18}
                                        className='text-dark/50 dark:text-white/50'
                                    />
                                    {format(new Date(blog.publishedAt || blog.createdAt), "MMMM d, yyyy")}
                                </time>
                                <span className="flex items-center gap-2 text-dark/70 dark:text-white/70">
                                    <Icon
                                        icon={'ph:clock'}
                                        width={18}
                                        height={18}
                                        className='text-dark/50 dark:text-white/50'
                                    />
                                    {formatReadTime(readTime)}
                                </span>
                                {/* Last Updated Indicator */}
                                {blog.updatedAt && new Date(blog.updatedAt).getTime() !== new Date(blog.createdAt).getTime() && (
                                    <LastUpdated date={blog.updatedAt} />
                                )}
                            </div>
                        </div>
                        
                        {/* Social Share Buttons */}
                        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                            <SocialShare 
                                url={`${baseUrl}/blogs/${blog.slug}`}
                                title={blog.title}
                                description={blog.excerpt}
                            />
                        </div>
                    </header>
                    
                    {/* Cover Image */}
                    {blog.coverImage && (
                        <figure className="z-20 mt-10 overflow-hidden rounded-2xl aspect-[16/9] relative shadow-xl">
                            <Image
                                src={blog.coverImage}
                                alt={blog.coverImageAlt || blog.title}
                                fill
                                sizes="(max-width: 768px) 100vw, 1170px"
                                quality={85}
                                priority
                                className="object-cover object-center"
                            />
                        </figure>
                    )}
                </div>
            </section>
            
            {/* Blog Content with Optional Sidebar ToC */}
            <section className="pt-12 pb-16">
                <div className="container max-w-6xl mx-auto px-4">
                    {/* Mobile ToC - Shows at top on mobile, before content */}
                    {hasToc && (
                        <div className="lg:hidden mb-8">
                            <TableOfContents items={tocItems} />
                        </div>
                    )}
                    
                    <div className={hasToc ? "lg:grid lg:grid-cols-[1fr_280px] lg:gap-12" : ""}>
                        {/* Main Content */}
                        <div className="min-w-0">
                            {/* Key Takeaways Box */}
                            {keyTakeaways.length >= 3 && (
                                <KeyTakeaways 
                                    takeaways={keyTakeaways}
                                    title="What You'll Learn"
                                />
                            )}
                            
                            <BlogSections content={blog.content} showFaq={true} />
                            
                            {/* Inline CTA - Contact */}
                            <InlineCTA 
                                title="Interested in Phuket Real Estate?"
                                description="Our experts can help you find the perfect property investment."
                                buttonText="Contact Us"
                                buttonHref="/contactus"
                                variant="primary"
                            />
                            
                            {/* Dynamic POI Property Section - Shows live listings */}
                            {blog.has_dynamic_properties && blog.poi_template_id && (
                                <PoiPropertyGrid
                                    templateId={blog.poi_template_id}
                                    queryParams={blog.poi_query_params ? JSON.parse(blog.poi_query_params) : {}}
                                    title="Featured Properties"
                                    maxItems={6}
                                />
                            )}
                            
                            {/* Author Bio Section */}
                            <AuthorBio 
                                name={blog.author.name || "Real Estate Pulse"}
                                image={blog.author.image}
                                role="Real Estate Expert"
                                bio="Specializing in luxury properties and investment opportunities in Phuket, Thailand. With years of experience helping international buyers navigate the Thai real estate market."
                            />
                            
                            {/* WhatsApp CTA */}
                            <InlineCTA 
                                title="Have Questions?"
                                description="Chat with us directly on WhatsApp for quick answers."
                                buttonText="Chat on WhatsApp"
                                buttonHref="https://wa.me/66986261646?text=Hi%2C%20I%20read%20your%20blog%20and%20have%20a%20question"
                                variant="whatsapp"
                            />
                        </div>
                        
                        {/* Sticky Sidebar - Table of Contents (Desktop only) */}
                        {hasToc && (
                            <aside className="hidden lg:block">
                                <div className="sticky top-28">
                                    <TableOfContents items={tocItems} />
                                </div>
                            </aside>
                        )}
                    </div>
                    
                    {/* Related Blogs Section */}
                    <RelatedBlogs currentSlug={blog.slug} limit={3} />
                </div>
            </section>
            
            {/* Admin Edit Button */}
            <AdminEditButton editType="blog" editId={blog.id} />
        </>
    );
}
