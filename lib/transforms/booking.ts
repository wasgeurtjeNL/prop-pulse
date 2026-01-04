/**
 * Transform utilities for booking-related models
 * Converts snake_case Prisma fields to camelCase for frontend
 */

// ============================================
// RENTAL BOOKING TRANSFORMS
// ============================================

export interface RentalBookingFrontend {
  id: string;
  propertyId: string;
  checkIn: Date | string;
  checkOut: Date | string;
  nights: number;
  adults: number;
  children: number;
  babies: number;
  pets: number;
  basePrice: number;
  season: string;
  discountPercent: number;
  totalPrice: number;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guestCountryCode: string;
  guestMessage: string | null;
  status: string;
  paymentStatus: string | null;
  cancellationPolicy: string | null;
  cancelledAt: Date | string | null;
  cancellationReason: string | null;
  internalNotes: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  userId: string;
  // Snake_case fields transformed to camelCase
  checkInTime: string | null;
  checkOutTime: string | null;
  propertyAddress: string | null;
  propertyInstructions: string | null;
  wifiName: string | null;
  wifiPassword: string | null;
  accessCode: string | null;
  emergencyContact: string | null;
  houseRules: string | null;
  confirmedAt: Date | string | null;
  agentId: string | null;
  passportsReceived: number;
  passportsRequired: number;
  tm30Error: string | null;
  tm30Reference: string | null;
  tm30Status: string;
  tm30SubmittedAt: Date | string | null;
  // Relations (optional)
  property?: any;
  guests?: BookingGuestFrontend[];
  messages?: BookingMessageFrontend[];
}

export function transformRentalBooking(booking: any): RentalBookingFrontend {
  return {
    id: booking.id,
    propertyId: booking.propertyId,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: booking.nights,
    adults: booking.adults,
    children: booking.children,
    babies: booking.babies,
    pets: booking.pets,
    basePrice: booking.basePrice,
    season: booking.season,
    discountPercent: booking.discountPercent,
    totalPrice: booking.totalPrice,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    guestCountryCode: booking.guestCountryCode,
    guestMessage: booking.guestMessage,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    cancellationPolicy: booking.cancellationPolicy,
    cancelledAt: booking.cancelledAt,
    cancellationReason: booking.cancellationReason,
    internalNotes: booking.internalNotes,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    userId: booking.userId,
    // Snake_case to camelCase
    checkInTime: booking.check_in_time,
    checkOutTime: booking.check_out_time,
    propertyAddress: booking.property_address,
    propertyInstructions: booking.property_instructions,
    wifiName: booking.wifi_name,
    wifiPassword: booking.wifi_password,
    accessCode: booking.access_code,
    emergencyContact: booking.emergency_contact,
    houseRules: booking.house_rules,
    confirmedAt: booking.confirmed_at,
    agentId: booking.agent_id,
    passportsReceived: booking.passports_received ?? 0,
    passportsRequired: booking.passports_required ?? 0,
    tm30Error: booking.tm30_error,
    tm30Reference: booking.tm30_reference,
    tm30Status: booking.tm30_status,
    tm30SubmittedAt: booking.tm30_submitted_at,
    // Relations
    property: booking.property,
    guests: booking.booking_guest?.map(transformBookingGuest),
    messages: booking.booking_message?.map(transformBookingMessage),
  };
}

// ============================================
// BOOKING GUEST TRANSFORMS
// ============================================

export interface BookingGuestFrontend {
  id: string;
  bookingId: string;
  guestType: string;
  guestNumber: number;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  dateOfBirth: Date | string | null;
  nationality: string | null;
  gender: string | null;
  passportNumber: string | null;
  passportExpiry: Date | string | null;
  passportIssueDate: Date | string | null;
  passportCountry: string | null;
  passportImageUrl: string | null;
  passportImagePath: string | null;
  ocrConfidence: number | null;
  ocrRawData: any;
  ocrProcessedAt: Date | string | null;
  passportVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | string | null;
  tm30Status: string;
  tm30SubmittedAt: Date | string | null;
  tm30Error: string | null;
  whatsappMessageId: string | null;
  whatsappReceivedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function transformBookingGuest(guest: any): BookingGuestFrontend {
  return {
    id: guest.id,
    bookingId: guest.booking_id,
    guestType: guest.guest_type,
    guestNumber: guest.guest_number,
    firstName: guest.first_name,
    lastName: guest.last_name,
    fullName: guest.full_name,
    dateOfBirth: guest.date_of_birth,
    nationality: guest.nationality,
    gender: guest.gender,
    passportNumber: guest.passport_number,
    passportExpiry: guest.passport_expiry,
    passportIssueDate: guest.passport_issue_date,
    passportCountry: guest.passport_country,
    passportImageUrl: guest.passport_image_url,
    passportImagePath: guest.passport_image_path,
    ocrConfidence: guest.ocr_confidence,
    ocrRawData: guest.ocr_raw_data,
    ocrProcessedAt: guest.ocr_processed_at,
    passportVerified: guest.passport_verified ?? false,
    verifiedBy: guest.verified_by,
    verifiedAt: guest.verified_at,
    tm30Status: guest.tm30_status,
    tm30SubmittedAt: guest.tm30_submitted_at,
    tm30Error: guest.tm30_error,
    whatsappMessageId: guest.whatsapp_message_id,
    whatsappReceivedAt: guest.whatsapp_received_at,
    createdAt: guest.created_at,
    updatedAt: guest.updated_at,
  };
}

// ============================================
// BOOKING MESSAGE TRANSFORMS
// ============================================

export interface BookingMessageFrontend {
  id: string;
  bookingId: string;
  senderId: string;
  senderRole: string;
  message: string;
  isRead: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function transformBookingMessage(msg: any): BookingMessageFrontend {
  return {
    id: msg.id,
    bookingId: msg.booking_id,
    senderId: msg.sender_id,
    senderRole: msg.sender_role,
    message: msg.message,
    isRead: msg.is_read ?? false,
    createdAt: msg.created_at,
    updatedAt: msg.updated_at,
  };
}

// ============================================
// TM30 BOOKING OVERVIEW TRANSFORM
// ============================================

export interface TM30BookingFrontend {
  id: string;
  guestName: string;
  guestPhone: string;
  checkIn: Date | string;
  checkOut: Date | string;
  tm30Status: string;
  tm30Reference: string | null;
  passportsRequired: number;
  passportsReceived: number;
  property: {
    title: string;
    tm30AccommodationId: string | null;
    tm30AccommodationName: string | null;
  };
  guests: BookingGuestFrontend[];
}

export function transformTM30Booking(booking: any): TM30BookingFrontend {
  return {
    id: booking.id,
    guestName: booking.guestName,
    guestPhone: booking.guestPhone,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    tm30Status: booking.tm30_status,
    tm30Reference: booking.tm30_reference,
    passportsRequired: booking.passports_required ?? 0,
    passportsReceived: booking.passports_received ?? 0,
    property: {
      title: booking.property?.title || "",
      tm30AccommodationId: booking.property?.tm30_accommodation_id || null,
      tm30AccommodationName: booking.property?.tm30_accommodation_name || null,
    },
    guests: booking.booking_guest?.map(transformBookingGuest) || [],
  };
}

