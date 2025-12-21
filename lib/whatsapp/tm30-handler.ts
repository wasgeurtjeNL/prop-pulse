/**
 * TM30 WhatsApp Flow Handler
 * 
 * Handles the step-by-step flow for adding TM30 accommodations via WhatsApp
 * 
 * NEW: Owner recognition via phone number
 * - If owner exists: reuse ID card, skip to bluebook
 * - If new owner: full flow
 */

import { imagekit } from '../imagekit';
import prisma from '../prisma';
import { extractIdCardData, extractBluebookData } from '../tm30/ocr';
import { triggerTM30Workflow, createTM30Payload } from '../tm30/trigger-workflow';
import { updateSessionStatus, updateTM30SessionData, getTM30SessionData } from './session-manager';
import { generateDocumentPath, normalizePhone } from '../tm30/storage';
import type { 
  WhatsAppListingSession, 
  BotResponse, 
  ParsedCommand,
  WhatsAppMessage,
  WhatsAppSessionStatus
} from './types';
import { BOT_MESSAGES } from './types';

// ============================================
// OWNER RECOGNITION
// ============================================

interface ExistingOwner {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  thaiIdNumber?: string | null;
  idCardUrl?: string | null;
  idCardPath?: string | null;
  properties: { id: string; title: string }[];
}

/**
 * Check if owner exists by phone number
 */
export async function findOwnerByPhone(phone: string): Promise<ExistingOwner | null> {
  try {
    const normalized = normalizePhone(phone);
    
    const owner = await prisma.propertyOwner.findUnique({
      where: { phone: normalized },
      include: {
        properties: {
          select: { id: true, title: true },
        },
      },
    });
    
    return owner;
  } catch (error) {
    console.error('[TM30 Handler] Error finding owner:', error);
    return null;
  }
}

/**
 * Create new owner from session data
 */
export async function createOwnerFromSession(
  session: WhatsAppListingSession,
  phone: string
): Promise<string | null> {
  try {
    const normalized = normalizePhone(phone);
    
    // Check if already exists
    const existing = await prisma.propertyOwner.findUnique({
      where: { phone: normalized },
    });
    
    if (existing) {
      return existing.id;
    }
    
    // Create new owner
    const owner = await prisma.propertyOwner.create({
      data: {
        firstName: session.tm30OwnerFirstName || 'Unknown',
        lastName: session.tm30OwnerLastName || 'Unknown',
        phone: normalized,
        gender: session.tm30OwnerGender,
        idCardUrl: session.tm30IdCardUrl,
        idCardPath: session.tm30IdCardUrl ? `owners/pending/id-card-${session.id}.jpg` : undefined,
        idCardUploadedAt: session.tm30IdCardUrl ? new Date() : undefined,
      },
    });
    
    console.log(`[TM30 Handler] Created new owner: ${owner.id}`);
    return owner.id;
  } catch (error) {
    console.error('[TM30 Handler] Error creating owner:', error);
    return null;
  }
}

/**
 * Start TM30 flow - check for existing owner first
 */
export async function startTm30Flow(
  session: WhatsAppListingSession,
  phone: string
): Promise<BotResponse> {
  const existingOwner = await findOwnerByPhone(phone);
  
  if (existingOwner && existingOwner.idCardUrl) {
    // Existing owner with ID card - skip ID card step
    await updateTM30SessionData(session.id, {
      ownerFirstName: existingOwner.firstName,
      ownerLastName: existingOwner.lastName,
      idCardUrl: existingOwner.idCardUrl,
      ownerGender: undefined, // Will be fetched from owner
    });
    
    // Store owner ID in session for later
    await prisma.whatsappListingSession.update({
      where: { id: session.id },
      data: { 
        owner_id: existingOwner.id,
        status: 'TM30_AWAITING_BLUEBOOK',
      },
    });
    
    return {
      text: `✅ *Welcome back, ${existingOwner.firstName}!*

📄 Your ID card is already on file.
🏠 You have ${existingOwner.properties.length} property(ies) registered.

To add a new property, please send:
📘 *House Book (Tabienbaan)* photo

The page with the House ID number.`,
    };
  }
  
  // New owner or no ID card - start from beginning
  await updateSessionStatus(session.id, 'TM30_AWAITING_ID_CARD');
  
  return {
    text: `🇹🇭 *TM30 Accommodation Registration*

To register a new accommodation, I need:

📸 *Step 1: ID Card*
Send a photo of the owner's Thai ID card (บัตรประชาชน)`,
  };
}

// ============================================
// IMAGE UPLOAD TO IMAGEKIT
// ============================================

interface UploadOptions {
  imageUrl: string;
  documentType: 'id_card' | 'house_book';
  sessionId: string;
  ownerId?: string;
  propertyId?: string;
}

async function uploadTm30Document(options: UploadOptions): Promise<string | null> {
  const { imageUrl, documentType, sessionId, ownerId, propertyId } = options;
  
  try {
    // Get Twilio credentials for media download
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.error('[TM30 Handler] Twilio credentials not configured');
      return null;
    }
    
    console.log(`[TM30 Handler] Downloading ${documentType} from:`, imageUrl);
    
    // Download the image from Twilio
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      redirect: 'follow',
    });
    
    if (!imageResponse.ok) {
      console.error(`[TM30 Handler] Failed to download: ${imageResponse.status}`);
      return null;
    }
    
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    if (imageBuffer.length === 0) {
      console.error('[TM30 Handler] Downloaded image is empty');
      return null;
    }
    
    // Generate path based on owner or session
    let folder: string;
    let fileName: string;
    
    if (ownerId) {
      // Use proper owner-based path
      folder = `/owners/${ownerId}`;
      if (documentType === 'id_card') {
        fileName = 'id-card.jpg';
      } else {
        fileName = propertyId ? `bluebook-${propertyId}.jpg` : `bluebook-${Date.now()}.jpg`;
      }
    } else {
      // Fallback to session-based path (will be moved later)
      folder = `/tm30/pending/${sessionId}`;
      fileName = `${documentType}_${sessionId}_${Date.now()}.jpg`;
    }
    
    const uploaded = await imagekit.upload({
      file: imageBuffer,
      fileName,
      folder,
      tags: ['tm30', documentType, ownerId || sessionId],
    });
    
    console.log(`[TM30 Handler] Uploaded to ImageKit: ${uploaded.url}`);
    return uploaded.url;
    
  } catch (error) {
    console.error('[TM30 Handler] Error uploading document:', error);
    return null;
  }
}

// ============================================
// TM30 STATE HANDLERS
// ============================================

/**
 * Handle ID card photo upload (Step 1)
 */
export async function handleTm30IdCardUpload(
  session: WhatsAppListingSession,
  parsed: ParsedCommand,
  message: WhatsAppMessage
): Promise<BotResponse> {
  // Check if this is a photo
  if (!parsed.isPhoto || !parsed.photoId) {
    // Check if user wants to cancel
    if (parsed.command === 'CANCEL' || parsed.rawText.toLowerCase() === 'cancel') {
      return { text: BOT_MESSAGES.MAIN_MENU };
    }
    
    return { 
      text: `📸 Send a photo of the *ID card* (บัตรประชาชน)

Or send *"cancel"* to stop.` 
    };
  }
  
  // Get the image URL from message
  const imageUrl = message.image?.url || message.mediaUrls?.[0];
  if (!imageUrl) {
    return { text: BOT_MESSAGES.TM30_ID_CARD_RETRY };
  }
  
  // Upload to ImageKit
  const uploadedUrl = await uploadTm30Document({
    imageUrl,
    documentType: 'id_card',
    sessionId: session.id,
    ownerId: session.owner_id || undefined,
  });
  if (!uploadedUrl) {
    return { text: BOT_MESSAGES.TM30_ID_CARD_RETRY };
  }
  
  // Run OCR on the uploaded image
  const ocrResult = await extractIdCardData(uploadedUrl);
  
  if (!ocrResult.success || !ocrResult.firstName || !ocrResult.lastName) {
    // Store the image URL even if OCR failed
    session.tm30IdCardUrl = uploadedUrl;
    return { text: BOT_MESSAGES.TM30_ID_CARD_RETRY };
  }
  
  // Store extracted data in database
  await updateTM30SessionData(session.id, {
    idCardUrl: uploadedUrl,
    ownerFirstName: ocrResult.firstName,
    ownerLastName: ocrResult.lastName,
    ownerGender: ocrResult.gender || 'Male',
  });
  
  // Move to confirmation state - SAVE TO DATABASE
  await updateSessionStatus(session.id, 'TM30_CONFIRM_ID_CARD_DATA');
  
  return {
    text: BOT_MESSAGES.TM30_ID_CARD_RECEIVED({
      firstName: ocrResult.firstName,
      lastName: ocrResult.lastName,
      gender: ocrResult.gender || 'Male',
    }),
  };
}

/**
 * Handle ID card data confirmation (Step 2)
 */
export async function handleTm30IdCardConfirmation(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  const text = parsed.rawText.toLowerCase();
  
  if (text === 'yes' || text === 'ok' || text === 'ja') {
    // Confirmed - move to Bluebook upload - SAVE TO DATABASE
    await updateSessionStatus(session.id, 'TM30_AWAITING_BLUEBOOK');
    return { text: BOT_MESSAGES.TM30_ASK_BLUEBOOK };
  }
  
  if (text === 'no' || text === 'nee') {
    // Go back to ID card upload - SAVE TO DATABASE
    await updateSessionStatus(session.id, 'TM30_AWAITING_ID_CARD');
    return { 
      text: `📸 Send a new photo of the ID card
      
Or type the details manually:
*firstname lastname gender*
(e.g. "RUEDEEKORN CHUNKERD female")` 
    };
  }
  
  // Check if user is manually entering data: "FIRSTNAME LASTNAME gender"
  const manualMatch = text.match(/^(\w+)\s+(\w+)\s+(man|vrouw|male|female)$/i);
  if (manualMatch) {
    session.tm30OwnerFirstName = manualMatch[1].toUpperCase();
    session.tm30OwnerLastName = manualMatch[2].toUpperCase();
    session.tm30OwnerGender = 
      manualMatch[3].toLowerCase() === 'vrouw' || manualMatch[3].toLowerCase() === 'female' 
        ? 'Female' 
        : 'Male';
    
    await updateSessionStatus(session.id, 'TM30_AWAITING_BLUEBOOK');
    return { text: BOT_MESSAGES.TM30_ASK_BLUEBOOK };
  }
  
  return {
    text: `Reply *"yes"* if the details are correct
Or *"no"* to send a new photo
Or type manually: *firstname lastname gender*`,
  };
}

/**
 * Handle Bluebook photo upload (Step 3)
 */
export async function handleTm30BluebookUpload(
  session: WhatsAppListingSession,
  parsed: ParsedCommand,
  message: WhatsAppMessage
): Promise<BotResponse> {
  // Check if this is a photo
  if (!parsed.isPhoto || !parsed.photoId) {
    if (parsed.command === 'CANCEL') {
      return { text: BOT_MESSAGES.MAIN_MENU };
    }
    return { 
      text: `📘 Send a photo of the *Bluebook* (ทะเบียนบ้าน)

Or send *"cancel"* to stop.` 
    };
  }
  
  // Get the image URL
  const imageUrl = message.image?.url || message.mediaUrls?.[0];
  if (!imageUrl) {
    return { text: BOT_MESSAGES.TM30_BLUEBOOK_RETRY };
  }
  
  // Upload to ImageKit
  const uploadedUrl = await uploadTm30Document({
    imageUrl,
    documentType: 'house_book',
    sessionId: session.id,
    ownerId: session.owner_id || undefined,
  });
  if (!uploadedUrl) {
    return { text: BOT_MESSAGES.TM30_BLUEBOOK_RETRY };
  }
  
  // Run OCR
  const ocrResult = await extractBluebookData(uploadedUrl);
  
  if (!ocrResult.success || !ocrResult.houseIdNumber) {
    session.tm30BluebookUrl = uploadedUrl;
    return { text: BOT_MESSAGES.TM30_BLUEBOOK_RETRY };
  }
  
  // Store extracted data in database
  await updateTM30SessionData(session.id, {
    bluebookUrl: uploadedUrl,
    houseIdNumber: ocrResult.houseIdNumber,
    addressNumber: ocrResult.addressNumber,
    villageNumber: ocrResult.villageNumber,
    subDistrict: ocrResult.subDistrict,
    district: ocrResult.district,
    province: ocrResult.province,
    postalCode: ocrResult.postalCode,
  });
  
  // Move to confirmation - SAVE TO DATABASE
  await updateSessionStatus(session.id, 'TM30_CONFIRM_BLUEBOOK_DATA');
  
  return {
    text: BOT_MESSAGES.TM30_BLUEBOOK_RECEIVED({
      houseId: ocrResult.houseIdNumber || '',
      address: ocrResult.addressNumber || '',
      village: ocrResult.villageNumber || '',
      subDistrict: ocrResult.subDistrict || '',
      district: ocrResult.district || '',
      province: ocrResult.province || '',
      postalCode: ocrResult.postalCode || '',
    }),
  };
}

/**
 * Handle Bluebook data confirmation (Step 4)
 */
export async function handleTm30BluebookConfirmation(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  const text = parsed.rawText.toLowerCase();
  
  if (text === 'yes' || text === 'ok' || text === 'ja') {
    // Confirmed - move to phone number - SAVE TO DATABASE
    await updateSessionStatus(session.id, 'TM30_AWAITING_PHONE');
    return { text: BOT_MESSAGES.TM30_ASK_PHONE };
  }
  
  if (text === 'no' || text === 'nee') {
    await updateSessionStatus(session.id, 'TM30_AWAITING_BLUEBOOK');
    return { text: BOT_MESSAGES.TM30_ASK_BLUEBOOK };
  }
  
  // Check for corrections like "postcode 83100"
  const postcodeMatch = text.match(/postcode\s*(\d{5})/i);
  if (postcodeMatch) {
    // Save postcode to database
    await updateTM30SessionData(session.id, { postalCode: postcodeMatch[1] });
    await updateSessionStatus(session.id, 'TM30_AWAITING_PHONE');
    return { 
      text: `✅ Postal code updated to ${postcodeMatch[1]}

${BOT_MESSAGES.TM30_ASK_PHONE}` 
    };
  }
  
  return {
    text: `Reply *"yes"* if the details are correct
Or *"no"* to send a new photo
Or correct a field (e.g. "postcode 83100")`,
  };
}

/**
 * Handle phone number input (Step 5)
 */
export async function handleTm30PhoneInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  const text = parsed.rawText.trim();
  
  if (parsed.command === 'CANCEL') {
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  // Validate phone number (Thai format)
  const phoneMatch = text.match(/^\+?(\d{9,12})$/);
  if (!phoneMatch) {
    return {
      text: `❌ Invalid phone number

Send a valid number:
• 0986261646
• +66986261646
• 66986261646`,
    };
  }
  
  await updateTM30SessionData(session.id, { phone: text });
  await updateSessionStatus(session.id, 'TM30_AWAITING_ACCOM_NAME');
  
  return { text: BOT_MESSAGES.TM30_ASK_ACCOM_NAME };
}

/**
 * Handle accommodation name input (Step 6)
 */
export async function handleTm30AccomNameInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  const text = parsed.rawText.trim();
  
  if (parsed.command === 'CANCEL') {
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  if (text.length < 3) {
    return {
      text: `❌ Name too short

Provide a descriptive name for the accommodation
(e.g. "PHUKET: Villa Rawai" or "Kata Beach Condo")`,
    };
  }
  
  // Auto-prefix with PHUKET if not already included
  let accommodationName = text;
  if (!text.toUpperCase().includes('PHUKET')) {
    accommodationName = `PHUKET: ${text}`;
  }
  
  await updateTM30SessionData(session.id, { accommodationName });
  await updateSessionStatus(session.id, 'TM30_CONFIRM_ALL');
  
  // Get all TM30 data from database
  const tm30Data = await getTM30SessionData(session.id);
  
  return {
    text: BOT_MESSAGES.TM30_CONFIRM_ALL({
      firstName: tm30Data?.ownerFirstName || '',
      lastName: tm30Data?.ownerLastName || '',
      gender: tm30Data?.ownerGender || 'Male',
      phone: tm30Data?.phone || '',
      houseId: tm30Data?.houseIdNumber || '',
      address: tm30Data?.addressNumber || '',
      subDistrict: tm30Data?.subDistrict || '',
      district: tm30Data?.district || '',
      province: tm30Data?.province || '',
      postalCode: tm30Data?.postalCode || '',
      accommodationName: accommodationName,
    }),
  };
}

/**
 * Handle final confirmation (Step 7)
 */
export async function handleTm30FinalConfirmation(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  const text = parsed.rawText.toLowerCase();
  
  if (text === 'cancel' || text === 'annuleer' || parsed.command === 'CANCEL') {
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  if (text !== 'confirm' && text !== 'bevestig' && parsed.command !== 'CONFIRM') {
    return {
      text: `Reply *"confirm"* to start TM30 automation
Or *"cancel"* to stop`,
    };
  }
  
  // Get TM30 data from database
  const tm30Data = await getTM30SessionData(session.id);
  
  if (!tm30Data) {
    return { text: BOT_MESSAGES.TM30_FAILED('Session data not found') };
  }
  
  // Create database record
  try {
    const tm30Request = await prisma.tm30AccommodationRequest.create({
      data: {
        ownerSameAsRegistrant: true,
        ownerNationalType: 'THAI',
        ownerFirstName: tm30Data.ownerFirstName || '',
        ownerLastName: tm30Data.ownerLastName || '',
        ownerGender: tm30Data.ownerGender || 'Male',
        ownerTelephone: tm30Data.phone || '',
        entityType: 'INDIVIDUAL',
        houseIdNumber: tm30Data.houseIdNumber,
        accommodationType: 'บ้าน, คอนโด, อื่นๆ / House, Condominium, etc.',
        accommodationName: tm30Data.accommodationName || '',
        position: 'เจ้าของ / Owner',
        addressNumber: tm30Data.addressNumber || '',
        villageNumber: tm30Data.villageNumber,
        province: tm30Data.province || '',
        district: tm30Data.district || '',
        subDistrict: tm30Data.subDistrict || '',
        postalCode: tm30Data.postalCode || '',
        ownerIdCardUrl: tm30Data.idCardUrl,
        houseRegistrationUrl: tm30Data.bluebookUrl,
        whatsappPhone: session.phoneNumber,
        whatsappSessionId: session.id,
        status: 'PENDING',
      },
    });
    
    await updateTM30SessionData(session.id, { requestId: tm30Request.id });
    
    // Trigger GitHub workflow
    const payload = createTM30Payload({
      requestId: tm30Request.id,
      firstName: tm30Data.ownerFirstName || '',
      lastName: tm30Data.ownerLastName || '',
      gender: tm30Data.ownerGender || 'Male',
      phone: tm30Data.phone || '',
      houseIdNumber: tm30Data.houseIdNumber || '',
      addressNumber: tm30Data.addressNumber || '',
      villageNumber: tm30Data.villageNumber,
      province: tm30Data.province || '',
      district: tm30Data.district || '',
      subDistrict: tm30Data.subDistrict || '',
      postalCode: tm30Data.postalCode || '',
      accommodationName: tm30Data.accommodationName || '',
      idCardUrl: tm30Data.idCardUrl,
      bluebookUrl: tm30Data.bluebookUrl,
      dryRun: false, // Live mode
    });
    
    const workflowResult = await triggerTM30Workflow(payload);
    
    if (!workflowResult.success) {
      // Update status to failed
      await prisma.tm30AccommodationRequest.update({
        where: { id: tm30Request.id },
        data: { 
          status: 'FAILED',
          errorMessage: workflowResult.error,
        },
      });
      
      return { text: BOT_MESSAGES.TM30_FAILED(workflowResult.error || 'Unknown error') };
    }
    
    // Update status to processing
    await prisma.tm30AccommodationRequest.update({
      where: { id: tm30Request.id },
      data: { status: 'PROCESSING' },
    });
    
    await updateSessionStatus(session.id, 'TM30_PROCESSING');
    
    return { text: BOT_MESSAGES.TM30_PROCESSING };
    
  } catch (error: any) {
    console.error('[TM30 Handler] Error creating request:', error);
    return { text: BOT_MESSAGES.TM30_FAILED(error.message) };
  }
}

/**
 * Handle processing state (just waiting)
 */
export async function handleTm30Processing(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  return {
    text: `⏳ *TM30 is still processing...*

You will receive a message automatically when it's done.
This takes about 2-3 minutes.`,
  };
}
