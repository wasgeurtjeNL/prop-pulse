import { revalidatePath } from "next/cache";
import prisma from "../prisma";
import { getOptimizedImageUrl } from "../imagekit";
import { PropertyImage } from "@prisma/client";

export async function ensurePropertyImages(): Promise<void> {
  const propertiesWithMissingImages = await prisma.property.findMany({
    where: {
      images: {
        none: {}
      }
    },
    include: {
      images: true
    }
  });

  for (const property of propertiesWithMissingImages) {
    const defaultImageUrl = getOptimizedImageUrl("default-property.jpg");
    await prisma.propertyImage.create({
      data: {
        propertyId: property.id,
        url: defaultImageUrl
      }
    });
  }

  revalidatePath("/properties");
}