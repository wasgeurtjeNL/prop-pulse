/**
 * Check Twilio message status
 */

import { NextResponse } from "next/server";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageSid = searchParams.get("sid") || "SM408a12ed941a9e929f0f73d77d83bedf";

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    return NextResponse.json({ error: "Missing Twilio credentials" });
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages/${messageSid}.json`,
      {
        headers: {
          Authorization: "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        },
      }
    );

    const data = await response.json();

    return NextResponse.json({
      messageSid,
      status: data.status,
      errorCode: data.error_code,
      errorMessage: data.error_message,
      to: data.to,
      from: data.from,
      dateSent: data.date_sent,
      dateCreated: data.date_created,
      fullResponse: data,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}



