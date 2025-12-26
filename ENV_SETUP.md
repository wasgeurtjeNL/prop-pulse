# 🔧 Environment Setup - BELANGRIJK!

## ⚠️ Auth werkt niet zonder environment variabelen!

### ✅ Stap 1: Maak `.env.local` bestand aan

Maak een nieuw bestand aan in de `prop-pulse` directory genaamd `.env.local` met de volgende inhoud:

```env
# Database
DATABASE_URL="postgresql://postgres@localhost:5433/real_estate_pulse"

# Better Auth - REQUIRED
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-super-secret-key-change-in-production-min-32-chars-long"

# Base URL (for emails and links)
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# =====================================
# 📧 SMTP Email Configuration (Optional)
# =====================================
# Without these settings, emails will be logged to console only
# 
# Common SMTP servers:
# - Gmail: smtp.gmail.com (port 587, use App Password)
# - Outlook: smtp.office365.com (port 587)
# - Yahoo: smtp.mail.yahoo.com (port 587)
# - Custom: your own SMTP server
#
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM_NAME="Real Estate Pulse"
SMTP_FROM_EMAIL="noreply@yoursite.com"

# ImageKit (Optional - voor image uploads)
# IMAGEKIT_PUBLIC_KEY=""
# IMAGEKIT_PRIVATE_KEY=""
# IMAGEKIT_URL_ENDPOINT=""

# =====================================
# 🤖 OpenAI API (voor SEO generatie)
# =====================================
# Krijg je API key op: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-your-openai-api-key-here"

# OAuth Providers (Optional - alleen voor social login)
# GOOGLE_CLIENT_ID=""
# GOOGLE_CLIENT_SECRET=""
# GITHUB_CLIENT_ID=""
# GITHUB_CLIENT_SECRET=""
```

### ⚡ Snelle Setup via Terminal

Of kopieer en plak dit in je terminal:

```powershell
@"
DATABASE_URL="postgresql://postgres@localhost:5433/real_estate_pulse"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-super-secret-key-change-in-production-min-32-chars-long"
"@ | Out-File -FilePath prop-pulse/.env.local -Encoding UTF8
```

### 🔄 Stap 2: Herstart Development Server

Nadat je `.env.local` hebt aangemaakt:

```bash
# Stop de server (Ctrl+C)
# Start opnieuw
npm run dev
```

### 📝 Stap 3: Test Sign-Up

1. Ga naar: http://localhost:3000/sign-up
2. Vul in:
   - Naam: Je naam
   - Email: test@example.com
   - Password: password123
3. Klik "Sign Up"
4. Je wordt automatisch ingelogd! ✅

---

## 🚨 Troubleshooting

### "Failed to fetch" of "Network error"
- Check of `.env.local` bestaat
- Check of `BETTER_AUTH_URL` en `NEXT_PUBLIC_BETTER_AUTH_URL` correct zijn
- Herstart dev server

### Database connectie error
- Check of PostgreSQL draait op port 5433
- Verificeer `DATABASE_URL` in `.env.local`
- Test met: `npx prisma studio`

### Sign-up button doet niets
- Open browser console (F12)
- Check voor errors
- Verifieer dat `/api/auth` endpoint werkt: http://localhost:3000/api/auth

---

**Status:** Environment setup is essentieel voor auth! 🔐

---

## 📧 SMTP Email Setup (voor notificaties)

### Gmail Setup (Aanbevolen voor testen)

1. **Enable 2-Factor Authentication** op je Google account
2. Ga naar: https://myaccount.google.com/apppasswords
3. Maak een nieuwe "App Password" aan voor "Mail"
4. Kopieer het 16-karakter wachtwoord (zonder spaties)
5. Gebruik dit in je `.env.local`:

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="jouw-email@gmail.com"
SMTP_PASSWORD="xxxx xxxx xxxx xxxx"
SMTP_FROM_NAME="Real Estate Pulse"
SMTP_FROM_EMAIL="jouw-email@gmail.com"
```

### Andere SMTP Providers

| Provider | Host | Port | Secure |
|----------|------|------|--------|
| Gmail | smtp.gmail.com | 587 | false |
| Outlook/Hotmail | smtp.office365.com | 587 | false |
| Yahoo | smtp.mail.yahoo.com | 587 | false |
| SendGrid | smtp.sendgrid.net | 587 | false |
| Mailgun | smtp.mailgun.org | 587 | false |

### Test SMTP Configuratie

Na het configureren, check de server logs. Als SMTP correct is geconfigureerd zie je:
```
✅ Email service initialized with SMTP
```

Als SMTP niet is geconfigureerd:
```
⚠️ SMTP not configured. Email notifications will be logged to console.
```

### Email Templates

Automatische emails worden verstuurd bij:
- ✉️ **Submission Received** - Na het indienen van een property
- ✉️ **Approved** - Wanneer admin goedkeurt (klant kan foto's uploaden)
- ✉️ **Info Requested** - Wanneer admin meer info vraagt
- ✉️ **Rejected** - Wanneer admin afwijst (met reden)
- ✉️ **Published** - Wanneer property live gaat

---

## 🤖 OpenAI API Setup (voor SEO generatie)

### Wat doet het?
De OpenAI integratie genereert automatisch:
- **SEO Titels** - Geoptimaliseerde titels (50-60 karakters)
- **Meta Descriptions** - Overtuigende beschrijvingen (145-155 karakters)

Dit is beschikbaar in het blog dashboard bij het aanmaken/bewerken van blogs.

### Setup

1. **Maak een OpenAI account** op https://platform.openai.com
2. **Genereer een API key** op https://platform.openai.com/api-keys
3. **Voeg toe aan `.env.local`**:

```env
OPENAI_API_KEY="sk-your-api-key-here"
```

### Kosten
- Model: `gpt-4o-mini`
- Kosten: ~$0.0001 per generatie (zeer goedkoop!)
- Ongeveer 10.000 generaties voor $1

### Troubleshooting

**"OpenAI API key not configured"**
- Voeg `OPENAI_API_KEY` toe aan `.env.local`
- Herstart de development server

**"Unauthorized" error**
- Controleer of je bent ingelogd in het dashboard
- SEO generatie werkt alleen voor ingelogde gebruikers

---

## 🔍 Perplexity API Setup (voor Smart Blog AI Research)

### Wat doet het?
De Perplexity integratie zorgt voor:
- **Live Web Research** - Actuele data en trends van het internet
- **Bronvermelding** - Automatische bronnen bij je blog content
- **Betere Kwaliteit** - Blogs met up-to-date informatie

> **Let op:** Perplexity is optioneel. Zonder Perplexity gebruikt Smart Blog AI de kennis van OpenAI (geen live research).

### Setup

1. **Maak een Perplexity account** op https://www.perplexity.ai
2. **Ga naar API Settings** op https://www.perplexity.ai/settings/api
3. **Genereer een API key**
4. **Voeg toe aan `.env.local`**:

```env
PERPLEXITY_API_KEY="pplx-your-api-key-here"
```

### Kosten
- Model: `sonar` (web search)
- Kosten: ~$0.005 per query (zeer betaalbaar!)
- Ongeveer 200 queries voor $1
- Gratis credits bij nieuwe accounts

### Wat als je geen Perplexity hebt?
Geen probleem! Smart Blog AI werkt ook zonder Perplexity:
- Gebruikt OpenAI's kennis (training data)
- Geen live web research
- Nog steeds professionele content

---

## 🗑️ Vercel Cache Management Setup

### Wat doet het?
De Vercel cache manager maakt het mogelijk om:
- **Cache legen** - Forceer content updates op de live site
- **Specifieke pagina's refreshen** - Update alleen wat nodig is
- **Edge cache purgen** - Clear Vercel's CDN cache

Dit is beschikbaar in het dashboard onder **Settings > Cache Beheer**.

### Setup

1. **Project ID ophalen:**
   - Ga naar https://vercel.com
   - Open je project > Settings
   - Kopieer het "Project ID"

2. **Team ID ophalen (voor team accounts):**
   - Ga naar Team Settings
   - Kopieer het "Team ID"

3. **API Token aanmaken:**
   - Ga naar https://vercel.com/account/tokens
   - Maak een nieuwe token aan met scope: je team
   - Kies een expiratie periode (1 jaar aanbevolen)

4. **Voeg toe aan `.env.local`:**

```env
# Vercel Cache Management
VERCEL_API_TOKEN="your-vercel-api-token"
VERCEL_PROJECT_ID="prj_your-project-id"
VERCEL_TEAM_ID="team_your-team-id"
```

### Gebruik
Na configuratie is de cache manager beschikbaar in:
- Dashboard > Settings > Cache Beheer

Je kunt dan:
- ✅ Alle cache legen met één klik
- ✅ Specifieke pagina's refreshen
- ✅ Cache tags invalideren
- ✅ Vercel Edge cache purgen

### Troubleshooting

**"Vercel API niet geconfigureerd"**
- Voeg alle drie de environment variables toe
- Herstart de development server

**"Cache operatie mislukt"**
- Controleer of je token de juiste scope heeft
- Controleer of de token niet is verlopen










