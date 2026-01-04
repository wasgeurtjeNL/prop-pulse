/** @type {import('next-sitemap').IConfig} */

// Hardcode the site URL - don't use env var to ensure consistency during build
const SITE_URL = 'https://www.psmphuket.com';

module.exports = {
  siteUrl: SITE_URL,
  generateRobotsTxt: true,
  generateIndexSitemap: false, // Disable index sitemap to avoid confusion
  
  // Exclude paths that should not be in sitemap
  exclude: [
    '/dashboard/*',
    '/dashboard',
    '/api/*',
    '/sign-in',
    '/sign-up',
    '/forgot-password',
    '/server-sitemap.xml', // Exclude the server-side sitemap from static sitemap
  ],
  
  // Robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/*',
          '/dashboard',
          '/api/*',
          '/sign-in',
          '/sign-up',
          '/forgot-password',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
    ],
    additionalSitemaps: [
      'https://www.psmphuket.com/sitemap.xml',
      'https://www.psmphuket.com/server-sitemap.xml',
    ],
  },
  
  // Transform function to customize sitemap entries
  transform: async (config, path) => {
    // Define priorities based on path
    let priority = 0.7;
    let changefreq = 'weekly';
    
    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path === '/properties') {
      priority = 0.9;
      changefreq = 'daily';
    } else if (path.startsWith('/properties/')) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path === '/blogs') {
      priority = 0.7;
      changefreq = 'weekly';
    } else if (path.startsWith('/blogs/')) {
      priority = 0.6;
      changefreq = 'monthly';
    } else if (path === '/rental-services' || path === '/renovation-projects') {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path === '/about' || path === '/contact') {
      priority = 0.6;
      changefreq = 'monthly';
    } else if (path === '/privacy-policy' || path === '/terms-and-conditions') {
      priority = 0.3;
      changefreq = 'yearly';
    }
    
    return {
      loc: path,
      changefreq,
      priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
    };
  },
  
  // Additional options
  autoLastmod: true,
  changefreq: 'weekly',
  priority: 0.7,
};

