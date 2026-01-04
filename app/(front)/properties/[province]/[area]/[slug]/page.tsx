import dynamic from "next/dynamic";
import { Metadata } from "next";
import { getPropertyByFullSlug, getRelatedProperties, getAllPropertySlugs } from "@/lib/actions/property.actions";
import { getNearbyPois } from "@/lib/actions/poi.actions";
import { notFound } from "next/navigation";
import { generatePropertySchema, generatePropertyFAQSchema, renderJsonLd } from "@/lib/utils/structured-data";
import { transformPropertyToTemplate } from "@/lib/adapters/property-adapter";
import { TrackPropertyView } from "@/components/shared/analytics/track-property-view";
import { unstable_cache } from "next/cache";

// Revalidate pages every 60 seconds (ISR - Incremental Static Regeneration)
export const revalidate = 60;

// Pre-generate all active property pages at build time for instant loading
export async function generateStaticParams() {
    const properties = await getAllPropertySlugs();
    return properties.map((p) => ({
        province: p.provinceSlug || 'thailand',
        area: p.areaSlug || 'properties',
        slug: p.slug,
    }));
}

// Cached property fetch to prevent duplicate database calls
const getCachedProperty = unstable_cache(
    async (province: string, area: string, slug: string) => {
        return getPropertyByFullSlug(province, area, slug);
    },
    ['property-detail'],
    { revalidate: 60, tags: ['properties'] }
);

// Cached related properties
const getCachedRelatedProperties = unstable_cache(
    async (slug: string, type: string, location: string, category: string | null) => {
        return getRelatedProperties(slug, type, location, category, 3);
    },
    ['related-properties'],
    { revalidate: 300, tags: ['properties'] }
);

// Dynamic import for the heavy property detail component
const Details = dynamic(() => import("@/components/new-design/properties/property-detail"), {
  ssr: true,
});

interface PropertyDetailPageProps {
    params: Promise<{ province: string; area: string; slug: string }>;
}

export async function generateMetadata({ params }: PropertyDetailPageProps): Promise<Metadata> {
    const { province, area, slug } = await params;
    const property = await getCachedProperty(province, area, slug);

    if (!property) {
        return {
            title: "Property Not Found | Real Estate Pulse",
        };
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://realestatepulse.com';
    const propertyUrl = `${baseUrl}/properties/${province}/${area}/${property.slug}`;
    
    // Get first image or fallback
    const mainImage = property.images?.[0]?.url || property.image || '';
    const allImages = property.images?.map(img => img.url || '').filter(Boolean) || [property.image];

    // Create optimized title with location, type and price
    const propertyType = property.category?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) || 'Property';
    const areaName = area.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const provinceName = province.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Add SOLD/RENTED prefix to title if property is no longer available
    const statusPrefix = property.status === 'SOLD' ? 'SOLD - ' : property.status === 'RENTED' ? 'RENTED - ' : '';
    const metaTitle = `${statusPrefix}${property.title} | ${areaName}, ${provinceName} | ${property.price} | Real Estate Pulse`;
    
    // Create rich description with POI highlights
    const poiHighlights: string[] = [];
    if (property.seaDistance && property.seaDistance < 2000) {
        poiHighlights.push(`${property.seaDistance}m to beach`);
    }
    if (property.hasSeaView) {
        poiHighlights.push('Sea view');
    }
    if (property.beachScore && property.beachScore >= 70) {
        poiHighlights.push('Near beach');
    }
    if (property.familyScore && property.familyScore >= 60) {
        poiHighlights.push('Family-friendly');
    }
    
    const poiSuffix = poiHighlights.length > 0 ? ` • ${poiHighlights.join(' • ')}` : '';
    
    const metaDescription = property.shortDescription || 
        `${property.beds} bedroom ${propertyType.toLowerCase()} for ${property.type === 'FOR_SALE' ? 'sale' : 'rent'} in ${areaName}, ${provinceName}. ${property.sqft} m². Price: ${property.price}${poiSuffix}. Contact us to schedule a viewing.`;

    return {
        title: metaTitle,
        description: metaDescription,
        keywords: [
            property.title,
            areaName,
            provinceName,
            property.location,
            propertyType,
            `${property.beds} bedroom`,
            property.type === 'FOR_SALE' ? 'for sale' : 'for rent',
            'real estate',
            'property',
            'Thailand',
            ...property.amenities.slice(0, 5),
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
                alt: `${property.title} - ${areaName}, ${provinceName}`,
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
            // Index ACTIVE, SOLD, and RENTED properties (INACTIVE is hidden)
            index: property.status !== 'INACTIVE',
            follow: true,
            googleBot: {
                index: property.status !== 'INACTIVE',
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
    const { province, area, slug } = await params;
    
    // Use cached property fetch (same cache as generateMetadata to prevent duplicate calls)
    const property = await getCachedProperty(province, area, slug);

    if (!property) {
        notFound();
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://realestatepulse.com';
    const mainImage = property.images?.[0]?.url || property.image || '';
    const allImages = property.images?.map(img => img.url || '').filter(Boolean) || [property.image];

    // Transform property to frontend format
    const transformedProperty = transformPropertyToTemplate(property);

    // Fetch related properties and POIs in parallel for faster rendering
    const [relatedProperties, nearbyPoisResult] = await Promise.all([
        getCachedRelatedProperties(property.slug, property.type, property.location, property.category),
        getNearbyPois(property.id, { maxDistance: 10000, limit: 20 })
    ]);

    const nearbyPoisFlat = nearbyPoisResult.success && nearbyPoisResult.data 
        ? nearbyPoisResult.data.flatMap(group => group.pois.map(poi => ({
            name: poi.name,
            category: poi.category,
            distanceMeters: poi.distanceMeters,
          })))
        : [];

    // Generate structured data for SEO (enhanced with POI data)
    const propertySchema = generatePropertySchema({
        name: property.title,
        description: property.shortDescription || `${property.beds} bedroom property in ${property.location}`,
        image: allImages.map(img => img.startsWith('http') ? img : `${baseUrl}${img}`),
        price: property.price,
        currency: 'THB',
        beds: property.beds,
        baths: property.baths,
        sqft: property.sqft,
        location: property.location,
        slug: property.slug,
        type: property.type,
        category: property.category,
        datePublished: property.createdAt,
        dateModified: property.updatedAt,
        latitude: property.latitude,
        longitude: property.longitude,
        district: property.district,
        beachScore: property.beachScore,
        familyScore: property.familyScore,
        convenienceScore: property.convenienceScore,
        quietnessScore: property.quietnessScore,
        hasSeaView: property.hasSeaView,
        seaDistance: property.seaDistance,
        nearbyPois: nearbyPoisFlat,
        // Add hierarchical URL info
        provinceSlug: province,
        areaSlug: area,
    }, baseUrl);

    // Generate FAQ schema from POI data
    const faqSchema = generatePropertyFAQSchema({
        propertyName: property.title,
        location: property.location,
        district: property.district,
        seaDistance: property.seaDistance,
        hasSeaView: property.hasSeaView,
        beachScore: property.beachScore,
        familyScore: property.familyScore,
        quietnessScore: property.quietnessScore,
        convenienceScore: property.convenienceScore,
        nearbyPois: nearbyPoisFlat,
    });

    return (
        <>
            {/* Track page view for analytics */}
            <TrackPropertyView propertyId={property.id} />
            
            {/* JSON-LD Structured Data - Property */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={renderJsonLd(propertySchema)}
            />
            {/* JSON-LD Structured Data - FAQ (for rich snippets) */}
            {faqSchema && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={renderJsonLd(faqSchema)}
                />
            )}
            {/* Note: Image preloading moved to Next.js Image priority prop in Details component */}
            <Details 
                initialProperty={transformedProperty} 
                initialRelatedProperties={relatedProperties}
            />
        </>
    );
};

export default PropertyDetailPage;

