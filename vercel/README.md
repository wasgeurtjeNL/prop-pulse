# Vercel CLI Deployment

Deploy naar Vercel zonder GitHub - direct vanuit je lokale machine.

## Setup (eenmalig)

```bash
# Installeer Vercel CLI globaal
npm i -g vercel

# Login bij Vercel
vercel login
```

## Deployen

```bash
# Preview deployment (voor testen)
vercel

# Production deployment
vercel --prod
```

## Belangrijke flags

| Flag | Beschrijving |
|------|-------------|
| `--prod` | Deploy naar production |
| `--yes` | Skip alle prompts |
| `--force` | Forceer nieuwe build |

## Snelle commando's

```bash
# Preview deploy zonder prompts
vercel --yes

# Direct naar production zonder prompts
vercel --prod --yes

# Forceer nieuwe production build
vercel --prod --force
```

## Environment Variables

Env vars worden beheerd via Vercel dashboard of:

```bash
# Toevoegen
vercel env add VARIABLE_NAME

# Lijst bekijken
vercel env ls

# Pull naar lokaal .env
vercel env pull
```
