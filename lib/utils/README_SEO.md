# SEO Utilities - Quick Reference

Deze utilities helpen je om structured data (Schema.org JSON-LD) toe te voegen aan je pagina's voor betere SEO.

## Import

```typescript
import {
  generatePropertySchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateAggregateRatingSchema,
  generateArticleSchema,
  renderJsonLd,
} from '@/lib/utils/structured-data';
```

---

## 1. Property Schema (RealEstateListing)

**Voor:** Property detail pages

```typescript
const propertySchema = generatePropertySchema({
  name: property.title,
  description: property.shortDescription,
  image: [image1, image2, image3], // Array of URLs
  price: property.price, // String zoals "850000"
  currency: 'USD', // of 'EUR', 'THB', etc.
  beds: property.beds,
  baths: property.baths,
  sqft: property.sqft,
  location: property.location,
  slug: property.slug,
  type: property.type, // 'FOR_SALE' | 'FOR_RENT'
  category: property.category,
  datePublished: property.createdAt,
  dateModified: property.updatedAt,
}, baseUrl);

// Render in page
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={renderJsonLd(propertySchema)}
/>
```

---

## 2. Organization Schema

**Voor:** Homepage, About page

```typescript
const organizationSchema = generateOrganizationSchema({
  name: 'Real Estate Pulse',
  url: 'https://yourdomain.com',
  logo: 'https://yourdomain.com/logo.png',
  description: 'Premium real estate services...',
  email: 'info@yourdomain.com',
  phone: '+1234567890',
  address: {
    streetAddress: '123 Main St',
    addressLocality: 'City',
    addressRegion: 'State',
    postalCode: '12345',
    addressCountry: 'US',
  },
  sameAs: [
    'https://facebook.com/yourpage',
    'https://instagram.com/yourpage',
  ],
});
```

---

## 3. Breadcrumb Schema

**Voor:** Navigatie op detail pages

```typescript
const breadcrumbs = [
  { name: 'Home', url: '/' },
  { name: 'Properties', url: '/properties' },
  { name: 'Luxury Villa', url: '/properties/luxury-villa' },
];

const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs, baseUrl);
```

---

## 4. FAQ Schema

**Voor:** FAQ pagina's of secties

```typescript
const faqs = [
  {
    question: 'How do I buy a property?',
    answer: 'You can contact our team to schedule a viewing...',
  },
  {
    question: 'What are the payment options?',
    answer: 'We accept various payment methods including...',
  },
];

const faqSchema = generateFAQSchema(faqs);
```

---

## 5. Aggregate Rating Schema

**Voor:** Properties met reviews

```typescript
const ratingSchema = generateAggregateRatingSchema(
  'Luxury Villa in Phuket',  // Item name
  4.8,                        // Rating (out of 5)
  120,                        // Number of reviews
  5                          // Best rating (optional, default 5)
);
```

---

## 6. Article/BlogPosting Schema

**Voor:** Blog posts

```typescript
const articleSchema = generateArticleSchema({
  headline: 'Top 10 Real Estate Tips',
  description: 'Learn the best tips for buying property...',
  image: 'https://yourdomain.com/blog-image.jpg',
  datePublished: new Date('2024-01-01'),
  dateModified: new Date('2024-01-15'),
  author: 'John Doe',
  url: 'https://yourdomain.com/blog/top-10-tips',
});
```

---

## Complete Voorbeeld

```typescript
// app/(front)/properties/[slug]/page.tsx

import { generatePropertySchema, renderJsonLd } from '@/lib/utils/structured-data';
import { getPropertyDetails } from '@/lib/actions/property.actions';

export default async function PropertyDetailPage({ params }) {
  const { slug } = await params;
  const property = await getPropertyDetails(slug);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  const propertySchema = generatePropertySchema({
    name: property.title,
    description: property.shortDescription,
    image: property.images.map(img => img.url),
    price: property.price,
    currency: 'USD',
    beds: property.beds,
    baths: property.baths,
    sqft: property.sqft,
    location: property.location,
    slug: property.slug,
    type: property.type,
    datePublished: property.createdAt,
    dateModified: property.updatedAt,
  }, baseUrl);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={renderJsonLd(propertySchema)}
      />
      
      {/* Your page content */}
    </>
  );
}
```

---

## Testing

1. **Google Rich Results Test:**
   - https://search.google.com/test/rich-results
   
2. **Schema Markup Validator:**
   - https://validator.schema.org/

3. **Check in browser:**
   ```javascript
   // Open DevTools > Elements
   // Find <script type="application/ld+json">
   // Copy and paste into validator
   ```

---

## Best Practices

1. ✅ **Altijd valideren** met Schema.org validator
2. ✅ **Gebruik echte data** - geen placeholder text
3. ✅ **Complete informatie** - vul zoveel mogelijk velden in
4. ✅ **Correcte types** - gebruik de juiste @type voor je content
5. ✅ **Unieke content** - elke pagina heeft unieke structured data
6. ✅ **Update regelmatig** - sync met je database updates

---

## Troubleshooting

### Schema valideert niet?
- Check of alle verplichte velden aanwezig zijn
- Valideer JSON syntax
- Test URL's (moeten volledig zijn met https://)

### Google herkent schema niet?
- Wacht 1-2 weken na deployment
- Submit sitemap via Search Console
- Check of pagina geïndexeerd is

### Multiple schemas op 1 page?
```typescript
// Combineer meerdere schemas in een array
const combinedSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    propertySchema,
    breadcrumbSchema,
  ],
};
```

---

## TypeScript Types

Alle functies zijn volledig typed. Gebruik TypeScript autocomplete voor verfijnde veld-suggesties.

```typescript
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
```










