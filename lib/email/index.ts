/**
 * Email Service with Custom SMTP Support
 * 
 * This service reads SMTP configuration from the database (SiteSettings)
 * and falls back to environment variables if not configured.
 * 
 * Developer: Jack Wullems
 * Contact: jackwullems18@gmail.com
 */

import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromEmail: string;
}

// Get SMTP config from database or environment
async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    // Try to get settings from database
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (settings?.smtpHost && settings?.smtpUser && settings?.smtpPassword) {
      return {
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpSecure,
        user: settings.smtpUser,
        password: settings.smtpPassword,
        fromName: settings.smtpFromName || "Real Estate Pulse",
        fromEmail: settings.smtpFromEmail || settings.smtpUser,
      };
    }
  } catch (error) {
    console.log("Database not available, falling back to env variables");
  }

  // Fallback to environment variables
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;

  if (host && user && password) {
    return {
      host,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      user,
      password,
      fromName: process.env.SMTP_FROM_NAME || "Real Estate Pulse",
      fromEmail: process.env.SMTP_FROM_EMAIL || user,
    };
  }

  return null;
}

// Create a transporter with the given config
function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });
}

// Strip HTML tags for plain text version
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

// Main email sending function
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options;

  const config = await getSmtpConfig();

  // If SMTP is not configured, log the email to console
  if (!config) {
    console.log("📧 Email (SMTP not configured - logging only):");
    console.log(`   To: ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Content preview: ${text?.substring(0, 100) || html.substring(0, 100)}...`);
    return true; // Return true so the flow continues
  }

  try {
    const transporter = createTransporter(config);
    
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return false;
  }
}

// Legacy export for backward compatibility
export const emailService = {
  send: sendEmail,
};

// Export types for use in templates
export type { SendEmailOptions };
