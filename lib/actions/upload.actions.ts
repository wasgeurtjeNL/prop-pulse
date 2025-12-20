"use server";

import { imagekit } from "@/lib/imagekit";
import { convertToWebP } from "@/lib/utils/image-utils";

/**
 * Upload an image to ImageKit with Sharp compression
 * Converts to WebP format and optimizes for web delivery
 */
export async function uploadToImageKit(formData: FormData, folder: string = "/properties") {
  const file = formData.get("file") as File;

  if (!file) {
    throw new Error("No file uploaded");
  }

  try {
    const bytes = await file.arrayBuffer();
    const inputBuffer = Buffer.from(bytes);

    // Compress with Sharp and convert to WebP
    const webpResult = await convertToWebP(inputBuffer, {
      quality: 80,
      maxWidth: 1920,
      maxHeight: 1440,
      effort: 4,
    });

    // Generate a clean filename with .webp extension
    const originalName = file.name.replace(/\.[^/.]+$/, ""); // Remove original extension
    const cleanName = originalName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    const fileName = `${cleanName}-${Date.now()}.webp`;

    const uploaded = await imagekit.upload({
      file: webpResult.buffer,
      fileName: fileName,
      folder: folder,
    });

    console.log(
      `📦 Image compressed: ${(webpResult.originalSize / 1024).toFixed(0)}KB → ${(webpResult.compressedSize / 1024).toFixed(0)}KB (${webpResult.savingsPercent}% saved)`
    );

    return uploaded.url;
  } catch (error) {
    console.error("ImageKit Upload Error:", error);
    throw new Error("Failed to upload image");
  }
}

// Specific function for blog images
export async function uploadBlogImage(formData: FormData) {
  return uploadToImageKit(formData, "/blogs");
}

/**
 * Delete an image from ImageKit by its URL
 * Extracts the fileId from the URL and deletes the file
 */
export async function deleteFromImageKit(imageUrl: string): Promise<boolean> {
  try {
    // ImageKit URLs look like: https://ik.imagekit.io/[urlEndpoint]/[folder]/[filename]
    // We need to search for the file by URL and get its fileId
    
    // Extract the path from the URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split("/");
    
    // The file path starts after the urlEndpoint ID
    // e.g., /abc123/properties/image.webp -> /properties/image.webp
    const filePath = "/" + pathParts.slice(2).join("/");
    
    // Search for the file in ImageKit
    const files = await imagekit.listFiles({
      path: filePath.substring(0, filePath.lastIndexOf("/")),
      name: pathParts[pathParts.length - 1],
    });

    if (files && files.length > 0) {
      // Delete the file using its fileId
      await imagekit.deleteFile(files[0].fileId);
      console.log(`🗑️ Deleted from ImageKit: ${filePath}`);
      return true;
    }
    
    console.warn(`⚠️ File not found in ImageKit: ${imageUrl}`);
    return false;
  } catch (error) {
    console.error("ImageKit Delete Error:", error);
    return false;
  }
}
