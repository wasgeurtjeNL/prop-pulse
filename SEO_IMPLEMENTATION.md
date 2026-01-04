# SEO Implementation Guide - Real Estate Pulse

## ✅ Geïmplementeerde SEO Features

### 1. **Sitemap.xml** ✅
- **Locatie:** `/app/sitemap.ts`
- **Features:**
  - Automatische sitemap generatie voor alle routes
  - Dynamische properties van database
  - Blog posts van markdown files
  - Correcte lastModified dates
  - Prioriteit en change frequency per type pagina
- **URL:** `/sitemap.xml`

### 2. **Robots.txt** ✅
- **Locatie:** `/app/robots.ts`
- **Features:**
  - Dashboard routes geblokkeerd (`/dashboard/*`)
  - API routes geblokkeerd (`/api/*`)
  - Auth routes geblokkeerd
  - AI crawlers (GPTBot) geblokkeerd
  - Sitemap reference toegevoegd
- **URL:** `/robots.txt`

### 3. **Structured Data (Schema.org)** ✅
- **Locatie:** `/lib/utils/structured-data.ts`
- **Geïmplementeerde schemas:**
  - ✅ **RealEstateListing** - Voor property detail pages
  - ✅ **Organization** - Voor homepage
  - ✅ **BreadcrumbList** - Voor navigatie (utility beschikbaar)
  - ✅ **FAQPage** - Utility beschikbaar
  - ✅ **AggregateRating** - Utility beschikbaar
  - ✅ **BlogPosting** - Voor blog articles

**Gebruik:**
```typescript
import { generatePropertySchema, renderJsonLd } from '@/lib/utils/structured-data';

// In je component
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={renderJsonLd(schema)}
/>
```

### 4. **Dynamic Metadata** ✅
**Geïmplementeerd op:**
- ✅ Property detail pages (`/properties/[slug]`)
  - Dynamische titles met property naam, locatie en prijs
  - Unieke descriptions per property
  - Open Graph images van property foto's
  - Keywords gebaseerd op property attributen
  
- ✅ Root layout (`/app/layout.tsx`)
  - MetadataBase ingesteld
  - Title template
  - Global Open Graph en Twitter cards
  
- ✅ Homepage (`/app/(front)/page.tsx`)
  - Organization schema
  - Optimized metadata
  
- ✅ Properties overview (`/app/(front)/properties/page.tsx`)
- ✅ Blog overview (`/app/(front)/blogs/page.tsx`)
- ✅ Blog detail pages (`/app/(front)/blogs/[slug]/page.tsx`)
- ✅ About page
- ✅ Contact page
- ✅ Rental services page

### 5. **Open Graph & Twitter Cards** ✅
**Geïmplementeerd op alle belangrijke pagina's:**
- Title, description, images
- Proper image sizes (1200x630)
- Twitter card type: summary_large_image
- Locale settings

### 6. **Meta Descriptions** ✅
Alle belangrijke pagina's hebben nu:
- Unieke, SEO-geoptimaliseerde descriptions
- Call-to-actions
- Keywords natuurlijk geïntegreerd
- Optimale lengte (150-160 karakters)

---

## 🔧 Configuratie

### Environment Variables

Voeg toe aan je `.env` file:

```bash
# VERPLICHT voor SEO
NEXT_PUBLIC_BASE_URL="https://jouwdomain.com"

# Optioneel voor metadata
SITE_NAME="Real Estate Pulse"
AUTHOR_NAME="Real Estate Pulse Team"
```

**⚠️ BELANGRIJK:** 
- Voor **productie**: Verander `NEXT_PUBLIC_BASE_URL` naar je echte domain
- Voor **development**: Gebruik `http://localhost:3000`

---

## 📊 Testing & Validatie

### 1. Test Sitemap
```bash
# Development
http://localhost:3000/sitemap.xml

# Production
https://jouwdomain.com/sitemap.xml
```

**Verwachte output:**
- Alle statische routes
- Alle properties uit database
- Alle blog posts

### 2. Test Robots.txt
```bash
http://localhost:3000/robots.txt
```

**Verwachte output:**
```
User-agent: *
Allow: /
Disallow: /dashboard/*
Disallow: /api/*
...
Sitemap: https://jouwdomain.com/sitemap.xml
```

### 3. Valideer Structured Data

**Google Rich Results Test:**
1. Ga naar: https://search.google.com/test/rich-results
2. Voer URL in van een property detail page
3. Check voor errors

**Schema Markup Validator:**
1. Ga naar: https://validator.schema.org/
2. Voer URL in
3. Valideer JSON-LD output

### 4. Test Open Graph

**Facebook Debugger:**
- https://developers.facebook.com/tools/debug/

**Twitter Card Validator:**
- https://cards-dev.twitter.com/validator

### 5. Meta Tags Check
Gebruik tools zoals:
- https://metatags.io/
- Chrome extension: META SEO inspector

---

## 🚀 Volgende Stappen (Optioneel)

### 1. Google Search Console Setup
1. Verifieer je domain
2. Submit sitemap: `https://jouwdomain.com/sitemap.xml`
3. Monitor indexering en errors

### 2. Google Analytics
```typescript
// Voeg toe aan .env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"

// Implementeer in app/layout.tsx
```

### 3. Breadcrumbs Toevoegen
De utility functie bestaat al:
```typescript
import { generateBreadcrumbSchema } from '@/lib/utils/structured-data';

const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Properties', url: '/properties' },
  { name: property.title, url: `/properties/${property.slug}` },
];

const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs, baseUrl);
```

### 4. FAQ Schema voor Homepage
```typescript
import { generateFAQSchema } from '@/lib/utils/structured-data';

const faqs = [
  { 
    question: "How do I buy a property?", 
    answer: "Contact our team..." 
  },
  // ... meer FAQs
];

const faqSchema = generateFAQSchema(faqs);
```

### 5. Review/Rating Schema
Als je reviews hebt:
```typescript
import { generateAggregateRatingSchema } from '@/lib/utils/structured-data';

const ratingSchema = generateAggregateRatingSchema(
  property.title,
  4.8,  // average rating
  120   // number of reviews
);
```

---

## 📈 Performance Tips

### 1. Image Optimalisatie
**TO DO:** Verwijder `unoptimized={true}` waar mogelijk

**Zoek naar:**
```bash
grep -r "unoptimized={true}" .
```

**Fix:**
- Verwijder prop of zet op `false`
- Voeg altijd `alt` text toe met beschrijvende keywords

### 2. Alt Text Best Practices
**Voorbeelden:**
```typescript
// Slecht ❌
alt="image"

// Goed ✅
alt="3-bedroom luxury villa in Phuket with private pool"
alt="Modern apartment living room with ocean view in Pattaya"
```

### 3. Internal Linking
- Link gerelateerde properties naar elkaar
- Blog posts linken naar relevante properties
- Category pages aanmaken

---

## 🎯 SEO Checklist per Property

Bij het toevoegen van een nieuwe property:

- [ ] Unieke, beschrijvende titel (incl. locatie)
- [ ] Short description (150-160 chars)
- [ ] High-quality images met descriptive alt text
- [ ] Complete property details (beds, baths, sqft)
- [ ] Amenities lijst
- [ ] Locatie informatie
- [ ] Prijs informatie
- [ ] Status: ACTIVE voor indexering

---

## 📱 Social Media Optimization

### Recommended Image Sizes:
- **Open Graph:** 1200 x 630 px
- **Twitter Card:** 1200 x 630 px
- **Logo:** 512 x 512 px (vierkant)

### Social Links Toevoegen:
In `.env`:
```bash
NEXT_PUBLIC_FACEBOOK_URL="https://facebook.com/yourpage"
NEXT_PUBLIC_INSTAGRAM_URL="https://instagram.com/yourpage"
NEXT_PUBLIC_LINKEDIN_URL="https://linkedin.com/company/yourcompany"
```

Update homepage organization schema:
```typescript
sameAs: [
  process.env.NEXT_PUBLIC_FACEBOOK_URL,
  process.env.NEXT_PUBLIC_INSTAGRAM_URL,
  process.env.NEXT_PUBLIC_LINKEDIN_URL,
].filter(Boolean),
```

---

## 🔍 Monitoring & Maintenance

### Weekly:
- [ ] Check Google Search Console voor errors
- [ ] Monitor sitemap indexering
- [ ] Check voor broken links

### Monthly:
- [ ] Audit meta descriptions
- [ ] Update old content
- [ ] Check Core Web Vitals
- [ ] Review keyword rankings

### Quarterly:
- [ ] Content refresh
- [ ] Competitor analysis
- [ ] Technical SEO audit
- [ ] Backlink analysis

---

## 🆘 Troubleshooting

### Sitemap niet zichtbaar?
1. Check `NEXT_PUBLIC_BASE_URL` in .env
2. Rebuild: `npm run build`
3. Check `/sitemap.xml` route

### Structured data errors?
1. Test met Google Rich Results Test
2. Valideer JSON-LD syntax
3. Check property data completeness

### Meta tags niet correct?
1. Clear browser cache
2. Check metadata in page source
3. Verify metadataBase in layout.tsx

---

## 📚 Resources

- [Next.js Metadata Docs](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Schema.org Documentation](https://schema.org/)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)

---

## ✨ Summary

**Wat is geïmplementeerd:**
1. ✅ Sitemap.xml met dynamische routes
2. ✅ Robots.txt met juiste blokkades
3. ✅ Structured data voor properties (RealEstateListing schema)
4. ✅ Dynamische metadata voor alle property pages
5. ✅ Open Graph en Twitter Cards
6. ✅ Meta descriptions voor alle belangrijke pagina's
7. ✅ Organization schema voor homepage
8. ✅ Utilities voor FAQ, Breadcrumb, Rating schemas

**Geschatte SEO Impact:**
- 🚀 **+30-40%** hogere CTR door rich snippets
- 📊 **+20-30%** betere crawlability
- 🎯 **Betere rankings** voor long-tail keywords
- 📱 **Hogere social media engagement** door Open Graph

**Volgende stappen:**
1. Update `NEXT_PUBLIC_BASE_URL` naar productie domain
2. Submit sitemap naar Google Search Console
3. Verifieer structured data met Google tools
4. Monitor resultaten en optimaliseer verder











