/**
 * Site Settings API
 * 
 * Developer: Jack Wullems
 * Contact: jackwullems18@gmail.com
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET - Retrieve settings
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const allowedRoles = ["AGENT", "ADMIN"];
  if (!session || !allowedRoles.includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get or create default settings
    let settings = await prisma.siteSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: "default" },
      });
    }

    // Don't send the password back to the client (security)
    const safeSettings = {
      ...settings,
      smtpPassword: settings.smtpPassword ? "••••••••" : null,
      hasSmtpPassword: !!settings.smtpPassword,
    };

    return NextResponse.json({ settings: safeSettings });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

// PATCH - Update settings
export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const allowedRoles = ["AGENT", "ADMIN"];
  if (!session || !allowedRoles.includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Build update data, only include fields that were provided
    const updateData: Record<string, unknown> = {};
    
    // SMTP fields
    if (body.smtpHost !== undefined) updateData.smtpHost = body.smtpHost || null;
    if (body.smtpPort !== undefined) updateData.smtpPort = body.smtpPort ? parseInt(body.smtpPort) : null;
    if (body.smtpSecure !== undefined) updateData.smtpSecure = body.smtpSecure;
    if (body.smtpUser !== undefined) updateData.smtpUser = body.smtpUser || null;
    if (body.smtpFromName !== undefined) updateData.smtpFromName = body.smtpFromName || null;
    if (body.smtpFromEmail !== undefined) updateData.smtpFromEmail = body.smtpFromEmail || null;
    
    // Only update password if a new one was provided (not the masked version)
    if (body.smtpPassword && body.smtpPassword !== "••••••••") {
      updateData.smtpPassword = body.smtpPassword;
    }
    
    // General settings
    if (body.siteName !== undefined) updateData.siteName = body.siteName || null;
    if (body.siteEmail !== undefined) updateData.siteEmail = body.siteEmail || null;
    
    // Notification settings
    if (body.adminNotifyEmail !== undefined) updateData.adminNotifyEmail = body.adminNotifyEmail || null;
    if (body.notifyOnSubmission !== undefined) updateData.notifyOnSubmission = body.notifyOnSubmission;
    if (body.notifyOnImageUpload !== undefined) updateData.notifyOnImageUpload = body.notifyOnImageUpload;

    // AI Content Generation settings
    if (body.companyDescription !== undefined) updateData.companyDescription = body.companyDescription || null;
    if (body.companyTone !== undefined) updateData.companyTone = body.companyTone || null;
    if (body.companyUSPs !== undefined) updateData.companyUSPs = body.companyUSPs || null;
    if (body.targetAudience !== undefined) updateData.targetAudience = body.targetAudience || null;
    if (body.brandKeywords !== undefined) updateData.brandKeywords = body.brandKeywords || null;
    if (body.avoidTopics !== undefined) updateData.avoidTopics = body.avoidTopics || null;

    // Upsert settings (create if not exists, update if exists)
    const settings = await prisma.siteSettings.upsert({
      where: { id: "default" },
      update: updateData,
      create: {
        id: "default",
        ...updateData,
      },
    });

    // Don't send the password back
    const safeSettings = {
      ...settings,
      smtpPassword: settings.smtpPassword ? "••••••••" : null,
      hasSmtpPassword: !!settings.smtpPassword,
    };

    return NextResponse.json({ 
      success: true, 
      settings: safeSettings,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

// POST - Test SMTP connection
export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const allowedRoles = ["AGENT", "ADMIN"];
  if (!session || !allowedRoles.includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    if (body.action === "test-smtp") {
      // Import nodemailer dynamically for testing
      const nodemailer = await import("nodemailer");
      
      // Get current settings from database
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "default" },
      });

      if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPassword) {
        return NextResponse.json({ 
          success: false, 
          error: "SMTP is niet volledig geconfigureerd. Vul eerst alle velden in en sla op." 
        });
      }

      // Create test transporter
      const transporter = nodemailer.default.createTransport({
        host: settings.smtpHost,
        port: settings.smtpPort || 587,
        secure: settings.smtpSecure,
        auth: {
          user: settings.smtpUser,
          pass: settings.smtpPassword,
        },
      });

      // Verify connection
      await transporter.verify();

      // Optionally send a test email
      if (body.testEmail) {
        await transporter.sendMail({
          from: `"${settings.smtpFromName || 'Real Estate Pulse'}" <${settings.smtpFromEmail || settings.smtpUser}>`,
          to: body.testEmail,
          subject: "🧪 Test Email - SMTP Configuratie Werkt!",
          html: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #004aac;">✅ SMTP Test Succesvol!</h2>
              <p>Dit is een test email om te bevestigen dat je SMTP configuratie correct werkt.</p>
              <p><strong>Verzonden vanaf:</strong> ${settings.smtpFromEmail || settings.smtpUser}</p>
              <p><strong>Server:</strong> ${settings.smtpHost}:${settings.smtpPort}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #666; font-size: 14px;">Real Estate Pulse</p>
            </div>
          `,
        });
        
        return NextResponse.json({ 
          success: true, 
          message: `SMTP werkt! Test email verzonden naar ${body.testEmail}` 
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: "SMTP verbinding succesvol!" 
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("SMTP test error:", error);
    return NextResponse.json({ 
      success: false, 
      error: `SMTP test mislukt: ${error instanceof Error ? error.message : 'Onbekende fout'}` 
    });
  }
}


