/**
 * Property Submission Image Upload API
 * 
 * Developer: Jack Wullems
 * Contact: jackwullems18@gmail.com
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { imagekit } from "@/lib/imagekit";
import { sendEmail } from "@/lib/email";
import { imagesUploadedAdminTemplate } from "@/lib/email/templates";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const submissionId = formData.get("submissionId") as string;
    const accessToken = formData.get("accessToken") as string;
    const files = formData.getAll("files") as File[];

    if (!submissionId || !accessToken) {
      return NextResponse.json(
        { error: "Missing submissionId or accessToken" },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files uploaded" },
        { status: 400 }
      );
    }

    // Verify the submission exists and belongs to this access token
    const submission = await prisma.propertySubmission.findFirst({
      where: {
        id: submissionId,
        accessToken: accessToken,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found or unauthorized" },
        { status: 404 }
      );
    }

    // Check if submission is in the correct status for image upload
    if (submission.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Submission must be approved before uploading images" },
        { status: 400 }
      );
    }

    // Upload each file to ImageKit
    const uploadedUrls: string[] = [];

    for (const file of files) {
      try {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const uploaded = await imagekit.upload({
          file: buffer,
          fileName: `${submission.id}-${file.name}`,
          folder: "/property-submissions",
        });

        uploadedUrls.push(uploaded.url);
      } catch (uploadError) {
        console.error("Failed to upload file:", file.name, uploadError);
        // Continue with other files
      }
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: "Failed to upload any images" },
        { status: 500 }
      );
    }

    // Update the submission with the uploaded images
    const updatedSubmission = await prisma.propertySubmission.update({
      where: { id: submissionId },
      data: {
        images: [...submission.images, ...uploadedUrls],
        status: "IMAGES_UPLOADED",
        imagesApprovedAt: null, // Reset in case of re-upload
      },
    });

    // Send admin notification if configured
    try {
      const settings = await prisma.siteSettings.findUnique({
        where: { id: "default" },
      });

      if (settings?.adminNotifyEmail && settings?.notifyOnImageUpload) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const emailTemplate = imagesUploadedAdminTemplate({
          ownerName: submission.ownerName,
          ownerEmail: submission.ownerEmail,
          propertyTitle: submission.propertyTitle,
          trackingUrl: `${baseUrl}/my-submission/${submission.accessToken}`,
          adminEmail: settings.adminNotifyEmail,
        });

        await sendEmail({
          to: settings.adminNotifyEmail,
          subject: emailTemplate.subject,
          html: emailTemplate.html,
        });
      }
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError);
      // Don't fail the upload if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadedUrls.length} images`,
      images: updatedSubmission.images,
    });
  } catch (error) {
    console.error("Error uploading images:", error);
    return NextResponse.json(
      { error: "Failed to upload images" },
      { status: 500 }
    );
  }
}

