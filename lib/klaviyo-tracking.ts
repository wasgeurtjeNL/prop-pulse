/**
 * Klaviyo Browser API Helpers
 * 
 * This file provides type-safe helpers for interacting with Klaviyo's
 * browser-side JavaScript API (_learnq).
 * 
 * Make sure the Klaviyo.js script is loaded in your layout.tsx:
 * <Script
 *   id="klaviyo-script"
 *   strategy="afterInteractive"
 *   src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY}`}
 * />
 */

declare global {
  interface Window {
    _learnq?: any[];
  }
}

/**
 * Identify a user in Klaviyo
 * This associates the current browser session with a known user profile
 */
export const klaviyoIdentify = (profile: {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  customProperties?: Record<string, any>;
}) => {
  if (typeof window === 'undefined' || !window._learnq) {
    console.warn('Klaviyo not loaded');
    return;
  }
  
  window._learnq.push(['identify', {
    '$email': profile.email,
    ...(profile.firstName && { '$first_name': profile.firstName }),
    ...(profile.lastName && { '$last_name': profile.lastName }),
    ...(profile.phone && { '$phone_number': profile.phone }),
    ...profile.customProperties,
  }]);
};

/**
 * Track a custom event in Klaviyo
 */
export const klaviyoTrack = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined' || !window._learnq) {
    console.warn('Klaviyo not loaded');
    return;
  }
  
  window._learnq.push(['track', eventName, {
    ...properties,
    tracked_at: new Date().toISOString(),
  }]);
};

/**
 * Subscribe an email using the browser API
 * This is an alternative to the server-side API
 */
export const klaviyoSubscribe = async (email: string, source?: string): Promise<boolean> => {
  if (typeof window === 'undefined' || !window._learnq) {
    console.warn('Klaviyo not loaded');
    return false;
  }

  try {
    // Identify the user first
    window._learnq.push(['identify', {
      '$email': email.toLowerCase().trim(),
      'Newsletter Subscriber': true,
      'Subscription Source': source || 'Website Footer',
      'Subscribed At': new Date().toISOString(),
    }]);

    // Track the subscription event
    window._learnq.push(['track', 'Newsletter Subscription', {
      email: email.toLowerCase().trim(),
      source: source || 'Website Footer',
      subscribed_at: new Date().toISOString(),
    }]);

    return true;
  } catch (error) {
    console.error('Klaviyo subscribe error:', error);
    return false;
  }
};

// ============================================
// Property-related tracking events
// ============================================

export interface PropertyData {
  id: string;
  name: string;
  price?: number;
  location?: string;
  bedrooms?: number;
  bathrooms?: number;
  propertyType?: string;
  listingNumber?: string;
  imageUrl?: string;
}

/**
 * Track when a user views a property
 */
export const trackPropertyView = (property: PropertyData) => {
  klaviyoTrack('Viewed Property', {
    'Property ID': property.id,
    'Property Name': property.name,
    'Price THB': property.price,
    'Location': property.location,
    'Bedrooms': property.bedrooms,
    'Bathrooms': property.bathrooms,
    'Property Type': property.propertyType,
    'Listing Number': property.listingNumber,
    'Image URL': property.imageUrl,
  });
};

/**
 * Track when a user adds a property to favorites
 */
export const trackAddToFavorites = (property: PropertyData) => {
  klaviyoTrack('Added to Favorites', {
    'Property ID': property.id,
    'Property Name': property.name,
    'Price THB': property.price,
    'Location': property.location,
    'Property Type': property.propertyType,
  });
};

/**
 * Track when a user removes a property from favorites
 */
export const trackRemoveFromFavorites = (property: PropertyData) => {
  klaviyoTrack('Removed from Favorites', {
    'Property ID': property.id,
    'Property Name': property.name,
  });
};

/**
 * Track when a user performs a property search
 */
export const trackPropertySearch = (filters: {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  bedrooms?: number;
  listingType?: string;
}) => {
  klaviyoTrack('Property Search', {
    'Location': filters.location,
    'Min Price': filters.minPrice,
    'Max Price': filters.maxPrice,
    'Property Type': filters.propertyType,
    'Bedrooms': filters.bedrooms,
    'Listing Type': filters.listingType,
  });
};

/**
 * Track when a user requests a viewing
 */
export const trackViewingRequest = (property: PropertyData, userEmail?: string) => {
  klaviyoTrack('Viewing Request', {
    'Property ID': property.id,
    'Property Name': property.name,
    'Price THB': property.price,
    'Location': property.location,
    'User Email': userEmail,
  });
};

/**
 * Track when a user submits a contact form
 */
export const trackContactFormSubmission = (data: {
  email: string;
  name?: string;
  phone?: string;
  message?: string;
  propertyId?: string;
  source?: string;
}) => {
  // First identify the user
  klaviyoIdentify({
    email: data.email,
    firstName: data.name?.split(' ')[0],
    lastName: data.name?.split(' ').slice(1).join(' '),
    phone: data.phone,
  });

  // Then track the event
  klaviyoTrack('Contact Form Submitted', {
    'Email': data.email,
    'Name': data.name,
    'Phone': data.phone,
    'Message': data.message,
    'Property ID': data.propertyId,
    'Source': data.source || 'Contact Page',
  });
};

/**
 * Track when a user uses the property calculator
 */
export const trackCalculatorUsage = (data: {
  propertyPrice: number;
  propertyType: string;
  buyerType?: string;
  currency?: string;
}) => {
  klaviyoTrack('Used Property Calculator', {
    'Property Price': data.propertyPrice,
    'Property Type': data.propertyType,
    'Buyer Type': data.buyerType,
    'Currency': data.currency,
  });
};

// ============================================
// Price Alert Tracking
// ============================================

/**
 * Track when a user subscribes to price alerts for a property
 */
export const trackPriceAlertSubscription = (data: {
  email: string;
  property: PropertyData;
}) => {
  // Identify the user
  klaviyoIdentify({
    email: data.email,
    customProperties: {
      'Has Price Alerts': true,
    },
  });

  // Track the subscription event
  klaviyoTrack('Subscribed to Price Alert', {
    'Property ID': data.property.id,
    'Property Name': data.property.name,
    'Price THB': data.property.price,
    'Location': data.property.location,
    'Listing Number': data.property.listingNumber,
    'Email': data.email,
  });
};

/**
 * Track when a user unsubscribes from price alerts
 */
export const trackPriceAlertUnsubscribe = (data: {
  email: string;
  propertyId: string;
  propertyName?: string;
}) => {
  klaviyoTrack('Unsubscribed from Price Alert', {
    'Property ID': data.propertyId,
    'Property Name': data.propertyName,
    'Email': data.email,
  });
};
