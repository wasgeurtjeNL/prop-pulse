/**
 * Google Search Console Indexing API Integration
 * 
 * This service handles automatic URL submission to Google for instant indexing.
 * When content is published, the URL is submitted via the Indexing API.
 * 
 * Setup requirements:
 * 1. Create a Google Cloud project
 * 2. Enable the Indexing API
 * 3. Create a Service Account with Indexing API permissions
 * 4. Download the JSON key and set it as GOOGLE_INDEXING_CREDENTIALS env var
 * 5. Add the service account email as an owner in Search Console
 * 
 * @developer Jack Wullems
 * @contact jackwullems18@gmail.com
 */

import { google } from 'googleapis';

// Types
export type IndexingAction = 'URL_UPDATED' | 'URL_DELETED';

export interface IndexingResult {
  success: boolean;
  url: string;
  action: IndexingAction;
  notificationTime?: string;
  error?: string;
}

export interface BatchIndexingResult {
  total: number;
  successful: number;
  failed: number;
  results: IndexingResult[];
}

// Site URL - used for Search Console API
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.psmphuket.com';

/**
 * Get authenticated Google client for Indexing API
 */
async function getIndexingAuth() {
  const credentials = process.env.GOOGLE_INDEXING_CREDENTIALS;
  
  if (!credentials) {
    console.warn('[Google Indexing] GOOGLE_INDEXING_CREDENTIALS not set');
    return null;
  }

  try {
    const parsedCredentials = JSON.parse(credentials);
    
    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    return auth;
  } catch (error) {
    console.error('[Google Indexing] Failed to parse credentials:', error);
    return null;
  }
}

/**
 * Submit a single URL for indexing
 */
export async function submitUrlForIndexing(
  url: string,
  action: IndexingAction = 'URL_UPDATED'
): Promise<IndexingResult> {
  const auth = await getIndexingAuth();
  
  if (!auth) {
    return {
      success: false,
      url,
      action,
      error: 'Google Indexing API credentials not configured',
    };
  }

  try {
    const indexing = google.indexing({ version: 'v3', auth });
    
    const response = await indexing.urlNotifications.publish({
      requestBody: {
        url: url.startsWith('http') ? url : `${SITE_URL}${url}`,
        type: action,
      },
    });

    console.log(`[Google Indexing] Submitted ${action} for: ${url}`);

    return {
      success: true,
      url,
      action,
      notificationTime: response.data.urlNotificationMetadata?.latestUpdate?.notifyTime || undefined,
    };
  } catch (error: any) {
    console.error(`[Google Indexing] Failed to submit ${url}:`, error.message);
    
    return {
      success: false,
      url,
      action,
      error: error.message || 'Failed to submit URL',
    };
  }
}

/**
 * Submit multiple URLs for indexing (batch operation)
 * Note: Google's Indexing API has a quota of 200 URLs/day
 */
export async function submitUrlsForIndexing(
  urls: string[],
  action: IndexingAction = 'URL_UPDATED'
): Promise<BatchIndexingResult> {
  const results: IndexingResult[] = [];
  let successful = 0;
  let failed = 0;

  // Process URLs sequentially to avoid rate limiting
  for (const url of urls) {
    const result = await submitUrlForIndexing(url, action);
    results.push(result);
    
    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    // Add a small delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return {
    total: urls.length,
    successful,
    failed,
    results,
  };
}

/**
 * Get authenticated Google client for Search Console API (for reading data)
 * Uses the same credentials as Indexing API (or GOOGLE_SEARCH_CONSOLE_CREDENTIALS if set separately)
 */
async function getSearchConsoleAuth() {
  // Use Search Console specific credentials if available, otherwise fall back to Indexing credentials
  const credentials = process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS || process.env.GOOGLE_INDEXING_CREDENTIALS;
  
  if (!credentials) {
    console.error('[Search Console] No credentials found. Set GOOGLE_INDEXING_CREDENTIALS or GOOGLE_SEARCH_CONSOLE_CREDENTIALS');
    return null;
  }

  try {
    const parsedCredentials = JSON.parse(credentials);
    console.log('[Search Console] Credentials loaded for:', parsedCredentials.client_email);
    
    const auth = new google.auth.GoogleAuth({
      credentials: parsedCredentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    return auth;
  } catch (error) {
    console.error('[Search Console] Failed to parse credentials:', error);
    return null;
  }
}

/**
 * Fetch search performance data from Google Search Console
 */
export interface SearchPerformanceData {
  rows?: {
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }[];
  totals?: {
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  };
}

export interface SearchPerformanceQuery {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
  dimensions?: ('query' | 'page' | 'country' | 'device' | 'date')[];
  rowLimit?: number;
  startRow?: number;
  filters?: {
    dimension: string;
    operator: 'equals' | 'contains' | 'notContains';
    expression: string;
  }[];
}

export async function getSearchPerformance(
  query: SearchPerformanceQuery
): Promise<SearchPerformanceData | null> {
  const auth = await getSearchConsoleAuth();
  
  if (!auth) {
    console.error('[Search Console] Auth not available - credentials missing or invalid');
    return null;
  }

  try {
    console.log('[Search Console] Fetching data for site:', SITE_URL);
    console.log('[Search Console] Query:', JSON.stringify(query));
    
    const searchconsole = google.searchconsole({ version: 'v1', auth });
    
    // For domain properties, use sc-domain: prefix
    const siteUrlForApi = SITE_URL.includes('://') 
      ? `sc-domain:${SITE_URL.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}`
      : SITE_URL;
    
    console.log('[Search Console] Using siteUrl for API:', siteUrlForApi);
    
    const response = await searchconsole.searchanalytics.query({
      siteUrl: siteUrlForApi,
      requestBody: {
        startDate: query.startDate,
        endDate: query.endDate,
        dimensions: query.dimensions || ['query'],
        rowLimit: query.rowLimit || 100,
        startRow: query.startRow || 0,
        dimensionFilterGroups: query.filters ? [{
          filters: query.filters.map(f => ({
            dimension: f.dimension,
            operator: f.operator,
            expression: f.expression,
          })),
        }] : undefined,
      },
    });

    const data = response.data;
    console.log('[Search Console] Response received, rows:', data.rows?.length || 0);
    
    return {
      rows: data.rows?.map(row => ({
        keys: row.keys || [],
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: row.ctr || 0,
        position: row.position || 0,
      })),
      totals: {
        clicks: data.rows?.reduce((sum, r) => sum + (r.clicks || 0), 0) || 0,
        impressions: data.rows?.reduce((sum, r) => sum + (r.impressions || 0), 0) || 0,
        ctr: 0, // Calculate separately
        position: 0, // Calculate separately
      },
    };
  } catch (error: any) {
    console.error('[Search Console] Failed to fetch performance data:', error.message);
    console.error('[Search Console] Error details:', error.response?.data || error);
    return null;
  }
}

/**
 * Get top performing pages
 */
export async function getTopPages(days: number = 28, limit: number = 20) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getSearchPerformance({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['page'],
    rowLimit: limit,
  });
}

/**
 * Get top search queries
 */
export async function getTopQueries(days: number = 28, limit: number = 50) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getSearchPerformance({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['query'],
    rowLimit: limit,
  });
}

/**
 * Get performance data for a specific page
 */
export async function getPagePerformance(pageUrl: string, days: number = 28) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return getSearchPerformance({
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['date'],
    filters: [{
      dimension: 'page',
      operator: 'equals',
      expression: pageUrl.startsWith('http') ? pageUrl : `${SITE_URL}${pageUrl}`,
    }],
  });
}

/**
 * Helper: Build full URL from path
 */
export function buildFullUrl(path: string): string {
  if (path.startsWith('http')) {
    return path;
  }
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/**
 * Helper: Generate common content URLs
 */
export function generateBlogUrl(slug: string): string {
  return buildFullUrl(`/blogs/${slug}`);
}

export function generatePropertyUrl(provinceSlug: string, areaSlug: string, slug: string): string {
  return buildFullUrl(`/properties/${provinceSlug}/${areaSlug}/${slug}`);
}

export function generateLandingPageUrl(slug: string): string {
  return buildFullUrl(`/landing-pages/${slug}`);
}
