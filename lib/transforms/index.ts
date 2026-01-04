/**
 * Central export for all transform utilities
 * 
 * These functions convert snake_case Prisma model fields to camelCase for frontend consumption.
 * 
 * Usage:
 * import { transformBookingGuest, transformRentalBooking } from "@/lib/transforms";
 * 
 * const guests = prismaGuests.map(transformBookingGuest);
 */

// Booking-related transforms
export {
  transformRentalBooking,
  transformBookingGuest,
  transformBookingMessage,
  transformTM30Booking,
  type RentalBookingFrontend,
  type BookingGuestFrontend,
  type BookingMessageFrontend,
  type TM30BookingFrontend,
} from "./booking";

// Property-related transforms
export {
  transformBlockedDate,
  transformPropertyOwner,
  transformOwnerDocument,
  transformPropertyRentalFields,
  transformPropertyWithRentalFields,
  type BlockedDateFrontend,
  type PropertyOwnerFrontend,
  type OwnerDocumentFrontend,
  type PropertyRentalFieldsFrontend,
} from "./property";

