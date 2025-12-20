import { z } from "zod";

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export const signUpSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const propertySchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  type: z.enum(["FOR_SALE", "FOR_RENT"]),
  category: z.enum(["LUXURY_VILLA", "APARTMENT", "RESIDENTIAL_HOME", "OFFICE_SPACES"]),
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "RENTED"]),
  price: z.string().min(1, "Price is required"),
  location: z.string().min(5, "Address is required"),
  beds: z.coerce.number().min(0),
  baths: z.coerce.number().min(0),
  sqft: z.coerce.number().min(0),
  plotSize: z.coerce.number().min(0).optional().nullable(), // Land/plot size in m²
  content: z.string().min(20, "Description must be longer"),
  shortDescription: z.string().optional().nullable(),
  amenities: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Select at least one amenity",
  }),
  tag: z.string().optional().nullable(),
  yearBuilt: z.coerce.number().optional().nullable(),
  mapUrl: z.string().url().optional().or(z.literal("")).nullable(),
  image: z.any().refine((val) => {
    if (typeof val === "string" && val.length > 0) return true;
    if (val instanceof FileList) return val.length > 0;
    return false;
  }, "Image is required"),
  // Ownership details (only for FOR_SALE properties)
  ownershipType: z.enum(["FREEHOLD", "LEASEHOLD"]).optional().nullable(),
  isResale: z.boolean().optional().nullable(),
  // Daily rental configuration (only for FOR_RENT properties)
  enableDailyRental: z.boolean().optional().nullable(),
  monthlyRentalPrice: z.coerce.number().min(0).optional().nullable(),
  maxGuests: z.coerce.number().min(1).optional().nullable(),
  allowPets: z.boolean().optional().nullable(),
  // Owner/Agency contact details
  ownerName: z.string().optional().nullable(),
  ownerEmail: z.string().email().optional().or(z.literal("")).nullable(),
  ownerPhone: z.string().optional().nullable(),
  ownerCountryCode: z.string().optional().nullable(),
  ownerCompany: z.string().optional().nullable(),
  ownerNotes: z.string().optional().nullable(),
  commissionRate: z.coerce.number().min(0).max(100).optional().nullable(),
  // Property Access Details (default values for rental bookings)
  defaultCheckInTime: z.string().optional().nullable(),
  defaultCheckOutTime: z.string().optional().nullable(),
  defaultPropertyAddress: z.string().optional().nullable(),
  defaultWifiName: z.string().optional().nullable(),
  defaultWifiPassword: z.string().optional().nullable(),
  defaultAccessCode: z.string().optional().nullable(),
  defaultEmergencyContact: z.string().optional().nullable(),
  defaultPropertyInstructions: z.string().optional().nullable(),
  defaultHouseRules: z.string().optional().nullable(),
});
