/**
 * Transform utilities for property-related models
 * Converts snake_case Prisma fields to camelCase for frontend
 */

// ============================================
// PROPERTY BLOCKED DATE TRANSFORMS
// ============================================

export interface BlockedDateFrontend {
  id: string;
  propertyId: string;
  startDate: Date | string;
  endDate: Date | string;
  reason: string | null;
  blockedBy: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function transformBlockedDate(blockedDate: any): BlockedDateFrontend {
  return {
    id: blockedDate.id,
    propertyId: blockedDate.property_id,
    startDate: blockedDate.start_date,
    endDate: blockedDate.end_date,
    reason: blockedDate.reason,
    blockedBy: blockedDate.blocked_by,
    createdAt: blockedDate.created_at,
    updatedAt: blockedDate.updated_at,
  };
}

// ============================================
// PROPERTY OWNER TRANSFORMS
// ============================================

export interface PropertyOwnerFrontend {
  id: string;
  firstName: string;
  lastName: string;
  thaiIdNumber: string | null;
  phone: string;
  email: string | null;
  gender: string | null;
  idCardUrl: string | null;
  idCardPath: string | null;
  idCardOcrData: any;
  idCardVerified: boolean;
  idCardUploadedAt: Date | string | null;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  // Relations
  documents?: OwnerDocumentFrontend[];
  properties?: any[];
  tm30Requests?: any[];
}

export function transformPropertyOwner(owner: any): PropertyOwnerFrontend {
  return {
    id: owner.id,
    firstName: owner.first_name,
    lastName: owner.last_name,
    thaiIdNumber: owner.thai_id_number,
    phone: owner.phone,
    email: owner.email,
    gender: owner.gender,
    idCardUrl: owner.id_card_url,
    idCardPath: owner.id_card_path,
    idCardOcrData: owner.id_card_ocr_data,
    idCardVerified: owner.id_card_verified ?? false,
    idCardUploadedAt: owner.id_card_uploaded_at,
    isActive: owner.is_active ?? true,
    isVerified: owner.is_verified ?? false,
    createdAt: owner.created_at,
    updatedAt: owner.updated_at,
    // Relations
    documents: owner.owner_document?.map(transformOwnerDocument),
    properties: owner.property,
    tm30Requests: owner.tm30_accommodation_request,
  };
}

// ============================================
// OWNER DOCUMENT TRANSFORMS
// ============================================

export interface OwnerDocumentFrontend {
  id: string;
  ownerId: string;
  documentType: string;
  imageUrl: string;
  imagePath: string;
  fileName: string | null;
  ocrData: any;
  ocrProcessedAt: Date | string | null;
  ocrConfidence: number | null;
  propertyId: string | null;
  houseId: string | null;
  extractedAddress: string | null;
  isVerified: boolean;
  verifiedBy: string | null;
  verifiedAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function transformOwnerDocument(doc: any): OwnerDocumentFrontend {
  return {
    id: doc.id,
    ownerId: doc.owner_id,
    documentType: doc.document_type,
    imageUrl: doc.image_url,
    imagePath: doc.image_path,
    fileName: doc.file_name,
    ocrData: doc.ocr_data,
    ocrProcessedAt: doc.ocr_processed_at,
    ocrConfidence: doc.ocr_confidence,
    propertyId: doc.property_id,
    houseId: doc.house_id,
    extractedAddress: doc.extracted_address,
    isVerified: doc.is_verified ?? false,
    verifiedBy: doc.verified_by,
    verifiedAt: doc.verified_at,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at,
  };
}

// ============================================
// PROPERTY FIELDS TRANSFORM (for mixed snake_case fields in Property model)
// ============================================

export interface PropertyRentalFieldsFrontend {
  defaultAccessCode: string | null;
  defaultCheckInTime: string | null;
  defaultCheckOutTime: string | null;
  defaultEmergencyContact: string | null;
  defaultHouseRules: string | null;
  defaultPropertyAddress: string | null;
  defaultPropertyInstructions: string | null;
  defaultWifiName: string | null;
  defaultWifiPassword: string | null;
  tm30AccommodationId: string | null;
  tm30AccommodationName: string | null;
  bluebookHouseId: string | null;
  bluebookUrl: string | null;
  propertyOwnerId: string | null;
}

export function transformPropertyRentalFields(property: any): PropertyRentalFieldsFrontend {
  return {
    defaultAccessCode: property.default_access_code,
    defaultCheckInTime: property.default_check_in_time,
    defaultCheckOutTime: property.default_check_out_time,
    defaultEmergencyContact: property.default_emergency_contact,
    defaultHouseRules: property.default_house_rules,
    defaultPropertyAddress: property.default_property_address,
    defaultPropertyInstructions: property.default_property_instructions,
    defaultWifiName: property.default_wifi_name,
    defaultWifiPassword: property.default_wifi_password,
    tm30AccommodationId: property.tm30_accommodation_id,
    tm30AccommodationName: property.tm30_accommodation_name,
    bluebookHouseId: property.bluebook_house_id,
    bluebookUrl: property.bluebook_url,
    propertyOwnerId: property.property_owner_id,
  };
}

/**
 * Transform full property with rental fields
 * Use this when you need to include the snake_case rental fields in a property response
 */
export function transformPropertyWithRentalFields(property: any): any {
  const rentalFields = transformPropertyRentalFields(property);
  return {
    ...property,
    ...rentalFields,
    // Remove the snake_case versions
    default_access_code: undefined,
    default_check_in_time: undefined,
    default_check_out_time: undefined,
    default_emergency_contact: undefined,
    default_house_rules: undefined,
    default_property_address: undefined,
    default_property_instructions: undefined,
    default_wifi_name: undefined,
    default_wifi_password: undefined,
    tm30_accommodation_id: undefined,
    tm30_accommodation_name: undefined,
    bluebook_house_id: undefined,
    bluebook_url: undefined,
    property_owner_id: undefined,
  };
}

