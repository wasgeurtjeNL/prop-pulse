import { Metadata } from "next";
import PropertiesWithFilters from "@/components/new-design/properties/properties-with-filters";
import { Suspense } from "react";

export const metadata: Metadata = {
    title: "Properties for Sale & Rent",
    description: "Browse our extensive collection of premium properties. Filter by type, location, bedrooms, and amenities to find your perfect home. Luxury villas, modern apartments, residential homes, and office spaces available.",
    keywords: "properties for sale, properties for rent, luxury villas, apartments, real estate listings, buy property, rent property",
    openGraph: {
        title: "Properties for Sale & Rent | Real Estate Pulse",
        description: "Browse our extensive collection of premium properties. Luxury villas, modern apartments, and investment opportunities.",
        images: [
            {
                url: "/images/properties/property7.jpg",
                width: 1200,
                height: 630,
                alt: "Premium Property Listings",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Properties for Sale & Rent | Real Estate Pulse",
        description: "Browse our extensive collection of premium properties. Luxury villas, modern apartments, and investment opportunities.",
    },
};

const PropertiesPage = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PropertiesWithFilters />
        </Suspense>
    );
};

export default PropertiesPage;
