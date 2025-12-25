# TM30 Property Owner System

Dit document beschrijft het Property Owner systeem dat wordt gebruikt voor TM30 accommodatie registratie.

## 📋 Overzicht

Het systeem koppelt eigenaren aan hun documenten en woningen zodat:
- **1 ID kaart per eigenaar** - eenmalig uploaden, hergebruiken voor alle woningen
- **1 Bluebook per woning** - elke woning heeft eigen Tabienbaan
- **Automatische herkenning** - via WhatsApp telefoonnummer

## 🗄️ Database Structuur

### PropertyOwner Tabel
```
property_owner
├── id                    (cuid)
├── first_name            (text) - Uit ID kaart OCR
├── last_name             (text) - Uit ID kaart OCR
├── thai_id_number        (text, unique) - Uit ID kaart OCR
├── phone                 (text, unique) - WhatsApp nummer
├── email                 (text, optional)
├── gender                (text)
├── id_card_url           (text) - ImageKit URL
├── id_card_path          (text) - "owners/{id}/id-card.jpg"
├── id_card_ocr_data      (jsonb)
├── id_card_verified      (boolean)
├── is_verified           (boolean) - Admin verificatie
└── created_at/updated_at
```

### OwnerDocument Tabel
```
owner_document
├── id                    (cuid)
├── owner_id              (text) - FK naar property_owner
├── document_type         (enum: ID_CARD, BLUEBOOK, PASSPORT, OTHER)
├── image_url             (text)
├── image_path            (text) - "owners/{ownerId}/bluebook-{propertyId}.jpg"
├── property_id           (text, unique) - Voor bluebook koppeling
├── house_id              (text) - "123/45" uit OCR
├── ocr_data              (jsonb)
├── is_verified           (boolean)
└── created_at/updated_at
```

## 📁 Bestandsnamen Structuur

```
ImageKit/owners/
├── {ownerId}/
│   ├── id-card.jpg                    # 1x per eigenaar
│   ├── bluebook-{propertyId1}.jpg     # Per woning
│   ├── bluebook-{propertyId2}.jpg
│   └── ...
```

### Voorbeeld
```
owners/
├── clmf7xyz123/
│   ├── id-card.jpg                    # Ruedeekorn's ID kaart
│   ├── bluebook-clprop123.jpg         # Villa Rawai bluebook
│   └── bluebook-clprop456.jpg         # Kata House bluebook
```

## 📱 WhatsApp Flow

### 1. Eigenaar Herkenning
```
User: "6" (TM30 Accommodation)
Bot: Checking phone number...

[Automatisch zoeken op telefoonnummer]

IF found:
  "✅ Welcome back {firstName}!
   You have {n} properties registered.
   
   📄 ID Card: ✅ On file
   
   Would you like to add a new property?"

ELSE:
  "👤 New owner registration
   Please send your Thai ID card photo"
```

### 2. Nieuwe Eigenaar
1. Upload ID kaart → OCR extract naam, Thai ID, geslacht
2. Bevestig gegevens
3. Opslaan in PropertyOwner

### 3. Nieuwe Woning Toevoegen
1. Check of eigenaar ID kaart heeft → Hergebruik
2. Vraag om Bluebook foto
3. OCR → Extract house ID, adres
4. Koppel aan eigenaar + property
5. Trigger GitHub Actions voor TM30

## 🔗 Koppelingen

```
PropertyOwner
    │
    ├─── OwnerDocument (ID_CARD) ──── 1 per eigenaar
    │
    ├─── OwnerDocument (BLUEBOOK) ─┬─ Per woning
    │                              └─ property_id verwijst naar Property
    │
    ├─── Property[] ─────────────────── Alle woningen
    │
    └─── Tm30AccommodationRequest[] ─── TM30 registraties
```

## 🌐 API Endpoints

### GET /api/owners
Lijst alle eigenaren met documenten en woningen.

Query parameters:
- `search` - Zoek op naam, telefoon, of Thai ID
- `phone` - Exacte telefoon lookup

### POST /api/owners
Maak nieuwe eigenaar.

Body:
```json
{
  "firstName": "Ruedeekorn",
  "lastName": "Chunkerd",
  "phone": "+66812345678",
  "thaiIdNumber": "1-1234-56789-01-2",
  "idCardUrl": "https://...",
  "idCardPath": "owners/xxx/id-card.jpg",
  "idCardOcrData": {...}
}
```

### GET /api/owners/{ownerId}
Detail van één eigenaar.

### PATCH /api/owners/{ownerId}
Update eigenaar.

### POST /api/owners/{ownerId}/documents
Voeg document toe aan eigenaar.

Body:
```json
{
  "documentType": "BLUEBOOK",
  "imageUrl": "https://...",
  "imagePath": "owners/xxx/bluebook-yyy.jpg",
  "propertyId": "clprop123",
  "houseId": "123/45",
  "ocrData": {...}
}
```

## 🖥️ Dashboard

### /dashboard/owners
Eigenaren beheer pagina met:
- Statistieken (totaal, geverifieerd, documenten, gekoppeld)
- Zoekfunctie
- Uitklapbare eigenaar kaarten
- Document previews
- Woningen overzicht

## 💡 Tips

1. **Telefoonnummer is key** - Gebruik voor herkenning
2. **Thai ID is backup** - Voor duplicate check
3. **OCR data bewaren** - Voor debugging en verificatie
4. **Bluebook koppelen aan property** - Via property_id in document

## 🔄 Toekomstige Uitbreidingen

- [ ] Bulk upload documenten
- [ ] Automatische TM30 koppeling suggesties
- [ ] Eigenaar verificatie workflow
- [ ] Document expiry alerts




