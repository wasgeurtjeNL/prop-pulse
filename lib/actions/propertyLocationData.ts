import { revalidatePath } from "next/cache";
import prisma from "../prisma";
import { geocodePropertyLocation } from "../services/poi/geocoding";

export async function verifyAndUpdatePropertyLocations(): Promise<void> {
  const propertiesWithMissingLocation = await prisma.property.findMany({
    where: {
      OR: [
        { latitude: null },
        { longitude: null }
      ]
    }
  });

  for (const property of propertiesWithMissingLocation) {
    try {
      const locationData = await geocodePropertyLocation(property.address);
      await prisma.property.update({
        where: { id: property.id },
        data: {
          latitude: locationData.latitude,
          longitude: locationData.longitude
        }
      });
    } catch (error) {
      console.error(`Failed to update location for property ID ${property.id}:`, error);
    }
  }

  revalidatePath("/properties");
}