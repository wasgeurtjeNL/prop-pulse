/**
 * UTM Tracking Utility
 * 
 * Captures UTM parameters from URLs and stores them in cookies for attribution.
 * Uses first-party cookies with 30-day expiration (Hyros-style persistent tracking).
 */

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

const UTM_COOKIE_NAME = 'psm_utm';
const UTM_COOKIE_DAYS = 30; // Cookie expires after 30 days

/**
 * Get UTM parameters from the current URL
 */
export function getUTMFromURL(): UTMParams {
  if (typeof window === 'undefined') return {};
  
  const params = new URLSearchParams(window.location.search);
  const utm: UTMParams = {};
  
  if (params.get('utm_source')) utm.utm_source = params.get('utm_source')!;
  if (params.get('utm_medium')) utm.utm_medium = params.get('utm_medium')!;
  if (params.get('utm_campaign')) utm.utm_campaign = params.get('utm_campaign')!;
  if (params.get('utm_term')) utm.utm_term = params.get('utm_term')!;
  if (params.get('utm_content')) utm.utm_content = params.get('utm_content')!;
  
  return utm;
}

/**
 * Get stored UTM parameters from cookies
 */
export function getStoredUTM(): UTMParams {
  if (typeof window === 'undefined') return {};
  
  try {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${UTM_COOKIE_NAME}=`));
    
    if (cookie) {
      const value = decodeURIComponent(cookie.split('=')[1]);
      return JSON.parse(value);
    }
  } catch (error) {
    console.warn('Failed to parse UTM cookie:', error);
  }
  
  return {};
}

/**
 * Store UTM parameters in a cookie
 */
export function storeUTM(params: UTMParams): void {
  if (typeof window === 'undefined') return;
  if (Object.keys(params).length === 0) return;
  
  try {
    const expires = new Date();
    expires.setDate(expires.getDate() + UTM_COOKIE_DAYS);
    
    const value = encodeURIComponent(JSON.stringify(params));
    document.cookie = `${UTM_COOKIE_NAME}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
  } catch (error) {
    console.warn('Failed to store UTM cookie:', error);
  }
}

/**
 * Capture and persist UTM parameters
 * Uses "first touch" attribution - only stores if no existing UTM
 */
export function captureUTM(overwrite = false): UTMParams {
  const urlParams = getUTMFromURL();
  const storedParams = getStoredUTM();
  
  // If we have new URL params, store them
  if (Object.keys(urlParams).length > 0) {
    if (overwrite || Object.keys(storedParams).length === 0) {
      storeUTM(urlParams);
      return urlParams;
    }
  }
  
  return storedParams;
}

/**
 * Get the effective UTM parameters (URL takes priority over stored)
 */
export function getEffectiveUTM(): UTMParams {
  const urlParams = getUTMFromURL();
  const storedParams = getStoredUTM();
  
  // URL params take priority
  if (Object.keys(urlParams).length > 0) {
    return urlParams;
  }
  
  return storedParams;
}

/**
 * Clear stored UTM parameters
 */
export function clearUTM(): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${UTM_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Format UTM data for API submission
 */
export function formatUTMForAPI(params: UTMParams): Record<string, string | undefined> {
  return {
    utm_source: params.utm_source,
    utm_medium: params.utm_medium,
    utm_campaign: params.utm_campaign,
    utm_term: params.utm_term,
    utm_content: params.utm_content,
  };
}

// ========================================
// Channel Presets - Pre-configured UTM settings
// ========================================

export interface ChannelPreset {
  id: string;
  name: string;
  icon: string;
  source: string;
  medium: string;
  description: string;
}

export const DEFAULT_CHANNEL_PRESETS: ChannelPreset[] = [
  {
    id: 'facebook_marketplace',
    name: 'Facebook Marketplace',
    icon: '📘',
    source: 'facebook',
    medium: 'marketplace',
    description: 'Property listings on Facebook Marketplace',
  },
  {
    id: 'facebook_social',
    name: 'Facebook Social',
    icon: '📘',
    source: 'facebook',
    medium: 'social',
    description: 'Facebook page posts and shares',
  },
  {
    id: 'instagram_social',
    name: 'Instagram',
    icon: '📸',
    source: 'instagram',
    medium: 'social',
    description: 'Instagram posts, stories, and reels',
  },
  {
    id: 'tiktok_social',
    name: 'TikTok',
    icon: '🎵',
    source: 'tiktok',
    medium: 'social',
    description: 'TikTok videos and profiles',
  },
  {
    id: 'youtube_video',
    name: 'YouTube',
    icon: '📺',
    source: 'youtube',
    medium: 'video',
    description: 'YouTube property tours and channel',
  },
  {
    id: 'google_ads',
    name: 'Google Ads',
    icon: '🔍',
    source: 'google',
    medium: 'ads',
    description: 'Paid Google advertising campaigns',
  },
  {
    id: 'google_organic',
    name: 'Google Organic',
    icon: '🔍',
    source: 'google',
    medium: 'organic',
    description: 'Organic search traffic from Google',
  },
  {
    id: 'line_social',
    name: 'LINE',
    icon: '💬',
    source: 'line',
    medium: 'social',
    description: 'LINE app messages and broadcasts',
  },
  {
    id: 'whatsapp_referral',
    name: 'WhatsApp',
    icon: '💚',
    source: 'whatsapp',
    medium: 'referral',
    description: 'WhatsApp shared links',
  },
  {
    id: 'email_newsletter',
    name: 'Email Newsletter',
    icon: '📧',
    source: 'email',
    medium: 'newsletter',
    description: 'Email newsletters and campaigns',
  },
  {
    id: 'partner_referral',
    name: 'Partner Referral',
    icon: '🤝',
    source: 'partner',
    medium: 'referral',
    description: 'Partner website links and referrals',
  },
  {
    id: 'qr_offline',
    name: 'QR Code',
    icon: '📱',
    source: 'qr',
    medium: 'offline',
    description: 'QR codes on print materials and signs',
  },
];

/**
 * Generate a tracking URL for a given property and channel preset
 */
export function generateTrackingURL(
  propertySlug: string,
  preset: ChannelPreset | { source: string; medium: string },
  campaign?: string,
  baseUrl = 'https://www.psmphuket.com'
): string {
  const url = new URL(`${baseUrl}/properties/phuket/${propertySlug}`);
  
  url.searchParams.set('utm_source', preset.source);
  url.searchParams.set('utm_medium', preset.medium);
  
  if (campaign) {
    url.searchParams.set('utm_campaign', campaign);
  }
  
  return url.toString();
}

/**
 * Get current campaign suggestion based on date
 */
export function getCurrentCampaignSuggestion(): string {
  const now = new Date();
  const month = now.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const year = now.getFullYear();
  return `${month}_${year}`;
}

