# WhatsApp Property Listing Bot

Een intelligente WhatsApp-gebaseerde tool voor het maken van property listings via chat.

## 🎯 Overzicht

Deze tool maakt het mogelijk om property listings te maken via WhatsApp met de volgende workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    WhatsApp Bot Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User: "Toast 1" (start listing)                               │
│          ↓                                                      │
│  Bot: "Upload je foto's (minimaal 8)"                          │
│          ↓                                                      │
│  [Foto 1-8 ontvangen] → ImageKit upload                        │
│          ↓                                                      │
│  Bot: "Wil je meer foto's toevoegen? (ja/3=klaar)"            │
│          ↓                                                      │
│  User: "3" (klaar)                                             │
│          ↓                                                      │
│  Bot: "Deel nu je locatie"                                     │
│          ↓                                                      │
│  [GPS ontvangen] → Reverse Geocoding → POI Berekening          │
│          ↓                                                      │
│  [AI Vision scant foto's] → Features detectie                  │
│          ↓                                                      │
│  [POI Description Generator] → Content maken                   │
│          ↓                                                      │
│  Property aangemaakt! 🎉                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Installatie & Setup

### 1. Meta Business Account Setup

1. Ga naar [Meta Business Suite](https://business.facebook.com)
2. Maak een business account aan (indien nog niet aanwezig)
3. Ga naar [Meta for Developers](https://developers.facebook.com)
4. Maak een nieuwe app aan met "WhatsApp" product

### 2. WhatsApp Business Platform Configuratie

1. In je Meta Developer dashboard, ga naar "WhatsApp" → "Getting Started"
2. Kopieer je **Phone Number ID** en **Access Token**
3. Voor productie: genereer een permanent access token

### 3. Environment Variabelen

Voeg de volgende variabelen toe aan je `.env` bestand:

```env
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token_here

# Bestaande configuratie (reeds aanwezig)
OPENAI_API_KEY=your_openai_key
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
```

### 4. Webhook Configuratie

In je Meta Developer Dashboard:

1. Ga naar "WhatsApp" → "Configuration"
2. Stel de Webhook URL in: `https://yourdomain.com/api/whatsapp/webhook`
3. Voer je `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in
4. Abonneer op de "messages" webhook field

### 5. Database Migratie

Run de database migratie:

```bash
# Pas de migratie toe
npx prisma db push

# Of als je migraties gebruikt:
npx prisma migrate dev --name add_whatsapp_sessions
```

## 📱 Gebruiker Commando's

| Commando | Actie |
|----------|-------|
| `Toast 1` / `Start` | Begin nieuwe listing |
| `3` | Update owner/agent details |
| `4` | Search owner/agency |
| `5` | Update property photos |
| `Done` / `Klaar` | Klaar met foto's uploaden |
| `Ja` / `Yes` / `More` | Meer foto's toevoegen |
| `Bevestig` / `Confirm` | Publiceer listing |
| `Cancel` / `Annuleer` | Annuleer huidige sessie |
| `Menu` | Terug naar hoofdmenu |
| `Status` | Bekijk voortgang |
| `Help` / `?` | Toon beschikbare commando's |

## 🔧 API Endpoints

### Webhook Endpoints

```
GET  /api/whatsapp/webhook    - Webhook verificatie (Meta)
POST /api/whatsapp/webhook    - Inkomende berichten handler
```

### Admin Endpoints

```
GET    /api/whatsapp/sessions      - Lijst alle sessies
DELETE /api/whatsapp/sessions      - Cleanup verlopen sessies
GET    /api/whatsapp/sessions/[id] - Sessie details
DELETE /api/whatsapp/sessions/[id] - Annuleer sessie
```

## 🤖 AI Features

### GPT-4o Vision Image Analyse

De bot analyseert foto's automatisch om te detecteren:
- Property type (villa, appartement, huis)
- Aantal slaap- en badkamers
- Amenities (zwembad, garage, tuin, etc.)
- Stijl (modern, traditioneel, tropisch)
- Staat (nieuw, uitstekend, goed)

### POI-Gebaseerde Content Generatie

Op basis van de locatie:
- Berekent scores voor strand, familie, gemak, rust
- Haalt nabijgelegen POIs op (stranden, scholen, ziekenhuizen, winkels)
- Genereert professionele beschrijvingen met exacte afstanden

### SEO-Optimized Alt Text Generatie

Bij het uploaden van foto's (zowel nieuwe listings als updates) worden automatisch SEO-geoptimaliseerde alt teksten gegenereerd op basis van:
- Positie in de galerij (hero shot, living room, kitchen, etc.)
- Property details (type, locatie, aantal kamers)
- Amenities (pool, sea view, garden)
- Listing type (for sale / for rent)

Voorbeeld alt teksten per positie:
| Positie | Alt Tekst |
|---------|-----------|
| 1 | "Villa Sunset - 3 bedroom luxury villa with private pool in Rawai" |
| 2 | "Spacious living room in Villa Sunset, modern luxury villa in Rawai" |
| 3 | "Open plan living with stunning views in 3 bed luxury villa, Rawai" |
| 4 | "Fully equipped modern kitchen in Villa Sunset, Rawai" |
| 5 | "Dining area in 3 bedroom luxury villa for sale in Rawai" |
| 6 | "Comfortable master bedroom in Villa Sunset, Rawai" |
| 7 | "Guest bedroom in 3 bed luxury villa, Rawai" |
| 8 | "Stylish bathroom in 3 bed luxury villa in Rawai" |
| 9 | "Private swimming pool at Villa Sunset, Rawai" |
| 10 | "Panoramic sea view from Villa Sunset in Rawai" |

## 📸 Photo Update Flow

De bot ondersteunt het bijwerken van foto's voor bestaande properties via het commando **"5"**:

### Beschikbare Acties

| Actie | Beschrijving |
|-------|--------------|
| **Toevoegen** | Voeg nieuwe foto's toe aan de galerij |
| **Vervangen** | Vervang een specifieke foto op een positie |
| **Verwijderen** | Verwijder een foto (minimaal 1 foto moet blijven) |

### Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  User: "5"                                                       │
│          ↓                                                       │
│  Bot: Toont 5 recente properties met foto-telling               │
│          ↓                                                       │
│  User: Selecteert property (nummer of PP-XXXX)                  │
│          ↓                                                       │
│  Bot: Bevestigt property en toont huidige foto's                │
│          ↓                                                       │
│  User: Kiest actie (1=Toevoegen, 2=Vervangen, 3=Verwijderen)   │
│          ↓                                                       │
│  [Actie uitvoeren]                                               │
│       → Upload nieuwe foto naar ImageKit                         │
│       → Genereer SEO alt tekst                                   │
│       → Update PropertyImage in database                         │
│          ↓                                                       │
│  Bot: "✅ Foto's bijgewerkt!"                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Technische Details

- **Upload**: Foto's worden via Twilio ontvangen en naar ImageKit geüpload
- **Compressie**: ImageKit optimaliseert automatisch (WebP/AVIF) bij delivery
- **Alt Tekst**: Automatisch gegenereerd op basis van positie en property data
- **Main Image**: Bij vervangen van positie 1 wordt ook de main property image bijgewerkt

## 📊 Sessie Status Flow

### Nieuwe Listing Flow
```
AWAITING_LISTING_TYPE (Koop of Huur?)
     ↓
AWAITING_PROPERTY_TYPE (Villa, Condo, etc.)
     ↓
AWAITING_OWNERSHIP (alleen bij koop: Freehold/Leasehold)
     ↓
AWAITING_PHOTOS
     ↓
COLLECTING_PHOTOS (< 8 foto's)
     ↓
AWAITING_MORE_PHOTOS (≥ 8 foto's, vraag om meer)
     ↓
AWAITING_LOCATION
     ↓
AWAITING_PRICE / AWAITING_BEDROOMS / AWAITING_BATHROOMS
     ↓
PROCESSING (AI analyse)
     ↓
AWAITING_CONFIRMATION
     ↓
COMPLETED / CANCELLED / ERROR
```

### Owner Update Flow (Commando: 3)
```
OWNER_UPDATE_SELECT_PROPERTY (Selecteer property)
     ↓
OWNER_UPDATE_CONFIRM_PROPERTY (Bevestig selectie)
     ↓
OWNER_UPDATE_NAME → OWNER_UPDATE_PHONE → OWNER_UPDATE_COMPANY → OWNER_UPDATE_COMMISSION
     ↓
COMPLETED
```

### Photo Update Flow (Commando: 5)
```
UPDATE_PHOTOS_SELECT_PROPERTY (Selecteer property)
     ↓
UPDATE_PHOTOS_VIEW_CURRENT (Bekijk huidige foto's)
     ↓
UPDATE_PHOTOS_SELECT_ACTION (Toevoegen / Vervangen / Verwijderen)
     ↓
UPDATE_PHOTOS_COLLECTING (Foto's ontvangen)
  of UPDATE_PHOTOS_REPLACE_SELECT (Selecteer positie)
     ↓
COMPLETED
```

### Search Owner Flow (Commando: 4)
```
SEARCH_OWNER_QUERY (Voer zoekopdracht in)
     ↓
SEARCH_OWNER_RESULTS (Bekijk resultaten met paginering)
```

## 🗄️ Database Schema

```sql
CREATE TABLE whatsapp_listing_session (
  id TEXT PRIMARY KEY,
  phone_number TEXT NOT NULL,
  whatsapp_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  images TEXT[],
  image_count INTEGER,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location_name TEXT,
  address TEXT,
  district TEXT,
  detected_features JSONB,
  generated_title TEXT,
  generated_description TEXT,
  generated_content_html TEXT,
  suggested_price TEXT,
  poi_scores JSONB,
  property_id TEXT,
  initiated_by TEXT,
  initiated_by_name TEXT,
  error_message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP
);
```

## 🔒 Beveiliging

- Sessies verlopen automatisch na 24 uur
- Webhook verificatie via token
- Telefoon- en WhatsApp ID validatie
- Rate limiting door Meta's platform

## 📁 Bestandsstructuur

```
lib/whatsapp/
├── index.ts           # Hoofd exports
├── types.ts           # TypeScript types & constants
├── session-manager.ts # Sessie CRUD operaties
├── message-handler.ts # Bericht verwerking logica
├── image-analyzer.ts  # GPT-4o Vision analyse
├── content-generator.ts # POI & content generatie
└── api-client.ts      # WhatsApp Cloud API client

app/api/whatsapp/
├── webhook/
│   └── route.ts       # Inkomende berichten webhook
└── sessions/
    ├── route.ts       # Sessie lijst & cleanup
    └── [id]/
        └── route.ts   # Sessie details
```

## 🧪 Testing

### Lokale ontwikkeling met ngrok

```bash
# Start je dev server
npm run dev

# In een andere terminal, start ngrok
ngrok http 3000

# Gebruik de ngrok URL als webhook in Meta Dashboard
# https://xxxx.ngrok.io/api/whatsapp/webhook
```

### Test het handmatig

1. Stuur "Toast 1" naar je WhatsApp Business nummer
2. Upload 8+ foto's van een property
3. Deel een locatie via WhatsApp
4. Bevestig de listing met "Bevestig"

## 🐛 Troubleshooting

### Webhook niet ontvangen
- Controleer of de webhook URL correct is geconfigureerd
- Verifieer dat de verify token overeenkomt
- Check de Meta Developer Dashboard voor fouten

### Foto's worden niet verwerkt
- Controleer ImageKit credentials
- Verifieer WhatsApp access token
- Check server logs voor fouten

### AI analyse faalt
- Controleer OpenAI API key
- Verifieer dat de afbeeldingen toegankelijk zijn
- Check API rate limits

## 📈 Monitoring

### Sessie statistieken ophalen

```bash
curl https://yourdomain.com/api/whatsapp/sessions
```

### Verlopen sessies opruimen

```bash
curl -X DELETE https://yourdomain.com/api/whatsapp/sessions
```

## 🔄 Hergebruikte Services

Deze integratie maakt gebruik van bestaande project services:

| Service | Locatie | Gebruik |
|---------|---------|---------|
| ImageKit | `lib/imagekit.ts` | Foto uploads |
| Geocoding | `lib/services/poi/geocoding.ts` | Locatie naar adres |
| POI Sync | `lib/services/poi/sync.ts` | POI scores |
| Property Import | `app/api/properties/import/route.ts` | Property aanmaken |

---

**Developer:** Jack Wullems  
**Contact:** jackwullems18@gmail.com

