/**
 * WhatsApp Listing Bot Types
 * 
 * Type definitions for the WhatsApp-based property listing workflow
 */

// ============================================
// SESSION STATES
// ============================================

export type WhatsAppSessionStatus =
  // New Listing Flow
  | 'AWAITING_LISTING_TYPE'  // First: Ask if FOR_SALE or FOR_RENT
  | 'AWAITING_PROPERTY_TYPE' // Second: Ask property category (Villa, Condo, etc.)
  | 'AWAITING_OWNERSHIP'     // Third (only for sale): Freehold or Leasehold?
  | 'AWAITING_PHOTOS'        // Fourth: Start collecting photos
  | 'COLLECTING_PHOTOS'      // Receiving photos (min 8)
  | 'AWAITING_MORE_PHOTOS'   // Asked if user wants more photos
  | 'AWAITING_LOCATION'      // Waiting for GPS location share
  | 'AWAITING_PRICE'         // Ask for price
  | 'AWAITING_BEDROOMS'      // Ask for number of bedrooms
  | 'AWAITING_BATHROOMS'     // Ask for number of bathrooms
  | 'PROCESSING'             // AI analyzing photos
  | 'AWAITING_CONFIRMATION'  // Showing preview
  | 'COMPLETED'              // Property created
  | 'CANCELLED'              // User cancelled
  | 'ERROR'                  // Error occurred
  // Owner Update Flow
  | 'OWNER_UPDATE_SELECT_PROPERTY'  // Selecting which property to update
  | 'OWNER_UPDATE_CONFIRM_PROPERTY' // Confirm the selected property
  | 'OWNER_UPDATE_NAME'             // Enter owner name
  | 'OWNER_UPDATE_PHONE'            // Enter phone number
  | 'OWNER_UPDATE_COMPANY'          // Enter company/agency name
  | 'OWNER_UPDATE_COMMISSION'       // Enter commission rate
  // Search Owner Flow
  | 'SEARCH_OWNER_QUERY'            // Waiting for search query
  | 'SEARCH_OWNER_RESULTS'          // Showing search results (with pagination)
  // Update Photos Flow
  | 'UPDATE_PHOTOS_SELECT_PROPERTY' // Selecting which property to update photos for
  | 'UPDATE_PHOTOS_VIEW_CURRENT'    // Viewing current photos
  | 'UPDATE_PHOTOS_SELECT_ACTION'   // Choose: add, replace, or delete photos
  | 'UPDATE_PHOTOS_COLLECTING'      // Collecting new photos
  | 'UPDATE_PHOTOS_REPLACE_SELECT'  // Select which photo to replace
  | 'UPDATE_PHOTOS_CONFIRM'         // Confirm changes
  // TM30 Accommodation Flow
  | 'TM30_AWAITING_ID_CARD'         // Step 1: Waiting for ID card photo
  | 'TM30_CONFIRM_ID_CARD_DATA'     // Step 2: Confirm OCR data from ID card
  | 'TM30_AWAITING_BLUEBOOK'        // Step 3: Waiting for Bluebook photo
  | 'TM30_CONFIRM_BLUEBOOK_DATA'    // Step 4: Confirm OCR data from Bluebook
  | 'TM30_AWAITING_PHONE'           // Step 5: Ask for phone number
  | 'TM30_AWAITING_ACCOM_NAME'      // Step 6: Ask for accommodation name
  | 'TM30_CONFIRM_ALL'              // Step 7: Show full summary, confirm all
  | 'TM30_PROCESSING'               // Step 8: GitHub workflow running
  | 'TM30_COMPLETED';               // Step 9: Done

// ============================================
// PROPERTY ENUMS (matching Prisma schema)
// ============================================

export type ListingType = 'FOR_SALE' | 'FOR_RENT';
export type PropertyCategoryType = 'LUXURY_VILLA' | 'APARTMENT' | 'RESIDENTIAL_HOME' | 'OFFICE_SPACES';
export type OwnershipTypeEnum = 'FREEHOLD' | 'LEASEHOLD';

// ============================================
// WHATSAPP WEBHOOK TYPES (Meta Cloud API)
// ============================================

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: {
    messaging_product: 'whatsapp';
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppStatus[];
  };
  field: 'messages';
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'location' | 'button' | 'interactive';
  text?: {
    body: string;
  };
  image?: {
    caption?: string;
    mime_type: string;
    sha256?: string;
    id: string;
    url?: string; // Twilio provides direct URL
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  button?: {
    text: string;
    payload: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  // Twilio-specific: multiple media URLs in one message
  mediaUrls?: string[];
}

export interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

// ============================================
// SESSION DATA TYPES
// ============================================

export interface WhatsAppListingSession {
  id: string;
  phoneNumber: string;
  whatsappId: string;
  status: WhatsAppSessionStatus;
  
  // Property classification (collected via conversation)
  listingType?: ListingType;         // FOR_SALE or FOR_RENT
  propertyCategory?: PropertyCategoryType; // LUXURY_VILLA, APARTMENT, etc.
  ownershipType?: OwnershipTypeEnum; // FREEHOLD or LEASEHOLD (only for sale)
  
  // Property details (collected via conversation)
  askingPrice?: string;
  bedrooms?: number;
  bathrooms?: number;
  
  // Collected images
  images: string[];
  imageCount: number;
  
  // Location data
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  district?: string;
  
  // AI detected features
  detectedFeatures?: DetectedPropertyFeatures;
  
  // Generated content
  generatedTitle?: string;
  generatedDescription?: string;
  generatedContentHtml?: string;
  suggestedPrice?: string;
  
  // POI scores
  poiScores?: PoiScoresData;
  
  // Final property
  propertyId?: string;
  
  // Owner Update Flow
  ownerUpdatePropertyId?: string;      // Property being updated
  ownerUpdatePropertyNumber?: string;  // Listing number (PP-XXXX)
  ownerUpdateName?: string;            // Collected owner name
  ownerUpdatePhone?: string;           // Collected phone number
  ownerUpdateCommission?: number;      // Collected commission rate
  
  // Photo Update Flow
  photoUpdatePropertyId?: string;      // Property being updated
  photoUpdateAction?: 'add' | 'replace' | 'delete';  // Current action
  photoUpdatePosition?: number;        // Position to replace/delete
  photoUpdateNewImages?: string[];     // New images collected
  
  // TM30 Accommodation Flow
  tm30RequestId?: string;              // Database request ID
  tm30IdCardUrl?: string;              // Uploaded ID card image URL
  tm30BluebookUrl?: string;            // Uploaded Bluebook image URL
  tm30OwnerFirstName?: string;         // Extracted from ID card
  tm30OwnerLastName?: string;          // Extracted from ID card
  tm30OwnerGender?: 'Male' | 'Female'; // Extracted from ID card
  tm30HouseIdNumber?: string;          // Extracted from Bluebook
  tm30AddressNumber?: string;          // Extracted from Bluebook
  tm30VillageNumber?: string;          // Extracted from Bluebook
  tm30Province?: string;               // Extracted from Bluebook
  tm30District?: string;               // Extracted from Bluebook
  tm30SubDistrict?: string;            // Extracted from Bluebook
  tm30PostalCode?: string;             // Extracted from Bluebook
  tm30Phone?: string;                  // User input
  tm30AccommodationName?: string;      // User input
  
  // Metadata
  initiatedBy?: string;
  initiatedByName?: string;
  errorMessage?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface DetectedPropertyFeatures {
  propertyType: 'LUXURY_VILLA' | 'APARTMENT' | 'RESIDENTIAL_HOME' | 'OFFICE_SPACES';
  category: string;
  beds: number;
  baths: number;
  estimatedSqft?: number;
  hasPool: boolean;
  hasGarage: boolean;
  hasGarden: boolean;
  hasSeaView: boolean;
  amenities: string[];
  style: string;
  condition: 'new' | 'excellent' | 'good' | 'needs_renovation';
  highlights: string[];
  suggestedTitle: string;
}

export interface PoiScoresData {
  beachScore: number;
  familyScore: number;
  convenienceScore: number;
  quietnessScore: number;
  nearbyPois: NearbyPoiInfo[];
}

export interface NearbyPoiInfo {
  name: string;
  category: string;
  distanceMeters: number;
  distanceFormatted: string;
}

// ============================================
// COMMAND TYPES
// ============================================

export type BotCommand = 
  | 'START_LISTING'  // "Toast 1" or "Listing" or "Start"
  | 'UPDATE_OWNER'   // "3" or "Update owner" - Update owner details
  | 'SEARCH_OWNER'   // "4" or "Search" - Search owner/agency
  | 'UPDATE_PHOTOS'  // "5" or "Update photos" - Update property photos
  | 'TM30_ACCOM'     // "6" or "TM30" - Add TM30 accommodation
  | 'FOR_SALE'       // User selected FOR_SALE
  | 'FOR_RENT'       // User selected FOR_RENT
  | 'VILLA'          // Property type selection
  | 'CONDO'          // Property type selection
  | 'HOUSE'          // Property type selection
  | 'OFFICE'         // Property type selection
  | 'FREEHOLD'       // Ownership type
  | 'LEASEHOLD'      // Ownership type
  | 'MORE_PHOTOS'    // "Yes" / "More"
  | 'DONE_PHOTOS'    // "3" / "Done"
  | 'CONFIRM'        // "Confirm" / "Ok"
  | 'CANCEL'         // "Cancel"
  | 'RESTART'        // "Restart"
  | 'HELP'           // "Help" / "?"
  | 'STATUS'         // "Status"
  | 'NEXT_PAGE'      // "Next" / "More" - Pagination next
  | 'PREV_PAGE'      // "Prev" / "Back" - Pagination previous
  | 'MENU';          // "Menu" - Go back to main menu

export interface ParsedCommand {
  command: BotCommand | null;
  rawText: string;
  isPhoto: boolean;
  isLocation: boolean;
  photoId?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  numericValue?: number; // For prices, bedrooms, bathrooms
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface BotMessage {
  text?: string;
  mediaUrl?: string;
  caption?: string;
}

export interface BotResponse {
  text?: string;
  mediaUrl?: string;
  caption?: string;
  buttons?: BotButton[];
  quickReplies?: string[];
  // For multi-message responses (e.g., search results with images)
  messages?: BotMessage[];
}

export interface BotButton {
  id: string;
  title: string;
}

// ============================================
// AI ANALYSIS TYPES
// ============================================

export interface ImageAnalysisRequest {
  imageUrls: string[];
  sessionId: string;
}

export interface ImageAnalysisResult {
  features: DetectedPropertyFeatures;
  confidence: number;
  rawAnalysis: string;
}

// ============================================
// CONSTANTS
// ============================================

export const MIN_PHOTOS_REQUIRED = 8;
export const MAX_PHOTOS_ALLOWED = 30;
export const SESSION_EXPIRY_HOURS = 24;

// Command patterns (supports multiple languages)
// NOTE: Numeric choices (1, 2, 3, 4, 5, 6) are handled contextually in state handlers
export const COMMAND_PATTERNS: Record<BotCommand, RegExp> = {
  START_LISTING: /^(toast\s*1|listing|start|begin|new listing)/i,
  UPDATE_OWNER: /^(update owner|owner|eigenaar|contact)/i,
  SEARCH_OWNER: /^(search|zoek|find|vind)/i,
  UPDATE_PHOTOS: /^(update photos|photos|foto|fotos|afbeeldingen|images)/i,
  TM30_ACCOM: /^(tm30|immigration|accommodatie|accommodation)/i,
  FOR_SALE: /^(sale|for sale|buy|koop|verkoop)/i,
  FOR_RENT: /^(rent|for rent|huur|rental)/i,
  VILLA: /^(villa|luxury villa)/i,
  CONDO: /^(condo|condominium|apartment)/i,
  HOUSE: /^(house|home|residential)/i,
  OFFICE: /^(office|commercial)/i,
  FREEHOLD: /^(freehold|full ownership)/i,
  LEASEHOLD: /^(leasehold|lease)/i,
  MORE_PHOTOS: /^(yes|meer|more|add more|ja)/i,
  DONE_PHOTOS: /^(done|finish|no more|nee|klaar)/i,
  CONFIRM: /^(confirm|ok|publish|bevestig)/i,
  CANCEL: /^(cancel|stop|quit|exit|annuleer)/i,
  RESTART: /^(restart|reset|opnieuw)/i,
  HELP: /^(help|\?|info)/i,
  STATUS: /^(status|progress)/i,
  NEXT_PAGE: /^(next|volgende|meer listings|more listings)$/i,
  PREV_PAGE: /^(prev|previous|vorige|back|terug)$/i,
  MENU: /^(menu|home|main|hoofdmenu)$/i,
};

// Bot messages (English)
export const BOT_MESSAGES = {
  WELCOME: `🏠 *Welcome to the Property Listing Tool!*

I'll help you create a new listing step by step.

*First, what type of listing is this?*

Reply *"1"* for 🏷️ *FOR SALE*
Reply *"2"* for 🔑 *FOR RENT*

━━━━━━━━━━━━━━━━━━━━━
💡 Or reply *"3"* to update owner/agent details
🔍 Or reply *"4"* to search owner/agency
📸 Or reply *"5"* to update property photos
🇹🇭 Or reply *"6"* for TM30 accommodation`,

  ASK_PROPERTY_TYPE: `🏡 *What type of property is this?*

Reply *"1"* for 🏰 *Villa / Luxury Villa*
Reply *"2"* for 🏢 *Condo / Apartment*
Reply *"3"* for 🏠 *House / Home*
Reply *"4"* for 🏢 *Office / Commercial*`,

  ASK_OWNERSHIP: `📜 *What is the ownership type?*

Reply *"1"* for 🏆 *Freehold* (Full ownership)
Reply *"2"* for 📋 *Leasehold*`,

  ASK_PHOTOS: `📸 *Now let's add photos!*

Send at least *8 photos* of the property:
• Exterior / facade
• Living room
• Kitchen
• Bedrooms
• Bathrooms
• Pool / garden (if any)
• Views

📌 *Tip:* The first photo will be the main listing image!`,

  PHOTO_RECEIVED: (count: number, min: number) => 
    `📸 Photo ${count} received! ${count < min ? `(${min - count} more needed)` : '✅ Minimum reached!'}`,

  MIN_PHOTOS_REACHED: `✅ *8 photos received!*

Would you like to add more photos for a better listing?

Reply *"yes"* to add more photos
Reply *"done"* to continue`,

  ASK_LOCATION: `📍 *Perfect! Now share the location.*

You can share the location in 3 ways:
1️⃣ Tap 📎 → "Location" → Share live location
2️⃣ Paste a *Google Maps link*
3️⃣ Send a *screenshot* of Google Maps

This ensures accurate POI information in your listing!`,

  ASK_PRICE: (listingType: ListingType) => 
    listingType === 'FOR_RENT'
      ? `💰 *What is the monthly rent?*

Reply with the price, for example:
• *35000* (THB per month)
• *50,000 THB*
• *$1,200/month*`
      : `💰 *What is the asking price?*

Reply with the price, for example:
• *15000000* (THB)
• *15,000,000 THB*
• *$450,000*`,

  ASK_BEDROOMS: `🛏️ *How many bedrooms?*

Reply with a number (0-10)`,

  ASK_BATHROOMS: `🚿 *How many bathrooms?*

Reply with a number (0-10)`,

  PROCESSING: `⏳ *Analyzing your property...*

I'm using AI to:
• Detect property features
• Identify amenities
• Assess condition and style
• Generate POI-based description

This takes about 30 seconds...`,

  LOCATION_RECEIVED: (address: string) =>
    `📍 *Location received!*

${address}`,

  ANALYSIS_COMPLETE: (features: DetectedPropertyFeatures, session: WhatsAppListingSession) =>
    `🎉 *Analysis complete!*

📋 *Property Summary:*
• Type: ${session.listingType === 'FOR_RENT' ? '🔑 For Rent' : '🏷️ For Sale'}
• Category: ${formatCategory(session.propertyCategory)}
${session.ownershipType ? `• Ownership: ${session.ownershipType === 'FREEHOLD' ? '🏆 Freehold' : '📋 Leasehold'}` : ''}
• Bedrooms: ${session.bedrooms || features.beds}
• Bathrooms: ${session.bathrooms || features.baths}
• Price: ${session.askingPrice || 'Contact for price'}

🤖 *AI Detected:*
• Pool: ${features.hasPool ? '✅' : '❌'}
• Garden: ${features.hasGarden ? '✅' : '❌'}
• Sea View: ${features.hasSeaView ? '✅' : '❌'}
• Style: ${features.style}
• Condition: ${features.condition}

📝 *Generated Title:*
"${features.suggestedTitle}"

Reply *"confirm"* to publish
Reply *"cancel"* to discard`,

  LISTING_CREATED: (listingNumber: string, slug: string, propertyUrl: string) =>
    `🎉 *Listing successfully created!*

📋 Listing number: *${listingNumber}*
🔗 Link: ${propertyUrl}

The listing is now live on the website!

Send *"start"* to create another listing.`,

  ERROR: (message: string) =>
    `❌ *Something went wrong*

${message}

Try again with "restart" or contact support.`,

  CANCELLED: `❌ *Listing cancelled*

You can start again anytime with "start".`,

  HELP: `ℹ️ *Available commands:*

• *Start* - Start new listing
• *3* - Update owner/agent details
• *4* - Search owner/agency
• *5* - Update property photos
• *Done* - Finished uploading photos
• *Yes* - Add more photos
• *Confirm* - Publish listing
• *Cancel* - Cancel current session
• *Menu* - Go back to main menu
• *Status* - View progress
• *Help* - Show this message`,

  SESSION_EXPIRED: `⏰ *Session expired*

Your listing session has expired (24 hour limit).
Start again with "start".`,

  INVALID_NUMBER: `❌ Please enter a valid number.`,
  
  INVALID_CHOICE: `❌ Please select a valid option.`,
  
  // ============================================
  // OWNER UPDATE FLOW MESSAGES
  // ============================================
  
  OWNER_UPDATE_SELECT: (properties: Array<{ listingNumber: string; title: string; price: string }>) => {
    const list = properties.map((p, i) => 
      `${i + 1}️⃣ *${p.listingNumber}* - ${p.title.slice(0, 30)}${p.title.length > 30 ? '...' : ''}\n   ${p.price}`
    ).join('\n\n');
    
    return `🏠 *Update Owner/Agent Details*

Recent properties:

${list}

Reply *1-5* to select from list
Or enter listing number (e.g. *89* for PP-0089)`;
  },
  
  OWNER_UPDATE_CONFIRM: (property: { listingNumber: string; title: string; price: string; beds: number; baths: number; location: string }) =>
    `📍 *Selected Property:*

*${property.listingNumber}* - ${property.title}
💰 ${property.price} | 🛏️ ${property.beds} bed | 🚿 ${property.baths} bath
📍 ${property.location}

Is this correct?
Reply *"yes"* to continue or *"no"* to select another`,

  OWNER_UPDATE_ASK_NAME: `👤 *Enter the owner/agent full name:*

Example: John Smith`,

  OWNER_UPDATE_ASK_PHONE: `📞 *Enter the phone number:*

Include country code for international numbers.
Examples: 0812345678, +66812345678, +31612345678`,

  OWNER_UPDATE_ASK_COMPANY: `🏢 *Enter the company/agency name:*

Example: Phuket Real Estate Co.

Send *"skip"* if not applicable.`,

  OWNER_UPDATE_ASK_COMMISSION: `💰 *Enter the commission rate (%):*

Example: 3 or 5`,

  OWNER_UPDATE_SUCCESS: (data: { listingNumber: string; name: string; phone: string; company?: string; commission: number }) =>
    `✅ *Owner details updated!*

📋 Property: *${data.listingNumber}*
👤 Owner: ${data.name}
📞 Phone: ${data.phone}${data.company ? `\n🏢 Company: ${data.company}` : ''}
💰 Commission: ${data.commission}%

Send *"Start"* to create a new listing
Or *"3"* to update another property`,

  OWNER_UPDATE_NOT_FOUND: (input: string) =>
    `❌ *Property not found*

Could not find property with number: ${input}

Please try again with a valid listing number.`,

  NO_PROPERTIES_FOUND: `❌ *No properties found*

There are no properties in the system yet.
Create a new listing first with *"Start"*`,

  // ============================================
  // SEARCH OWNER FLOW MESSAGES
  // ============================================
  
  SEARCH_OWNER_ASK_QUERY: `🔍 *Search Owner/Agency*

Enter a name or company to search:

Examples:
• "PSM Phuket" (company)
• "Jack" (owner name)
• "Rawai" (location)

Send *"menu"* to go back.`,

  SEARCH_OWNER_NO_RESULTS: (query: string) =>
    `🔍 *No results found*

No properties found matching "${query}"

Try:
• Different spelling
• Partial name (e.g. "PSM" instead of "PSM Phuket")
• Owner name or location

Send another search or *"menu"* to go back.`,

  SEARCH_OWNER_RESULTS_HEADER: (query: string, total: number, page: number, totalPages: number) =>
    `🔍 *Found ${total} listing${total === 1 ? '' : 's'} for "${query}"*

📄 Page ${page} of ${totalPages}`,

  SEARCH_OWNER_CONTACT: (data: { name?: string; company?: string; phone?: string; countryCode?: string; email?: string }) => {
    let msg = `━━━━━━━━━━━━━━━━━━━━━
📋 *Contact Details:*
`;
    if (data.name) msg += `👤 ${data.name}\n`;
    if (data.company) msg += `🏢 ${data.company}\n`;
    if (data.phone) msg += `📞 ${data.countryCode || '+66'}${data.phone}\n`;
    if (data.email) msg += `📧 ${data.email}\n`;
    return msg + `━━━━━━━━━━━━━━━━━━━━━`;
  },

  SEARCH_OWNER_PAGINATION: (page: number, totalPages: number) => {
    let msg = `\n📄 *Page ${page} of ${totalPages}*\n\n`;
    if (page > 1) msg += `Send *"prev"* for previous page\n`;
    if (page < totalPages) msg += `Send *"next"* for next page\n`;
    msg += `Send *"menu"* to go back`;
    return msg;
  },

  MAIN_MENU: `👋 *Main Menu*

Send *"Start"* to create a new listing
Send *"3"* to update owner/agent details
Send *"4"* to search owner/agency
Send *"5"* to update property photos

Or send *"Help"* for more options.`,

  // ============================================
  // UPDATE PHOTOS FLOW MESSAGES
  // ============================================
  
  UPDATE_PHOTOS_SELECT: (properties: Array<{ listingNumber: string; title: string; imageCount: number }>) => {
    const list = properties.map((p, i) => 
      `${i + 1}️⃣ *${p.listingNumber}* - ${p.title.slice(0, 25)}${p.title.length > 25 ? '...' : ''}\n   📸 ${p.imageCount} foto's`
    ).join('\n\n');
    
    return `📸 *Update Property Photos*

Select a property to update photos:

${list}

Reply *1-5* to select from list
Or enter listing number (e.g. *89* for PP-0089)
Or send *"menu"* to go back`;
  },
  
  UPDATE_PHOTOS_CONFIRM_PROPERTY: (property: { listingNumber: string; title: string; imageCount: number; location: string }) =>
    `📍 *Selected Property:*

*${property.listingNumber}* - ${property.title}
📸 Current photos: ${property.imageCount}
📍 ${property.location}

Is this correct?
Reply *"yes"* to continue or *"no"* to select another`,

  UPDATE_PHOTOS_CURRENT_OVERVIEW: (property: { listingNumber: string; title: string }, images: Array<{ position: number; alt: string | null }>) => {
    const imageList = images.map(img => 
      `${img.position}. ${img.alt?.slice(0, 40) || 'No description'}${(img.alt?.length || 0) > 40 ? '...' : ''}`
    ).join('\n');
    
    return `📸 *Current Photos for ${property.listingNumber}*

${imageList || 'No photos yet'}

━━━━━━━━━━━━━━━━━━━━━
*What would you like to do?*

Reply *"1"* to ➕ *Add more photos*
Reply *"2"* to 🔄 *Replace a specific photo*
Reply *"3"* to 🗑️ *Delete a photo*
Reply *"menu"* to go back`;
  },

  UPDATE_PHOTOS_SELECT_TO_REPLACE: (images: Array<{ position: number; alt: string | null }>) => {
    const imageList = images.map(img => 
      `${img.position}. ${img.alt?.slice(0, 35) || 'No description'}${(img.alt?.length || 0) > 35 ? '...' : ''}`
    ).join('\n');
    
    return `🔄 *Which photo do you want to replace?*

${imageList}

Reply with the number (1-${images.length}) of the photo to replace
Or send *"cancel"* to go back`;
  },

  UPDATE_PHOTOS_SELECT_TO_DELETE: (images: Array<{ position: number; alt: string | null }>) => {
    const imageList = images.map(img => 
      `${img.position}. ${img.alt?.slice(0, 35) || 'No description'}${(img.alt?.length || 0) > 35 ? '...' : ''}`
    ).join('\n');
    
    return `🗑️ *Which photo do you want to delete?*

${imageList}

Reply with the number (1-${images.length}) of the photo to delete
Or send *"cancel"* to go back`;
  },

  UPDATE_PHOTOS_SEND_NEW: `📸 *Send your new photo(s)*

Upload the photo(s) you want to add.

When finished, reply *"done"*
Or send *"cancel"* to go back`,

  UPDATE_PHOTOS_SEND_REPLACEMENT: (position: number) =>
    `📸 *Send the replacement photo for position ${position}*

Upload a single photo to replace the current one.

Or send *"cancel"* to go back`,

  UPDATE_PHOTOS_PHOTO_ADDED: (count: number, total: number) =>
    `✅ Photo added! (${count} new, ${total} total)

Send more photos or reply *"done"* when finished.`,

  UPDATE_PHOTOS_PHOTO_REPLACED: (position: number) =>
    `✅ Photo at position ${position} has been replaced!

Send *"menu"* to go back or continue updating.`,

  UPDATE_PHOTOS_PHOTO_DELETED: (position: number, remaining: number) =>
    `✅ Photo at position ${position} has been deleted!

${remaining} photos remaining.

Send *"menu"* to go back or continue updating.`,

  UPDATE_PHOTOS_SUCCESS: (listingNumber: string, totalPhotos: number) =>
    `🎉 *Photos updated successfully!*

📋 Property: *${listingNumber}*
📸 Total photos: ${totalPhotos}

Send *"5"* to update more photos
Send *"menu"* to go back to main menu`,

  UPDATE_PHOTOS_NOT_FOUND: (input: string) =>
    `❌ *Property not found*

Could not find property with number: ${input}

Please try again with a valid listing number.`,

  UPDATE_PHOTOS_NO_PHOTOS: `❌ *No photos to update*

This property has no photos yet.
Reply *"1"* to add photos first.`,

  UPDATE_PHOTOS_MIN_PHOTOS_WARNING: (current: number) =>
    `⚠️ *Warning: Minimum photos required*

This property has only ${current} photo(s).
Properties need at least 1 photo.

Are you sure you want to delete?
Reply *"yes"* to confirm or *"no"* to cancel`,

  // ============================================
  // TM30 ACCOMMODATION FLOW MESSAGES
  // ============================================
  
  TM30_START: `🇹🇭 *Add TM30 Accommodation*

I will help you register a new accommodation with Thailand Immigration.

📸 *Step 1: ID Card*
Send a photo of the owner's *Thai ID card* (บัตรประชาชน)

━━━━━━━━━━━━━━━━━━━━━
💡 Make sure the text is clearly readable`,

  TM30_ID_CARD_RECEIVED: (data: { firstName: string; lastName: string; gender: string }) =>
    `✅ *ID Card received!*

🔍 Scanned data:
• First name: ${data.firstName}
• Last name: ${data.lastName}
• Gender: ${data.gender === 'Female' ? 'Female 👩' : 'Male 👨'}

Is this correct?
Reply *"yes"* or *"no"*`,

  TM30_ID_CARD_RETRY: `❌ *Could not read data*

The ID card was not clear enough.
Send a new photo with:
• Good lighting
• No reflections
• Full card visible

Or type the name manually:
*firstname lastname gender*
(e.g. "RUEDEEKORN CHUNKERD female")`,

  TM30_ASK_BLUEBOOK: `📘 *Step 2: Bluebook (ทะเบียนบ้าน)*

Now send a photo of the *Tabienbaan* (house registration).
The page with:
• House ID number (เลขรหัสประจำบ้าน)
• Address details

━━━━━━━━━━━━━━━━━━━━━`,

  TM30_BLUEBOOK_RECEIVED: (data: { 
    houseId: string; 
    address: string; 
    village: string;
    subDistrict: string; 
    district: string; 
    province: string; 
    postalCode: string 
  }) =>
    `✅ *Bluebook received!*

🔍 Scanned data:
• House ID: ${data.houseId}
• Address: ${data.address}
• Moo: ${data.village}
• Tambon: ${data.subDistrict}
• Amphoe: ${data.district}
• Province: ${data.province}
• Postal code: ${data.postalCode}

Is this correct?
Reply *"yes"* or correct (e.g. "postcode 83100")`,

  TM30_BLUEBOOK_RETRY: `❌ *Could not read data*

The bluebook was not clear enough.
Send a new photo of the page with the House ID.

Or type the data manually:
*house_id, address, moo, tambon, amphoe, province, postcode*`,

  TM30_ASK_PHONE: `📞 *Step 3: Phone number*

What is the owner's phone number?

(e.g. 0986261646 or +66986261646)`,

  TM30_ASK_ACCOM_NAME: `🏠 *Step 4: Accommodation name*

What should the accommodation be called in TM30?

(e.g. "PHUKET: Villa Rawai" or "Villa Kata Beach")`,

  TM30_CONFIRM_ALL: (data: {
    firstName: string;
    lastName: string;
    gender: string;
    phone: string;
    houseId: string;
    address: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    accommodationName: string;
  }) =>
    `✅ *Complete Summary*

━━━━━━━━━━━━━━━━━━━━━
🏠 *${data.accommodationName}*
━━━━━━━━━━━━━━━━━━━━━

👤 *Owner:*
• Name: ${data.firstName} ${data.lastName}
• Gender: ${data.gender === 'Female' ? 'Female' : 'Male'}
• Tel: ${data.phone}

📍 *Address:*
• House ID: ${data.houseId}
• Address: ${data.address}
• ${data.subDistrict}, ${data.district}
• ${data.province} ${data.postalCode}

📎 *Documents:*
• ID Card: ✅
• Bluebook: ✅

━━━━━━━━━━━━━━━━━━━━━

All correct?
Reply *"confirm"* to start TM30
Or *"cancel"* to stop`,

  TM30_PROCESSING: `🚀 *TM30 Automation Started!*

The accommodation is now being automatically added to the TM30 system.

⏳ This takes about 2-3 minutes...
You will receive a message when it's done.`,

  TM30_SUCCESS: (data: { accommodationName: string; tm30Id?: string }) =>
    `✅ *TM30 Accommodation Added!*

🏠 ${data.accommodationName}
${data.tm30Id ? `📋 TM30 ID: ${data.tm30Id}` : ''}
✅ Status: Approved

You can now report guests for this accommodation!

━━━━━━━━━━━━━━━━━━━━━
Send *"6"* to add another accommodation
Send *"menu"* for the main menu`,

  TM30_FAILED: (error: string) =>
    `❌ *TM30 Registration Failed*

An error occurred:
${error}

Try again with *"6"*
Or contact support.`,

} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCategory(category?: PropertyCategoryType): string {
  if (!category) return 'Property';
  const map: Record<PropertyCategoryType, string> = {
    'LUXURY_VILLA': '🏰 Luxury Villa',
    'APARTMENT': '🏢 Condo/Apartment',
    'RESIDENTIAL_HOME': '🏠 House/Home',
    'OFFICE_SPACES': '🏢 Office',
  };
  return map[category] || category;
}
  // New Listing Flow
  | 'AWAITING_LISTING_TYPE'  // First: Ask if FOR_SALE or FOR_RENT
  | 'AWAITING_PROPERTY_TYPE' // Second: Ask property category (Villa, Condo, etc.)
  | 'AWAITING_OWNERSHIP'     // Third (only for sale): Freehold or Leasehold?
  | 'AWAITING_PHOTOS'        // Fourth: Start collecting photos
  | 'COLLECTING_PHOTOS'      // Receiving photos (min 8)
  | 'AWAITING_MORE_PHOTOS'   // Asked if user wants more photos
  | 'AWAITING_LOCATION'      // Waiting for GPS location share
  | 'AWAITING_PRICE'         // Ask for price
  | 'AWAITING_BEDROOMS'      // Ask for number of bedrooms
  | 'AWAITING_BATHROOMS'     // Ask for number of bathrooms
  | 'PROCESSING'             // AI analyzing photos
  | 'AWAITING_CONFIRMATION'  // Showing preview
  | 'COMPLETED'              // Property created
  | 'CANCELLED'              // User cancelled
  | 'ERROR'                  // Error occurred
  // Owner Update Flow
  | 'OWNER_UPDATE_SELECT_PROPERTY'  // Selecting which property to update
  | 'OWNER_UPDATE_CONFIRM_PROPERTY' // Confirm the selected property
  | 'OWNER_UPDATE_NAME'             // Enter owner name
  | 'OWNER_UPDATE_PHONE'            // Enter phone number
  | 'OWNER_UPDATE_COMPANY'          // Enter company/agency name
  | 'OWNER_UPDATE_COMMISSION'       // Enter commission rate
  // Search Owner Flow
  | 'SEARCH_OWNER_QUERY'            // Waiting for search query
  | 'SEARCH_OWNER_RESULTS'          // Showing search results (with pagination)
  // Update Photos Flow
  | 'UPDATE_PHOTOS_SELECT_PROPERTY' // Selecting which property to update photos for
  | 'UPDATE_PHOTOS_VIEW_CURRENT'    // Viewing current photos
  | 'UPDATE_PHOTOS_SELECT_ACTION'   // Choose: add, replace, or delete photos
  | 'UPDATE_PHOTOS_COLLECTING'      // Collecting new photos
  | 'UPDATE_PHOTOS_REPLACE_SELECT'  // Select which photo to replace
  | 'UPDATE_PHOTOS_CONFIRM'         // Confirm changes
  // TM30 Accommodation Flow
  | 'TM30_AWAITING_ID_CARD'         // Step 1: Waiting for ID card photo
  | 'TM30_CONFIRM_ID_CARD_DATA'     // Step 2: Confirm OCR data from ID card
  | 'TM30_AWAITING_BLUEBOOK'        // Step 3: Waiting for Bluebook photo
  | 'TM30_CONFIRM_BLUEBOOK_DATA'    // Step 4: Confirm OCR data from Bluebook
  | 'TM30_AWAITING_PHONE'           // Step 5: Ask for phone number
  | 'TM30_AWAITING_ACCOM_NAME'      // Step 6: Ask for accommodation name
  | 'TM30_CONFIRM_ALL'              // Step 7: Show full summary, confirm all
  | 'TM30_PROCESSING'               // Step 8: GitHub workflow running
  | 'TM30_COMPLETED';               // Step 9: Done

// ============================================
// PROPERTY ENUMS (matching Prisma schema)
// ============================================

export type ListingType = 'FOR_SALE' | 'FOR_RENT';
export type PropertyCategoryType = 'LUXURY_VILLA' | 'APARTMENT' | 'RESIDENTIAL_HOME' | 'OFFICE_SPACES';
export type OwnershipTypeEnum = 'FREEHOLD' | 'LEASEHOLD';

// ============================================
// WHATSAPP WEBHOOK TYPES (Meta Cloud API)
// ============================================

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: WhatsAppEntry[];
}

export interface WhatsAppEntry {
  id: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppChange {
  value: {
    messaging_product: 'whatsapp';
    metadata: {
      display_phone_number: string;
      phone_number_id: string;
    };
    contacts?: WhatsAppContact[];
    messages?: WhatsAppMessage[];
    statuses?: WhatsAppStatus[];
  };
  field: 'messages';
}

export interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

export interface WhatsAppMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'image' | 'location' | 'button' | 'interactive';
  text?: {
    body: string;
  };
  image?: {
    caption?: string;
    mime_type: string;
    sha256?: string;
    id: string;
    url?: string; // Twilio provides direct URL
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  button?: {
    text: string;
    payload: string;
  };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
  };
  // Twilio-specific: multiple media URLs in one message
  mediaUrls?: string[];
}

export interface WhatsAppStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
}

// ============================================
// SESSION DATA TYPES
// ============================================

export interface WhatsAppListingSession {
  id: string;
  phoneNumber: string;
  whatsappId: string;
  status: WhatsAppSessionStatus;
  
  // Property classification (collected via conversation)
  listingType?: ListingType;         // FOR_SALE or FOR_RENT
  propertyCategory?: PropertyCategoryType; // LUXURY_VILLA, APARTMENT, etc.
  ownershipType?: OwnershipTypeEnum; // FREEHOLD or LEASEHOLD (only for sale)
  
  // Property details (collected via conversation)
  askingPrice?: string;
  bedrooms?: number;
  bathrooms?: number;
  
  // Collected images
  images: string[];
  imageCount: number;
  
  // Location data
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  district?: string;
  
  // AI detected features
  detectedFeatures?: DetectedPropertyFeatures;
  
  // Generated content
  generatedTitle?: string;
  generatedDescription?: string;
  generatedContentHtml?: string;
  suggestedPrice?: string;
  
  // POI scores
  poiScores?: PoiScoresData;
  
  // Final property
  propertyId?: string;
  
  // Owner Update Flow
  ownerUpdatePropertyId?: string;      // Property being updated
  ownerUpdatePropertyNumber?: string;  // Listing number (PP-XXXX)
  ownerUpdateName?: string;            // Collected owner name
  ownerUpdatePhone?: string;           // Collected phone number
  ownerUpdateCommission?: number;      // Collected commission rate
  
  // Photo Update Flow
  photoUpdatePropertyId?: string;      // Property being updated
  photoUpdateAction?: 'add' | 'replace' | 'delete';  // Current action
  photoUpdatePosition?: number;        // Position to replace/delete
  photoUpdateNewImages?: string[];     // New images collected
  
  // TM30 Accommodation Flow
  tm30RequestId?: string;              // Database request ID
  tm30IdCardUrl?: string;              // Uploaded ID card image URL
  tm30BluebookUrl?: string;            // Uploaded Bluebook image URL
  tm30OwnerFirstName?: string;         // Extracted from ID card
  tm30OwnerLastName?: string;          // Extracted from ID card
  tm30OwnerGender?: 'Male' | 'Female'; // Extracted from ID card
  tm30HouseIdNumber?: string;          // Extracted from Bluebook
  tm30AddressNumber?: string;          // Extracted from Bluebook
  tm30VillageNumber?: string;          // Extracted from Bluebook
  tm30Province?: string;               // Extracted from Bluebook
  tm30District?: string;               // Extracted from Bluebook
  tm30SubDistrict?: string;            // Extracted from Bluebook
  tm30PostalCode?: string;             // Extracted from Bluebook
  tm30Phone?: string;                  // User input
  tm30AccommodationName?: string;      // User input
  
  // Metadata
  initiatedBy?: string;
  initiatedByName?: string;
  errorMessage?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface DetectedPropertyFeatures {
  propertyType: 'LUXURY_VILLA' | 'APARTMENT' | 'RESIDENTIAL_HOME' | 'OFFICE_SPACES';
  category: string;
  beds: number;
  baths: number;
  estimatedSqft?: number;
  hasPool: boolean;
  hasGarage: boolean;
  hasGarden: boolean;
  hasSeaView: boolean;
  amenities: string[];
  style: string;
  condition: 'new' | 'excellent' | 'good' | 'needs_renovation';
  highlights: string[];
  suggestedTitle: string;
}

export interface PoiScoresData {
  beachScore: number;
  familyScore: number;
  convenienceScore: number;
  quietnessScore: number;
  nearbyPois: NearbyPoiInfo[];
}

export interface NearbyPoiInfo {
  name: string;
  category: string;
  distanceMeters: number;
  distanceFormatted: string;
}

// ============================================
// COMMAND TYPES
// ============================================

export type BotCommand = 
  | 'START_LISTING'  // "Toast 1" or "Listing" or "Start"
  | 'UPDATE_OWNER'   // "3" or "Update owner" - Update owner details
  | 'SEARCH_OWNER'   // "4" or "Search" - Search owner/agency
  | 'UPDATE_PHOTOS'  // "5" or "Update photos" - Update property photos
  | 'TM30_ACCOM'     // "6" or "TM30" - Add TM30 accommodation
  | 'FOR_SALE'       // User selected FOR_SALE
  | 'FOR_RENT'       // User selected FOR_RENT
  | 'VILLA'          // Property type selection
  | 'CONDO'          // Property type selection
  | 'HOUSE'          // Property type selection
  | 'OFFICE'         // Property type selection
  | 'FREEHOLD'       // Ownership type
  | 'LEASEHOLD'      // Ownership type
  | 'MORE_PHOTOS'    // "Yes" / "More"
  | 'DONE_PHOTOS'    // "3" / "Done"
  | 'CONFIRM'        // "Confirm" / "Ok"
  | 'CANCEL'         // "Cancel"
  | 'RESTART'        // "Restart"
  | 'HELP'           // "Help" / "?"
  | 'STATUS'         // "Status"
  | 'NEXT_PAGE'      // "Next" / "More" - Pagination next
  | 'PREV_PAGE'      // "Prev" / "Back" - Pagination previous
  | 'MENU';          // "Menu" - Go back to main menu

export interface ParsedCommand {
  command: BotCommand | null;
  rawText: string;
  isPhoto: boolean;
  isLocation: boolean;
  photoId?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  numericValue?: number; // For prices, bedrooms, bathrooms
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface BotMessage {
  text?: string;
  mediaUrl?: string;
  caption?: string;
}

export interface BotResponse {
  text?: string;
  mediaUrl?: string;
  caption?: string;
  buttons?: BotButton[];
  quickReplies?: string[];
  // For multi-message responses (e.g., search results with images)
  messages?: BotMessage[];
}

export interface BotButton {
  id: string;
  title: string;
}

// ============================================
// AI ANALYSIS TYPES
// ============================================

export interface ImageAnalysisRequest {
  imageUrls: string[];
  sessionId: string;
}

export interface ImageAnalysisResult {
  features: DetectedPropertyFeatures;
  confidence: number;
  rawAnalysis: string;
}

// ============================================
// CONSTANTS
// ============================================

export const MIN_PHOTOS_REQUIRED = 8;
export const MAX_PHOTOS_ALLOWED = 30;
export const SESSION_EXPIRY_HOURS = 24;

// Command patterns (supports multiple languages)
// NOTE: Numeric choices (1, 2, 3, 4, 5, 6) are handled contextually in state handlers
export const COMMAND_PATTERNS: Record<BotCommand, RegExp> = {
  START_LISTING: /^(toast\s*1|listing|start|begin|new listing)/i,
  UPDATE_OWNER: /^(update owner|owner|eigenaar|contact)/i,
  SEARCH_OWNER: /^(search|zoek|find|vind)/i,
  UPDATE_PHOTOS: /^(update photos|photos|foto|fotos|afbeeldingen|images)/i,
  TM30_ACCOM: /^(tm30|immigration|accommodatie|accommodation)/i,
  FOR_SALE: /^(sale|for sale|buy|koop|verkoop)/i,
  FOR_RENT: /^(rent|for rent|huur|rental)/i,
  VILLA: /^(villa|luxury villa)/i,
  CONDO: /^(condo|condominium|apartment)/i,
  HOUSE: /^(house|home|residential)/i,
  OFFICE: /^(office|commercial)/i,
  FREEHOLD: /^(freehold|full ownership)/i,
  LEASEHOLD: /^(leasehold|lease)/i,
  MORE_PHOTOS: /^(yes|meer|more|add more|ja)/i,
  DONE_PHOTOS: /^(done|finish|no more|nee|klaar)/i,
  CONFIRM: /^(confirm|ok|publish|bevestig)/i,
  CANCEL: /^(cancel|stop|quit|exit|annuleer)/i,
  RESTART: /^(restart|reset|opnieuw)/i,
  HELP: /^(help|\?|info)/i,
  STATUS: /^(status|progress)/i,
  NEXT_PAGE: /^(next|volgende|meer listings|more listings)$/i,
  PREV_PAGE: /^(prev|previous|vorige|back|terug)$/i,
  MENU: /^(menu|home|main|hoofdmenu)$/i,
};

// Bot messages (English)
export const BOT_MESSAGES = {
  WELCOME: `🏠 *Welcome to the Property Listing Tool!*

I'll help you create a new listing step by step.

*First, what type of listing is this?*

Reply *"1"* for 🏷️ *FOR SALE*
Reply *"2"* for 🔑 *FOR RENT*

━━━━━━━━━━━━━━━━━━━━━
💡 Or reply *"3"* to update owner/agent details
🔍 Or reply *"4"* to search owner/agency
📸 Or reply *"5"* to update property photos
🇹🇭 Or reply *"6"* for TM30 accommodation`,

  ASK_PROPERTY_TYPE: `🏡 *What type of property is this?*

Reply *"1"* for 🏰 *Villa / Luxury Villa*
Reply *"2"* for 🏢 *Condo / Apartment*
Reply *"3"* for 🏠 *House / Home*
Reply *"4"* for 🏢 *Office / Commercial*`,

  ASK_OWNERSHIP: `📜 *What is the ownership type?*

Reply *"1"* for 🏆 *Freehold* (Full ownership)
Reply *"2"* for 📋 *Leasehold*`,

  ASK_PHOTOS: `📸 *Now let's add photos!*

Send at least *8 photos* of the property:
• Exterior / facade
• Living room
• Kitchen
• Bedrooms
• Bathrooms
• Pool / garden (if any)
• Views

📌 *Tip:* The first photo will be the main listing image!`,

  PHOTO_RECEIVED: (count: number, min: number) => 
    `📸 Photo ${count} received! ${count < min ? `(${min - count} more needed)` : '✅ Minimum reached!'}`,

  MIN_PHOTOS_REACHED: `✅ *8 photos received!*

Would you like to add more photos for a better listing?

Reply *"yes"* to add more photos
Reply *"done"* to continue`,

  ASK_LOCATION: `📍 *Perfect! Now share the location.*

You can share the location in 3 ways:
1️⃣ Tap 📎 → "Location" → Share live location
2️⃣ Paste a *Google Maps link*
3️⃣ Send a *screenshot* of Google Maps

This ensures accurate POI information in your listing!`,

  ASK_PRICE: (listingType: ListingType) => 
    listingType === 'FOR_RENT'
      ? `💰 *What is the monthly rent?*

Reply with the price, for example:
• *35000* (THB per month)
• *50,000 THB*
• *$1,200/month*`
      : `💰 *What is the asking price?*

Reply with the price, for example:
• *15000000* (THB)
• *15,000,000 THB*
• *$450,000*`,

  ASK_BEDROOMS: `🛏️ *How many bedrooms?*

Reply with a number (0-10)`,

  ASK_BATHROOMS: `🚿 *How many bathrooms?*

Reply with a number (0-10)`,

  PROCESSING: `⏳ *Analyzing your property...*

I'm using AI to:
• Detect property features
• Identify amenities
• Assess condition and style
• Generate POI-based description

This takes about 30 seconds...`,

  LOCATION_RECEIVED: (address: string) =>
    `📍 *Location received!*

${address}`,

  ANALYSIS_COMPLETE: (features: DetectedPropertyFeatures, session: WhatsAppListingSession) =>
    `🎉 *Analysis complete!*

📋 *Property Summary:*
• Type: ${session.listingType === 'FOR_RENT' ? '🔑 For Rent' : '🏷️ For Sale'}
• Category: ${formatCategory(session.propertyCategory)}
${session.ownershipType ? `• Ownership: ${session.ownershipType === 'FREEHOLD' ? '🏆 Freehold' : '📋 Leasehold'}` : ''}
• Bedrooms: ${session.bedrooms || features.beds}
• Bathrooms: ${session.bathrooms || features.baths}
• Price: ${session.askingPrice || 'Contact for price'}

🤖 *AI Detected:*
• Pool: ${features.hasPool ? '✅' : '❌'}
• Garden: ${features.hasGarden ? '✅' : '❌'}
• Sea View: ${features.hasSeaView ? '✅' : '❌'}
• Style: ${features.style}
• Condition: ${features.condition}

📝 *Generated Title:*
"${features.suggestedTitle}"

Reply *"confirm"* to publish
Reply *"cancel"* to discard`,

  LISTING_CREATED: (listingNumber: string, slug: string, propertyUrl: string) =>
    `🎉 *Listing successfully created!*

📋 Listing number: *${listingNumber}*
🔗 Link: ${propertyUrl}

The listing is now live on the website!

Send *"start"* to create another listing.`,

  ERROR: (message: string) =>
    `❌ *Something went wrong*

${message}

Try again with "restart" or contact support.`,

  CANCELLED: `❌ *Listing cancelled*

You can start again anytime with "start".`,

  HELP: `ℹ️ *Available commands:*

• *Start* - Start new listing
• *3* - Update owner/agent details
• *4* - Search owner/agency
• *5* - Update property photos
• *Done* - Finished uploading photos
• *Yes* - Add more photos
• *Confirm* - Publish listing
• *Cancel* - Cancel current session
• *Menu* - Go back to main menu
• *Status* - View progress
• *Help* - Show this message`,

  SESSION_EXPIRED: `⏰ *Session expired*

Your listing session has expired (24 hour limit).
Start again with "start".`,

  INVALID_NUMBER: `❌ Please enter a valid number.`,
  
  INVALID_CHOICE: `❌ Please select a valid option.`,
  
  // ============================================
  // OWNER UPDATE FLOW MESSAGES
  // ============================================
  
  OWNER_UPDATE_SELECT: (properties: Array<{ listingNumber: string; title: string; price: string }>) => {
    const list = properties.map((p, i) => 
      `${i + 1}️⃣ *${p.listingNumber}* - ${p.title.slice(0, 30)}${p.title.length > 30 ? '...' : ''}\n   ${p.price}`
    ).join('\n\n');
    
    return `🏠 *Update Owner/Agent Details*

Recent properties:

${list}

Reply *1-5* to select from list
Or enter listing number (e.g. *89* for PP-0089)`;
  },
  
  OWNER_UPDATE_CONFIRM: (property: { listingNumber: string; title: string; price: string; beds: number; baths: number; location: string }) =>
    `📍 *Selected Property:*

*${property.listingNumber}* - ${property.title}
💰 ${property.price} | 🛏️ ${property.beds} bed | 🚿 ${property.baths} bath
📍 ${property.location}

Is this correct?
Reply *"yes"* to continue or *"no"* to select another`,

  OWNER_UPDATE_ASK_NAME: `👤 *Enter the owner/agent full name:*

Example: John Smith`,

  OWNER_UPDATE_ASK_PHONE: `📞 *Enter the phone number:*

Include country code for international numbers.
Examples: 0812345678, +66812345678, +31612345678`,

  OWNER_UPDATE_ASK_COMPANY: `🏢 *Enter the company/agency name:*

Example: Phuket Real Estate Co.

Send *"skip"* if not applicable.`,

  OWNER_UPDATE_ASK_COMMISSION: `💰 *Enter the commission rate (%):*

Example: 3 or 5`,

  OWNER_UPDATE_SUCCESS: (data: { listingNumber: string; name: string; phone: string; company?: string; commission: number }) =>
    `✅ *Owner details updated!*

📋 Property: *${data.listingNumber}*
👤 Owner: ${data.name}
📞 Phone: ${data.phone}${data.company ? `\n🏢 Company: ${data.company}` : ''}
💰 Commission: ${data.commission}%

Send *"Start"* to create a new listing
Or *"3"* to update another property`,

  OWNER_UPDATE_NOT_FOUND: (input: string) =>
    `❌ *Property not found*

Could not find property with number: ${input}

Please try again with a valid listing number.`,

  NO_PROPERTIES_FOUND: `❌ *No properties found*

There are no properties in the system yet.
Create a new listing first with *"Start"*`,

  // ============================================
  // SEARCH OWNER FLOW MESSAGES
  // ============================================
  
  SEARCH_OWNER_ASK_QUERY: `🔍 *Search Owner/Agency*

Enter a name or company to search:

Examples:
• "PSM Phuket" (company)
• "Jack" (owner name)
• "Rawai" (location)

Send *"menu"* to go back.`,

  SEARCH_OWNER_NO_RESULTS: (query: string) =>
    `🔍 *No results found*

No properties found matching "${query}"

Try:
• Different spelling
• Partial name (e.g. "PSM" instead of "PSM Phuket")
• Owner name or location

Send another search or *"menu"* to go back.`,

  SEARCH_OWNER_RESULTS_HEADER: (query: string, total: number, page: number, totalPages: number) =>
    `🔍 *Found ${total} listing${total === 1 ? '' : 's'} for "${query}"*

📄 Page ${page} of ${totalPages}`,

  SEARCH_OWNER_CONTACT: (data: { name?: string; company?: string; phone?: string; countryCode?: string; email?: string }) => {
    let msg = `━━━━━━━━━━━━━━━━━━━━━
📋 *Contact Details:*
`;
    if (data.name) msg += `👤 ${data.name}\n`;
    if (data.company) msg += `🏢 ${data.company}\n`;
    if (data.phone) msg += `📞 ${data.countryCode || '+66'}${data.phone}\n`;
    if (data.email) msg += `📧 ${data.email}\n`;
    return msg + `━━━━━━━━━━━━━━━━━━━━━`;
  },

  SEARCH_OWNER_PAGINATION: (page: number, totalPages: number) => {
    let msg = `\n📄 *Page ${page} of ${totalPages}*\n\n`;
    if (page > 1) msg += `Send *"prev"* for previous page\n`;
    if (page < totalPages) msg += `Send *"next"* for next page\n`;
    msg += `Send *"menu"* to go back`;
    return msg;
  },

  MAIN_MENU: `👋 *Main Menu*

Send *"Start"* to create a new listing
Send *"3"* to update owner/agent details
Send *"4"* to search owner/agency
Send *"5"* to update property photos

Or send *"Help"* for more options.`,

  // ============================================
  // UPDATE PHOTOS FLOW MESSAGES
  // ============================================
  
  UPDATE_PHOTOS_SELECT: (properties: Array<{ listingNumber: string; title: string; imageCount: number }>) => {
    const list = properties.map((p, i) => 
      `${i + 1}️⃣ *${p.listingNumber}* - ${p.title.slice(0, 25)}${p.title.length > 25 ? '...' : ''}\n   📸 ${p.imageCount} foto's`
    ).join('\n\n');
    
    return `📸 *Update Property Photos*

Select a property to update photos:

${list}

Reply *1-5* to select from list
Or enter listing number (e.g. *89* for PP-0089)
Or send *"menu"* to go back`;
  },
  
  UPDATE_PHOTOS_CONFIRM_PROPERTY: (property: { listingNumber: string; title: string; imageCount: number; location: string }) =>
    `📍 *Selected Property:*

*${property.listingNumber}* - ${property.title}
📸 Current photos: ${property.imageCount}
📍 ${property.location}

Is this correct?
Reply *"yes"* to continue or *"no"* to select another`,

  UPDATE_PHOTOS_CURRENT_OVERVIEW: (property: { listingNumber: string; title: string }, images: Array<{ position: number; alt: string | null }>) => {
    const imageList = images.map(img => 
      `${img.position}. ${img.alt?.slice(0, 40) || 'No description'}${(img.alt?.length || 0) > 40 ? '...' : ''}`
    ).join('\n');
    
    return `📸 *Current Photos for ${property.listingNumber}*

${imageList || 'No photos yet'}

━━━━━━━━━━━━━━━━━━━━━
*What would you like to do?*

Reply *"1"* to ➕ *Add more photos*
Reply *"2"* to 🔄 *Replace a specific photo*
Reply *"3"* to 🗑️ *Delete a photo*
Reply *"menu"* to go back`;
  },

  UPDATE_PHOTOS_SELECT_TO_REPLACE: (images: Array<{ position: number; alt: string | null }>) => {
    const imageList = images.map(img => 
      `${img.position}. ${img.alt?.slice(0, 35) || 'No description'}${(img.alt?.length || 0) > 35 ? '...' : ''}`
    ).join('\n');
    
    return `🔄 *Which photo do you want to replace?*

${imageList}

Reply with the number (1-${images.length}) of the photo to replace
Or send *"cancel"* to go back`;
  },

  UPDATE_PHOTOS_SELECT_TO_DELETE: (images: Array<{ position: number; alt: string | null }>) => {
    const imageList = images.map(img => 
      `${img.position}. ${img.alt?.slice(0, 35) || 'No description'}${(img.alt?.length || 0) > 35 ? '...' : ''}`
    ).join('\n');
    
    return `🗑️ *Which photo do you want to delete?*

${imageList}

Reply with the number (1-${images.length}) of the photo to delete
Or send *"cancel"* to go back`;
  },

  UPDATE_PHOTOS_SEND_NEW: `📸 *Send your new photo(s)*

Upload the photo(s) you want to add.

When finished, reply *"done"*
Or send *"cancel"* to go back`,

  UPDATE_PHOTOS_SEND_REPLACEMENT: (position: number) =>
    `📸 *Send the replacement photo for position ${position}*

Upload a single photo to replace the current one.

Or send *"cancel"* to go back`,

  UPDATE_PHOTOS_PHOTO_ADDED: (count: number, total: number) =>
    `✅ Photo added! (${count} new, ${total} total)

Send more photos or reply *"done"* when finished.`,

  UPDATE_PHOTOS_PHOTO_REPLACED: (position: number) =>
    `✅ Photo at position ${position} has been replaced!

Send *"menu"* to go back or continue updating.`,

  UPDATE_PHOTOS_PHOTO_DELETED: (position: number, remaining: number) =>
    `✅ Photo at position ${position} has been deleted!

${remaining} photos remaining.

Send *"menu"* to go back or continue updating.`,

  UPDATE_PHOTOS_SUCCESS: (listingNumber: string, totalPhotos: number) =>
    `🎉 *Photos updated successfully!*

📋 Property: *${listingNumber}*
📸 Total photos: ${totalPhotos}

Send *"5"* to update more photos
Send *"menu"* to go back to main menu`,

  UPDATE_PHOTOS_NOT_FOUND: (input: string) =>
    `❌ *Property not found*

Could not find property with number: ${input}

Please try again with a valid listing number.`,

  UPDATE_PHOTOS_NO_PHOTOS: `❌ *No photos to update*

This property has no photos yet.
Reply *"1"* to add photos first.`,

  UPDATE_PHOTOS_MIN_PHOTOS_WARNING: (current: number) =>
    `⚠️ *Warning: Minimum photos required*

This property has only ${current} photo(s).
Properties need at least 1 photo.

Are you sure you want to delete?
Reply *"yes"* to confirm or *"no"* to cancel`,

  // ============================================
  // TM30 ACCOMMODATION FLOW MESSAGES
  // ============================================
  
  TM30_START: `🇹🇭 *Add TM30 Accommodation*

I will help you register a new accommodation with Thailand Immigration.

📸 *Step 1: ID Card*
Send a photo of the owner's *Thai ID card* (บัตรประชาชน)

━━━━━━━━━━━━━━━━━━━━━
💡 Make sure the text is clearly readable`,

  TM30_ID_CARD_RECEIVED: (data: { firstName: string; lastName: string; gender: string }) =>
    `✅ *ID Card received!*

🔍 Scanned data:
• First name: ${data.firstName}
• Last name: ${data.lastName}
• Gender: ${data.gender === 'Female' ? 'Female 👩' : 'Male 👨'}

Is this correct?
Reply *"yes"* or *"no"*`,

  TM30_ID_CARD_RETRY: `❌ *Could not read data*

The ID card was not clear enough.
Send a new photo with:
• Good lighting
• No reflections
• Full card visible

Or type the name manually:
*firstname lastname gender*
(e.g. "RUEDEEKORN CHUNKERD female")`,

  TM30_ASK_BLUEBOOK: `📘 *Step 2: Bluebook (ทะเบียนบ้าน)*

Now send a photo of the *Tabienbaan* (house registration).
The page with:
• House ID number (เลขรหัสประจำบ้าน)
• Address details

━━━━━━━━━━━━━━━━━━━━━`,

  TM30_BLUEBOOK_RECEIVED: (data: { 
    houseId: string; 
    address: string; 
    village: string;
    subDistrict: string; 
    district: string; 
    province: string; 
    postalCode: string 
  }) =>
    `✅ *Bluebook received!*

🔍 Scanned data:
• House ID: ${data.houseId}
• Address: ${data.address}
• Moo: ${data.village}
• Tambon: ${data.subDistrict}
• Amphoe: ${data.district}
• Province: ${data.province}
• Postal code: ${data.postalCode}

Is this correct?
Reply *"yes"* or correct (e.g. "postcode 83100")`,

  TM30_BLUEBOOK_RETRY: `❌ *Could not read data*

The bluebook was not clear enough.
Send a new photo of the page with the House ID.

Or type the data manually:
*house_id, address, moo, tambon, amphoe, province, postcode*`,

  TM30_ASK_PHONE: `📞 *Step 3: Phone number*

What is the owner's phone number?

(e.g. 0986261646 or +66986261646)`,

  TM30_ASK_ACCOM_NAME: `🏠 *Step 4: Accommodation name*

What should the accommodation be called in TM30?

(e.g. "PHUKET: Villa Rawai" or "Villa Kata Beach")`,

  TM30_CONFIRM_ALL: (data: {
    firstName: string;
    lastName: string;
    gender: string;
    phone: string;
    houseId: string;
    address: string;
    subDistrict: string;
    district: string;
    province: string;
    postalCode: string;
    accommodationName: string;
  }) =>
    `✅ *Complete Summary*

━━━━━━━━━━━━━━━━━━━━━
🏠 *${data.accommodationName}*
━━━━━━━━━━━━━━━━━━━━━

👤 *Owner:*
• Name: ${data.firstName} ${data.lastName}
• Gender: ${data.gender === 'Female' ? 'Female' : 'Male'}
• Tel: ${data.phone}

📍 *Address:*
• House ID: ${data.houseId}
• Address: ${data.address}
• ${data.subDistrict}, ${data.district}
• ${data.province} ${data.postalCode}

📎 *Documents:*
• ID Card: ✅
• Bluebook: ✅

━━━━━━━━━━━━━━━━━━━━━

All correct?
Reply *"confirm"* to start TM30
Or *"cancel"* to stop`,

  TM30_PROCESSING: `🚀 *TM30 Automation Started!*

The accommodation is now being automatically added to the TM30 system.

⏳ This takes about 2-3 minutes...
You will receive a message when it's done.`,

  TM30_SUCCESS: (data: { accommodationName: string; tm30Id?: string }) =>
    `✅ *TM30 Accommodation Added!*

🏠 ${data.accommodationName}
${data.tm30Id ? `📋 TM30 ID: ${data.tm30Id}` : ''}
✅ Status: Approved

You can now report guests for this accommodation!

━━━━━━━━━━━━━━━━━━━━━
Send *"6"* to add another accommodation
Send *"menu"* for the main menu`,

  TM30_FAILED: (error: string) =>
    `❌ *TM30 Registration Failed*

An error occurred:
${error}

Try again with *"6"*
Or contact support.`,

} as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCategory(category?: PropertyCategoryType): string {
  if (!category) return 'Property';
  const map: Record<PropertyCategoryType, string> = {
    'LUXURY_VILLA': '🏰 Luxury Villa',
    'APARTMENT': '🏢 Condo/Apartment',
    'RESIDENTIAL_HOME': '🏠 House/Home',
    'OFFICE_SPACES': '🏢 Office',
  };
  return map[category] || category;
}
