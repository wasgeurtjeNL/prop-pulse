/**
 * WhatsApp Test Endpoint
 * 
 * Use this to verify Twilio configuration and send a test message.
 * GET: Check config status
 * POST: Send a test message
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
  };
  
  return NextResponse.json({
    status: 'ok',
    config: {
      accountSid: config.accountSid ? `${config.accountSid.substring(0, 10)}...` : 'NOT SET',
      authToken: config.authToken ? `${config.authToken.substring(0, 5)}...` : 'NOT SET',
      whatsappNumber: config.whatsappNumber,
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json();
    
    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }
    
    const config = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
    };
    
    if (!config.accountSid || !config.authToken) {
      return NextResponse.json({ 
        error: 'Twilio credentials not configured',
        accountSid: config.accountSid ? 'SET' : 'NOT SET',
        authToken: config.authToken ? 'SET' : 'NOT SET',
      }, { status: 500 });
    }
    
    // Format phone numbers (handle whatsapp: prefix correctly)
    const cleanFrom = config.whatsappNumber.replace('whatsapp:', '');
    const from = `whatsapp:${cleanFrom.startsWith('+') ? cleanFrom : '+' + cleanFrom}`;
    const cleanTo = phone.replace('whatsapp:', '');
    const to = `whatsapp:${cleanTo.startsWith('+') ? cleanTo : '+' + cleanTo}`;
    
    const body = new URLSearchParams({
      From: from,
      To: to,
      Body: message || '🏠 Test message from Prop Pulse Bot!',
    });
    
    console.log('[WhatsApp Test] Sending message:', { from, to });
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      }
    );
    
    const resultText = await response.text();
    let result;
    try {
      result = JSON.parse(resultText);
    } catch {
      result = { raw: resultText };
    }
    
    if (!response.ok) {
      console.error('[WhatsApp Test] Twilio error:', result);
      return NextResponse.json({
        error: 'Twilio API error',
        twilioError: result,
        status: response.status,
        request: { from, to },
        credentials: {
          accountSid: config.accountSid,
          authTokenLength: config.authToken.length,
          authTokenStart: config.authToken.substring(0, 5),
        }
      }, { status: 200 }); // Return 200 so we can see the error details
    }
    
    console.log('[WhatsApp Test] Message sent:', result.sid);
    
    return NextResponse.json({
      success: true,
      messageSid: result.sid,
      status: result.status,
      from,
      to,
    });
    
  } catch (error) {
    console.error('[WhatsApp Test] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

