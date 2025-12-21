/**
 * WhatsApp Listing Session Manager
 * 
 * Manages conversation state for the WhatsApp property listing workflow.
 * Uses database persistence for session data.
 */

import prisma from '@/lib/prisma';
import {
  WhatsAppListingSession,
  WhatsAppSessionStatus,
  DetectedPropertyFeatures,
  PoiScoresData,
  ListingType,
  PropertyCategoryType,
  OwnershipTypeEnum,
  MIN_PHOTOS_REQUIRED,
  SESSION_EXPIRY_HOURS,
} from './types';

// ============================================
// SESSION CRUD OPERATIONS
// ============================================

/**
 * Get or create a session for a WhatsApp user
 */
export async function getOrCreateSession(
  phoneNumber: string,
  whatsappId: string
): Promise<WhatsAppListingSession> {
  // First, check for an existing active session
  const existing = await getActiveSession(whatsappId);
  
  if (existing) {
    return existing;
  }
  
  // Create new session
  return createSession(phoneNumber, whatsappId);
}

/**
 * Get active session for a user (not expired, not completed)
 */
export async function getActiveSession(
  whatsappId: string
): Promise<WhatsAppListingSession | null> {
  const session = await prisma.$queryRaw<Array<SessionRow>>`
    SELECT * FROM whatsapp_listing_session 
    WHERE whatsapp_id = ${whatsappId}
      AND status NOT IN ('COMPLETED', 'CANCELLED', 'ERROR')
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (session.length === 0) {
    return null;
  }

  return mapToSession(session[0]);
}

/**
 * Create a new listing session
 */
export async function createSession(
  phoneNumber: string,
  whatsappId: string,
  initiatedBy?: string,
  initiatedByName?: string
): Promise<WhatsAppListingSession> {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
  
  const result = await prisma.$queryRaw<Array<SessionRow>>`
    INSERT INTO whatsapp_listing_session (
      phone_number, whatsapp_id, status, initiated_by, initiated_by_name, expires_at
    ) VALUES (
      ${phoneNumber}, ${whatsappId}, 'AWAITING_LISTING_TYPE', ${initiatedBy}, ${initiatedByName}, ${expiresAt}
    )
    RETURNING *
  `;

  return mapToSession(result[0]);
}

/**
 * Set listing type (FOR_SALE or FOR_RENT)
 */
export async function setListingType(
  sessionId: string,
  listingType: ListingType
): Promise<void> {
  const nextStatus = 'AWAITING_PROPERTY_TYPE';
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET listing_type = ${listingType}, status = ${nextStatus}
    WHERE id = ${sessionId}
  `;
}

/**
 * Set property category
 */
export async function setPropertyCategory(
  sessionId: string,
  category: PropertyCategoryType,
  listingType: ListingType
): Promise<void> {
  // If FOR_SALE, ask about ownership; otherwise go to photos
  const nextStatus = listingType === 'FOR_SALE' ? 'AWAITING_OWNERSHIP' : 'AWAITING_PHOTOS';
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET property_category = ${category}, status = ${nextStatus}
    WHERE id = ${sessionId}
  `;
}

/**
 * Set ownership type (only for FOR_SALE)
 */
export async function setOwnershipType(
  sessionId: string,
  ownershipType: OwnershipTypeEnum
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET ownership_type = ${ownershipType}, status = 'AWAITING_PHOTOS'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set asking price
 */
export async function setAskingPrice(
  sessionId: string,
  price: string
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET asking_price = ${price}, status = 'AWAITING_BEDROOMS'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set bedrooms count
 */
export async function setBedrooms(
  sessionId: string,
  bedrooms: number
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET bedrooms = ${bedrooms}, status = 'AWAITING_BATHROOMS'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set bathrooms count
 */
export async function setBathrooms(
  sessionId: string,
  bathrooms: number
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET bathrooms = ${bathrooms}, status = 'PROCESSING'
    WHERE id = ${sessionId}
  `;
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: WhatsAppSessionStatus,
  errorMessage?: string
): Promise<void> {
  if (status === 'ERROR' && errorMessage) {
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET status = ${status}, error_message = ${errorMessage}, error_at = NOW()
      WHERE id = ${sessionId}
    `;
  } else if (status === 'COMPLETED') {
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET status = ${status}, completed_at = NOW()
      WHERE id = ${sessionId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET status = ${status}
      WHERE id = ${sessionId}
    `;
  }
}

/**
 * Add image to session
 */
export async function addImageToSession(
  sessionId: string,
  imageUrl: string
): Promise<{ imageCount: number; minReached: boolean }> {
  const result = await prisma.$queryRaw<Array<{ image_count: number }>>`
    UPDATE whatsapp_listing_session 
    SET images = array_append(images, ${imageUrl}),
        image_count = image_count + 1,
        status = CASE 
          WHEN image_count + 1 >= ${MIN_PHOTOS_REQUIRED} THEN 'AWAITING_MORE_PHOTOS'
          ELSE 'COLLECTING_PHOTOS'
        END
    WHERE id = ${sessionId}
    RETURNING image_count
  `;

  const imageCount = result[0]?.image_count || 0;
  return {
    imageCount,
    minReached: imageCount >= MIN_PHOTOS_REQUIRED,
  };
}

/**
 * Set location data for session
 */
export async function setSessionLocation(
  sessionId: string,
  latitude: number,
  longitude: number,
  locationName?: string,
  address?: string,
  district?: string
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET latitude = ${latitude},
        longitude = ${longitude},
        location_name = ${locationName || null},
        address = ${address || null},
        district = ${district || null},
        status = 'PROCESSING'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set detected features from AI analysis
 */
export async function setDetectedFeatures(
  sessionId: string,
  features: DetectedPropertyFeatures
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET detected_features = ${JSON.stringify(features)}::jsonb
    WHERE id = ${sessionId}
  `;
}

/**
 * Set generated content
 */
export async function setGeneratedContent(
  sessionId: string,
  title: string,
  description: string,
  contentHtml: string,
  suggestedPrice?: string
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET generated_title = ${title},
        generated_description = ${description},
        generated_content_html = ${contentHtml},
        suggested_price = ${suggestedPrice || null},
        status = 'AWAITING_CONFIRMATION'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set POI scores
 */
export async function setPoiScores(
  sessionId: string,
  scores: PoiScoresData
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET poi_scores = ${JSON.stringify(scores)}::jsonb
    WHERE id = ${sessionId}
  `;
}

/**
 * Set final property ID after creation
 */
export async function setPropertyId(
  sessionId: string,
  propertyId: string
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET property_id = ${propertyId},
        status = 'COMPLETED',
        completed_at = NOW()
    WHERE id = ${sessionId}
  `;
}

/**
 * Cancel a session
 */
export async function cancelSession(sessionId: string): Promise<void> {
  await updateSessionStatus(sessionId, 'CANCELLED');
}

/**
 * Get session by ID
 */
export async function getSessionById(
  sessionId: string
): Promise<WhatsAppListingSession | null> {
  const result = await prisma.$queryRaw<Array<SessionRow>>`
    SELECT * FROM whatsapp_listing_session WHERE id = ${sessionId}
  `;

  if (result.length === 0) {
    return null;
  }

  return mapToSession(result[0]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Database row type for session
 */
interface SessionRow {
  id: string;
  phone_number: string;
  whatsapp_id: string;
  status: string;
  listing_type: string | null;
  property_category: string | null;
  ownership_type: string | null;
  asking_price: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[];
  image_count: number;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  address: string | null;
  district: string | null;
  detected_features: object | null;
  generated_title: string | null;
  generated_description: string | null;
  generated_content_html: string | null;
  suggested_price: string | null;
  poi_scores: object | null;
  property_id: string | null;
  initiated_by: string | null;
  initiated_by_name: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  expires_at: Date;
}

/**
 * Map database row to session object
 */
function mapToSession(row: SessionRow): WhatsAppListingSession {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    whatsappId: row.whatsapp_id,
    status: row.status as WhatsAppSessionStatus,
    listingType: row.listing_type as ListingType | undefined,
    propertyCategory: row.property_category as PropertyCategoryType | undefined,
    ownershipType: row.ownership_type as OwnershipTypeEnum | undefined,
    askingPrice: row.asking_price || undefined,
    bedrooms: row.bedrooms || undefined,
    bathrooms: row.bathrooms || undefined,
    images: row.images || [],
    imageCount: row.image_count || 0,
    latitude: row.latitude || undefined,
    longitude: row.longitude || undefined,
    locationName: row.location_name || undefined,
    address: row.address || undefined,
    district: row.district || undefined,
    detectedFeatures: row.detected_features as DetectedPropertyFeatures | undefined,
    generatedTitle: row.generated_title || undefined,
    generatedDescription: row.generated_description || undefined,
    generatedContentHtml: row.generated_content_html || undefined,
    suggestedPrice: row.suggested_price || undefined,
    poiScores: row.poi_scores as PoiScoresData | undefined,
    propertyId: row.property_id || undefined,
    initiatedBy: row.initiated_by || undefined,
    initiatedByName: row.initiated_by_name || undefined,
    errorMessage: row.error_message || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || undefined,
    expiresAt: row.expires_at,
  };
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.$executeRaw`
    DELETE FROM whatsapp_listing_session 
    WHERE expires_at < NOW()
      AND status NOT IN ('COMPLETED')
  `;
  
  return result;
}

/**
 * Get session statistics
 */
export async function getSessionStats(): Promise<{
  active: number;
  completed: number;
  cancelled: number;
  error: number;
}> {
  const results = await prisma.$queryRaw<Array<{
    status: string;
    count: bigint;
  }>>`
    SELECT status, COUNT(*) as count
    FROM whatsapp_listing_session
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY status
  `;

  const stats = {
    active: 0,
    completed: 0,
    cancelled: 0,
    error: 0,
  };

  for (const row of results) {
    const count = Number(row.count);
    if (row.status === 'COMPLETED') {
      stats.completed = count;
    } else if (row.status === 'CANCELLED') {
      stats.cancelled = count;
    } else if (row.status === 'ERROR') {
      stats.error = count;
    } else {
      stats.active += count;
    }
  }

  return stats;
}

// ============================================
// TM30 SESSION DATA FUNCTIONS
// ============================================

export interface TM30SessionData {
  idCardUrl?: string;
  bluebookUrl?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerGender?: string;
  phone?: string;
  houseIdNumber?: string;
  addressNumber?: string;
  villageNumber?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  accommodationName?: string;
  requestId?: string;
}

/**
 * Update TM30 session data
 */
export async function updateTM30SessionData(
  sessionId: string,
  data: TM30SessionData
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET 
      tm30_id_card_url = COALESCE(${data.idCardUrl || null}, tm30_id_card_url),
      tm30_bluebook_url = COALESCE(${data.bluebookUrl || null}, tm30_bluebook_url),
      tm30_owner_first_name = COALESCE(${data.ownerFirstName || null}, tm30_owner_first_name),
      tm30_owner_last_name = COALESCE(${data.ownerLastName || null}, tm30_owner_last_name),
      tm30_owner_gender = COALESCE(${data.ownerGender || null}, tm30_owner_gender),
      tm30_phone = COALESCE(${data.phone || null}, tm30_phone),
      tm30_house_id_number = COALESCE(${data.houseIdNumber || null}, tm30_house_id_number),
      tm30_address_number = COALESCE(${data.addressNumber || null}, tm30_address_number),
      tm30_village_number = COALESCE(${data.villageNumber || null}, tm30_village_number),
      tm30_sub_district = COALESCE(${data.subDistrict || null}, tm30_sub_district),
      tm30_district = COALESCE(${data.district || null}, tm30_district),
      tm30_province = COALESCE(${data.province || null}, tm30_province),
      tm30_postal_code = COALESCE(${data.postalCode || null}, tm30_postal_code),
      tm30_accommodation_name = COALESCE(${data.accommodationName || null}, tm30_accommodation_name),
      tm30_request_id = COALESCE(${data.requestId || null}, tm30_request_id),
      updated_at = NOW()
    WHERE id = ${sessionId}
  `;
}

/**
 * Get TM30 session data
 */
export async function getTM30SessionData(
  sessionId: string
): Promise<TM30SessionData | null> {
  const result = await prisma.$queryRaw<Array<{
    tm30_id_card_url: string | null;
    tm30_bluebook_url: string | null;
    tm30_owner_first_name: string | null;
    tm30_owner_last_name: string | null;
    tm30_owner_gender: string | null;
    tm30_phone: string | null;
    tm30_house_id_number: string | null;
    tm30_address_number: string | null;
    tm30_village_number: string | null;
    tm30_sub_district: string | null;
    tm30_district: string | null;
    tm30_province: string | null;
    tm30_postal_code: string | null;
    tm30_accommodation_name: string | null;
    tm30_request_id: string | null;
  }>>`
    SELECT 
      tm30_id_card_url,
      tm30_bluebook_url,
      tm30_owner_first_name,
      tm30_owner_last_name,
      tm30_owner_gender,
      tm30_phone,
      tm30_house_id_number,
      tm30_address_number,
      tm30_village_number,
      tm30_sub_district,
      tm30_district,
      tm30_province,
      tm30_postal_code,
      tm30_accommodation_name,
      tm30_request_id
    FROM whatsapp_listing_session 
    WHERE id = ${sessionId}
  `;

  if (result.length === 0) {
    return null;
  }

  const row = result[0];
  return {
    idCardUrl: row.tm30_id_card_url || undefined,
    bluebookUrl: row.tm30_bluebook_url || undefined,
    ownerFirstName: row.tm30_owner_first_name || undefined,
    ownerLastName: row.tm30_owner_last_name || undefined,
    ownerGender: row.tm30_owner_gender || undefined,
    phone: row.tm30_phone || undefined,
    houseIdNumber: row.tm30_house_id_number || undefined,
    addressNumber: row.tm30_address_number || undefined,
    villageNumber: row.tm30_village_number || undefined,
    subDistrict: row.tm30_sub_district || undefined,
    district: row.tm30_district || undefined,
    province: row.tm30_province || undefined,
    postalCode: row.tm30_postal_code || undefined,
    accommodationName: row.tm30_accommodation_name || undefined,
    requestId: row.tm30_request_id || undefined,
  };
}
import {
  WhatsAppListingSession,
  WhatsAppSessionStatus,
  DetectedPropertyFeatures,
  PoiScoresData,
  ListingType,
  PropertyCategoryType,
  OwnershipTypeEnum,
  MIN_PHOTOS_REQUIRED,
  SESSION_EXPIRY_HOURS,
} from './types';

// ============================================
// SESSION CRUD OPERATIONS
// ============================================

/**
 * Get or create a session for a WhatsApp user
 */
export async function getOrCreateSession(
  phoneNumber: string,
  whatsappId: string
): Promise<WhatsAppListingSession> {
  // First, check for an existing active session
  const existing = await getActiveSession(whatsappId);
  
  if (existing) {
    return existing;
  }
  
  // Create new session
  return createSession(phoneNumber, whatsappId);
}

/**
 * Get active session for a user (not expired, not completed)
 */
export async function getActiveSession(
  whatsappId: string
): Promise<WhatsAppListingSession | null> {
  const session = await prisma.$queryRaw<Array<SessionRow>>`
    SELECT * FROM whatsapp_listing_session 
    WHERE whatsapp_id = ${whatsappId}
      AND status NOT IN ('COMPLETED', 'CANCELLED', 'ERROR')
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (session.length === 0) {
    return null;
  }

  return mapToSession(session[0]);
}

/**
 * Create a new listing session
 */
export async function createSession(
  phoneNumber: string,
  whatsappId: string,
  initiatedBy?: string,
  initiatedByName?: string
): Promise<WhatsAppListingSession> {
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000);
  
  const result = await prisma.$queryRaw<Array<SessionRow>>`
    INSERT INTO whatsapp_listing_session (
      phone_number, whatsapp_id, status, initiated_by, initiated_by_name, expires_at
    ) VALUES (
      ${phoneNumber}, ${whatsappId}, 'AWAITING_LISTING_TYPE', ${initiatedBy}, ${initiatedByName}, ${expiresAt}
    )
    RETURNING *
  `;

  return mapToSession(result[0]);
}

/**
 * Set listing type (FOR_SALE or FOR_RENT)
 */
export async function setListingType(
  sessionId: string,
  listingType: ListingType
): Promise<void> {
  const nextStatus = 'AWAITING_PROPERTY_TYPE';
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET listing_type = ${listingType}, status = ${nextStatus}
    WHERE id = ${sessionId}
  `;
}

/**
 * Set property category
 */
export async function setPropertyCategory(
  sessionId: string,
  category: PropertyCategoryType,
  listingType: ListingType
): Promise<void> {
  // If FOR_SALE, ask about ownership; otherwise go to photos
  const nextStatus = listingType === 'FOR_SALE' ? 'AWAITING_OWNERSHIP' : 'AWAITING_PHOTOS';
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET property_category = ${category}, status = ${nextStatus}
    WHERE id = ${sessionId}
  `;
}

/**
 * Set ownership type (only for FOR_SALE)
 */
export async function setOwnershipType(
  sessionId: string,
  ownershipType: OwnershipTypeEnum
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET ownership_type = ${ownershipType}, status = 'AWAITING_PHOTOS'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set asking price
 */
export async function setAskingPrice(
  sessionId: string,
  price: string
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET asking_price = ${price}, status = 'AWAITING_BEDROOMS'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set bedrooms count
 */
export async function setBedrooms(
  sessionId: string,
  bedrooms: number
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET bedrooms = ${bedrooms}, status = 'AWAITING_BATHROOMS'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set bathrooms count
 */
export async function setBathrooms(
  sessionId: string,
  bathrooms: number
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET bathrooms = ${bathrooms}, status = 'PROCESSING'
    WHERE id = ${sessionId}
  `;
}

/**
 * Update session status
 */
export async function updateSessionStatus(
  sessionId: string,
  status: WhatsAppSessionStatus,
  errorMessage?: string
): Promise<void> {
  if (status === 'ERROR' && errorMessage) {
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET status = ${status}, error_message = ${errorMessage}, error_at = NOW()
      WHERE id = ${sessionId}
    `;
  } else if (status === 'COMPLETED') {
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET status = ${status}, completed_at = NOW()
      WHERE id = ${sessionId}
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET status = ${status}
      WHERE id = ${sessionId}
    `;
  }
}

/**
 * Add image to session
 */
export async function addImageToSession(
  sessionId: string,
  imageUrl: string
): Promise<{ imageCount: number; minReached: boolean }> {
  const result = await prisma.$queryRaw<Array<{ image_count: number }>>`
    UPDATE whatsapp_listing_session 
    SET images = array_append(images, ${imageUrl}),
        image_count = image_count + 1,
        status = CASE 
          WHEN image_count + 1 >= ${MIN_PHOTOS_REQUIRED} THEN 'AWAITING_MORE_PHOTOS'
          ELSE 'COLLECTING_PHOTOS'
        END
    WHERE id = ${sessionId}
    RETURNING image_count
  `;

  const imageCount = result[0]?.image_count || 0;
  return {
    imageCount,
    minReached: imageCount >= MIN_PHOTOS_REQUIRED,
  };
}

/**
 * Set location data for session
 */
export async function setSessionLocation(
  sessionId: string,
  latitude: number,
  longitude: number,
  locationName?: string,
  address?: string,
  district?: string
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET latitude = ${latitude},
        longitude = ${longitude},
        location_name = ${locationName || null},
        address = ${address || null},
        district = ${district || null},
        status = 'PROCESSING'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set detected features from AI analysis
 */
export async function setDetectedFeatures(
  sessionId: string,
  features: DetectedPropertyFeatures
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET detected_features = ${JSON.stringify(features)}::jsonb
    WHERE id = ${sessionId}
  `;
}

/**
 * Set generated content
 */
export async function setGeneratedContent(
  sessionId: string,
  title: string,
  description: string,
  contentHtml: string,
  suggestedPrice?: string
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET generated_title = ${title},
        generated_description = ${description},
        generated_content_html = ${contentHtml},
        suggested_price = ${suggestedPrice || null},
        status = 'AWAITING_CONFIRMATION'
    WHERE id = ${sessionId}
  `;
}

/**
 * Set POI scores
 */
export async function setPoiScores(
  sessionId: string,
  scores: PoiScoresData
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET poi_scores = ${JSON.stringify(scores)}::jsonb
    WHERE id = ${sessionId}
  `;
}

/**
 * Set final property ID after creation
 */
export async function setPropertyId(
  sessionId: string,
  propertyId: string
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET property_id = ${propertyId},
        status = 'COMPLETED',
        completed_at = NOW()
    WHERE id = ${sessionId}
  `;
}

/**
 * Cancel a session
 */
export async function cancelSession(sessionId: string): Promise<void> {
  await updateSessionStatus(sessionId, 'CANCELLED');
}

/**
 * Get session by ID
 */
export async function getSessionById(
  sessionId: string
): Promise<WhatsAppListingSession | null> {
  const result = await prisma.$queryRaw<Array<SessionRow>>`
    SELECT * FROM whatsapp_listing_session WHERE id = ${sessionId}
  `;

  if (result.length === 0) {
    return null;
  }

  return mapToSession(result[0]);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Database row type for session
 */
interface SessionRow {
  id: string;
  phone_number: string;
  whatsapp_id: string;
  status: string;
  listing_type: string | null;
  property_category: string | null;
  ownership_type: string | null;
  asking_price: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images: string[];
  image_count: number;
  latitude: number | null;
  longitude: number | null;
  location_name: string | null;
  address: string | null;
  district: string | null;
  detected_features: object | null;
  generated_title: string | null;
  generated_description: string | null;
  generated_content_html: string | null;
  suggested_price: string | null;
  poi_scores: object | null;
  property_id: string | null;
  initiated_by: string | null;
  initiated_by_name: string | null;
  error_message: string | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  expires_at: Date;
}

/**
 * Map database row to session object
 */
function mapToSession(row: SessionRow): WhatsAppListingSession {
  return {
    id: row.id,
    phoneNumber: row.phone_number,
    whatsappId: row.whatsapp_id,
    status: row.status as WhatsAppSessionStatus,
    listingType: row.listing_type as ListingType | undefined,
    propertyCategory: row.property_category as PropertyCategoryType | undefined,
    ownershipType: row.ownership_type as OwnershipTypeEnum | undefined,
    askingPrice: row.asking_price || undefined,
    bedrooms: row.bedrooms || undefined,
    bathrooms: row.bathrooms || undefined,
    images: row.images || [],
    imageCount: row.image_count || 0,
    latitude: row.latitude || undefined,
    longitude: row.longitude || undefined,
    locationName: row.location_name || undefined,
    address: row.address || undefined,
    district: row.district || undefined,
    detectedFeatures: row.detected_features as DetectedPropertyFeatures | undefined,
    generatedTitle: row.generated_title || undefined,
    generatedDescription: row.generated_description || undefined,
    generatedContentHtml: row.generated_content_html || undefined,
    suggestedPrice: row.suggested_price || undefined,
    poiScores: row.poi_scores as PoiScoresData | undefined,
    propertyId: row.property_id || undefined,
    initiatedBy: row.initiated_by || undefined,
    initiatedByName: row.initiated_by_name || undefined,
    errorMessage: row.error_message || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || undefined,
    expiresAt: row.expires_at,
  };
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.$executeRaw`
    DELETE FROM whatsapp_listing_session 
    WHERE expires_at < NOW()
      AND status NOT IN ('COMPLETED')
  `;
  
  return result;
}

/**
 * Get session statistics
 */
export async function getSessionStats(): Promise<{
  active: number;
  completed: number;
  cancelled: number;
  error: number;
}> {
  const results = await prisma.$queryRaw<Array<{
    status: string;
    count: bigint;
  }>>`
    SELECT status, COUNT(*) as count
    FROM whatsapp_listing_session
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY status
  `;

  const stats = {
    active: 0,
    completed: 0,
    cancelled: 0,
    error: 0,
  };

  for (const row of results) {
    const count = Number(row.count);
    if (row.status === 'COMPLETED') {
      stats.completed = count;
    } else if (row.status === 'CANCELLED') {
      stats.cancelled = count;
    } else if (row.status === 'ERROR') {
      stats.error = count;
    } else {
      stats.active += count;
    }
  }

  return stats;
}

// ============================================
// TM30 SESSION DATA FUNCTIONS
// ============================================

export interface TM30SessionData {
  idCardUrl?: string;
  bluebookUrl?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  ownerGender?: string;
  phone?: string;
  houseIdNumber?: string;
  addressNumber?: string;
  villageNumber?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  accommodationName?: string;
  requestId?: string;
}

/**
 * Update TM30 session data
 */
export async function updateTM30SessionData(
  sessionId: string,
  data: TM30SessionData
): Promise<void> {
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET 
      tm30_id_card_url = COALESCE(${data.idCardUrl || null}, tm30_id_card_url),
      tm30_bluebook_url = COALESCE(${data.bluebookUrl || null}, tm30_bluebook_url),
      tm30_owner_first_name = COALESCE(${data.ownerFirstName || null}, tm30_owner_first_name),
      tm30_owner_last_name = COALESCE(${data.ownerLastName || null}, tm30_owner_last_name),
      tm30_owner_gender = COALESCE(${data.ownerGender || null}, tm30_owner_gender),
      tm30_phone = COALESCE(${data.phone || null}, tm30_phone),
      tm30_house_id_number = COALESCE(${data.houseIdNumber || null}, tm30_house_id_number),
      tm30_address_number = COALESCE(${data.addressNumber || null}, tm30_address_number),
      tm30_village_number = COALESCE(${data.villageNumber || null}, tm30_village_number),
      tm30_sub_district = COALESCE(${data.subDistrict || null}, tm30_sub_district),
      tm30_district = COALESCE(${data.district || null}, tm30_district),
      tm30_province = COALESCE(${data.province || null}, tm30_province),
      tm30_postal_code = COALESCE(${data.postalCode || null}, tm30_postal_code),
      tm30_accommodation_name = COALESCE(${data.accommodationName || null}, tm30_accommodation_name),
      tm30_request_id = COALESCE(${data.requestId || null}, tm30_request_id),
      updated_at = NOW()
    WHERE id = ${sessionId}
  `;
}

/**
 * Get TM30 session data
 */
export async function getTM30SessionData(
  sessionId: string
): Promise<TM30SessionData | null> {
  const result = await prisma.$queryRaw<Array<{
    tm30_id_card_url: string | null;
    tm30_bluebook_url: string | null;
    tm30_owner_first_name: string | null;
    tm30_owner_last_name: string | null;
    tm30_owner_gender: string | null;
    tm30_phone: string | null;
    tm30_house_id_number: string | null;
    tm30_address_number: string | null;
    tm30_village_number: string | null;
    tm30_sub_district: string | null;
    tm30_district: string | null;
    tm30_province: string | null;
    tm30_postal_code: string | null;
    tm30_accommodation_name: string | null;
    tm30_request_id: string | null;
  }>>`
    SELECT 
      tm30_id_card_url,
      tm30_bluebook_url,
      tm30_owner_first_name,
      tm30_owner_last_name,
      tm30_owner_gender,
      tm30_phone,
      tm30_house_id_number,
      tm30_address_number,
      tm30_village_number,
      tm30_sub_district,
      tm30_district,
      tm30_province,
      tm30_postal_code,
      tm30_accommodation_name,
      tm30_request_id
    FROM whatsapp_listing_session 
    WHERE id = ${sessionId}
  `;

  if (result.length === 0) {
    return null;
  }

  const row = result[0];
  return {
    idCardUrl: row.tm30_id_card_url || undefined,
    bluebookUrl: row.tm30_bluebook_url || undefined,
    ownerFirstName: row.tm30_owner_first_name || undefined,
    ownerLastName: row.tm30_owner_last_name || undefined,
    ownerGender: row.tm30_owner_gender || undefined,
    phone: row.tm30_phone || undefined,
    houseIdNumber: row.tm30_house_id_number || undefined,
    addressNumber: row.tm30_address_number || undefined,
    villageNumber: row.tm30_village_number || undefined,
    subDistrict: row.tm30_sub_district || undefined,
    district: row.tm30_district || undefined,
    province: row.tm30_province || undefined,
    postalCode: row.tm30_postal_code || undefined,
    accommodationName: row.tm30_accommodation_name || undefined,
    requestId: row.tm30_request_id || undefined,
  };
}

