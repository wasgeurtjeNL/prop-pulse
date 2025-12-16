/**
 * Utility functions for generating Schema.org structured data (JSON-LD)
 * for SEO optimization
 */

interface PropertyStructuredDataProps {
  name: string;
  description?: string;
  image: string | string[];
  price: string;
  currency?: string;
  beds: number;
  baths: number;
  sqft?: number;
  location: string;
  slug: string;
  type?: 'FOR_SALE' | 'FOR_RENT';
  category?: string;
  datePublished?: Date;
  dateModified?: Date;
}

interface OrganizationStructuredDataProps {
  name: string;
  url: string;
  logo: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  sameAs?: string[];
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate RealEstateListing Schema for property pages
 */
export function generatePropertySchema(
  props: PropertyStructuredDataProps,
  baseUrl: string = ''
) {
  const {
    name,
    description,
    image,
    price,
    currency = 'USD',
    beds,
    baths,
    sqft,
    location,
    slug,
    type,
    datePublished,
    dateModified,
  } = props;

  // Convert price string to number (remove commas, $ signs, etc.)
  const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));

  const schema = {
    '@context': 'https://schema.org',
    '@type': type === 'FOR_RENT' ? 'Apartment' : 'SingleFamilyResidence',
    '@id': `${baseUrl}/properties/${slug}`,
    name,
    description: description || `${beds} bedroom property in ${location}`,
    url: `${baseUrl}/properties/${slug}`,
    image: Array.isArray(image) ? image : [image],
    address: {
      '@type': 'PostalAddress',
      addressLocality: location,
    },
    numberOfRooms: beds,
    numberOfBathroomsTotal: baths,
    ...(sqft && { floorSize: { '@type': 'QuantitativeValue', value: sqft, unitCode: 'FTK' } }),
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: numericPrice,
      availability: 'https://schema.org/InStock',
      ...(type === 'FOR_RENT' && { priceSpecification: { '@type': 'UnitPriceSpecification', price: numericPrice, priceCurrency: currency, referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitCode: 'MON' } } }),
    },
    ...(datePublished && { datePublished: datePublished.toISOString() }),
    ...(dateModified && { dateModified: dateModified.toISOString() }),
  };

  return schema;
}

/**
 * Generate Organization Schema for company information
 */
export function generateOrganizationSchema(props: OrganizationStructuredDataProps) {
  const {
    name,
    url,
    logo,
    description,
    email,
    phone,
    address,
    sameAs = [],
  } = props;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name,
    url,
    logo,
    ...(description && { description }),
    ...(email && { email }),
    ...(phone && { telephone: phone }),
    ...(address && { address: { '@type': 'PostalAddress', ...address } }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  return schema;
}

/**
 * Generate BreadcrumbList Schema for navigation
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[], baseUrl: string = '') {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.url}`,
    })),
  };

  return schema;
}

/**
 * Generate FAQPage Schema
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return schema;
}

/**
 * Generate AggregateRating Schema for reviews
 */
export function generateAggregateRatingSchema(
  itemName: string,
  ratingValue: number,
  reviewCount: number,
  bestRating: number = 5
) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: {
      '@type': 'Thing',
      name: itemName,
    },
    ratingValue,
    reviewCount,
    bestRating,
  };

  return schema;
}

/**
 * Generate Article/BlogPosting Schema
 */
export function generateArticleSchema(props: {
  headline: string;
  description: string;
  image: string;
  datePublished: Date;
  dateModified?: Date;
  author: string;
  url: string;
}) {
  const { headline, description, image, datePublished, dateModified, author, url } = props;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline,
    description,
    image,
    datePublished: datePublished.toISOString(),
    dateModified: (dateModified || datePublished).toISOString(),
    author: {
      '@type': 'Person',
      name: author,
    },
    url,
  };

  return schema;
}

/**
 * Helper function to render JSON-LD script tag
 */
export function renderJsonLd(schema: object) {
  return {
    __html: JSON.stringify(schema),
  };
}


