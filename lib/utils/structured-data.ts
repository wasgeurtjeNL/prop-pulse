/**
 * Utility functions for generating Schema.org structured data (JSON-LD)
 * for SEO optimization
 */

interface NearbyPoiData {
  name: string;
  category: string;
  distanceMeters: number;
}

interface PropertyStructuredDataProps {
  // Basic property info
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
  
  // POI & Location data (NEW)
  latitude?: number | null;
  longitude?: number | null;
  district?: string | null;
  beachScore?: number | null;
  familyScore?: number | null;
  convenienceScore?: number | null;
  quietnessScore?: number | null;
  hasSeaView?: boolean | null;
  seaDistance?: number | null;
  nearbyPois?: NearbyPoiData[];
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
 * Enhanced with POI data for better SEO
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
    currency = 'THB', // Fixed: Thai Baht is the correct currency
    beds,
    baths,
    sqft,
    location,
    slug,
    type,
    datePublished,
    dateModified,
    // POI data
    latitude,
    longitude,
    district,
    beachScore,
    familyScore,
    convenienceScore,
    quietnessScore,
    hasSeaView,
    seaDistance,
    nearbyPois,
  } = props;

  // Convert price string to number (remove commas, ฿ signs, etc.)
  const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));

  // Build amenity features from POI data
  const amenityFeatures: object[] = [];
  
  if (seaDistance && seaDistance < 5000) {
    const distanceStr = seaDistance < 1000 ? `${seaDistance}m` : `${(seaDistance / 1000).toFixed(1)}km`;
    amenityFeatures.push({
      '@type': 'LocationFeatureSpecification',
      name: 'Beach Distance',
      value: distanceStr,
    });
  }
  
  if (hasSeaView) {
    amenityFeatures.push({
      '@type': 'LocationFeatureSpecification',
      name: 'Sea View',
      value: true,
    });
  }

  // Add nearby POIs as amenities (top 5)
  if (nearbyPois && nearbyPois.length > 0) {
    const topPois = nearbyPois.slice(0, 5);
    topPois.forEach(poi => {
      const distStr = poi.distanceMeters < 1000 
        ? `${poi.distanceMeters}m` 
        : `${(poi.distanceMeters / 1000).toFixed(1)}km`;
      amenityFeatures.push({
        '@type': 'LocationFeatureSpecification',
        name: formatPoiCategory(poi.category),
        value: `${poi.name} (${distStr})`,
      });
    });
  }

  // Build additional properties for scores
  const additionalProperties: object[] = [];
  
  if (beachScore !== null && beachScore !== undefined) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Beach Score',
      value: beachScore,
      maxValue: 100,
      unitText: 'points',
    });
  }
  
  if (familyScore !== null && familyScore !== undefined) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Family Friendliness Score',
      value: familyScore,
      maxValue: 100,
      unitText: 'points',
    });
  }
  
  if (convenienceScore !== null && convenienceScore !== undefined) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Convenience Score',
      value: convenienceScore,
      maxValue: 100,
      unitText: 'points',
    });
  }
  
  if (quietnessScore !== null && quietnessScore !== undefined) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Quietness Score',
      value: quietnessScore,
      maxValue: 100,
      unitText: 'points',
    });
  }

  // Build enhanced description
  const enhancedDescription = buildEnhancedDescription({
    description,
    beds,
    location,
    district,
    seaDistance,
    hasSeaView,
    beachScore,
  });

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${baseUrl}/properties/${slug}`,
    name,
    description: enhancedDescription,
    url: `${baseUrl}/properties/${slug}`,
    image: Array.isArray(image) ? image : [image],
    
    // Address with district info
    address: {
      '@type': 'PostalAddress',
      addressLocality: district || location,
      addressRegion: 'Phuket',
      addressCountry: 'TH',
    },
    
    // GeoCoordinates (NEW)
    ...(latitude && longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude,
        longitude,
      },
    }),
    
    // containedInPlace for better location context (NEW)
    ...(district && {
      containedInPlace: {
        '@type': 'Place',
        name: district,
        containedInPlace: {
          '@type': 'AdministrativeArea',
          name: 'Phuket, Thailand',
        },
      },
    }),
    
    numberOfRooms: beds,
    numberOfBathroomsTotal: baths,
    ...(sqft && { floorSize: { '@type': 'QuantitativeValue', value: sqft, unitCode: 'FTK' } }),
    
    // Amenity features from POI data (NEW)
    ...(amenityFeatures.length > 0 && { amenityFeature: amenityFeatures }),
    
    // Additional properties for scores (NEW)
    ...(additionalProperties.length > 0 && { additionalProperty: additionalProperties }),
    
    offers: {
      '@type': 'Offer',
      priceCurrency: currency,
      price: numericPrice,
      availability: 'https://schema.org/InStock',
      ...(type === 'FOR_RENT' && { 
        priceSpecification: { 
          '@type': 'UnitPriceSpecification', 
          price: numericPrice, 
          priceCurrency: currency, 
          referenceQuantity: { '@type': 'QuantitativeValue', value: '1', unitCode: 'MON' } 
        } 
      }),
    },
    ...(datePublished && { datePublished: datePublished.toISOString() }),
    ...(dateModified && { dateModified: dateModified.toISOString() }),
  };

  return schema;
}

/**
 * Format POI category for display
 */
function formatPoiCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'BEACH': 'Nearby Beach',
    'INTERNATIONAL_SCHOOL': 'International School',
    'LOCAL_SCHOOL': 'School',
    'KINDERGARTEN': 'Kindergarten',
    'HOSPITAL': 'Hospital',
    'CLINIC': 'Medical Clinic',
    'SHOPPING_MALL': 'Shopping Mall',
    'SUPERMARKET': 'Supermarket',
    'GYM': 'Fitness Center',
    'RESTAURANT': 'Restaurant',
    'PARK': 'Park',
    'VIEWPOINT': 'Viewpoint',
    'TEMPLE': 'Temple',
    'AIRPORT': 'Airport',
  };
  return categoryMap[category] || category.replace(/_/g, ' ').toLowerCase();
}

/**
 * Build enhanced description with POI data
 */
function buildEnhancedDescription(data: {
  description?: string;
  beds: number;
  location: string;
  district?: string | null;
  seaDistance?: number | null;
  hasSeaView?: boolean | null;
  beachScore?: number | null;
}): string {
  const { description, beds, location, district, seaDistance, hasSeaView, beachScore } = data;
  
  if (description) return description;
  
  let desc = `${beds} bedroom property in ${district || location}`;
  
  if (seaDistance && seaDistance < 2000) {
    desc += `, just ${seaDistance}m from the beach`;
  } else if (beachScore && beachScore >= 70) {
    desc += ', walking distance to beach';
  }
  
  if (hasSeaView) {
    desc += ' with stunning sea view';
  }
  
  return desc;
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
 * Property FAQ data interface
 */
interface PropertyFAQData {
  propertyName: string;
  location: string;
  district?: string | null;
  seaDistance?: number | null;
  hasSeaView?: boolean | null;
  beachScore?: number | null;
  familyScore?: number | null;
  quietnessScore?: number | null;
  convenienceScore?: number | null;
  nearbyPois?: NearbyPoiData[];
}

/**
 * Generate FAQ Schema automatically from property POI data
 * Creates SEO-rich FAQs based on available location data
 */
export function generatePropertyFAQSchema(data: PropertyFAQData) {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  const { 
    propertyName, 
    location, 
    district, 
    seaDistance, 
    hasSeaView, 
    beachScore,
    familyScore,
    quietnessScore,
    convenienceScore,
    nearbyPois = [],
  } = data;

  const areaName = district || location;

  // Beach distance FAQ
  if (seaDistance && seaDistance < 10000) {
    const distStr = seaDistance < 1000 
      ? `${seaDistance} meters` 
      : `${(seaDistance / 1000).toFixed(1)} kilometers`;
    const walkTime = Math.round(seaDistance / 80); // ~80m per minute walking
    
    faqs.push({
      question: 'How far is this property from the beach?',
      answer: `This property is located ${distStr} from the nearest beach${walkTime < 20 ? `, approximately ${walkTime} minutes walking distance` : ''}. ${beachScore && beachScore >= 70 ? 'It has an excellent beach accessibility score.' : ''}`,
    });
  }

  // Sea view FAQ
  if (hasSeaView) {
    faqs.push({
      question: 'Does this property have sea view?',
      answer: `Yes! ${propertyName} features beautiful sea views toward the Andaman Sea, perfect for enjoying stunning tropical sunsets.`,
    });
  }

  // Schools FAQ - find nearest school from POIs
  const schools = nearbyPois.filter(p => 
    ['INTERNATIONAL_SCHOOL', 'LOCAL_SCHOOL', 'KINDERGARTEN'].includes(p.category)
  );
  if (schools.length > 0) {
    const nearest = schools[0];
    const distStr = nearest.distanceMeters < 1000 
      ? `${nearest.distanceMeters}m` 
      : `${(nearest.distanceMeters / 1000).toFixed(1)}km`;
    const driveTime = Math.round(nearest.distanceMeters / 500); // ~500m per minute driving
    
    let answer = `Yes, there are ${schools.length > 1 ? 'several' : ''} international schools nearby. `;
    answer += `The nearest is ${nearest.name}, located ${distStr} away (approximately ${driveTime} minutes by car).`;
    if (schools.length > 1) {
      answer += ` Other options include ${schools.slice(1, 3).map(s => s.name).join(' and ')}.`;
    }
    
    faqs.push({
      question: 'Are there international schools nearby?',
      answer,
    });
  }

  // Hospital FAQ
  const hospitals = nearbyPois.filter(p => 
    ['HOSPITAL', 'CLINIC'].includes(p.category)
  );
  if (hospitals.length > 0) {
    const nearest = hospitals[0];
    const distStr = nearest.distanceMeters < 1000 
      ? `${nearest.distanceMeters}m` 
      : `${(nearest.distanceMeters / 1000).toFixed(1)}km`;
    const driveTime = Math.round(nearest.distanceMeters / 500);
    
    faqs.push({
      question: 'What hospitals are close to this property?',
      answer: `The nearest hospital is ${nearest.name}, located ${distStr} away (approximately ${driveTime} minutes by car). Phuket has excellent medical facilities including Bangkok Hospital Phuket and several international clinics.`,
    });
  }

  // Quietness FAQ
  if (quietnessScore !== null && quietnessScore !== undefined) {
    let quietDesc = '';
    if (quietnessScore >= 90) {
      quietDesc = 'This is a very quiet, peaceful area, perfect for those seeking tranquility. The property has a quietness score of ' + quietnessScore + '/100.';
    } else if (quietnessScore >= 70) {
      quietDesc = 'This is a quiet residential area with a good balance of peace and accessibility. The quietness score is ' + quietnessScore + '/100.';
    } else if (quietnessScore >= 50) {
      quietDesc = 'The property is in a moderately active area with some nearby entertainment options. Quietness score: ' + quietnessScore + '/100.';
    } else {
      quietDesc = 'This property is located in a lively area, close to entertainment and nightlife venues.';
    }
    
    faqs.push({
      question: 'Is this area quiet or near nightlife?',
      answer: quietDesc,
    });
  }

  // Family friendly FAQ
  if (familyScore !== null && familyScore !== undefined && familyScore >= 50) {
    faqs.push({
      question: 'Is this area suitable for families?',
      answer: `Yes, ${areaName} is family-friendly with a family score of ${familyScore}/100. There are international schools, hospitals, and family-oriented amenities nearby, making it an excellent choice for families with children.`,
    });
  }

  // Shopping FAQ
  const shopping = nearbyPois.filter(p => 
    ['SHOPPING_MALL', 'SUPERMARKET'].includes(p.category)
  );
  if (shopping.length > 0) {
    const nearest = shopping[0];
    const distStr = nearest.distanceMeters < 1000 
      ? `${nearest.distanceMeters}m` 
      : `${(nearest.distanceMeters / 1000).toFixed(1)}km`;
    
    faqs.push({
      question: 'What shopping options are nearby?',
      answer: `${nearest.name} is just ${distStr} away for your shopping needs. ${shopping.length > 1 ? `Additional options include ${shopping.slice(1, 3).map(s => s.name).join(' and ')}.` : ''} Central Phuket mall and other major shopping centers are easily accessible by car.`,
    });
  }

  // Fitness FAQ
  const gyms = nearbyPois.filter(p => p.category === 'GYM');
  if (gyms.length > 0) {
    const nearest = gyms[0];
    const distStr = nearest.distanceMeters < 1000 
      ? `${nearest.distanceMeters}m` 
      : `${(nearest.distanceMeters / 1000).toFixed(1)}km`;
    
    faqs.push({
      question: 'Are there fitness facilities nearby?',
      answer: `Yes! ${nearest.name} is located ${distStr} from the property. Phuket offers various fitness options including gyms, CrossFit boxes, yoga studios, and Muay Thai training camps.`,
    });
  }

  // Only return schema if we have FAQs
  if (faqs.length === 0) return null;

  return generateFAQSchema(faqs);
}

/**
 * Get FAQ array for display on property page
 */
export function getPropertyFAQs(data: PropertyFAQData): Array<{ question: string; answer: string }> {
  const schema = generatePropertyFAQSchema(data);
  if (!schema) return [];
  
  return (schema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map(q => ({
    question: q.name,
    answer: q.acceptedAnswer.text,
  }));
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










