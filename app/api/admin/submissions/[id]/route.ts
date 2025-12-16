/**
 * Admin Submission Management API
 * 
 * Developer: Jack Wullems
 * Contact: jackwullems18@gmail.com
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { emailService } from "@/lib/email";
import {
  submissionApprovedTemplate,
  submissionRejectedTemplate,
  infoRequestedTemplate,
  propertyPublishedTemplate,
} from "@/lib/email/templates";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const allowedRoles = ["AGENT", "ADMIN"];
  if (!session || !allowedRoles.includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const submission = await prisma.propertySubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const allowedRoles = ["AGENT", "ADMIN"];
  if (!session || !allowedRoles.includes(session.user.role || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, reviewNotes } = body;

  try {
    const submission = await prisma.propertySubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    switch (action) {
      case "approve":
        updateData = {
          status: "APPROVED",
          reviewNotes: reviewNotes || null,
          reviewedBy: session.user.id,
          reviewedByName: session.user.name,
          reviewedAt: new Date(),
        };
        break;

      case "reject":
        updateData = {
          status: "REJECTED",
          reviewNotes: reviewNotes,
          reviewedBy: session.user.id,
          reviewedByName: session.user.name,
          reviewedAt: new Date(),
        };
        break;

      case "request_info":
        updateData = {
          status: "INFO_REQUESTED",
          reviewNotes: reviewNotes,
          reviewedBy: session.user.id,
          reviewedByName: session.user.name,
          reviewedAt: new Date(),
        };
        break;

      case "publish":
        // Create the actual property listing
        const newProperty = await prisma.property.create({
          data: {
            title: submission.propertyTitle,
            slug: generateSlug(submission.propertyTitle),
            location: submission.location,
            price: submission.askingPrice,
            beds: submission.beds,
            baths: submission.baths,
            sqft: submission.sqft,
            type: submission.propertyType as "FOR_SALE" | "FOR_RENT",
            category: submission.propertyCategory as "LUXURY_VILLA" | "APARTMENT" | "RESIDENTIAL_HOME" | "OFFICE_SPACES",
            tag: submission.exclusiveRights ? "Featured" : "",
            status: "ACTIVE",
            image: submission.images[0] || "",
            content: submission.description,
            shortDescription: submission.description.substring(0, 200),
            amenities: [],
            userId: session.user.id, // Assign to the admin who published it
          },
        });

        // Create property images
        if (submission.images.length > 0) {
          await prisma.propertyImage.createMany({
            data: submission.images.map((url, index) => ({
              propertyId: newProperty.id,
              url,
              position: index + 1,
              alt: `${submission.propertyTitle} - Image ${index + 1}`,
            })),
          });
        }

        updateData = {
          status: "PUBLISHED",
          publishedAt: new Date(),
          publishedBy: session.user.id,
          convertedPropertyId: newProperty.id,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const updatedSubmission = await prisma.propertySubmission.update({
      where: { id },
      data: updateData,
    });

    // Send email notification to property owner
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const trackingUrl = `${baseUrl}/my-submission/${submission.accessToken}`;
    
    const emailData = {
      ownerName: submission.ownerName,
      ownerEmail: submission.ownerEmail,
      propertyTitle: submission.propertyTitle,
      trackingUrl,
      reviewNotes: reviewNotes || null,
    };

    let emailTemplate;
    switch (action) {
      case "approve":
        emailTemplate = submissionApprovedTemplate(emailData);
        break;
      case "reject":
        emailTemplate = submissionRejectedTemplate(emailData);
        break;
      case "request_info":
        emailTemplate = infoRequestedTemplate(emailData);
        break;
      case "publish":
        // For publish, include the live property URL
        const propertySlug = (updateData as { convertedPropertyId?: string }).convertedPropertyId;
        const liveProperty = propertySlug ? await prisma.property.findUnique({
          where: { id: propertySlug },
          select: { slug: true },
        }) : null;
        
        emailTemplate = propertyPublishedTemplate({
          ...emailData,
          livePropertyUrl: liveProperty ? `${baseUrl}/properties/${liveProperty.slug}` : undefined,
        });
        break;
    }

    if (emailTemplate) {
      await emailService.send({
        to: submission.ownerEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
      });
    }

    return NextResponse.json({ 
      success: true, 
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    + "-" + Date.now().toString(36);
}

