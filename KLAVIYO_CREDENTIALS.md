# Klaviyo Integration Credentials

## Account Information
- **Account Name**: Property Service and Management Co.,Ltd.
- **Login Email**: jumi6961@gmail.com

## API Keys

### Public API Key (Site ID)
```
QVPgfw
```
**Usage**: Client-side tracking, embedded forms, and on-site behavior tracking

### Private API Key
```
pk_a2f661c640dd3288ea23178429f77daa33
```
**Name**: Nextjs Real Estate Website  
**Access Level**: Full Access Key  
**Usage**: Server-side API calls (profiles, events, campaigns, etc.)

## Environment Variables

Add these to your `.env.local` file:

```env
# Klaviyo API Keys
KLAVIYO_PRIVATE_API_KEY=pk_a2f661c640dd3288ea23178429f77daa33
NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY=QVPgfw
```

## Installation

Install the official Klaviyo SDK:

```bash
npm install klaviyo-api
```

## Usage Examples

### Server-Side (API Routes)

```typescript
// app/api/klaviyo/subscribe/route.ts
import { ApiKeySession, ProfilesApi } from 'klaviyo-api'

const session = new ApiKeySession(process.env.KLAVIYO_PRIVATE_API_KEY!)
const profilesApi = new ProfilesApi(session)

export async function POST(request: Request) {
  const { email, firstName, lastName } = await request.json()
  
  try {
    const profile = await profilesApi.createProfile({
      data: {
        type: 'profile',
        attributes: {
          email,
          first_name: firstName,
          last_name: lastName,
        }
      }
    })
    
    return Response.json({ success: true, profile })
  } catch (error) {
    console.error('Klaviyo API Error:', error)
    return Response.json({ success: false, error: 'Failed to create profile' }, { status: 500 })
  }
}
```

### Client-Side Tracking

Add to your root layout (`app/layout.tsx`):

```typescript
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          id="klaviyo-script"
          strategy="afterInteractive"
          src={`https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=${process.env.NEXT_PUBLIC_KLAVIYO_PUBLIC_KEY}`}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### Track Custom Events

```typescript
// In any client component
declare global {
  interface Window {
    _learnq?: any[]
  }
}

export function trackPropertyView(propertyId: string, propertyName: string) {
  if (typeof window !== 'undefined' && window._learnq) {
    window._learnq.push(['track', 'Viewed Property', {
      PropertyID: propertyId,
      PropertyName: propertyName,
      ViewedAt: new Date().toISOString()
    }])
  }
}
```

## Integration with Contact Form

Update your contact form to send data to Klaviyo:

```typescript
// app/(front)/contact/page.tsx
const handleSubmit = async (data: ContactFormData) => {
  // Send to Klaviyo
  await fetch('/api/klaviyo/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName
    })
  })
  
  // Track contact form submission event
  if (typeof window !== 'undefined' && window._learnq) {
    window._learnq.push(['track', 'Contact Form Submitted', {
      email: data.email,
      message: data.message
    }])
  }
}
```

## Price Drop Alert Flow

### Flow Details
| Property | Value |
|----------|-------|
| **Flow Name** | Price Drop Alert |
| **Flow URL** | https://www.klaviyo.com/flow/SPVFQ3/edit |
| **Trigger Event** | `Price Drop Alert` |
| **Email Name** | Price Drop Notification |
| **Status** | ✅ Live |

### Email Template Variables

The email template uses the following Klaviyo variables:

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `{{ first_name\|default:'there' }}` | Customer's first name with fallback | "John" or "there" |
| `{{ event.Property_Title }}` | Property title | "Exquisite Villa in Rawai" |
| `{{ event.Old_Price }}` | Previous price (number) | 36000000 |
| `{{ event.New_Price }}` | New price (number) | 34000000 |
| `{{ event.Price_Change }}` | Price difference (absolute) | 2000000 |
| `{{ event.Price_Change_Percent }}` | Percentage change | "5.6" |
| `{{ event.Property_URL }}` | Link to property page | "https://..." |
| `{{ event.Location }}` | Property location | "Rawai, Phuket" |
| `{{ event.Listing_Number }}` | Listing reference | "SLN6" |
| `{{ event.Unsubscribe_URL }}` | Property-specific unsubscribe link | "https://..." |
| `{% unsubscribe_link %}` | Klaviyo standard unsubscribe | Auto-generated |

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/property-price-alerts` | POST | Subscribe to price alerts |
| `/api/property-price-alerts` | DELETE | Unsubscribe from price alerts |
| `/api/property-price-alerts/check` | GET | Check subscription status |
| `/api/property-price-alerts/notify` | POST | Send price change notifications (internal) |
| `/api/property-price-alerts/unsubscribe` | GET | Token-based unsubscribe (email link) |

### How Price Drop Alerts Work

1. **User subscribes**: User enters email on property detail page
2. **Subscription stored**: Email + propertyId saved in `property_price_alert` table
3. **Price change detected**: When property price is updated, `updateProperty` action detects the change
4. **Klaviyo event sent**: For each subscriber, a "Price Drop Alert" event is sent to Klaviyo
5. **Flow triggered**: Klaviyo flow sends personalized email with property details
6. **Unsubscribe**: User can unsubscribe via emailk heb link (property-specific) or all emails

### Internal API Secret

For security, the `/api/property-price-alerts/notify` endpoint requires an internal secret:

```env
INTERNAL_API_SECRET=your-secret-here
```

Generate with: `openssl rand -hex 32`

## Security Best Practices

⚠️ **IMPORTANT**: 
- Never expose the Private API Key in client-side code
- Never expose the INTERNAL_API_SECRET in client-side code
- Always use environment variables
- Add `.env.local` to `.gitignore`
- Store the Private API Key in your password manager
- Only use the Public Key in client-side code

## Resources

- [Klaviyo API Documentation](https://developers.klaviyo.com/)
- [Klaviyo Node.js SDK](https://github.com/klaviyo/klaviyo-api-node)
- [Account Dashboard](https://www.klaviyo.com/dashboard)
- [API Keys Settings](https://www.klaviyo.com/settings/account/api-keys)
- [Price Drop Alert Flow](https://www.klaviyo.com/flow/SPVFQ3/edit)
