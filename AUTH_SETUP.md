# Authentication Setup Guide

## Overview
This application uses **Better Auth** for authentication with PostgreSQL database integration via Prisma.

## Environment Variables

Create a `.env` or `.env.local` file in the `prop-pulse` directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/realestatepulse"

# Better Auth
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="your-secret-key-here-change-in-production"

# OAuth Providers (Optional - only needed for social login)
# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
```

## Database Setup

1. Make sure your PostgreSQL database is running
2. Update the `DATABASE_URL` in your `.env` file
3. Run the Prisma migration:
   ```bash
   npx prisma migrate dev
   ```

## Features Implemented

### ✅ Email/Password Authentication
- **Sign Up**: `/sign-up` - Users can create new accounts with email and password
- **Sign In**: `/sign-in` - Users can sign in with their credentials
- **Database Integration**: All user data is stored in PostgreSQL via Prisma

### ✅ Social Authentication (Optional)
- **Google OAuth**: Sign in/up with Google account
- **GitHub OAuth**: Sign in/up with GitHub account

To enable social authentication:
1. Create OAuth apps in Google/GitHub developer consoles
2. Add the client IDs and secrets to your `.env` file
3. The social login buttons will automatically work

### ✅ Session Management
- Sessions are stored in the database
- Secure token-based authentication
- Auto-redirect to dashboard after successful login

### ✅ User Feedback
- Toast notifications for success/error states
- Form validation with real-time error messages
- Loading states during authentication

## API Routes

The authentication API is available at:
- `/api/auth/*` - All Better Auth endpoints

## Components Updated

1. **Sign In** (`components/new-design/auth/sign-in/index.tsx`)
   - Email/password login with database verification
   - Toast notifications
   - Redirects to `/dashboard` on success

2. **Sign Up** (`components/new-design/auth/sign-up/index.tsx`)
   - User registration with database storage
   - Toast notifications
   - Redirects to `/dashboard` on success

3. **Social Auth** (`components/new-design/auth/SocialSignIn.tsx` & `SocialSignUp.tsx`)
   - Google and GitHub OAuth integration
   - Conditional rendering based on provider configuration

## Testing

### Test Email/Password Authentication:
1. Navigate to `/sign-up`
2. Create a new account with:
   - Name: Your name
   - Email: test@example.com
   - Password: (minimum 8 characters)
3. Sign in at `/sign-in` with the same credentials

### Check Database:
```bash
npx prisma studio
```
This opens Prisma Studio where you can view users, sessions, and accounts in your database.

## Security Notes

- Passwords are hashed before storage (handled by Better Auth)
- Sessions use secure tokens
- Email verification can be enabled in `lib/auth.ts`
- In production, always use HTTPS and strong secrets

## Troubleshooting

### "Connection error" or "Database error"
- Check your `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run `npx prisma migrate dev`

### "Invalid credentials"
- Make sure the user exists in the database
- Check password meets validation requirements
- Clear browser cache and try again

### Social login not working
- Verify OAuth credentials in `.env`
- Check redirect URIs in OAuth app settings
- Social providers must be enabled in `lib/auth.ts`














