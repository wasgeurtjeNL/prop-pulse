import BlogList from "@/components/new-design/blog";
import HeroSub from "@/components/new-design/shared/hero-sub";
import { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

export const metadata: Metadata = {
    title: "Real Estate Blog & Insights",
    description: "Stay informed with the latest real estate trends, market insights, investment tips, and property buying guides. Expert advice for buyers, sellers, and investors.",
    keywords: "real estate blog, property market news, investment tips, buying guides, real estate trends",
    ...(baseUrl && {
        alternates: {
            canonical: `${baseUrl}/blogs`,
        },
    }),
    openGraph: {
        title: "Real Estate Blog & Insights | Real Estate Pulse",
        description: "Stay informed with the latest real estate trends, market insights, and expert advice.",
        ...(baseUrl && { url: `${baseUrl}/blogs` }),
        type: "website",
    },
};

const Blog = () => {
    const breadcrumbs = [
        { name: 'Blog', href: '/blogs' }
    ];

    return (
        <>
            <HeroSub
                title="Real estate insights."
                description="Stay ahead in the property market with expert advice and updates."
                badge="Blog"
                breadcrumbs={breadcrumbs}
            />
            <BlogList />
        </>
    );
};

export default Blog;
