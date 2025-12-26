/**
 * WhatsApp Property Listing Bot
 * 
 * Main export file for the WhatsApp integration.
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Create a Meta Business Account at https://business.facebook.com
 * 
 * 2. Set up WhatsApp Business Platform:
 *    - Go to https://developers.facebook.com
 *    - Create an app with WhatsApp product
 *    - Get your Phone Number ID and Access Token
 * 
 * 3. Configure environment variables:
 *    WHATSAPP_ACCESS_TOKEN=your_permanent_access_token
 *    WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
 *    WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_custom_verify_token
 * 
 * 4. Set up webhook in Meta dashboard:
 *    - URL: https://yourdomain.com/api/whatsapp/webhook
 *    - Verify Token: same as WHATSAPP_WEBHOOK_VERIFY_TOKEN
 *    - Subscribe to: messages
 * 
 * 5. Run the database migration:
 *    npx prisma db push
 * 
 * USAGE:
 * 
 * The bot workflow:
 * 1. User sends "Toast 1" or "Start" to begin
 * 2. User uploads 8+ photos of the property
 * 3. User shares GPS location
 * 4. AI analyzes photos and generates listing content
 * 5. User confirms to publish
 * 
 * COMMANDS:
 * - "Toast 1" / "Start" - Begin new listing
 * - "3" / "Klaar" - Done uploading photos
 * - "Ja" - Add more photos
 * - "Bevestig" - Confirm and publish
 * - "Cancel" - Cancel current session
 * - "Help" - Show available commands
 */

// Types
export * from './types';

// Session Management
export {
  getOrCreateSession,
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
  getSessionById,
  cleanupExpiredSessions,
  getSessionStats,
} from './session-manager';

// Message Handling
export { handleIncomingMessage } from './message-handler';

// Image Analysis
export {
  analyzePropertyImages,
  analyzePreviewImage,
  getAmenityIcon,
  generateAmenitiesWithIcons,
} from './image-analyzer';

// Content Generation
export {
  generatePropertyContent,
  calculateLocationScores,
  reverseGeocode,
} from './content-generator';

// WhatsApp API Client
export {
  sendTextMessage,
  sendButtonMessage,
  sendListMessage,
  sendImageMessage,
  sendLocationRequest,
  sendTemplateMessage,
  markMessageAsRead,
  verifyWebhook,
} from './api-client';








