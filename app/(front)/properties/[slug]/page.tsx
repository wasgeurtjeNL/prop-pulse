import dynamic from "next/dynamic";
import { Metadata } from "next";
import { getPropertyDetails, getRelatedProperties } from "@/lib/actions/property.actions";
import { notFound } from "next/navigation";
import { generatePropertySchema, renderJsonLd } from "@/lib/utils/structured-data";
import { transformPropertyToTemplate } from "@/lib/adapters/property-adapter";

// Dynamic import for the heavy property detail component
const Details = dynamic(() => import("@/components/new-design/properties/property-detail"), {
  ssr: true,
});

interface PropertyDetailPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
    const { slug } = await params;
    const property = await getPropertyDetails(slug);

    if (!property) {
        return {
            title: "Property Not Found | Real Estate Pulse",
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://realestatepulse.com';
    const propertyUrl = `${baseUrl}/properties/${property.slug}`;
    
    // Get first image or fallback
    const mainImage = property.images?.[0]?.url || property.image || '';
    const allImages = property.images?.map(img => img.url || '').filter(Boolean) || [property.image];

    // Create optimized title with location, type and price
    const propertyType = property.category?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Property';
    const metaTitle = `${property.title} | ${property.location} | ${property.price} | Real Estate Pulse`;
    
    // Create rich description
    const metaDescription = property.shortDescription || 
        `${property.beds} bedroom ${propertyType.toLowerCase()} for ${property.type === 'FOR_SALE' ? 'sale' : 'rent'} in ${property.location}. ${property.sqft} sq ft. Price: ${property.price}. Contact us to schedule a viewing.`;

    return {
        title: metaTitle,
        description: metaDescription,
        keywords: [
            property.title,
            property.location,
            propertyType,
            `${property.beds} bedroom`,
            property.type === 'FOR_SALE' ? 'for sale' : 'for rent',
            'real estate',
            'property',
            ...property.amenities.slice(0, 5), // Add top amenities as keywords
        ].join(', '),
        authors: [{ name: 'Real Estate Pulse' }],
        openGraph: {
            title: metaTitle,
            description: metaDescription,
            url: propertyUrl,
            siteName: 'Real Estate Pulse',
            images: allImages.map(img => ({
                url: img.startsWith('http') ? img : `${baseUrl}${img}`,
                width: 1200,
                height: 630,
                alt: `${property.title} - ${property.location}`,
            })),
            locale: 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: metaTitle,
            description: metaDescription,
            images: [mainImage.startsWith('http') ? mainImage : `${baseUrl}${mainImage}`],
        },
        robots: {
            index: property.status === 'ACTIVE',
            follow: true,
            googleBot: {
                index: property.status === 'ACTIVE',
                follow: true,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
        alternates: {
            canonical: propertyUrl,
        },
    };
}

const PropertyDetailPage = async ({ params }: PropertyDetailPageProps) => {
    const { slug } = await params;
    const property = await getPropertyDetails(slug);

    if (!property) {
        notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://realestatepulse.com';
    const mainImage = property.images?.[0]?.url || property.image || '';
    const allImages = property.images?.map(img => img.url || '').filter(Boolean) || [property.image];

    // Transform property to frontend format
    const transformedProperty = transformPropertyToTemplate(property);

    // Fetch related properties server-side for faster rendering
    const relatedProperties = await getRelatedProperties(
        property.slug,
        property.type,
        property.location,
        property.category,
        3
    );

    // Generate structured data for SEO
    const propertySchema = generatePropertySchema({
        name: property.title,
        description: property.shortDescription || `${property.beds} bedroom property in ${property.location}`,
        image: allImages.map(img => img.startsWith('http') ? img : `${baseUrl}${img}`),
        price: property.price,
        currency: 'USD',
        beds: property.beds,
        baths: property.baths,
        sqft: property.sqft,
        location: property.location,
        slug: property.slug,
        type: property.type,
        category: property.category,
        datePublished: property.createdAt,
        dateModified: property.updatedAt,
    }, baseUrl);

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={renderJsonLd(propertySchema)}
            />
            {/* Preload hero image for LCP optimization */}
            {mainImage && (
                <link
                    rel="preload"
                    as="image"
                    href={mainImage}
                    fetchPriority="high"
                />
            )}
            <Details 
                initialProperty={transformedProperty} 
                initialRelatedProperties={relatedProperties}
            />
        </>
    );
};

export default PropertyDetailPage;
