/**
 * WhatsApp Webhook API (Twilio)
 * 
 * Receives incoming messages from Twilio WhatsApp Sandbox
 * and handles the property listing workflow.
 * 
 * GET /api/whatsapp/webhook - Health check
 * POST /api/whatsapp/webhook - Incoming message handler
 * 
 * IMPORTANT: Twilio expects TwiML (XML) responses, NOT JSON!
 * Since we send messages via the API, we return empty TwiML.
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendTextMessage, sendImageMessage } from '@/lib/whatsapp/api-client';
import { handleIncomingMessage } from '@/lib/whatsapp/message-handler';
import { WhatsAppMessage, BotResponse } from '@/lib/whatsapp/types';

// Empty TwiML response - Twilio expects this format
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

/**
 * Create a TwiML response (what Twilio expects)
 */
function twimlResponse(status = 200): Response {
  return new Response(EMPTY_TWIML, {
    status,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

/**
 * Send a BotResponse to the user
 * Handles both single messages and multi-message responses with media
 */
async function sendBotResponse(to: string, response: BotResponse): Promise<void> {
  // Handle multi-message responses (e.g., search results with images)
  if (response.messages && response.messages.length > 0) {
    console.log(`[WhatsApp Webhook] Sending ${response.messages.length} messages`);
    
    for (const msg of response.messages) {
      if (msg.mediaUrl) {
        // Send image with caption
        console.log(`[WhatsApp Webhook] Sending image: ${msg.mediaUrl.substring(0, 50)}...`);
        const sent = await sendImageMessage(to, msg.mediaUrl, msg.caption);
        if (!sent) {
          console.error('[WhatsApp Webhook] Failed to send image message');
        }
      } else if (msg.text) {
        // Send text message
        console.log(`[WhatsApp Webhook] Sending text: "${msg.text.substring(0, 50)}..."`);
        const sent = await sendTextMessage(to, msg.text);
        if (!sent) {
          console.error('[WhatsApp Webhook] Failed to send text message');
        }
      }
      
      // Small delay between messages to maintain order
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    return;
  }
  
  // Handle single message with media
  if (response.mediaUrl) {
    console.log(`[WhatsApp Webhook] Sending single image: ${response.mediaUrl.substring(0, 50)}...`);
    const sent = await sendImageMessage(to, response.mediaUrl, response.caption || response.text);
    if (!sent) {
      console.error('[WhatsApp Webhook] Failed to send image message');
    }
    return;
  }
  
  // Handle single text message
  if (response.text) {
    console.log(`[WhatsApp Webhook] Sending response: "${response.text.substring(0, 50)}..."`);
    const sent = await sendTextMessage(to, response.text);
    if (!sent) {
      console.error('[WhatsApp Webhook] Failed to send response');
    }
  }
}

// ============================================
// HEALTH CHECK (GET)
// ============================================

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'WhatsApp Property Listing Bot (Twilio)',
    timestamp: new Date().toISOString(),
  });
}

// ============================================
// TWILIO WEBHOOK HANDLER (POST)
// ============================================

/**
 * Handle incoming WhatsApp messages from Twilio
 * Twilio sends form-urlencoded data
 */
export async function POST(request: NextRequest) {
  console.log('[WhatsApp Webhook] POST received');
  
  try {
    // Parse form-urlencoded data from Twilio
    const formData = await request.formData();
    const twilioData = Object.fromEntries(formData.entries()) as Record<string, string>;
    
    // Log incoming webhook
    console.log('[WhatsApp Webhook] Twilio data:', JSON.stringify(twilioData, null, 2));
    
    // Extract phone number (remove "whatsapp:" prefix)
    const from = twilioData.From?.replace('whatsapp:', '') || '';
    const body = twilioData.Body || '';
    const profileName = twilioData.ProfileName || from;
    const numMedia = parseInt(twilioData.NumMedia || '0', 10);
    
    // Check if this is a sandbox join message
    if (body.toLowerCase().startsWith('join ')) {
      console.log('[WhatsApp Webhook] Sandbox join message, ignoring');
      return twimlResponse();
    }
    
    // Build WhatsApp message object
    const message: WhatsAppMessage = {
      from,
      id: twilioData.SmsMessageSid || twilioData.MessageSid || '',
      timestamp: Date.now().toString(),
      type: 'text',
      text: { body },
    };
    
    // Handle media (images)
    if (numMedia > 0) {
      const mediaUrl0 = twilioData.MediaUrl0 || '';
      const contentType0 = twilioData.MediaContentType0 || 'image/jpeg';
      
      console.log(`[WhatsApp Webhook] Media detected - NumMedia: ${numMedia}`);
      console.log(`[WhatsApp Webhook] MediaUrl0: ${mediaUrl0}`);
      console.log(`[WhatsApp Webhook] MediaContentType0: ${contentType0}`);
      
      message.type = 'image';
      message.image = {
        id: mediaUrl0,
        url: mediaUrl0,
        mime_type: contentType0,
      };
      message.mediaUrls = [];
      for (let i = 0; i < numMedia; i++) {
        const mediaUrl = twilioData[`MediaUrl${i}`];
        if (mediaUrl) {
          message.mediaUrls.push(mediaUrl);
          console.log(`[WhatsApp Webhook] MediaUrl${i}: ${mediaUrl}`);
        }
      }
    }
    
    // Handle location
    if (twilioData.Latitude && twilioData.Longitude) {
      message.type = 'location';
      message.location = {
        latitude: parseFloat(twilioData.Latitude),
        longitude: parseFloat(twilioData.Longitude),
        name: twilioData.Label,
        address: twilioData.Address,
      };
      console.log(`[WhatsApp Webhook] Received location: ${twilioData.Latitude}, ${twilioData.Longitude}`);
    }
    
    console.log(`[WhatsApp Webhook] Message from ${from}: type=${message.type}, body="${body}"`);
    
    // Process the message through our handler
    const response = await handleIncomingMessage(
      message,
      from,
      from, // Use phone as whatsappId for Twilio
      profileName
    );
    
    // Send the response back to the user
    await sendBotResponse(from, response);
    
    // Return empty TwiML (Twilio expects XML, not JSON)
    return twimlResponse();
    
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    
    // Still return 200 with TwiML to prevent Twilio from retrying
    return twimlResponse();
  }
}
