# Klaviyo Newsletter Integration - Implementation Guide

## ✅ What's Been Implemented

### 1. Footer Newsletter Subscription
Your footer now has a fully functional newsletter subscription form that:
- ✅ Validates email addresses
- ✅ Sends subscriptions to Klaviyo via Browser API (primary)
- ✅ Falls back to Server API if Browser API fails
- ✅ Shows success/error messages with toast notifications
- ✅ Tracks subscription events
- ✅ Prevents duplicate submissions with loading states
- ✅ Clears the form after successful subscription

### 2. API Route (Fallback)
**Location**: `app/api/klaviyo/subscribe/route.ts`

This server-side endpoint (used as fallback):
- Creates or updates profiles in Klaviyo
- Handles errors gracefully
- Returns appropriate status codes
- Logs subscription events

### 3. Browser API (Primary Method)
**Location**: `lib/klaviyo-tracking.ts`

The Klaviyo Browser API provides:
- Direct client-to-Klaviyo communication (no server round-trip)
- User identification (`klaviyoIdentify`)
- Event tracking (`klaviyoTrack`)
- Newsletter subscription (`klaviyoSubscribe`)
- Property-related tracking events

### 4. Client-Side Tracking Script
**Location**: `app/layout.tsx`

The Klaviyo tracking script is loaded on all pages and enables:
- User behavior tracking
- Event tracking
- Form submissions
- Custom events

---

## 🧪 Testing the Integration

### Test the Newsletter Form

1. **Navigate to any page** (footer is on all pages)
2. **Scroll to the footer**
3. **Enter an email address** in the "Enter Your Email" field
4. **Click "Subscribe"**
5. **Check for:**
   - Loading state shows "Subscribing..."
   - Success toast appears
   - Form clears after success
   - Button becomes disabled during submission

### Verify in Klaviyo

1. **Log in to Klaviyo**: https://www.klaviyo.com/login
2. **Go to Profiles** (Audience → Profiles)
3. **Search for the email** you just subscribed
4. **Check the profile**:
   - Email should be there
   - Properties should include: `source: "Footer Newsletter Signup"`
   - Properties should include: `signup_date`

---

## 📊 Tracked Events

### Newsletter Subscription Event
When someone subscribes, the following event is tracked:

```javascript
{
  event: "Newsletter Subscription",
  properties: {
    email: "user@example.com",
    source: "Footer",
    subscribed_at: "2025-01-08T12:34:56.789Z"
  }
}
```

---

## 🛠️ Available Tracking Functions

Import from `lib/klaviyo-tracking.ts`:

### Basic Functions

```typescript
import { 
  klaviyoIdentify, 
  klaviyoTrack, 
  klaviyoSubscribe 
} from '@/lib/klaviyo-tracking';

// Identify a user
klaviyoIdentify({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+66123456789',
  customProperties: { source: 'Contact Form' }
});

// Track any custom event
klaviyoTrack('Custom Event Name', {
  property1: 'value1',
  property2: 'value2'
});

// Subscribe to newsletter (used in footer)
await klaviyoSubscribe('user@example.com', 'Source Page');
```

### Property-Related Functions

```typescript
import { 
  trackPropertyView,
  trackAddToFavorites,
  trackRemoveFromFavorites,
  trackPropertySearch,
  trackViewingRequest,
  trackContactFormSubmission,
  trackCalculatorUsage
} from '@/lib/klaviyo-tracking';

// Track property view
trackPropertyView({
  id: 'prop-123',
  name: 'Beautiful Villa in Phuket',
  price: 15000000,
  location: 'Phuket',
  bedrooms: 3,
  bathrooms: 2,
  propertyType: 'Villa',
  listingNumber: 'PSM-123',
  imageUrl: 'https://...'
});

// Track favorites
trackAddToFavorites({ id: 'prop-123', name: 'Villa Name', price: 15000000 });
trackRemoveFromFavorites({ id: 'prop-123', name: 'Villa Name' });

// Track search
trackPropertySearch({
  location: 'Phuket',
  minPrice: 5000000,
  maxPrice: 20000000,
  propertyType: 'Villa',
  bedrooms: 3,
  listingType: 'buy'
});

// Track viewing request
trackViewingRequest(property, 'user@example.com');

// Track contact form
trackContactFormSubmission({
  email: 'user@example.com',
  name: 'John Doe',
  phone: '+66123456789',
  message: 'I am interested...',
  propertyId: 'prop-123',
  source: 'Property Page'
});

// Track calculator usage
trackCalculatorUsage({
  propertyPrice: 10000000,
  propertyType: 'Condo',
  buyerType: 'Foreign',
  currency: 'THB'
});
```

---

## 🎯 Next Steps & Enhancement Ideas

### 1. Create a Newsletter List in Klaviyo

Currently, profiles are created but not added to a specific list. To segment your newsletter subscribers:

1. **In Klaviyo Dashboard**:
   - Go to Audience → Lists & Segments
   - Click "Create List"
   - Name it "Newsletter Subscribers"
   - Copy the List ID

2. **Update API Route** (`app/api/klaviyo/subscribe/route.ts`):

```typescript
// After creating the profile, add them to the list
const LIST_ID = 'YOUR_LIST_ID'; // Replace with your actual list ID

await listsApi.createListRelationships(LIST_ID, {
  data: [
    {
      type: 'profile',
      id: profileId,
    },
  ],
});
```

### 2. Track Property Views

Add to any property detail page:

```typescript
// In property detail component
useEffect(() => {
  if (typeof window !== 'undefined' && (window as any)._learnq) {
    (window as any)._learnq.push(['track', 'Viewed Property', {
      PropertyID: property.id,
      PropertyName: property.name,
      PropertyPrice: property.price,
      PropertyLocation: property.location,
    }]);
  }
}, [property]);
```

### 3. Track Contact Form Submissions

Update your contact form to track when users submit:

```typescript
// After successful form submission
if (typeof window !== 'undefined' && (window as any)._learnq) {
  (window as any)._learnq.push(['track', 'Contact Form Submitted', {
    email: formData.email,
    name: formData.name,
    property: propertyId || 'General Inquiry',
  }]);
}
```

### 4. Identify Logged-In Users

If you have user authentication, identify users:

```typescript
// In your auth context or after login
if (typeof window !== 'undefined' && (window as any)._learnq && user) {
  (window as any)._learnq.push(['identify', {
    '$email': user.email,
    '$first_name': user.firstName,
    '$last_name': user.lastName,
  }]);
}
```

### 5. Create Email Campaigns in Klaviyo

Now that you're collecting subscribers, create campaigns:

1. **Welcome Email Flow**:
   - Trigger: When someone subscribes to the list
   - Send: Welcome email with your best properties

2. **New Listings Email**:
   - Trigger: When new property is added
   - Send: Showcase new listings to subscribers

3. **Property View Follow-up**:
   - Trigger: When someone views a property but doesn't inquire
   - Send: Follow-up email about that property

---

## 🔧 Troubleshooting

### "Newsletter service is not configured"
- Check that `KLAVIYO_PRIVATE_API_KEY` is set in your environment variables
- Verify the key starts with `pk_`

### "Failed to subscribe"
- Check browser console for errors
- Verify API route is accessible at `/api/klaviyo/subscribe`
- Check Klaviyo API status

### No toast notifications appearing
- Verify `Toaster` component is in your root layout (✅ already there)
- Check that `sonner` is installed (✅ already installed)

### Events not tracking
- Check browser console for `_learnq` errors
- Verify Klaviyo script is loaded (check Network tab)
- Confirm `NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY` is set

---

## 📈 Analytics & Metrics

### In Klaviyo Dashboard

Track these metrics:
- **Total Subscribers**: Audience → Profiles → Filter by list
- **Subscription Rate**: Analytics → Metrics → Newsletter Subscription
- **Email Open Rates**: Campaigns → Reports
- **Click-Through Rates**: Campaigns → Reports
- **Property View Events**: Analytics → Metrics → Custom Events

---

## 🔐 Security Notes

- ✅ Private API key is server-side only
- ✅ Public key is safe to expose
- ✅ Email validation is implemented
- ✅ Rate limiting recommended (consider adding to API route)
- ✅ GDPR compliance text included in footer

---

## 📚 Resources

- [Klaviyo API Docs](https://developers.klaviyo.com/)
- [Klaviyo Node SDK](https://github.com/klaviyo/klaviyo-api-node)
- [Email Marketing Best Practices](https://www.klaviyo.com/marketing-resources/email-best-practices)
- [GDPR Compliance](https://help.klaviyo.com/hc/en-us/articles/360001232347)

---

## 🎉 You're All Set!

Your newsletter subscription is now live and collecting subscribers. Start building your email list and engage with your audience through targeted campaigns!
