# Property Scraper Tool

Een slim Python script dat property listings scraped van externe websites en deze automatisch importeert in PropPulse.

## 📋 Vereisten

- Python 3.10+
- OpenAI API key (in `.env` bestand in project root)

## 🚀 Installatie

```bash
cd tools
pip install -r requirements.txt
```

Zorg dat je `.env` bestand in de project root een `OPENAI_API_KEY` heeft:
```
OPENAI_API_KEY=sk-...
```

## 📖 Gebruik

### Preview Mode (aanbevolen om eerst te testen)
```bash
python scrape_property.py "https://example.com/property/villa" --preview
```
Dit scraped de website, extraheert data met AI, en slaat het op als JSON bestand in `tools/output/`.

### Direct Importeren
```bash
python scrape_property.py "https://example.com/property/villa" --import
```
Dit scraped én importeert de property direct in de database.

### Importeren vanuit een JSON bestand
```bash
python scrape_property.py "output/property_data.json" --import
```
Handig als je eerst de JSON wilt reviewen/aanpassen voordat je importeert.

## 🔧 Wat het script doet

1. **Scrapen** - Haalt HTML content op van de URL
2. **AI Extractie** - Gebruikt GPT-4o om structured data te extraheren:
   - Titel, locatie, prijs
   - Bedrooms, bathrooms, sqft
   - Type (FOR_SALE / FOR_RENT)
   - Category (LUXURY_VILLA, APARTMENT, etc.)
   - Amenities met icons
   - Alle afbeeldingen
3. **Validatie** - Checkt of alle vereiste velden aanwezig zijn
4. **Import** - Stuurt data naar de API route die:
   - Afbeeldingen download en uploadt naar ImageKit
   - Property aanmaakt in de database
   - Alle gallery images koppelt

## 📁 Output

Gescrapedte data wordt opgeslagen in `tools/output/` met timestamp:
```
output/
  property_villa-name_20251215_124800.json
```

## 🔒 API Beveiliging

Voor productie, voeg een API key toe aan `.env`:
```
PROPPULSE_IMPORT_API_KEY=je-geheime-api-key
```

In development mode werkt de API ook zonder key.

## 💡 Tips

1. **Test eerst met --preview** om de geëxtraheerde data te bekijken
2. **QR codes worden automatisch gefilterd** uit de afbeeldingen
3. **Retries zijn ingebouwd** voor instabiele connecties
4. **Edit de JSON** als je handmatige aanpassingen wilt maken voordat je importeert

## 🛠 Troubleshooting

### "Connection reset" errors
De externe website kan rate-limiting hebben. Wacht even en probeer opnieuw.

### "No admin user found"
Je moet eerst een admin user aanmaken in de database.

### Images worden niet geüpload
Check of je ImageKit credentials correct zijn in `.env`.


