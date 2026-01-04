# 🗄️ Database Upgrade Plan - Property Schema Enhancement

**Datum:** December 6, 2025  
**Doel:** Database aanpassen zodat frontend en backend perfect communiceren

---

## ✅ STAP 1: SCHEMA WIJZIGINGEN (VOLTOOID)

### Nieuwe Velden Toegevoegd

#### **1. Property Categorisatie**
```prisma
category    PropertyCategory  @default(RESIDENTIAL_HOME)
```
**Waarom:** Frontend filtert properties op category (luxury-villa, apartment, etc.)

**Nieuw Enum:**
```prisma
enum PropertyCategory {
  LUXURY_VILLA
  APARTMENT  
  RESIDENTIAL_HOME
  OFFICE_SPACES
}
```

#### **2. Images Array - CRUCIAAL! 📸**
```prisma
images      PropertyImage[]   // Relatie naar image model
```

**Nieuw Model:**
```prisma
model PropertyImage {
  id          String   @id @default(cuid())
  propertyId  String
  url         String
  position    Int      // 1=hero, 2=top-right, 3=bottom-left, 4=bottom-right
  alt         String?
}
```

**Layout Posities:**
- Positie 1: Grote hero image (links, 8 kolommen breed, 540px hoog)
- Positie 2: Top rechts (4 kolommen breed, 335px hoog)
- Positie 3: Onder rechts links (2 kolommen breed, 155px hoog)
- Positie 4: Onder rechts rechts (2 kolommen breed, 155px hoog)

#### **3. Content Structuur**
```prisma
shortDescription       String?  @db.Text
descriptionParagraphs  Json?    // Array van 4+ paragrafen
```

**JSON Voorbeeld:**
```json
[
  "Nestled in the heart of miami...",
  "Step inside to discover...",
  "The primary suite serves...",
  "Outdoor living is equally impressive..."
]
```

#### **4. Property Features/Highlights**
```prisma
propertyFeatures  Json?  // Array of {title, description, icon}
```

**JSON Voorbeeld:**
```json
[
  {
    "title": "Property details",
    "description": "One of the few homes in the area with a private pool.",
    "icon": "property-details"
  },
  {
    "title": "Smart home access",
    "description": "Easily check yourself in with a modern keypad system.",
    "icon": "smart-home-access"
  },
  {
    "title": "Energy efficient",
    "description": "Built in 2025 with sustainable and smart-home features.",
    "icon": "energyefficient"
  }
]
```

#### **5. Amenities met Icons**
```prisma
amenitiesWithIcons Json?  // Array of {name, icon}
```

**JSON Voorbeeld:**
```json
[
  {
    "name": "Smart Home Integration",
    "icon": "ph:aperture"
  },
  {
    "name": "Spacious Living Areas",
    "icon": "ph:chart-pie-slice"
  },
  {
    "name": "Energy Efficiency",
    "icon": "ph:television-simple"
  }
]
```

#### **6. Extra Metadata**
```prisma
yearBuilt   Int?       // Bouwjaar (bijv. 2025)
mapUrl      String?    // Google Maps embed URL
```

### Backward Compatibility ✅

**Behouden voor compatibiliteit:**
- `image` (String) - Hoofdfoto blijft bestaan
- `content` (String) - Oude content veld blijft
- `amenities` (String[]) - Oude amenities array blijft

**Strategie:** Nieuwe velden zijn optioneel (nullable), bestaande data blijft werken!

---

## 📊 VOOR & NA VERGELIJKING

### VOOR (Oude Schema)
```
Property {
  title, slug, location, price
  beds, baths, sqft, type
  tag, image (single!)
  content (1 tekstveld)
  amenities (alleen namen)
}
```

### NA (Nieuwe Schema)
```
Property {
  // Basis (ongewijzigd)
  title, slug, location, price
  beds, baths, sqft, type
  
  // NIEUW
  category (LUXURY_VILLA/APARTMENT/etc)
  images[] (4 posities voor gallery)
  shortDescription
  descriptionParagraphs (JSON array)
  propertyFeatures (JSON array)
  amenitiesWithIcons (JSON array)
  yearBuilt, mapUrl
  
  // Backward compatibility
  tag, image, content, amenities
}

PropertyImage {
  url, position (1-4)
}
```

---

## 🎯 MAPPING: Database → Frontend

| Database Veld | Frontend Veld | Type | Gebruik |
|---------------|---------------|------|---------|
| `title` | `name` | String | Property naam |
| `slug` | `slug` | String | URL |
| `category` | `category` | Enum | Filtering |
| `price` | `rate` | String | Prijs display |
| `sqft` | `area` | Int | Oppervlakte |
| `images[].url` | `images[].src` | Array | Gallery (4 posities) |
| `descriptionParagraphs` | 4x `<p>` tags | JSON | Detail pagina content |
| `propertyFeatures` | Property details sectie | JSON | 3 highlights |
| `amenitiesWithIcons` | "What this property offers" | JSON | Grid met icons |

---

## ⚠️ BELANGRIJK - Data Migratie

### Bestaande Properties
Wanneer je de migratie uitvoert:

1. ✅ Alle bestaande velden blijven intact
2. ✅ Nieuwe velden krijgen default waarden of NULL
3. ⚠️ `category` wordt `RESIDENTIAL_HOME` (default)
4. ⚠️ Bestaande `image` blijft, maar `images[]` is leeg (moet handmatig gevuld)

### Data Transformatie Nodig
Na migratie moet je voor bestaande properties:
1. Category handmatig instellen (of via script)
2. Images uploaden voor posities 1-4
3. Content splitsen in paragrafen
4. Property features toevoegen
5. Amenities icons toewijzen

---

## 🚀 VOLGENDE STAPPEN

- [x] **Stap 1:** Schema updaten ✅
- [ ] **Stap 2:** Migratie uitvoeren
- [ ] **Stap 3:** Adapter/Transformer maken
- [ ] **Stap 4:** API routes updaten
- [ ] **Stap 5:** Property actions aanpassen
- [ ] **Stap 6:** Dashboard forms uitbreiden

---

## 📝 NOTES

- JSON velden zijn flexibel en makkelijk uit te breiden
- PropertyImage model maakt het makkelijk om later meer posities toe te voegen
- Alle oude functionaliteit blijft werken tijdens transitie
- Frontend krijgt exact de data structuur die verwacht wordt

**Status:** Schema gereed voor migratie! 🎉














