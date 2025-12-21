/**
 * WhatsApp Message Handler
 * 
 * Core logic for handling incoming WhatsApp messages and orchestrating
 * the property listing workflow.
 */

import { imagekit } from '@/lib/imagekit';
import prisma from '@/lib/prisma';
import { sendTextMessage } from './api-client';
import {
  WhatsAppMessage,
  WhatsAppListingSession,
  BotCommand,
  BotResponse,
  ParsedCommand,
  COMMAND_PATTERNS,
  BOT_MESSAGES,
  MIN_PHOTOS_REQUIRED,
  ListingType,
  PropertyCategoryType,
  OwnershipTypeEnum,
} from './types';
import {
  getActiveSession,
  createSession,
  updateSessionStatus,
  addImageToSession,
  setSessionLocation,
  setDetectedFeatures,
  setGeneratedContent,
  setPoiScores,
  setPropertyId,
  cancelSession,
  setListingType,
  setPropertyCategory,
  setOwnershipType,
  setAskingPrice,
  setBedrooms,
  setBathrooms,
  getSessionById,
} from './session-manager';
import { analyzePropertyImages, generateAmenitiesWithIcons } from './image-analyzer';
import { 
  generatePropertyContent, 
  calculateLocationScores, 
  reverseGeocode 
} from './content-generator';
import { generateListingNumber } from '@/lib/actions/property.actions';
import { parseLocationToSlugs } from '@/lib/property-url';
import {
  handleTm30IdCardUpload,
  handleTm30IdCardConfirmation,
  handleTm30BluebookUpload,
  handleTm30BluebookConfirmation,
  handleTm30PhoneInput,
  handleTm30AccomNameInput,
  handleTm30FinalConfirmation,
  handleTm30Processing,
} from './tm30-handler';
import { calculatePropertyPoiDistances, calculatePropertyScores } from '@/lib/services/poi/sync';
import { processPassportPhoto, sendWhatsAppMessage } from '@/lib/services/tm30-whatsapp';

// Website base URL
const WEBSITE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://prop-pulse-nine.vercel.app';

// ============================================
// TM30 PASSPORT PHOTO HANDLER
// ============================================

/**
 * Check if incoming photo is a passport for TM30 booking
 * Returns a response if handled, null if not a passport flow
 */
async function handlePossiblePassportPhoto(
  phoneNumber: string,
  photoId: string,
  message: WhatsAppMessage
): Promise<BotResponse | null> {
  try {
    // Normalize phone number (remove leading 0, ensure country code)
    const normalizedPhone = phoneNumber.replace(/^0/, '').replace(/^\+/, '');
    
    // Find pending booking for this phone number that needs passports
    const pendingBooking = await prisma.rentalBooking.findFirst({
      where: {
        OR: [
          // Match with country code variations
          { guestPhone: { contains: normalizedPhone.slice(-9) } }, // Last 9 digits
        ],
        status: 'PENDING',
        passportsReceived: { lt: prisma.rentalBooking.fields.passportsRequired },
        property: {
          tm30AccommodationId: { not: null },
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            title: true,
            tm30AccommodationId: true,
          },
        },
        guests: {
          where: { passportImageUrl: null },
          orderBy: { guestNumber: 'asc' },
          take: 1,
        },
      },
    });

    if (!pendingBooking || pendingBooking.guests.length === 0) {
      // No pending booking that needs passports
      return null;
    }

    console.log(`[TM30] Found pending booking ${pendingBooking.id} for phone ${phoneNumber}`);
    console.log(`[TM30] Passports: ${pendingBooking.passportsReceived}/${pendingBooking.passportsRequired}`);

    // Download the image from Twilio/WhatsApp
    const imageUrl = await downloadPassportImage(photoId);
    
    if (!imageUrl) {
      return {
        text: `❌ Sorry, I couldn't download the image. Please try sending the passport photo again.`,
      };
    }

    // Process the passport photo
    const result = await processPassportPhoto(
      pendingBooking.id,
      imageUrl,
      message.id
    );

    return { text: result.message };
  } catch (error) {
    console.error('[TM30] Error handling passport photo:', error);
    return null; // Let normal flow handle it
  }
}

/**
 * Download image from WhatsApp/Twilio for passport processing
 */
async function downloadPassportImage(mediaUrl: string): Promise<string | null> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.error('[TM30] Twilio credentials not configured');
      return null;
    }
    
    console.log(`[TM30] Downloading passport image from: ${mediaUrl}`);
    
    // Download from Twilio
    const imageResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      redirect: 'follow',
    });
    
    if (!imageResponse.ok) {
      console.error(`[TM30] Failed to download image: ${imageResponse.status}`);
      return null;
    }
    
    const contentType = imageResponse.headers.get('content-type');
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    if (imageBuffer.length === 0) {
      console.error('[TM30] Downloaded image is empty');
      return null;
    }
    
    console.log(`[TM30] Downloaded passport image, size: ${imageBuffer.length} bytes`);
    
    // Upload to ImageKit for permanent storage
    const timestamp = Date.now();
    const extension = contentType?.includes('png') ? 'png' : 'jpg';
    const fileName = `passport-${timestamp}.${extension}`;
    
    const uploaded = await imagekit.upload({
      file: imageBuffer,
      fileName,
      folder: '/tm30-passports',
      tags: ['passport', 'tm30'],
    });
    
    console.log(`[TM30] Uploaded passport to ImageKit: ${uploaded.url}`);
    return uploaded.url;
    
  } catch (error) {
    console.error('[TM30] Error downloading passport image:', error);
    return null;
  }
}

// ============================================
// MAIN MESSAGE HANDLER
// ============================================

/**
 * Handle incoming WhatsApp message
 */
export async function handleIncomingMessage(
  message: WhatsAppMessage,
  phoneNumber: string,
  whatsappId: string,
  contactName?: string
): Promise<BotResponse> {
  try {
    // Parse the message to understand intent (async for Google Maps URL support)
    const parsed = await parseMessage(message);
    
    // ============================================
    // CHECK FOR TM30 PASSPORT PHOTO FLOW
    // ============================================
    // If user sends a photo and has a pending booking that needs passports,
    // process it as a passport photo
    if (parsed.isPhoto && parsed.photoId) {
      const passportResult = await handlePossiblePassportPhoto(
        phoneNumber,
        parsed.photoId,
        message
      );
      
      if (passportResult) {
        // This was handled as a passport photo
        return passportResult;
      }
      // Not a passport flow, continue with normal handling
    }
    
    // Get or create session
    let session = await getActiveSession(whatsappId);
    
    console.log(`[WhatsApp] Message from ${whatsappId}: "${parsed.rawText}" | Session: ${session ? `${session.id} (${session.status})` : 'none'} | Command: ${parsed.command || 'none'}`);
    
    // Handle commands that work with or without a session
    if (parsed.command === 'START_LISTING') {
      // Create new session (or reset existing one)
      if (session) {
        await cancelSession(session.id);
      }
      session = await createSession(phoneNumber, whatsappId);
      return { text: BOT_MESSAGES.WELCOME };
    }
    
    // Handle owner update command (works with or without session)
    if (parsed.rawText === '3' || parsed.command === 'UPDATE_OWNER') {
      // Cancel any existing session and start owner update flow
      if (session) {
        await cancelSession(session.id);
      }
      session = await createSession(phoneNumber, whatsappId);
      await updateSessionStatus(session.id, 'OWNER_UPDATE_SELECT_PROPERTY');
      return await showPropertySelectionForOwnerUpdate();
    }
    
    // Handle search owner command (works with or without session)
    if (parsed.rawText === '4' || parsed.command === 'SEARCH_OWNER') {
      // Cancel any existing session and start search flow
      if (session) {
        await cancelSession(session.id);
      }
      session = await createSession(phoneNumber, whatsappId);
      await updateSessionStatus(session.id, 'SEARCH_OWNER_QUERY');
      return { text: BOT_MESSAGES.SEARCH_OWNER_ASK_QUERY };
    }
    
    // Handle update photos command (works with or without session)
    if (parsed.rawText === '5' || parsed.command === 'UPDATE_PHOTOS') {
      // Cancel any existing session and start photo update flow
      if (session) {
        await cancelSession(session.id);
      }
      session = await createSession(phoneNumber, whatsappId);
      await updateSessionStatus(session.id, 'UPDATE_PHOTOS_SELECT_PROPERTY');
      return await showPropertySelectionForPhotoUpdate();
    }
    
    // Handle TM30 accommodation command (works with or without session)
    if (parsed.rawText === '6' || parsed.command === 'TM30_ACCOM') {
      // Cancel any existing session and start TM30 flow
      if (session) {
        await cancelSession(session.id);
      }
      session = await createSession(phoneNumber, whatsappId);
      await updateSessionStatus(session.id, 'TM30_AWAITING_ID_CARD');
      return { text: BOT_MESSAGES.TM30_START };
    }
    
    // Handle menu command (go back to main menu)
    if (parsed.command === 'MENU') {
      if (session) {
        await cancelSession(session.id);
      }
      return { text: BOT_MESSAGES.MAIN_MENU };
    }
    
    if (parsed.command === 'HELP') {
      return { text: BOT_MESSAGES.HELP };
    }
    
    // If no active session, prompt to start
    if (!session) {
      return {
        text: `👋 Hello${contactName ? ` ${contactName}` : ''}!

Send *"Start"* to create a new listing
Send *"3"* to update owner/agent details
Send *"4"* to search owner/agency
Send *"5"* to update property photos
Send *"6"* for TM30 accommodation 🇹🇭

Or send *"Help"* for more options.`,
      };
    }
    
    // Check if session is expired
    if (new Date() > session.expiresAt) {
      return { text: BOT_MESSAGES.SESSION_EXPIRED };
    }
    
    // Handle based on current session state
    switch (session.status) {
      case 'AWAITING_LISTING_TYPE':
        return await handleListingTypeSelection(session, parsed);
        
      case 'AWAITING_PROPERTY_TYPE':
        return await handlePropertyTypeSelection(session, parsed);
        
      case 'AWAITING_OWNERSHIP':
        return await handleOwnershipSelection(session, parsed);
        
      case 'AWAITING_PHOTOS':
      case 'COLLECTING_PHOTOS':
        return await handlePhotoCollection(session, parsed);
        
      case 'AWAITING_MORE_PHOTOS':
        return await handleMorePhotosDecision(session, parsed);
        
      case 'AWAITING_LOCATION':
        return await handleLocationInput(session, parsed, message);
        
      case 'AWAITING_PRICE':
        return await handlePriceInput(session, parsed);
        
      case 'AWAITING_BEDROOMS':
        return await handleBedroomsInput(session, parsed);
        
      case 'AWAITING_BATHROOMS':
        return await handleBathroomsInput(session, parsed);
        
      case 'PROCESSING':
        return { text: BOT_MESSAGES.PROCESSING };
        
      case 'AWAITING_CONFIRMATION':
        return await handleConfirmation(session, parsed);
        
      case 'COMPLETED':
        return {
          text: `✅ Your listing has already been published!\n\nSend *"Start"* to create a new listing.`,
        };
        
      case 'CANCELLED':
      case 'ERROR':
        return {
          text: `Send *"Start"* to begin a new listing.`,
        };
      
      // Owner Update Flow
      case 'OWNER_UPDATE_SELECT_PROPERTY':
        return await handleOwnerPropertySelection(session, parsed);
        
      case 'OWNER_UPDATE_CONFIRM_PROPERTY':
        return await handleOwnerPropertyConfirmation(session, parsed);
        
      case 'OWNER_UPDATE_NAME':
        return await handleOwnerNameInput(session, parsed);
        
      case 'OWNER_UPDATE_PHONE':
        return await handleOwnerPhoneInput(session, parsed);
        
      case 'OWNER_UPDATE_COMPANY':
        return await handleOwnerCompanyInput(session, parsed);
        
      case 'OWNER_UPDATE_COMMISSION':
        return await handleOwnerCommissionInput(session, parsed);
      
      // Search Owner Flow
      case 'SEARCH_OWNER_QUERY':
        return await handleSearchOwnerQuery(session, parsed);
        
      case 'SEARCH_OWNER_RESULTS':
        return await handleSearchOwnerResults(session, parsed);
      
      // Update Photos Flow
      case 'UPDATE_PHOTOS_SELECT_PROPERTY':
        return await handlePhotoUpdatePropertySelection(session, parsed);
        
      case 'UPDATE_PHOTOS_VIEW_CURRENT':
        return await handlePhotoUpdateViewCurrent(session, parsed);
        
      case 'UPDATE_PHOTOS_SELECT_ACTION':
        return await handlePhotoUpdateSelectAction(session, parsed);
        
      case 'UPDATE_PHOTOS_COLLECTING':
        return await handlePhotoUpdateCollecting(session, parsed);
        
      case 'UPDATE_PHOTOS_REPLACE_SELECT':
        return await handlePhotoUpdateReplaceSelect(session, parsed);
        
      case 'UPDATE_PHOTOS_CONFIRM':
        return await handlePhotoUpdateConfirm(session, parsed);
      
      // TM30 Accommodation Flow
      case 'TM30_AWAITING_ID_CARD':
        return await handleTm30IdCardUpload(session, parsed, message);
        
      case 'TM30_CONFIRM_ID_CARD_DATA':
        return await handleTm30IdCardConfirmation(session, parsed);
        
      case 'TM30_AWAITING_BLUEBOOK':
        return await handleTm30BluebookUpload(session, parsed, message);
        
      case 'TM30_CONFIRM_BLUEBOOK_DATA':
        return await handleTm30BluebookConfirmation(session, parsed);
        
      case 'TM30_AWAITING_PHONE':
        return await handleTm30PhoneInput(session, parsed);
        
      case 'TM30_AWAITING_ACCOM_NAME':
        return await handleTm30AccomNameInput(session, parsed);
        
      case 'TM30_CONFIRM_ALL':
        return await handleTm30FinalConfirmation(session, parsed);
        
      case 'TM30_PROCESSING':
        return await handleTm30Processing(session, parsed);
        
      case 'TM30_COMPLETED':
        return { text: BOT_MESSAGES.MAIN_MENU };
        
      default:
        return { text: BOT_MESSAGES.HELP };
    }
  } catch (error) {
    console.error('Error handling WhatsApp message:', error);
    return {
      text: BOT_MESSAGES.ERROR(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ),
    };
  }
}

// ============================================
// NEW STATE HANDLERS
// ============================================

/**
 * Handle listing type selection (FOR_SALE or FOR_RENT)
 */
async function handleListingTypeSelection(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const input = parsed.rawText.trim().toLowerCase();
  
  // Accept "1" or text commands for FOR_SALE
  if (input === '1' || parsed.command === 'FOR_SALE') {
    await setListingType(session.id, 'FOR_SALE');
    return { text: BOT_MESSAGES.ASK_PROPERTY_TYPE };
  }
  
  // Accept "2" or text commands for FOR_RENT
  if (input === '2' || parsed.command === 'FOR_RENT') {
    await setListingType(session.id, 'FOR_RENT');
    return { text: BOT_MESSAGES.ASK_PROPERTY_TYPE };
  }
  
  return { text: BOT_MESSAGES.WELCOME };
}

/**
 * Handle property type selection
 */
async function handlePropertyTypeSelection(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const input = parsed.rawText.trim().toLowerCase();
  let category: PropertyCategoryType | null = null;
  
  // Accept numeric or text input
  if (input === '1' || parsed.command === 'VILLA') {
    category = 'LUXURY_VILLA';
  } else if (input === '2' || parsed.command === 'CONDO') {
    category = 'APARTMENT';
  } else if (input === '3' || parsed.command === 'HOUSE') {
    category = 'RESIDENTIAL_HOME';
  } else if (input === '4' || parsed.command === 'OFFICE') {
    category = 'OFFICE_SPACES';
  }
  
  if (category) {
    // Get the listing type to determine next step
    const freshSession = await getSessionById(session.id);
    const listingType = freshSession?.listingType || 'FOR_SALE';
    
    await setPropertyCategory(session.id, category, listingType);
    
    // If FOR_SALE, ask about ownership; otherwise go to photos
    if (listingType === 'FOR_SALE') {
      return { text: BOT_MESSAGES.ASK_OWNERSHIP };
    } else {
      return { text: BOT_MESSAGES.ASK_PHOTOS };
    }
  }
  
  return { text: BOT_MESSAGES.ASK_PROPERTY_TYPE };
}

/**
 * Handle ownership type selection (Freehold/Leasehold)
 */
async function handleOwnershipSelection(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const input = parsed.rawText.trim().toLowerCase();
  
  // Accept "1" or text for FREEHOLD
  if (input === '1' || parsed.command === 'FREEHOLD') {
    await setOwnershipType(session.id, 'FREEHOLD');
    return { text: BOT_MESSAGES.ASK_PHOTOS };
  }
  
  // Accept "2" or text for LEASEHOLD
  if (input === '2' || parsed.command === 'LEASEHOLD') {
    await setOwnershipType(session.id, 'LEASEHOLD');
    return { text: BOT_MESSAGES.ASK_PHOTOS };
  }
  
  return { text: BOT_MESSAGES.ASK_OWNERSHIP };
}

/**
 * Handle price input
 */
async function handlePriceInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const priceText = parsed.rawText.trim();
  
  // Basic validation - should contain some numbers
  if (!/\d/.test(priceText)) {
    return { text: `${BOT_MESSAGES.INVALID_NUMBER}\n\n${BOT_MESSAGES.ASK_PRICE(session.listingType || 'FOR_SALE')}` };
  }
  
  await setAskingPrice(session.id, priceText);
  return { text: BOT_MESSAGES.ASK_BEDROOMS };
}

/**
 * Handle bedrooms input
 */
async function handleBedroomsInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const num = parseInt(parsed.rawText.trim(), 10);
  
  if (isNaN(num) || num < 0 || num > 20) {
    return { text: `${BOT_MESSAGES.INVALID_NUMBER}\n\n${BOT_MESSAGES.ASK_BEDROOMS}` };
  }
  
  await setBedrooms(session.id, num);
  return { text: BOT_MESSAGES.ASK_BATHROOMS };
}

/**
 * Handle bathrooms input
 */
async function handleBathroomsInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const num = parseInt(parsed.rawText.trim(), 10);
  
  if (isNaN(num) || num < 0 || num > 20) {
    return { text: `${BOT_MESSAGES.INVALID_NUMBER}\n\n${BOT_MESSAGES.ASK_BATHROOMS}` };
  }
  
  await setBathrooms(session.id, num);
  
  // Start background processing and send message
  processPropertyListingWithNotification(session.id, session.whatsappId).catch(err => {
    console.error('Background processing error:', err);
  });
  
  return { text: BOT_MESSAGES.PROCESSING };
}

// ============================================
// EXISTING STATE HANDLERS (UPDATED)
// ============================================

/**
 * Handle photo collection state
 */
async function handlePhotoCollection(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  // If it's a photo, process it
  if (parsed.isPhoto && parsed.photoId) {
    const imageUrl = await downloadAndUploadImage(parsed.photoId, session.id);
    
    if (!imageUrl) {
      return { text: '❌ Could not process photo. Please try again.' };
    }
    
    const { imageCount, minReached } = await addImageToSession(session.id, imageUrl);
    
    if (minReached) {
      return { text: BOT_MESSAGES.MIN_PHOTOS_REACHED };
    }
    
    return { text: BOT_MESSAGES.PHOTO_RECEIVED(imageCount, MIN_PHOTOS_REQUIRED) };
  }
  
  // Not a photo - remind user
  return {
    text: `📸 Send photos of the property.\n\nYou have ${session.imageCount} photos. Minimum ${MIN_PHOTOS_REQUIRED} required.\n\nOr send *"Cancel"* to cancel.`,
  };
}

/**
 * Handle decision about more photos
 */
async function handleMorePhotosDecision(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const input = parsed.rawText.trim().toLowerCase();
  
  // User wants to add more photos
  if (parsed.command === 'MORE_PHOTOS' || parsed.isPhoto) {
    // If they sent a photo, process it
    if (parsed.isPhoto && parsed.photoId) {
      const imageUrl = await downloadAndUploadImage(parsed.photoId, session.id);
      if (imageUrl) {
        const { imageCount } = await addImageToSession(session.id, imageUrl);
        return {
          text: `📸 Photo ${imageCount} added!\n\nSend more photos or reply *"done"* when finished.`,
        };
      }
    }
    
    // Update status to collecting again
    await updateSessionStatus(session.id, 'COLLECTING_PHOTOS');
    return {
      text: `📸 Send more photos!\n\nYou now have ${session.imageCount} photos.\n\nReply *"done"* when finished.`,
    };
  }
  
  // User is done with photos (accept "3", "done", "no", "nee")
  if (input === '3' || input === 'no' || parsed.command === 'DONE_PHOTOS') {
    await updateSessionStatus(session.id, 'AWAITING_LOCATION');
    return { text: BOT_MESSAGES.ASK_LOCATION };
  }
  
  // Unclear response
  return {
    text: `Do you want to add more photos?\n\n✅ *"Yes"* - Add more photos\n✅ *"Done"* or *"3"* - Continue to location`,
  };
}

/**
 * Handle location input
 */
async function handleLocationInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand,
  message?: WhatsAppMessage
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  // Helper function to save location and continue
  async function saveLocationAndContinue(
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<BotResponse> {
    // Reverse geocode if no address provided
    let finalAddress = address;
    let district: string | undefined;
    
    if (!finalAddress) {
      const geocoded = await reverseGeocode(latitude, longitude);
      finalAddress = geocoded.address;
      district = geocoded.district;
    }
    
    // Save location to session and move to AWAITING_PRICE
    await setSessionLocation(
      session.id,
      latitude,
      longitude,
      name,
      finalAddress,
      district
    );
    
    // Update status to AWAITING_PRICE
    await updateSessionStatus(session.id, 'AWAITING_PRICE');
    
    // Get fresh session to get listing type
    const freshSession = await getSessionById(session.id);
    const listingType = freshSession?.listingType || 'FOR_SALE';
    
    return { 
      text: `${BOT_MESSAGES.LOCATION_RECEIVED(finalAddress || `${latitude}, ${longitude}`)}\n\n${BOT_MESSAGES.ASK_PRICE(listingType)}`
    };
  }
  
  // Check for location message (native WhatsApp location sharing)
  if (parsed.isLocation && parsed.location) {
    const { latitude, longitude, name, address } = parsed.location;
    return saveLocationAndContinue(latitude, longitude, name, address);
  }
  
  // Check for screenshot/image (Vision AI extraction)
  if (parsed.isPhoto && message?.image?.url) {
    console.log('[WhatsApp] Received image during location step, analyzing with Vision AI...');
    
    // Download and upload image first (same as photo collection)
    const imageUrl = await downloadAndUploadImage(message.image.url, session.id);
    if (!imageUrl) {
      return { text: '❌ Could not process the image. Please try again or share your location directly.' };
    }
    
    // Extract location from screenshot using Vision AI
    const extractedLocation = await extractLocationFromScreenshot(imageUrl);
    
    if (extractedLocation) {
      console.log('[WhatsApp] Successfully extracted location from screenshot:', extractedLocation);
      return saveLocationAndContinue(
        extractedLocation.latitude,
        extractedLocation.longitude,
        undefined,
        extractedLocation.address
      );
    } else {
      return { 
        text: `❌ *Could not extract location from image*

Please try one of these options:
1️⃣ Share your *live location* via 📎
2️⃣ Paste a *Google Maps link*
3️⃣ Send a clearer screenshot showing the address or Plus Code`
      };
    }
  }
  
  // Not a location - remind user
  return { text: BOT_MESSAGES.ASK_LOCATION };
}

/**
 * Handle confirmation of listing
 */
async function handleConfirmation(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  // User confirms
  if (parsed.command === 'CONFIRM') {
    try {
      // Create the property
      const property = await createPropertyFromSession(session);
      
      // Update session with property ID
      await setPropertyId(session.id, property.id);
      
      // Build full property URL
      const propertyUrl = property.provinceSlug && property.areaSlug
        ? `${WEBSITE_URL}/properties/${property.provinceSlug}/${property.areaSlug}/${property.slug}`
        : `${WEBSITE_URL}/properties/${property.slug}`;
      
      return {
        text: BOT_MESSAGES.LISTING_CREATED(
          property.listingNumber,
          property.slug,
          propertyUrl
        ),
      };
    } catch (error) {
      console.error('Error creating property:', error);
      await updateSessionStatus(session.id, 'ERROR', 
        error instanceof Error ? error.message : 'Failed to create property'
      );
      return {
        text: BOT_MESSAGES.ERROR('Could not create property. Please try again.'),
      };
    }
  }
  
  // Show current summary again
  const freshSession = await getSessionById(session.id);
  if (freshSession?.detectedFeatures) {
    return {
      text: BOT_MESSAGES.ANALYSIS_COMPLETE(freshSession.detectedFeatures, freshSession),
    };
  }
  
  return {
    text: `Do you want to publish this listing?\n\n✅ *"Confirm"* - Publish\n❌ *"Cancel"* - Cancel`,
  };
}

// ============================================
// OWNER UPDATE FLOW HANDLERS
// ============================================

/**
 * Show property selection for owner update
 */
async function showPropertySelectionForOwnerUpdate(): Promise<BotResponse> {
  // Get last 5 properties
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      listingNumber: true,
      title: true,
      price: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  
  if (properties.length === 0) {
    return { text: BOT_MESSAGES.NO_PROPERTIES_FOUND };
  }
  
  return {
    text: BOT_MESSAGES.OWNER_UPDATE_SELECT(
      properties.map((p: { listingNumber: string | null; title: string; price: string }) => ({
        listingNumber: p.listingNumber || 'N/A',
        title: p.title,
        price: p.price,
      }))
    ),
  };
}

/**
 * Parse listing number input (supports short format like "89" for PP-0089)
 */
function parseListingNumber(input: string): string {
  const trimmed = input.trim().toUpperCase();
  
  // If already has PP- prefix, use as-is
  if (trimmed.startsWith('PP-')) {
    return trimmed;
  }
  
  // If it's just a number, pad to 4 digits
  const num = parseInt(trimmed, 10);
  if (!isNaN(num)) {
    return `PP-${num.toString().padStart(4, '0')}`;
  }
  
  return trimmed;
}

/**
 * Handle property selection for owner update
 */
async function handleOwnerPropertySelection(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const input = parsed.rawText.trim();
  const sessionId = session.id; // Capture session ID for use in helper
  
  // Helper to show property confirmation with owner details
  async function showPropertyConfirmationMessage(propertyId: string): Promise<BotResponse> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        listingNumber: true,
        title: true,
        price: true,
        beds: true,
        baths: true,
        location: true,
        ownerName: true,
        ownerPhone: true,
        ownerEmail: true,
        ownerCompany: true,
        commissionRate: true,
      },
    });
    
    if (!property) {
      return { text: BOT_MESSAGES.OWNER_UPDATE_NOT_FOUND(input) };
    }
    
    console.log(`[WhatsApp] Updating session ${sessionId} with property ${property.id}, setting status to OWNER_UPDATE_CONFIRM_PROPERTY`);
    
    // Save selection to session using setPropertyId and updateSessionStatus
    await setPropertyId(sessionId, property.id);
    await updateSessionStatus(sessionId, 'OWNER_UPDATE_CONFIRM_PROPERTY');
    
    console.log(`[WhatsApp] Session updated successfully`);
    
    // Build confirmation message with current owner details
    let message = `📍 *Selected Property:*

*${property.listingNumber}* - ${property.title}
💰 ${property.price} | 🛏️ ${property.beds} bed | 🚿 ${property.baths} bath
📍 ${property.location}

`;

    // Show current owner details if they exist
    if (property.ownerName || property.ownerPhone || property.commissionRate) {
      message += `━━━━━━━━━━━━━━━━━━━━━
📋 *Current Owner Details:*
`;
      if (property.ownerName) message += `👤 Name: ${property.ownerName}\n`;
      if (property.ownerPhone) message += `📞 Phone: ${property.ownerPhone}\n`;
      if (property.ownerEmail) message += `📧 Email: ${property.ownerEmail}\n`;
      if (property.ownerCompany) message += `🏢 Company: ${property.ownerCompany}\n`;
      if (property.commissionRate) message += `💰 Commission: ${property.commissionRate}%\n`;
      message += `
Do you want to *update* these details?`;
    } else {
      message += `⚠️ *No owner details set yet*`;
    }

    message += `

Reply *"yes"* to ${property.ownerName ? 'update' : 'add'} owner details
Reply *"no"* to select another property`;

    return { text: message };
  }
  
  // Check if it's a quick select (1-5)
  const quickSelect = parseInt(input, 10);
  if (!isNaN(quickSelect) && quickSelect >= 1 && quickSelect <= 5) {
    // Get properties and select by index
    const properties = await prisma.property.findMany({
      select: { id: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    
    if (quickSelect > properties.length) {
      return { text: BOT_MESSAGES.INVALID_CHOICE };
    }
    
    return await showPropertyConfirmationMessage(properties[quickSelect - 1].id);
  }
  
  // Try to find by listing number
  const listingNumber = parseListingNumber(input);
  console.log(`[WhatsApp] Looking for property: ${listingNumber}`);
  
  const property = await prisma.property.findFirst({
    where: { listingNumber },
    select: { id: true },
  });
  
  if (!property) {
    return { text: BOT_MESSAGES.OWNER_UPDATE_NOT_FOUND(input) };
  }
  
  return await showPropertyConfirmationMessage(property.id);
}

/**
 * Handle property confirmation for owner update
 */
async function handleOwnerPropertyConfirmation(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const input = parsed.rawText.toLowerCase().trim();
  
  console.log(`[WhatsApp] Owner confirmation - input: "${input}", session: ${session.id}, status: ${session.status}`);
  
  // User confirms
  if (input === 'yes' || input === 'ja' || parsed.command === 'CONFIRM') {
    console.log(`[WhatsApp] User confirmed, updating status to OWNER_UPDATE_NAME for session ${session.id}`);
    
    await updateSessionStatus(session.id, 'OWNER_UPDATE_NAME');
    
    console.log(`[WhatsApp] Status updated to OWNER_UPDATE_NAME`);
    
    return { text: BOT_MESSAGES.OWNER_UPDATE_ASK_NAME };
  }
  
  // User wants to select another
  if (input === 'no' || input === 'nee') {
    await updateSessionStatus(session.id, 'OWNER_UPDATE_SELECT_PROPERTY');
    return await showPropertySelectionForOwnerUpdate();
  }
  
  return {
    text: `Reply *"yes"* to continue or *"no"* to select another property.`,
  };
}

/**
 * Handle owner name input
 */
async function handleOwnerNameInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const name = parsed.rawText.trim();
  
  if (name.length < 2) {
    return { text: '❌ Please enter a valid name (at least 2 characters).' };
  }
  
  // Store name temporarily (we'll use raw SQL since session doesn't have these fields in Prisma)
  // For now, we'll collect all data and update at the end
  // Store in session using a workaround - use error_message field temporarily
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET status = 'OWNER_UPDATE_PHONE',
        error_message = ${name},
        updated_at = NOW()
    WHERE id = ${session.id}
  `;
  
  return { text: BOT_MESSAGES.OWNER_UPDATE_ASK_PHONE };
}

/**
 * Handle owner phone input
 */
async function handleOwnerPhoneInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  let phone = parsed.rawText.trim();
  
  // Clean up phone number - remove spaces, dashes, parentheses
  phone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Validate phone number:
  // - Can start with + followed by country code (1-4 digits)
  // - Followed by phone number (7-14 digits)
  // - Or just local number (8-15 digits starting with 0 or digit)
  // This accepts: +31612345678, +66812345678, +1234567890, 0812345678, 812345678
  const phoneRegex = /^(\+\d{1,4})?\d{7,14}$/;
  
  if (!phoneRegex.test(phone)) {
    return { 
      text: `❌ Please enter a valid phone number.

Examples:
• +31612345678 (Netherlands)
• +66812345678 (Thailand)
• +1234567890 (USA)
• 0812345678 (local)` 
    };
  }
  
  // Store phone temporarily using location_name field
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET status = 'OWNER_UPDATE_COMPANY',
        location_name = ${phone},
        updated_at = NOW()
    WHERE id = ${session.id}
  `;
  
  return { text: BOT_MESSAGES.OWNER_UPDATE_ASK_COMPANY };
}

/**
 * Handle owner company/agency input
 */
async function handleOwnerCompanyInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const input = parsed.rawText.trim();
  
  // Allow skipping
  const company = input.toLowerCase() === 'skip' || input === '-' ? null : input;
  
  // Store company temporarily using address field (we'll use it for this)
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET status = 'OWNER_UPDATE_COMMISSION',
        address = ${company || ''},
        updated_at = NOW()
    WHERE id = ${session.id}
  `;
  
  return { text: BOT_MESSAGES.OWNER_UPDATE_ASK_COMMISSION };
}

/**
 * Parse phone number into country code and local number
 * Returns { countryCode: string, localNumber: string }
 */
function parsePhoneNumber(phone: string): { countryCode: string; localNumber: string } {
  // Common country codes with their lengths (most specific first)
  const countryCodes: Array<{ code: string; length: number }> = [
    // 4-digit codes
    { code: '+1684', length: 4 }, // American Samoa
    { code: '+1670', length: 4 }, // Northern Mariana Islands
    { code: '+1671', length: 4 }, // Guam
    // 3-digit codes
    { code: '+351', length: 3 }, // Portugal
    { code: '+352', length: 3 }, // Luxembourg
    { code: '+353', length: 3 }, // Ireland
    { code: '+354', length: 3 }, // Iceland
    { code: '+355', length: 3 }, // Albania
    { code: '+356', length: 3 }, // Malta
    { code: '+357', length: 3 }, // Cyprus
    { code: '+358', length: 3 }, // Finland
    { code: '+359', length: 3 }, // Bulgaria
    { code: '+370', length: 3 }, // Lithuania
    { code: '+371', length: 3 }, // Latvia
    { code: '+372', length: 3 }, // Estonia
    { code: '+373', length: 3 }, // Moldova
    { code: '+374', length: 3 }, // Armenia
    { code: '+375', length: 3 }, // Belarus
    { code: '+376', length: 3 }, // Andorra
    { code: '+377', length: 3 }, // Monaco
    { code: '+378', length: 3 }, // San Marino
    { code: '+380', length: 3 }, // Ukraine
    { code: '+381', length: 3 }, // Serbia
    { code: '+382', length: 3 }, // Montenegro
    { code: '+383', length: 3 }, // Kosovo
    { code: '+385', length: 3 }, // Croatia
    { code: '+386', length: 3 }, // Slovenia
    { code: '+387', length: 3 }, // Bosnia
    { code: '+389', length: 3 }, // North Macedonia
    { code: '+420', length: 3 }, // Czech Republic
    { code: '+421', length: 3 }, // Slovakia
    { code: '+423', length: 3 }, // Liechtenstein
    { code: '+852', length: 3 }, // Hong Kong
    { code: '+853', length: 3 }, // Macau
    { code: '+855', length: 3 }, // Cambodia
    { code: '+856', length: 3 }, // Laos
    { code: '+880', length: 3 }, // Bangladesh
    { code: '+886', length: 3 }, // Taiwan
    { code: '+960', length: 3 }, // Maldives
    { code: '+961', length: 3 }, // Lebanon
    { code: '+962', length: 3 }, // Jordan
    { code: '+963', length: 3 }, // Syria
    { code: '+964', length: 3 }, // Iraq
    { code: '+965', length: 3 }, // Kuwait
    { code: '+966', length: 3 }, // Saudi Arabia
    { code: '+967', length: 3 }, // Yemen
    { code: '+968', length: 3 }, // Oman
    { code: '+970', length: 3 }, // Palestine
    { code: '+971', length: 3 }, // UAE
    { code: '+972', length: 3 }, // Israel
    { code: '+973', length: 3 }, // Bahrain
    { code: '+974', length: 3 }, // Qatar
    { code: '+975', length: 3 }, // Bhutan
    { code: '+976', length: 3 }, // Mongolia
    { code: '+977', length: 3 }, // Nepal
    // 2-digit codes
    { code: '+31', length: 2 }, // Netherlands
    { code: '+32', length: 2 }, // Belgium
    { code: '+33', length: 2 }, // France
    { code: '+34', length: 2 }, // Spain
    { code: '+36', length: 2 }, // Hungary
    { code: '+39', length: 2 }, // Italy
    { code: '+40', length: 2 }, // Romania
    { code: '+41', length: 2 }, // Switzerland
    { code: '+43', length: 2 }, // Austria
    { code: '+44', length: 2 }, // UK
    { code: '+45', length: 2 }, // Denmark
    { code: '+46', length: 2 }, // Sweden
    { code: '+47', length: 2 }, // Norway
    { code: '+48', length: 2 }, // Poland
    { code: '+49', length: 2 }, // Germany
    { code: '+51', length: 2 }, // Peru
    { code: '+52', length: 2 }, // Mexico
    { code: '+53', length: 2 }, // Cuba
    { code: '+54', length: 2 }, // Argentina
    { code: '+55', length: 2 }, // Brazil
    { code: '+56', length: 2 }, // Chile
    { code: '+57', length: 2 }, // Colombia
    { code: '+58', length: 2 }, // Venezuela
    { code: '+60', length: 2 }, // Malaysia
    { code: '+61', length: 2 }, // Australia
    { code: '+62', length: 2 }, // Indonesia
    { code: '+63', length: 2 }, // Philippines
    { code: '+64', length: 2 }, // New Zealand
    { code: '+65', length: 2 }, // Singapore
    { code: '+66', length: 2 }, // Thailand
    { code: '+81', length: 2 }, // Japan
    { code: '+82', length: 2 }, // South Korea
    { code: '+84', length: 2 }, // Vietnam
    { code: '+86', length: 2 }, // China
    { code: '+90', length: 2 }, // Turkey
    { code: '+91', length: 2 }, // India
    { code: '+92', length: 2 }, // Pakistan
    { code: '+93', length: 2 }, // Afghanistan
    { code: '+94', length: 2 }, // Sri Lanka
    { code: '+95', length: 2 }, // Myanmar
    { code: '+98', length: 2 }, // Iran
    // 1-digit codes
    { code: '+1', length: 1 }, // USA/Canada
    { code: '+7', length: 1 }, // Russia/Kazakhstan
  ];
  
  // If phone starts with +, try to extract country code
  if (phone.startsWith('+')) {
    for (const { code } of countryCodes) {
      if (phone.startsWith(code)) {
        return {
          countryCode: code,
          localNumber: phone.slice(code.length),
        };
      }
    }
    // Unknown country code - extract first 1-4 digits after +
    const match = phone.match(/^(\+\d{1,4})(.+)$/);
    if (match) {
      return {
        countryCode: match[1],
        localNumber: match[2],
      };
    }
  }
  
  // No country code found, default to +66 (Thailand)
  // Remove leading 0 if present
  const localNumber = phone.startsWith('0') ? phone.slice(1) : phone;
  return {
    countryCode: '+66',
    localNumber: localNumber,
  };
}

/**
 * Handle owner commission input
 */
async function handleOwnerCommissionInput(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.CANCELLED };
  }
  
  const commissionStr = parsed.rawText.trim().replace('%', '');
  const commission = parseFloat(commissionStr);
  
  if (isNaN(commission) || commission < 0 || commission > 100) {
    return { text: '❌ Please enter a valid commission rate (0-100).' };
  }
  
  // Get all stored data
  const sessionData = await prisma.$queryRaw<Array<{ 
    error_message: string; 
    location_name: string;
    address: string | null;
    property_id: string;
  }>>`
    SELECT error_message, location_name, address, property_id 
    FROM whatsapp_listing_session 
    WHERE id = ${session.id}
  `;
  
  const ownerName = sessionData[0]?.error_message || '';
  const rawPhone = sessionData[0]?.location_name || '';
  const ownerCompany = sessionData[0]?.address || null;
  const propertyId = sessionData[0]?.property_id || '';
  
  if (!propertyId) {
    return { text: BOT_MESSAGES.ERROR('Property not found. Please start again.') };
  }
  
  // Parse phone number into country code and local number
  const { countryCode, localNumber } = parsePhoneNumber(rawPhone);
  
  console.log(`[WhatsApp] Parsed phone: ${rawPhone} -> countryCode=${countryCode}, localNumber=${localNumber}`);
  
  // Get property to get listing number
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { listingNumber: true },
  });
  
  // Update the property with owner details
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      ownerName: ownerName,
      ownerPhone: localNumber,
      ownerCountryCode: countryCode,
      ownerCompany: ownerCompany || null,
      commissionRate: commission,
    },
  });
  
  console.log(`[WhatsApp] Updated owner details for property ${property?.listingNumber}: name=${ownerName}, phone=${countryCode}${localNumber}, company=${ownerCompany}, commission=${commission}`);
  
  // Mark session as completed
  await updateSessionStatus(session.id, 'COMPLETED');
  
  return {
    text: BOT_MESSAGES.OWNER_UPDATE_SUCCESS({
      listingNumber: property?.listingNumber || 'N/A',
      name: ownerName,
      phone: `${countryCode}${localNumber}`,
      company: ownerCompany || undefined,
      commission: commission,
    }),
  };
}

// ============================================
// SEARCH OWNER FLOW HANDLERS
// ============================================

const SEARCH_RESULTS_PER_PAGE = 10;

/**
 * Handle search owner query input
 */
async function handleSearchOwnerQuery(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle menu command
  if (parsed.command === 'MENU' || parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  const query = parsed.rawText.trim();
  
  if (query.length < 2) {
    return { text: '❌ Please enter at least 2 characters to search.' };
  }
  
  console.log(`[WhatsApp] Searching for owner/agency: "${query}"`);
  
  // Search properties by owner name, company, title, or location
  const results = await prisma.property.findMany({
    where: {
      OR: [
        { ownerName: { contains: query, mode: 'insensitive' } },
        { ownerCompany: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      listingNumber: true,
      title: true,
      price: true,
      beds: true,
      baths: true,
      location: true,
      slug: true,
      images: true,
      ownerName: true,
      ownerCompany: true,
      ownerPhone: true,
      ownerCountryCode: true,
      ownerEmail: true,
      area: true,
      province: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  if (results.length === 0) {
    return { text: BOT_MESSAGES.SEARCH_OWNER_NO_RESULTS(query) };
  }
  
  console.log(`[WhatsApp] Found ${results.length} properties for "${query}"`);
  
  // Store search query and page in session for pagination
  // We'll use error_message for query and location_name for page number
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET status = 'SEARCH_OWNER_RESULTS',
        error_message = ${query},
        location_name = '1',
        updated_at = NOW()
    WHERE id = ${session.id}
  `;
  
  // Return first page of results
  return await formatSearchResults(results, query, 1);
}

/**
 * Handle search owner results pagination
 */
async function handleSearchOwnerResults(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle menu command
  if (parsed.command === 'MENU' || parsed.command === 'CANCEL') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  // Get stored search data
  const sessionData = await prisma.$queryRaw<Array<{ 
    error_message: string; 
    location_name: string;
  }>>`
    SELECT error_message, location_name 
    FROM whatsapp_listing_session 
    WHERE id = ${session.id}
  `;
  
  const query = sessionData[0]?.error_message || '';
  let currentPage = parseInt(sessionData[0]?.location_name || '1', 10);
  
  // Handle pagination commands
  if (parsed.command === 'NEXT_PAGE' || parsed.rawText.toLowerCase() === 'next') {
    currentPage++;
  } else if (parsed.command === 'PREV_PAGE' || parsed.rawText.toLowerCase() === 'prev') {
    currentPage = Math.max(1, currentPage - 1);
  } else {
    // New search query
    return await handleSearchOwnerQuery(session, parsed);
  }
  
  // Re-fetch results
  const results = await prisma.property.findMany({
    where: {
      OR: [
        { ownerName: { contains: query, mode: 'insensitive' } },
        { ownerCompany: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { location: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      listingNumber: true,
      title: true,
      price: true,
      beds: true,
      baths: true,
      location: true,
      slug: true,
      images: true,
      ownerName: true,
      ownerCompany: true,
      ownerPhone: true,
      ownerCountryCode: true,
      ownerEmail: true,
      area: true,
      province: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const totalPages = Math.ceil(results.length / SEARCH_RESULTS_PER_PAGE);
  currentPage = Math.min(currentPage, totalPages);
  currentPage = Math.max(1, currentPage);
  
  // Update page in session
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET location_name = ${currentPage.toString()},
        updated_at = NOW()
    WHERE id = ${session.id}
  `;
  
  return await formatSearchResults(results, query, currentPage);
}

/**
 * Format search results for WhatsApp with images
 */
async function formatSearchResults(
  results: Array<{
    id: string;
    listingNumber: string | null;
    title: string;
    price: string;
    beds: number;
    baths: number;
    location: string;
    slug: string;
    images: string[];
    ownerName: string | null;
    ownerCompany: string | null;
    ownerPhone: string | null;
    ownerCountryCode: string | null;
    ownerEmail: string | null;
    area: string | null;
    province: string | null;
  }>,
  query: string,
  page: number
): Promise<BotResponse> {
  const totalResults = results.length;
  const totalPages = Math.ceil(totalResults / SEARCH_RESULTS_PER_PAGE);
  const startIdx = (page - 1) * SEARCH_RESULTS_PER_PAGE;
  const endIdx = Math.min(startIdx + SEARCH_RESULTS_PER_PAGE, totalResults);
  const pageResults = results.slice(startIdx, endIdx);
  
  // Get first result's owner info for contact details header
  const firstResult = pageResults[0];
  const contactInfo = BOT_MESSAGES.SEARCH_OWNER_CONTACT({
    name: firstResult?.ownerName || undefined,
    company: firstResult?.ownerCompany || undefined,
    phone: firstResult?.ownerPhone || undefined,
    countryCode: firstResult?.ownerCountryCode || undefined,
    email: firstResult?.ownerEmail || undefined,
  });
  
  // Build header message
  let headerMsg = BOT_MESSAGES.SEARCH_OWNER_RESULTS_HEADER(query, totalResults, page, totalPages);
  headerMsg += `\n\n${contactInfo}\n`;
  headerMsg += `\n🏠 *Listings ${startIdx + 1}-${endIdx} of ${totalResults}:*`;
  
  // Build listing messages with images
  const messages: Array<{ text?: string; mediaUrl?: string; caption?: string }> = [];
  
  // First message: header with contact details
  messages.push({ text: headerMsg });
  
  // Add each property as an image message
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://psmphuket.com';
  
  for (const property of pageResults) {
    const propertyUrl = `${baseUrl}/properties/${property.province?.toLowerCase() || 'phuket'}/${property.area?.toLowerCase().replace(/\s+/g, '-') || 'area'}/${property.slug}`;
    
    const caption = `🏠 *${property.listingNumber || 'N/A'}* - ${property.title.slice(0, 40)}${property.title.length > 40 ? '...' : ''}
💰 ${property.price} | 🛏️ ${property.beds} bed | 🚿 ${property.baths} bath
📍 ${property.location}
🔗 ${propertyUrl}`;
    
    // Use first image if available
    const imageUrl = property.images?.[0] || null;
    
    if (imageUrl) {
      messages.push({
        mediaUrl: imageUrl,
        caption: caption,
      });
    } else {
      messages.push({ text: caption });
    }
  }
  
  // Add pagination message
  messages.push({ text: BOT_MESSAGES.SEARCH_OWNER_PAGINATION(page, totalPages) });
  
  return { messages };
}

// ============================================
// UPDATE PHOTOS FLOW HANDLERS
// ============================================

/**
 * Show property selection for photo update
 */
async function showPropertySelectionForPhotoUpdate(): Promise<BotResponse> {
  // Get 5 most recent properties
  const properties = await prisma.property.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      listingNumber: true,
      title: true,
      _count: {
        select: { images: true }
      }
    },
  });
  
  if (properties.length === 0) {
    return { text: BOT_MESSAGES.NO_PROPERTIES_FOUND };
  }
  
  return {
    text: BOT_MESSAGES.UPDATE_PHOTOS_SELECT(
      properties.map((p: { listingNumber: string | null; title: string; _count: { images: number } }) => ({
        listingNumber: p.listingNumber || 'N/A',
        title: p.title,
        imageCount: p._count.images,
      }))
    ),
  };
}

/**
 * Handle property selection for photo update
 */
async function handlePhotoUpdatePropertySelection(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel/menu
  if (parsed.command === 'CANCEL' || parsed.command === 'MENU') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  const input = parsed.rawText.trim();
  const sessionId = session.id;
  
  // Parse input - could be 1-5 for list selection or listing number
  let property;
  
  const listIndex = parseInt(input);
  if (!isNaN(listIndex) && listIndex >= 1 && listIndex <= 5) {
    // Get by list position
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        listingNumber: true,
        title: true,
        location: true,
        _count: {
          select: { images: true }
        }
      },
    });
    
    property = properties[listIndex - 1];
  } else {
    // Try to find by listing number
    const paddedNumber = input.replace(/\D/g, '').padStart(4, '0');
    const listingNumber = `PP-${paddedNumber}`;
    
    property = await prisma.property.findFirst({
      where: {
        OR: [
          { listingNumber: listingNumber },
          { listingNumber: { endsWith: input.replace(/\D/g, '') } },
        ],
      },
      select: {
        id: true,
        listingNumber: true,
        title: true,
        location: true,
        _count: {
          select: { images: true }
        }
      },
    });
  }
  
  if (!property) {
    return { text: BOT_MESSAGES.UPDATE_PHOTOS_NOT_FOUND(input) };
  }
  
  // Save selection to session
  await prisma.$executeRaw`
    UPDATE whatsapp_listing_session 
    SET error_message = ${property.id},
        status = 'UPDATE_PHOTOS_VIEW_CURRENT',
        updated_at = NOW()
    WHERE id = ${sessionId}
  `;
  
  return {
    text: BOT_MESSAGES.UPDATE_PHOTOS_CONFIRM_PROPERTY({
      listingNumber: property.listingNumber || 'N/A',
      title: property.title,
      imageCount: property._count.images,
      location: property.location,
    }),
  };
}

/**
 * Handle viewing current photos and asking for action
 */
async function handlePhotoUpdateViewCurrent(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel/menu
  if (parsed.command === 'CANCEL' || parsed.command === 'MENU') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  const input = parsed.rawText.trim().toLowerCase();
  
  // Get property ID from session
  const sessionData = await prisma.$queryRaw<Array<{ error_message: string }>>`
    SELECT error_message FROM whatsapp_listing_session WHERE id = ${session.id}
  `;
  
  const propertyId = sessionData[0]?.error_message;
  
  if (!propertyId) {
    await updateSessionStatus(session.id, 'UPDATE_PHOTOS_SELECT_PROPERTY');
    return await showPropertySelectionForPhotoUpdate();
  }
  
  // If user confirmed, show current photos
  if (input === 'yes' || input === 'ja') {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        listingNumber: true,
        title: true,
        images: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            position: true,
            alt: true,
            url: true,
          }
        }
      },
    });
    
    if (!property) {
      return { text: BOT_MESSAGES.UPDATE_PHOTOS_NOT_FOUND(propertyId) };
    }
    
    // Update status to select action
    await updateSessionStatus(session.id, 'UPDATE_PHOTOS_SELECT_ACTION');
    
    return {
      text: BOT_MESSAGES.UPDATE_PHOTOS_CURRENT_OVERVIEW(
        { listingNumber: property.listingNumber || 'N/A', title: property.title },
        property.images.map((img: { position: number; alt: string | null }) => ({ position: img.position, alt: img.alt }))
      ),
    };
  }
  
  // If user said no, go back to selection
  if (input === 'no' || input === 'nee') {
    await updateSessionStatus(session.id, 'UPDATE_PHOTOS_SELECT_PROPERTY');
    return await showPropertySelectionForPhotoUpdate();
  }
  
  return {
    text: `Reply *"yes"* to continue or *"no"* to select another property.`,
  };
}

/**
 * Handle action selection (add, replace, delete)
 */
async function handlePhotoUpdateSelectAction(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel/menu
  if (parsed.command === 'CANCEL' || parsed.command === 'MENU') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  const input = parsed.rawText.trim();
  
  // Get property ID from session
  const sessionData = await prisma.$queryRaw<Array<{ error_message: string }>>`
    SELECT error_message FROM whatsapp_listing_session WHERE id = ${session.id}
  `;
  
  const propertyId = sessionData[0]?.error_message;
  
  if (!propertyId) {
    await updateSessionStatus(session.id, 'UPDATE_PHOTOS_SELECT_PROPERTY');
    return await showPropertySelectionForPhotoUpdate();
  }
  
  // Handle action selection
  if (input === '1') {
    // Add photos
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET location_name = 'add',
          status = 'UPDATE_PHOTOS_COLLECTING',
          updated_at = NOW()
      WHERE id = ${session.id}
    `;
    
    return { text: BOT_MESSAGES.UPDATE_PHOTOS_SEND_NEW };
  }
  
  if (input === '2') {
    // Replace photo - show list to select which one
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        images: {
          orderBy: { position: 'asc' },
          select: { position: true, alt: true }
        }
      },
    });
    
    if (!property || property.images.length === 0) {
      return { text: BOT_MESSAGES.UPDATE_PHOTOS_NO_PHOTOS };
    }
    
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET location_name = 'replace',
          status = 'UPDATE_PHOTOS_REPLACE_SELECT',
          updated_at = NOW()
      WHERE id = ${session.id}
    `;
    
    return {
      text: BOT_MESSAGES.UPDATE_PHOTOS_SELECT_TO_REPLACE(property.images),
    };
  }
  
  if (input === '3') {
    // Delete photo - show list to select which one
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        images: {
          orderBy: { position: 'asc' },
          select: { position: true, alt: true }
        }
      },
    });
    
    if (!property || property.images.length === 0) {
      return { text: BOT_MESSAGES.UPDATE_PHOTOS_NO_PHOTOS };
    }
    
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET location_name = 'delete',
          status = 'UPDATE_PHOTOS_REPLACE_SELECT',
          updated_at = NOW()
      WHERE id = ${session.id}
    `;
    
    return {
      text: BOT_MESSAGES.UPDATE_PHOTOS_SELECT_TO_DELETE(property.images),
    };
  }
  
  return {
    text: `Please select an option:

Reply *"1"* to ➕ Add more photos
Reply *"2"* to 🔄 Replace a specific photo
Reply *"3"* to 🗑️ Delete a photo
Reply *"menu"* to go back`,
  };
}

/**
 * Handle photo collection for adding new photos
 */
async function handlePhotoUpdateCollecting(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel/menu
  if (parsed.command === 'CANCEL' || parsed.command === 'MENU') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  // Get property ID and action from session
  const sessionData = await prisma.$queryRaw<Array<{ 
    error_message: string; 
    location_name: string;
    address: string;
    image_count: number;
  }>>`
    SELECT error_message, location_name, address, image_count 
    FROM whatsapp_listing_session 
    WHERE id = ${session.id}
  `;
  
  const propertyId = sessionData[0]?.error_message;
  const action = sessionData[0]?.location_name;
  const replacePosition = sessionData[0]?.address ? parseInt(sessionData[0].address) : null;
  const newPhotosCount = sessionData[0]?.image_count || 0;
  
  if (!propertyId) {
    await updateSessionStatus(session.id, 'UPDATE_PHOTOS_SELECT_PROPERTY');
    return await showPropertySelectionForPhotoUpdate();
  }
  
  // If photo received
  if (parsed.isPhoto && parsed.photoId) {
    const imageUrl = await downloadAndUploadImageWithCompression(parsed.photoId, session.id);
    
    if (!imageUrl) {
      return { text: '❌ Could not process photo. Please try again.' };
    }
    
    if (action === 'replace' && replacePosition) {
      // Replace the specific photo
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          listingNumber: true,
          title: true,
          location: true,
          category: true,
          beds: true,
          baths: true,
          type: true,
          amenities: true,
          images: {
            where: { position: replacePosition },
            select: { id: true }
          }
        }
      });
      
      if (property && property.images[0]) {
        // Generate new alt text
        const altText = generatePhotoUpdateAltText(replacePosition, {
          title: property.title,
          location: property.location,
          beds: property.beds,
          baths: property.baths,
          category: property.category || 'RESIDENTIAL_HOME',
          amenities: property.amenities || [],
          type: (property.type || 'FOR_SALE') as 'FOR_SALE' | 'FOR_RENT',
        });
        
        await prisma.propertyImage.update({
          where: { id: property.images[0].id },
          data: {
            url: imageUrl,
            alt: altText,
          }
        });
        
        // Also update main image if this is position 1
        if (replacePosition === 1) {
          await prisma.property.update({
            where: { id: propertyId },
            data: { image: imageUrl }
          });
        }
        
        await cancelSession(session.id);
        return { text: BOT_MESSAGES.UPDATE_PHOTOS_PHOTO_REPLACED(replacePosition) };
      }
    } else {
      // Add new photo
      const property = await prisma.property.findUnique({
        where: { id: propertyId },
        select: {
          listingNumber: true,
          title: true,
          location: true,
          category: true,
          beds: true,
          baths: true,
          type: true,
          amenities: true,
          _count: { select: { images: true } }
        }
      });
      
      if (property) {
        const newPosition = property._count.images + newPhotosCount + 1;
        
        // Generate alt text for new position
        const altText = generatePhotoUpdateAltText(newPosition, {
          title: property.title,
          location: property.location,
          beds: property.beds,
          baths: property.baths,
          category: property.category || 'RESIDENTIAL_HOME',
          amenities: property.amenities || [],
          type: (property.type || 'FOR_SALE') as 'FOR_SALE' | 'FOR_RENT',
        });
        
        await prisma.propertyImage.create({
          data: {
            propertyId,
            url: imageUrl,
            position: newPosition,
            alt: altText,
          }
        });
        
        // Increment counter in session
        await prisma.$executeRaw`
          UPDATE whatsapp_listing_session 
          SET image_count = image_count + 1,
              updated_at = NOW()
          WHERE id = ${session.id}
        `;
        
        const totalPhotos = property._count.images + newPhotosCount + 1;
        return { text: BOT_MESSAGES.UPDATE_PHOTOS_PHOTO_ADDED(newPhotosCount + 1, totalPhotos) };
      }
    }
    
    return { text: '❌ Could not find property. Please try again.' };
  }
  
  // If user is done adding photos
  if (parsed.command === 'DONE_PHOTOS' || parsed.rawText.toLowerCase() === 'done') {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        listingNumber: true,
        _count: { select: { images: true } }
      }
    });
    
    await cancelSession(session.id);
    
    return {
      text: BOT_MESSAGES.UPDATE_PHOTOS_SUCCESS(
        property?.listingNumber || 'N/A',
        property?._count.images || 0
      ),
    };
  }
  
  return { text: BOT_MESSAGES.UPDATE_PHOTOS_SEND_NEW };
}

/**
 * Handle photo position selection for replace/delete
 */
async function handlePhotoUpdateReplaceSelect(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel
  if (parsed.command === 'CANCEL' || parsed.command === 'MENU') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  // Get property ID and action from session
  const sessionData = await prisma.$queryRaw<Array<{ 
    error_message: string; 
    location_name: string;
  }>>`
    SELECT error_message, location_name FROM whatsapp_listing_session WHERE id = ${session.id}
  `;
  
  const propertyId = sessionData[0]?.error_message;
  const action = sessionData[0]?.location_name;
  
  if (!propertyId) {
    await updateSessionStatus(session.id, 'UPDATE_PHOTOS_SELECT_PROPERTY');
    return await showPropertySelectionForPhotoUpdate();
  }
  
  const position = parseInt(parsed.rawText.trim());
  
  if (isNaN(position) || position < 1) {
    return { text: BOT_MESSAGES.INVALID_NUMBER };
  }
  
  // Get property images
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      listingNumber: true,
      images: {
        orderBy: { position: 'asc' },
        select: { id: true, position: true }
      }
    }
  });
  
  if (!property) {
    return { text: BOT_MESSAGES.UPDATE_PHOTOS_NOT_FOUND(propertyId) };
  }
  
  const targetImage = property.images.find((img: { id: string; position: number }) => img.position === position);
  
  if (!targetImage) {
    return { text: `❌ Photo at position ${position} not found. Please select a valid position.` };
  }
  
  if (action === 'delete') {
    // Check if we're deleting the last photo
    if (property.images.length <= 1) {
      return { text: BOT_MESSAGES.UPDATE_PHOTOS_MIN_PHOTOS_WARNING(property.images.length) };
    }
    
    // Delete the photo
    await prisma.propertyImage.delete({
      where: { id: targetImage.id }
    });
    
    // Re-order remaining photos
    const remainingImages = property.images.filter((img: { id: string; position: number }) => img.id !== targetImage.id);
    for (let i = 0; i < remainingImages.length; i++) {
      await prisma.propertyImage.update({
        where: { id: remainingImages[i].id },
        data: { position: i + 1 }
      });
    }
    
    // Update main image if we deleted position 1
    if (position === 1 && remainingImages.length > 0) {
      const firstImage = await prisma.propertyImage.findFirst({
        where: { propertyId },
        orderBy: { position: 'asc' }
      });
      if (firstImage) {
        await prisma.property.update({
          where: { id: propertyId },
          data: { image: firstImage.url }
        });
      }
    }
    
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.UPDATE_PHOTOS_PHOTO_DELETED(position, remainingImages.length) };
  }
  
  if (action === 'replace') {
    // Save position to replace and wait for photo
    await prisma.$executeRaw`
      UPDATE whatsapp_listing_session 
      SET address = ${position.toString()},
          status = 'UPDATE_PHOTOS_COLLECTING',
          updated_at = NOW()
      WHERE id = ${session.id}
    `;
    
    return { text: BOT_MESSAGES.UPDATE_PHOTOS_SEND_REPLACEMENT(position) };
  }
  
  return { text: 'Invalid action. Please try again.' };
}

/**
 * Handle photo update confirmation
 */
async function handlePhotoUpdateConfirm(
  session: WhatsAppListingSession,
  parsed: ParsedCommand
): Promise<BotResponse> {
  // Handle cancel/menu
  if (parsed.command === 'CANCEL' || parsed.command === 'MENU') {
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  const input = parsed.rawText.trim().toLowerCase();
  
  // Get property ID from session
  const sessionData = await prisma.$queryRaw<Array<{ error_message: string }>>`
    SELECT error_message FROM whatsapp_listing_session WHERE id = ${session.id}
  `;
  
  const propertyId = sessionData[0]?.error_message;
  
  if (input === 'yes' || input === 'ja') {
    // Confirm deletion even with warning
    if (propertyId) {
      // Already handled in replace select
    }
    await cancelSession(session.id);
    return { text: BOT_MESSAGES.MAIN_MENU };
  }
  
  if (input === 'no' || input === 'nee') {
    await updateSessionStatus(session.id, 'UPDATE_PHOTOS_SELECT_ACTION');
    // Go back to action selection
    const property = await prisma.property.findUnique({
      where: { id: propertyId! },
      select: {
        listingNumber: true,
        title: true,
        images: {
          orderBy: { position: 'asc' },
          select: { position: true, alt: true }
        }
      }
    });
    
    if (property) {
      return {
        text: BOT_MESSAGES.UPDATE_PHOTOS_CURRENT_OVERVIEW(
          { listingNumber: property.listingNumber || 'N/A', title: property.title },
          property.images
        ),
      };
    }
  }
  
  return { text: 'Reply *"yes"* to confirm or *"no"* to go back.' };
}

/**
 * Generate alt text for photo updates
 */
function generatePhotoUpdateAltText(
  position: number,
  context: {
    title: string;
    location: string;
    beds: number;
    baths: number;
    category: string;
    amenities: string[];
    type: 'FOR_SALE' | 'FOR_RENT';
  }
): string {
  const { title, location, beds, category, amenities, type } = context;
  
  const area = location.split(',')[0]?.trim() || location;
  const categoryText = category.replace(/_/g, ' ').toLowerCase();
  const hasPool = amenities.some(a => a.toLowerCase().includes('pool'));
  const hasSeaView = amenities.some(a => 
    a.toLowerCase().includes('sea view') || a.toLowerCase().includes('ocean')
  );
  const hasGarden = amenities.some(a => a.toLowerCase().includes('garden'));
  const forText = type === 'FOR_RENT' ? 'for rent' : 'for sale';
  
  switch (position) {
    case 1:
      if (hasPool) {
        return `${title} - ${beds} bedroom ${categoryText} with private pool in ${area}`;
      } else if (hasSeaView) {
        return `${title} - ${categoryText} with sea view in ${area}, ${forText}`;
      }
      return `${title} - ${beds} bedroom ${categoryText} ${forText} in ${area}`;
    case 2:
      return `Spacious living room in ${title}, modern ${categoryText} in ${area}`;
    case 3:
      if (hasSeaView) {
        return `Open plan living with stunning views in ${beds} bed ${categoryText}, ${area}`;
      }
      return `Bright interior living space in ${title}, ${area}`;
    case 4:
      return `Fully equipped modern kitchen in ${title}, ${area}`;
    case 5:
      return `Dining area in ${beds} bedroom ${categoryText} ${forText} in ${area}`;
    case 6:
      return `Comfortable master bedroom in ${title}, ${area}`;
    case 7:
      if (beds > 1) {
        return `Guest bedroom in ${beds} bed ${categoryText}, ${area}`;
      }
      return `Modern bathroom with quality finishes in ${title}`;
    case 8:
      return `Stylish bathroom in ${beds} bed ${categoryText} in ${area}`;
    case 9:
      if (hasPool) {
        return `Private swimming pool at ${title}, ${area}`;
      } else if (hasGarden) {
        return `Tropical garden at ${title}, ${area}`;
      }
      return `Outdoor area at ${beds} bedroom ${categoryText} in ${area}`;
    case 10:
      if (hasSeaView) {
        return `Panoramic sea view from ${title} in ${area}`;
      }
      return `${title} exterior view, ${categoryText} ${forText} in ${area}`;
    default:
      return `${title} - ${categoryText} in ${area} - Photo ${position}`;
  }
}

/**
 * Download image from Twilio and upload to ImageKit with compression
 */
async function downloadAndUploadImageWithCompression(
  mediaUrl: string,
  sessionId: string
): Promise<string | null> {
  try {
    // Get Twilio credentials for media download
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.error('[WhatsApp] Twilio credentials not configured');
      return null;
    }
    
    console.log(`[WhatsApp] Downloading image from: ${mediaUrl}`);
    
    // Download the image from Twilio
    const imageResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      redirect: 'follow',
    });
    
    if (!imageResponse.ok) {
      console.error(`[WhatsApp] Failed to download image: ${imageResponse.status}`);
      return null;
    }
    
    const contentType = imageResponse.headers.get('content-type');
    let imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    if (imageBuffer.length === 0) {
      console.error('[WhatsApp] Downloaded image is empty');
      return null;
    }
    
    // Compress image using ImageKit's transformation on upload
    // We upload the original and rely on ImageKit's on-the-fly transformation
    // But we can also resize large images before upload to save bandwidth
    
    const timestamp = Date.now();
    const extension = contentType?.includes('png') ? 'png' : 'jpg';
    const fileName = `whatsapp-${sessionId}-${timestamp}.${extension}`;
    
    // Upload to ImageKit with transformation hints
    const uploaded = await imagekit.upload({
      file: imageBuffer,
      fileName,
      folder: '/whatsapp-listings',
      // Request ImageKit to optimize during delivery
      tags: ['whatsapp-upload', 'auto-optimize'],
    });
    
    console.log(`[WhatsApp] Uploaded to ImageKit: ${uploaded.url}`);
    
    return uploaded.url;
    
  } catch (error) {
    console.error('[WhatsApp] Error downloading/uploading image:', error);
    return null;
  }
}

// ============================================
// BACKGROUND PROCESSING WITH NOTIFICATION
// ============================================

/**
 * Process property listing and send notification when complete
 */
async function processPropertyListingWithNotification(
  sessionId: string, 
  whatsappId: string
): Promise<void> {
  try {
    // Get fresh session data
    const session = await prisma.$queryRaw<Array<{
      id: string;
      images: string[];
      latitude: number;
      longitude: number;
      address: string;
      district: string;
      listing_type: string;
      property_category: string;
      ownership_type: string;
      asking_price: string;
      bedrooms: number;
      bathrooms: number;
    }>>`
      SELECT id, images, latitude, longitude, address, district,
             listing_type, property_category, ownership_type,
             asking_price, bedrooms, bathrooms
      FROM whatsapp_listing_session
      WHERE id = ${sessionId}
    `;
    
    if (session.length === 0) {
      throw new Error('Session not found');
    }
    
    const data = session[0];
    
    // Step 1: Analyze images with AI
    console.log(`[WhatsApp] Analyzing ${data.images.length} images for session ${sessionId}`);
    const features = await analyzePropertyImages(data.images, { 
      district: data.district, 
      address: data.address 
    });
    
    // Override with user-provided values
    if (data.bedrooms) features.beds = data.bedrooms;
    if (data.bathrooms) features.baths = data.bathrooms;
    if (data.property_category) {
      features.propertyType = data.property_category as any;
    }
    
    await setDetectedFeatures(sessionId, features);
    
    // Step 2: Calculate POI scores
    console.log(`[WhatsApp] Calculating POI scores for location ${data.latitude}, ${data.longitude}`);
    const poiScores = await calculateLocationScores(data.latitude, data.longitude);
    await setPoiScores(sessionId, poiScores);
    
    // Step 3: Generate content
    console.log(`[WhatsApp] Generating content for session ${sessionId}`);
    const content = await generatePropertyContent(
      features,
      { latitude: data.latitude, longitude: data.longitude, address: data.address, district: data.district },
      data.images
    );
    
    await setGeneratedContent(
      sessionId,
      content.title,
      content.shortDescription,
      content.contentHtml,
      data.asking_price || content.suggestedPrice
    );
    
    console.log(`[WhatsApp] Processing complete for session ${sessionId}`);
    
    // Get fresh session with all data
    const freshSession = await getSessionById(sessionId);
    
    if (freshSession) {
      // Send completion message to user
      const analysisMessage = BOT_MESSAGES.ANALYSIS_COMPLETE(features, freshSession);
      await sendTextMessage(whatsappId, analysisMessage);
    }
    
  } catch (error) {
    console.error(`[WhatsApp] Processing error for session ${sessionId}:`, error);
    await updateSessionStatus(
      sessionId,
      'ERROR',
      error instanceof Error ? error.message : 'Processing failed'
    );
    
    // Notify user of error
    await sendTextMessage(
      whatsappId, 
      BOT_MESSAGES.ERROR(error instanceof Error ? error.message : 'Processing failed')
    );
  }
}

// ============================================
// PROPERTY CREATION
// ============================================

/**
 * Create property from completed session
 * Includes: listing number, SEO alt texts, POI calculations, URL slugs
 */
async function createPropertyFromSession(
  session: WhatsAppListingSession
): Promise<{ id: string; slug: string; listingNumber: string; provinceSlug?: string; areaSlug?: string }> {
  // Refresh session data
  const freshSession = await prisma.$queryRaw<Array<{
    id: string;
    images: string[];
    latitude: number;
    longitude: number;
    address: string;
    district: string;
    listing_type: string;
    property_category: string;
    ownership_type: string;
    asking_price: string;
    bedrooms: number;
    bathrooms: number;
    detected_features: object;
    generated_title: string;
    generated_description: string;
    generated_content_html: string;
    poi_scores: object;
  }>>`
    SELECT id, images, latitude, longitude, address, district,
           listing_type, property_category, ownership_type,
           asking_price, bedrooms, bathrooms,
           detected_features, generated_title, generated_description, 
           generated_content_html, poi_scores
    FROM whatsapp_listing_session
    WHERE id = ${session.id}
  `;
  
  if (freshSession.length === 0) {
    throw new Error('Session not found');
  }
  
  const data = freshSession[0];
  const features = data.detected_features as any;
  const poiScores = data.poi_scores as any;
  
  // Generate unique listing number (PP-XXXX)
  const listingNumber = await generateListingNumber();
  console.log(`[WhatsApp] Generated listing number: ${listingNumber}`);
  
  // Generate SEO-friendly slug
  const baseSlug = data.generated_title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
  
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const slug = `${baseSlug}-${randomSuffix}`;
  
  // Parse location to get URL slugs for hierarchical URLs
  const location = data.address || `${data.district}, Phuket`;
  const { provinceSlug, areaSlug } = parseLocationToSlugs(location);
  console.log(`[WhatsApp] URL slugs: /${provinceSlug}/${areaSlug}/${slug}`);
  
  // Get admin user for ownership
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });
  
  if (!adminUser) {
    throw new Error('No admin user found');
  }
  
  // Prepare property data
  const listingType = (data.listing_type as 'FOR_SALE' | 'FOR_RENT') || 'FOR_SALE';
  const propertyCategory = (data.property_category as any) || features.propertyType || 'RESIDENTIAL_HOME';
  const beds = data.bedrooms || features.beds || 0;
  const baths = data.bathrooms || features.baths || 0;
  const amenities = features.amenities || [];
  
  // Create property with all fields
  const property = await prisma.property.create({
    data: {
      // Listing identification
      listingNumber,
      title: data.generated_title,
      slug,
      
      // Location
      location,
      latitude: data.latitude,
      longitude: data.longitude,
      district: data.district,
      provinceSlug,
      areaSlug,
      
      // Pricing
      price: data.asking_price || features.suggestedPrice || '฿ Contact for Price',
      
      // Property details
      beds,
      baths,
      sqft: features.estimatedSqft || 0,
      
      // Property classification
      type: listingType,
      category: propertyCategory,
      ownershipType: listingType === 'FOR_SALE' ? (data.ownership_type as any) : null,
      status: 'ACTIVE',
      
      // Main image
      image: data.images[0] || '',
      
      // Content
      shortDescription: data.generated_description,
      content: data.generated_content_html,
      
      // Amenities with icons
      amenities,
      amenitiesWithIcons: generateAmenitiesWithIcons(amenities),
      
      // POI scores
      beachScore: poiScores?.beachScore,
      familyScore: poiScores?.familyScore,
      convenienceScore: poiScores?.convenienceScore,
      quietnessScore: poiScores?.quietnessScore,
      
      // Sea view
      hasSeaView: features.hasSeaView || false,
      
      // Owner
      userId: adminUser.id,
    },
  });
  
  // Create property images with SEO-optimized alt texts
  const altTextContext = {
    title: data.generated_title,
    location,
    beds,
    baths,
    category: propertyCategory,
    amenities,
    type: listingType,
  };
  
  // Save up to 10 images with SEO alt texts
  const maxImages = Math.min(data.images.length, 10);
  for (let i = 0; i < maxImages; i++) {
    const altText = generateSeoAltText(i, altTextContext);
    await prisma.propertyImage.create({
      data: {
        propertyId: property.id,
        url: data.images[i],
        position: i + 1,
        alt: altText,
      },
    });
  }
  console.log(`[WhatsApp] Created ${maxImages} property images with SEO alt texts`);
  
  // Calculate POI distances for this property
  if (data.latitude && data.longitude) {
    try {
      console.log(`[WhatsApp] Calculating POI distances for property ${property.id}`);
      const poiCount = await calculatePropertyPoiDistances(property.id);
      console.log(`[WhatsApp] Calculated distances to ${poiCount} POIs`);
      
      // Recalculate location scores
      await calculatePropertyScores(property.id);
      console.log(`[WhatsApp] Calculated location scores`);
    } catch (error) {
      console.warn('[WhatsApp] Failed to calculate POI distances:', error);
    }
  }
  
  console.log(`[WhatsApp] ✅ Property created: ${listingNumber} - ${property.slug}`);
  
  return {
    id: property.id,
    slug: property.slug,
    listingNumber,
    provinceSlug,
    areaSlug,
  };
}

/**
 * Generate SEO-optimized alt text for property images based on position
 */
function generateSeoAltText(
  index: number, 
  context: {
    title: string;
    location: string;
    beds: number;
    baths: number;
    category: string;
    amenities: string[];
    type: 'FOR_SALE' | 'FOR_RENT';
  }
): string {
  const { title, location, beds, category, amenities, type } = context;
  
  // Extract area from location
  const area = location.split(',')[0]?.trim() || location;
  
  // Convert category to readable format
  const categoryText = category.replace(/_/g, ' ').toLowerCase();
  
  // Check for specific amenities
  const hasPool = amenities.some(a => a.toLowerCase().includes('pool'));
  const hasSeaView = amenities.some(a => 
    a.toLowerCase().includes('sea view') || a.toLowerCase().includes('ocean')
  );
  const hasGarden = amenities.some(a => a.toLowerCase().includes('garden'));
  
  // Rental or sale context
  const forText = type === 'FOR_RENT' ? 'for rent' : 'for sale';
  
  const position = index + 1;
  
  switch (position) {
    case 1:
      // Hero/exterior shot
      if (hasPool) {
        return `${title} - ${beds} bedroom ${categoryText} with private pool in ${area}`;
      } else if (hasSeaView) {
        return `${title} - ${categoryText} with sea view in ${area}, ${forText}`;
      }
      return `${title} - ${beds} bedroom ${categoryText} ${forText} in ${area}`;
    
    case 2:
      return `Spacious living room in ${title}, modern ${categoryText} in ${area}`;
    
    case 3:
      if (hasSeaView) {
        return `Open plan living with stunning views in ${beds} bed ${categoryText}, ${area}`;
      }
      return `Bright interior living space in ${title}, ${area}`;
    
    case 4:
      return `Fully equipped modern kitchen in ${title}, ${area}`;
    
    case 5:
      return `Dining area in ${beds} bedroom ${categoryText} ${forText} in ${area}`;
    
    case 6:
      return `Comfortable master bedroom in ${title}, ${area}`;
    
    case 7:
      if (beds > 1) {
        return `Guest bedroom in ${beds} bed ${categoryText}, ${area}`;
      }
      return `Modern bathroom with quality finishes in ${title}`;
    
    case 8:
      return `Stylish bathroom in ${beds} bed ${categoryText} in ${area}`;
    
    case 9:
      if (hasPool) {
        return `Private swimming pool at ${title}, ${area}`;
      } else if (hasGarden) {
        return `Tropical garden at ${title}, ${area}`;
      }
      return `Outdoor area at ${beds} bedroom ${categoryText} in ${area}`;
    
    case 10:
      if (hasSeaView) {
        return `Panoramic sea view from ${title} in ${area}`;
      }
      return `${title} exterior view, ${categoryText} ${forText} in ${area}`;
    
    default:
      return `${title} - ${categoryText} in ${area}`;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract location from Google Maps screenshot using Vision AI
 * Returns address/Plus Code which can then be geocoded
 */
async function extractLocationFromScreenshot(
  imageUrl: string
): Promise<{ latitude: number; longitude: number; address?: string } | null> {
  try {
    console.log('[WhatsApp] Analyzing screenshot with Vision AI...');
    
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.error('[WhatsApp] OpenAI API key not configured');
      return null;
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `This is a screenshot of Google Maps or a map application. 
                
Extract the location information and respond ONLY with a JSON object in this exact format:
{
  "address": "the full address if visible",
  "plusCode": "the Plus Code if visible (format: XXXX+XX City)",
  "placeName": "the name of the place/business if visible",
  "coordinates": { "lat": number, "lng": number } // if coordinates are visible
}

If you cannot extract any location information, respond with: { "error": "no location found" }
Only respond with the JSON object, nothing else.`,
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
        max_tokens: 500,
      }),
    });
    
    if (!response.ok) {
      console.error('[WhatsApp] Vision API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    console.log('[WhatsApp] Vision AI response:', content);
    
    // Parse the JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[WhatsApp] Could not parse Vision AI response');
      return null;
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    if (parsed.error) {
      console.log('[WhatsApp] Vision AI could not find location:', parsed.error);
      return null;
    }
    
    // If we have coordinates directly, use them
    if (parsed.coordinates?.lat && parsed.coordinates?.lng) {
      return {
        latitude: parsed.coordinates.lat,
        longitude: parsed.coordinates.lng,
        address: parsed.address || parsed.placeName,
      };
    }
    
    // If we have a Plus Code, geocode it
    if (parsed.plusCode) {
      const coords = await geocodePlusCode(parsed.plusCode);
      if (coords) {
        return {
          ...coords,
          address: parsed.address || parsed.placeName,
        };
      }
    }
    
    // If we have an address, geocode it
    if (parsed.address || parsed.placeName) {
      const searchTerm = parsed.address || parsed.placeName;
      const coords = await geocodeAddress(searchTerm);
      if (coords) {
        return {
          ...coords,
          address: searchTerm,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[WhatsApp] Error extracting location from screenshot:', error);
    return null;
  }
}

/**
 * Geocode a Plus Code (e.g., "Q8F9+VF Rawai") to coordinates
 */
async function geocodePlusCode(
  plusCode: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    console.log('[WhatsApp] Geocoding Plus Code:', plusCode);
    
    // Use Google Geocoding API or OpenStreetMap Nominatim
    const encoded = encodeURIComponent(plusCode);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'PropPulse/1.0',
        },
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    
    // Fallback: Try Google Maps Geocoding if we have API key
    const googleKey = process.env.GOOGLE_MAPS_API_KEY;
    if (googleKey) {
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${googleKey}`
      );
      const googleData = await googleResponse.json();
      if (googleData.results?.[0]?.geometry?.location) {
        const loc = googleData.results[0].geometry.location;
        return {
          latitude: loc.lat,
          longitude: loc.lng,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('[WhatsApp] Error geocoding Plus Code:', error);
    return null;
  }
}

/**
 * Geocode an address to coordinates
 */
async function geocodeAddress(
  address: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    console.log('[WhatsApp] Geocoding address:', address);
    
    const encoded = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'PropPulse/1.0',
        },
      }
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    
    return null;
  } catch (error) {
    console.error('[WhatsApp] Error geocoding address:', error);
    return null;
  }
}

/**
 * Check if text contains a Google Maps URL
 */
function isGoogleMapsUrl(text: string): boolean {
  const patterns = [
    /maps\.app\.goo\.gl/i,
    /goo\.gl\/maps/i,
    /google\.com\/maps/i,
    /maps\.google\.com/i,
  ];
  return patterns.some(p => p.test(text));
}

/**
 * Extract coordinates from Google Maps URL
 * Supports:
 * - https://maps.app.goo.gl/xxx (short URL - needs redirect)
 * - https://www.google.com/maps/@lat,lng,zoom
 * - https://www.google.com/maps/place/.../@lat,lng,zoom
 * - https://maps.google.com/maps?ll=lat,lng
 * - https://www.google.com/maps?q=lat,lng
 */
async function extractCoordsFromGoogleMapsUrl(
  url: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    let finalUrl = url;
    
    // If it's a short URL (maps.app.goo.gl), follow the redirect
    if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
      console.log('[WhatsApp] Following Google Maps short URL redirect...');
      const response = await fetch(url, { 
        method: 'HEAD',
        redirect: 'follow' 
      });
      finalUrl = response.url;
      console.log('[WhatsApp] Resolved URL:', finalUrl);
    }
    
    // Try to extract coordinates from URL patterns
    
    // Pattern 1: @lat,lng in URL (most common)
    const atPattern = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const atMatch = finalUrl.match(atPattern);
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2]),
      };
    }
    
    // Pattern 2: ll=lat,lng query param
    const llPattern = /[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const llMatch = finalUrl.match(llPattern);
    if (llMatch) {
      return {
        latitude: parseFloat(llMatch[1]),
        longitude: parseFloat(llMatch[2]),
      };
    }
    
    // Pattern 3: q=lat,lng query param
    const qPattern = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const qMatch = finalUrl.match(qPattern);
    if (qMatch) {
      return {
        latitude: parseFloat(qMatch[1]),
        longitude: parseFloat(qMatch[2]),
      };
    }
    
    // Pattern 4: !3d and !4d for lat/lng (embedded maps)
    const embeddedPattern = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
    const embeddedMatch = finalUrl.match(embeddedPattern);
    if (embeddedMatch) {
      return {
        latitude: parseFloat(embeddedMatch[1]),
        longitude: parseFloat(embeddedMatch[2]),
      };
    }
    
    console.log('[WhatsApp] Could not extract coordinates from URL:', finalUrl);
    return null;
  } catch (error) {
    console.error('[WhatsApp] Error extracting coords from Google Maps URL:', error);
    return null;
  }
}

/**
 * Parse incoming message to determine intent
 */
async function parseMessage(message: WhatsAppMessage): Promise<ParsedCommand> {
  const result: ParsedCommand = {
    command: null,
    rawText: '',
    isPhoto: false,
    isLocation: false,
  };
  
  // Handle text messages
  if (message.type === 'text' && message.text?.body) {
    result.rawText = message.text.body.trim();
    
    // Check for commands first
    for (const [command, pattern] of Object.entries(COMMAND_PATTERNS)) {
      if (pattern.test(result.rawText)) {
        result.command = command as BotCommand;
        break;
      }
    }
    
    // Check if it's a Google Maps URL (when not already a command)
    if (!result.command && isGoogleMapsUrl(result.rawText)) {
      console.log('[WhatsApp] Detected Google Maps URL:', result.rawText);
      const coords = await extractCoordsFromGoogleMapsUrl(result.rawText);
      if (coords) {
        console.log('[WhatsApp] Extracted coordinates:', coords.latitude, coords.longitude);
        result.isLocation = true;
        result.location = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
      }
    }
    
    // Try to parse as number (only if not a command or location)
    if (!result.command && !result.isLocation) {
      const num = parseInt(result.rawText, 10);
      if (!isNaN(num)) {
        result.numericValue = num;
      }
    }
  }
  
  // Handle image messages
  if (message.type === 'image' && message.image?.id) {
    result.isPhoto = true;
    result.photoId = message.image.id;
  }
  
  // Handle location messages
  if (message.type === 'location' && message.location) {
    result.isLocation = true;
    result.location = {
      latitude: message.location.latitude,
      longitude: message.location.longitude,
      name: message.location.name,
      address: message.location.address,
    };
  }
  
  // Handle button/interactive replies
  if (message.type === 'button' && message.button?.payload) {
    result.rawText = message.button.payload;
    // Check if it matches a command
    for (const [command, pattern] of Object.entries(COMMAND_PATTERNS)) {
      if (pattern.test(result.rawText)) {
        result.command = command as BotCommand;
        break;
      }
    }
  }
  
  if (message.type === 'interactive') {
    if (message.interactive?.button_reply?.id) {
      result.rawText = message.interactive.button_reply.id;
    } else if (message.interactive?.list_reply?.id) {
      result.rawText = message.interactive.list_reply.id;
    }
    
    // Check if it matches a command
    for (const [command, pattern] of Object.entries(COMMAND_PATTERNS)) {
      if (pattern.test(result.rawText)) {
        result.command = command as BotCommand;
        break;
      }
    }
  }
  
  return result;
}

/**
 * Download image from Twilio and upload to ImageKit
 * 
 * Twilio provides direct media URLs that require Basic Auth to access
 */
async function downloadAndUploadImage(
  mediaUrl: string,
  sessionId: string
): Promise<string | null> {
  try {
    // Get Twilio credentials for media download
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      console.error('[WhatsApp] Twilio credentials not configured - accountSid:', !!accountSid, 'authToken:', !!authToken);
      return null;
    }
    
    console.log(`[WhatsApp] Downloading image from: ${mediaUrl}`);
    
    // Download the image from Twilio (requires Basic Auth)
    // Twilio media URLs redirect to S3, we need to follow redirects manually
    // with auth header only on the initial request
    const imageResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      },
      redirect: 'follow', // Follow redirects automatically
    });
    
    console.log(`[WhatsApp] Twilio response status: ${imageResponse.status}, url: ${imageResponse.url}`);
    
    if (!imageResponse.ok) {
      const errorText = await imageResponse.text().catch(() => 'No error body');
      console.error(`[WhatsApp] Failed to download image: ${imageResponse.status} - ${errorText}`);
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }
    
    const contentType = imageResponse.headers.get('content-type');
    console.log(`[WhatsApp] Content-Type: ${contentType}`);
    
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    
    if (imageBuffer.length === 0) {
      console.error('[WhatsApp] Downloaded image is empty (0 bytes)');
      return null;
    }
    
    console.log(`[WhatsApp] Downloaded image, size: ${imageBuffer.length} bytes`);
    
    // Upload to ImageKit
    const timestamp = Date.now();
    const extension = contentType?.includes('png') ? 'png' : 'jpg';
    const fileName = `whatsapp-${sessionId}-${timestamp}.${extension}`;
    
    const uploaded = await imagekit.upload({
      file: imageBuffer,
      fileName,
      folder: '/whatsapp-listings',
    });
    
    console.log(`[WhatsApp] Uploaded to ImageKit: ${uploaded.url}`);
    
    return uploaded.url;
    
  } catch (error) {
    console.error('[WhatsApp] Error downloading/uploading image:', error);
    return null;
  }
}
