/**
 * Authentication Configuration
 * 
 * @developer Jack Wullems
 * @contact jackwullems18@gmail.com
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import prisma from "./prisma";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "https://prop-pulse-nine.vercel.app",
    "https://prop-pulse.vercel.app",
    "https://prop-pulse-wasgeurtjes-projects.vercel.app",
    // Allow all Vercel preview deployments
    /^https:\/\/prop-pulse-.*\.vercel\.app$/,
  ],
  advanced: {
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === "production",
    // Cookie configuration for cross-origin requests
    cookies: {
      session_token: {
        name: "better-auth.session_token",
        options: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
          secure: process.env.NODE_ENV === "production",
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true, // Auto sign in after successful authentication
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET,
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [admin()],
  user: {
    // Add additional user fields
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "AGENT", // Default role for new users!
        required: false,
      },
    },
  },
});
