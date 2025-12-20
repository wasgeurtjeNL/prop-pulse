/**
 * WhatsApp Twilio API Client
 * 
 * Handles sending messages via Twilio WhatsApp API.
 * For use with Twilio WhatsApp Sandbox and production senders.
 */

import { BotButton } from './types';

// ============================================
// CONFIGURATION
// ============================================

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

function getConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886', // Sandbox number
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'prop-pulse-webhook-2024',
  };
}

/**
 * Format phone number for WhatsApp (add whatsapp: prefix)
 */
function formatWhatsAppNumber(phone: string): string {
  // Remove whatsapp: prefix if already present
  const cleanPhone = phone.replace('whatsapp:', '');
  // Ensure it has + prefix
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
  return `whatsapp:${formattedPhone}`;
}

// ============================================
// MESSAGE SENDING
// ============================================

/**
 * Send a text message via Twilio WhatsApp
 */
export async function sendTextMessage(
  recipientPhone: string,
  text: string
): Promise<boolean> {
  const config = getConfig();
  
  if (!config.accountSid || !config.authToken) {
    console.error('Twilio credentials not configured');
    return false;
  }
  
  try {
    const from = formatWhatsAppNumber(config.whatsappNumber);
    const to = formatWhatsAppNumber(recipientPhone);
    
    const body = new URLSearchParams({
      From: from,
      To: to,
      Body: text,
    });
    
    const response = await fetch(
      `${TWILIO_API_BASE}/Accounts/${config.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio WhatsApp API error:', error);
      return false;
    }
    
    const result = await response.json();
    console.log(`[Twilio] Message sent: ${result.sid}`);
    return true;
    
  } catch (error) {
    console.error('Error sending Twilio WhatsApp message:', error);
    return false;
  }
}

/**
 * Send a message with interactive buttons (Twilio uses content templates)
 * For sandbox, we just append button options as text
 */
export async function sendButtonMessage(
  recipientPhone: string,
  text: string,
  buttons: BotButton[]
): Promise<boolean> {
  // Twilio WhatsApp buttons require approved templates
  // For sandbox, we simulate with text options
  const buttonText = buttons
    .map((btn, i) => `${i + 1}. ${btn.title}`)
    .join('\n');
  
  const fullMessage = `${text}\n\n${buttonText}\n\n_Antwoord met het nummer of typ je keuze._`;
  
  return sendTextMessage(recipientPhone, fullMessage);
}

/**
 * Send a message with a list of options
 */
export async function sendListMessage(
  recipientPhone: string,
  headerText: string,
  bodyText: string,
  buttonText: string,
  sections: Array<{
    title: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>
): Promise<boolean> {
  // For sandbox, convert list to text format
  let message = `*${headerText}*\n\n${bodyText}\n\n`;
  
  for (const section of sections) {
    message += `📋 *${section.title}*\n`;
    for (const row of section.rows) {
      message += `• ${row.title}`;
      if (row.description) {
        message += ` - ${row.description}`;
      }
      message += '\n';
    }
    message += '\n';
  }
  
  return sendTextMessage(recipientPhone, message.trim());
}

/**
 * Send an image message via Twilio
 */
export async function sendImageMessage(
  recipientPhone: string,
  imageUrl: string,
  caption?: string
): Promise<boolean> {
  const config = getConfig();
  
  if (!config.accountSid || !config.authToken) {
    console.error('Twilio credentials not configured');
    return false;
  }
  
  try {
    const from = formatWhatsAppNumber(config.whatsappNumber);
    const to = formatWhatsAppNumber(recipientPhone);
    
    const body = new URLSearchParams({
      From: from,
      To: to,
      MediaUrl: imageUrl,
    });
    
    if (caption) {
      body.append('Body', caption);
    }
    
    const response = await fetch(
      `${TWILIO_API_BASE}/Accounts/${config.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Twilio WhatsApp API error:', error);
      return false;
    }
    
    const result = await response.json();
    console.log(`[Twilio] Image message sent: ${result.sid}`);
    return true;
    
  } catch (error) {
    console.error('Error sending Twilio WhatsApp image message:', error);
    return false;
  }
}

/**
 * Send a location request message
 * Twilio doesn't support interactive location requests, so we ask via text
 */
export async function sendLocationRequest(
  recipientPhone: string,
  text: string
): Promise<boolean> {
  const locationMessage = `${text}\n\n📍 _Deel je locatie via WhatsApp:_\n1. Klik op het paperclip icoon 📎\n2. Kies "Locatie"\n3. Deel je huidige locatie of kies een locatie op de kaart`;
  
  return sendTextMessage(recipientPhone, locationMessage);
}

/**
 * Mark a message as read (Twilio handles this automatically)
 */
export async function markMessageAsRead(messageId: string): Promise<boolean> {
  // Twilio automatically marks messages as delivered/read
  console.log(`[Twilio] Message ${messageId} acknowledged`);
  return true;
}

/**
 * Send typing indicator (not supported by Twilio WhatsApp)
 */
export async function sendTypingIndicator(recipientPhone: string): Promise<boolean> {
  // Twilio WhatsApp doesn't support typing indicators
  return true;
}

// ============================================
// TEMPLATE MESSAGES
// ============================================

/**
 * Send a template message via Twilio Content Templates
 */
export async function sendTemplateMessage(
  recipientPhone: string,
  templateName: string,
  languageCode: string = 'en',
  components?: Array<{
    type: 'header' | 'body' | 'button';
    parameters: Array<{
      type: 'text' | 'image' | 'document';
      text?: string;
      image?: { link: string };
    }>;
  }>
): Promise<boolean> {
  // For sandbox, we don't have approved templates
  // Just send a regular text message
  console.log(`[Twilio] Template ${templateName} requested, sending as text`);
  return sendTextMessage(
    recipientPhone,
    `🏠 Welcome to Prop Pulse Property Listing Bot!\n\nType "Listing" to start creating a new property listing.`
  );
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

/**
 * Verify webhook request (Twilio uses signature validation)
 * For sandbox testing, we use a simple token verification
 */
export function verifyWebhook(
  mode: string | null,
  token: string | null,
  challenge: string | null
): { valid: boolean; challenge?: string } {
  const config = getConfig();
  
  // Twilio doesn't use the same verification as Meta
  // For testing, we accept all requests or use a simple token
  if (mode === 'subscribe' && token === config.webhookVerifyToken) {
    return { valid: true, challenge: challenge || '' };
  }
  
  // For Twilio sandbox, we don't need verification - just accept
  return { valid: true, challenge: '' };
}

/**
 * Validate Twilio webhook signature
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const config = getConfig();
  
  if (!config.authToken) {
    console.warn('Twilio auth token not configured, skipping signature validation');
    return true;
  }
  
  // For sandbox testing, we skip validation
  // In production, implement proper Twilio signature validation:
  // https://www.twilio.com/docs/usage/security#validating-requests
  return true;
}

// ============================================
// MEDIA HANDLING
// ============================================

/**
 * Download media from Twilio
 */
export async function downloadTwilioMedia(
  mediaUrl: string
): Promise<{ data: Buffer; contentType: string } | null> {
  const config = getConfig();
  
  try {
    const response = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
      },
    });
    
    if (!response.ok) {
      console.error('Failed to download Twilio media:', response.status);
      return null;
    }
    
    const data = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    return { data, contentType };
    
  } catch (error) {
    console.error('Error downloading Twilio media:', error);
    return null;
  }
}
