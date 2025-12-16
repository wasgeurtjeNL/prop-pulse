/**
 * Property Submission API
 * 
 * Developer: Jack Wullems
 * Contact: jackwullems18@gmail.com
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email";
import { submissionReceivedTemplate, newSubmissionAdminTemplate } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headersList = await headers();

    // Validate required fields
    const requiredFields = [
      "propertyTitle",
      "propertyCategory",
      "propertyType",
      "location",
      "askingPrice",
      "beds",
      "baths",
      "sqft",
      "description",
      "ownerName",
      "ownerEmail",
      "ownerPhone",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create the submission
    const submission = await prisma.propertySubmission.create({
      data: {
        // Owner Information
        ownerName: body.ownerName,
        ownerEmail: body.ownerEmail,
        ownerPhone: body.ownerPhone,
        ownerCountryCode: body.ownerCountryCode || "+66",

        // Property Details
        propertyTitle: body.propertyTitle,
        propertyCategory: body.propertyCategory,
        propertyType: body.propertyType,
        location: body.location,
        askingPrice: body.askingPrice,
        beds: parseInt(body.beds),
        baths: parseFloat(body.baths),
        sqft: parseInt(body.sqft),
        description: body.description,

        // Images (empty for initial submission - added after approval)
        images: [],

        // Listing Agreement
        exclusiveRights: body.exclusiveRights || false,
        commissionRate: body.commissionRate || (body.exclusiveRights ? 15 : 3),
        agreementAccepted: body.agreementAccepted || false,

        // Metadata
        ipAddress: headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || null,
        userAgent: headersList.get("user-agent") || null,
        source: body.source || "website",
      },
    });

    // Send confirmation email to property owner
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const trackingUrl = `${baseUrl}/my-submission/${submission.accessToken}`;
    
    const emailTemplate = submissionReceivedTemplate({
      ownerName: submission.ownerName,
      ownerEmail: submission.ownerEmail,
      propertyTitle: submission.propertyTitle,
      trackingUrl,
    });
    
    await sendEmail({
      to: submission.ownerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
    });

    // Send admin notification if configured
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "default" },
      });

      if (settings?.adminNotifyEmail && settings?.notifyOnSubmission) {
        const adminTemplate = newSubmissionAdminTemplate({
          ownerName: submission.ownerName,
          ownerEmail: submission.ownerEmail,
          propertyTitle: submission.propertyTitle,
          trackingUrl,
          adminEmail: settings.adminNotifyEmail,
          propertyCategory: submission.propertyCategory,
          propertyType: submission.propertyType,
          location: submission.location,
          askingPrice: submission.askingPrice,
          exclusiveRights: submission.exclusiveRights,
        });

        await sendEmail({
          to: settings.adminNotifyEmail,
          subject: adminTemplate.subject,
          html: adminTemplate.html,
        });
      }
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
      // Don't fail the submission if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Property submission received successfully",
      submissionId: submission.id,
      accessToken: submission.accessToken,
    });
  } catch (error) {
    console.error("Error creating property submission:", error);
    return NextResponse.json(
      { error: "Failed to submit property" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  // This endpoint could be used by admin to list submissions
  // For now, just return unauthorized
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}

