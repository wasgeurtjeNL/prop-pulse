# UTM Tracking & Marketing Attribution System

This guide explains how to use the UTM tracking system to measure the effectiveness of your marketing campaigns.

## Overview

The UTM tracking system allows you to:
- **Track traffic sources** - Know exactly where your visitors come from
- **Measure campaign performance** - See which campaigns drive the most views and leads
- **Persistent attribution** - Track visitors across multiple sessions (30-day cookie)
- **Lead attribution** - Connect leads to their original marketing source

## Getting Started

### 1. Access the Marketing Tools

Navigate to **Dashboard → Marketing Tools** to access:
- **Link Generator** - Create trackable URLs
- **Campaign Analytics** - View performance data
- **Channel Presets** - Manage your marketing channels
- **How It Works** - Detailed documentation

### 2. Generate Tracking Links

1. Select a property from the dropdown
2. Choose a traffic source (Facebook, Instagram, etc.)
3. Select a medium (marketplace, social, ads, etc.)
4. Optionally add a campaign name
5. Copy the generated URL

**Example URL:**
```
https://www.psmphuket.com/properties/phuket/luxury-villa?utm_source=facebook&utm_medium=marketplace&utm_campaign=december_2024
```

### 3. Use Your Tracking Links

Share these links instead of regular URLs:
- Post on Facebook Marketplace
- Share on Instagram Stories
- Include in email newsletters
- Add to partner websites
- Print QR codes with UTM links

## UTM Parameters Explained

| Parameter | Required | Description | Examples |
|-----------|----------|-------------|----------|
| `utm_source` | ✅ Yes | Where traffic comes from | facebook, google, instagram |
| `utm_medium` | ✅ Yes | Type of traffic | marketplace, social, ads, email |
| `utm_campaign` | Recommended | Campaign identifier | december_2024, villa_promo |
| `utm_term` | Optional | Paid search keywords | phuket+villa |
| `utm_content` | Optional | A/B test variants | hero_image, sidebar |

## How Tracking Works

### Automatic Capture
When a visitor clicks a UTM link:
1. UTM parameters are captured automatically
2. Parameters are stored in a cookie (30-day expiration)
3. Attribution persists across page views and sessions

### Lead Attribution
When a visitor submits a form:
1. The system checks for stored UTM data
2. UTM parameters are saved with the lead
3. You can see the traffic source in your leads dashboard

### First-Touch Attribution
The system uses "first-touch" attribution:
- The **first** marketing source that brought the visitor gets credit
- Subsequent visits don't overwrite the original source
- This helps identify which channels drive new visitors

## Best Practices

### Naming Conventions
- Use **lowercase** for all parameters
- Use **underscores** instead of spaces
- Be **consistent** (always "facebook", never "fb")

### Campaign Names
Include context in your campaign names:
- `december_2024` - Monthly campaigns
- `villa_promo_dec` - Specific promotions
- `new_listings_q4` - Quarterly themes
- `partner_thailand_property` - Partner campaigns

### Channel Presets
Use the built-in presets for consistency:
- **Facebook Marketplace** → `source=facebook, medium=marketplace`
- **Instagram Social** → `source=instagram, medium=social`
- **Google Ads** → `source=google, medium=ads`

Create custom presets for:
- Partner websites
- Specific ad accounts
- Regional campaigns

## Viewing Analytics

### Marketing Dashboard
Go to **Dashboard → Marketing Tools → Campaign Analytics** to see:
- Tracked vs. untracked views
- Top traffic sources
- Active campaigns
- Source/medium combinations

### Full Analytics
For detailed analytics, go to **Dashboard → Analytics** which includes:
- Views over time with UTM breakdown
- Geographic data
- Device breakdown
- Conversion funnel

## Technical Details

### Cookie Storage
- **Cookie Name:** `psm_utm`
- **Duration:** 30 days
- **Scope:** First-party (same domain)
- **Privacy:** No personal data stored

### API Integration
UTM parameters are automatically included when submitting:
- Viewing requests
- Investor lead forms
- Rental lead forms
- Property inquiries

### Database Fields
UTM fields are stored in:
- `PropertyView` - Page views
- `ViewingRequest` - Viewing/offer requests
- `InvestorLead` - Investor inquiries
- `RentalLead` - Rental inquiries

## Troubleshooting

### Links Not Being Tracked
1. Ensure the URL includes `?utm_source=` parameters
2. Check that the link points to your domain
3. Verify cookies are enabled in the browser

### Analytics Not Showing
1. Allow a few minutes for data to sync
2. Check the date range filter
3. Ensure you have views with UTM parameters

### Leads Missing Attribution
1. Visitor may have cleared cookies
2. Over 30 days may have passed since first visit
3. Visitor may have used a different device

## Quick Reference

### Common Channels
| Channel | Source | Medium |
|---------|--------|--------|
| Facebook Marketplace | facebook | marketplace |
| Facebook Posts | facebook | social |
| Instagram | instagram | social |
| TikTok | tiktok | social |
| YouTube | youtube | video |
| Google Ads | google | ads |
| Email Newsletter | email | newsletter |
| Partner Website | partner | referral |
| QR Code | qr | offline |

### Quick Generate Buttons
Use the "Quick Generate" buttons in the Link Generator for instant links:
- FB Marketplace
- Instagram
- TikTok
- LINE

---

*Last updated: December 2024*

