/**
 * Passport OCR Service
 * Uses OpenAI Vision API to extract data from passport images
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PassportOCRResult {
  success: boolean;
  confidence: number;
  data?: {
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string; // YYYY-MM-DD
    nationality: string;
    gender: string; // M or F
    passportNumber: string;
    passportExpiry: string; // YYYY-MM-DD
    passportIssueDate?: string; // YYYY-MM-DD
    passportCountry: string; // Country that issued the passport
  };
  rawResponse?: string;
  error?: string;
}

/**
 * Extract passport data from an image using OpenAI Vision API
 */
export async function scanPassport(imageUrl: string): Promise<PassportOCRResult> {
  try {
    console.log("[Passport OCR] Starting scan for image:", imageUrl.substring(0, 100) + "...");

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1000,
      messages: [
        {
          role: "system",
          content: `You are a passport data extraction specialist. Your job is to accurately extract personal information from passport images.

IMPORTANT RULES:
1. Extract data EXACTLY as shown on the passport
2. For names, use the format shown in the MRZ (machine readable zone) at the bottom if visible
3. ALL DATES must be in YYYY-MM-DD format (e.g., 1985-05-20)
4. Nationality should be the full country name (e.g., "Dutch", "British", "American", "German", "Italian")
5. Gender/Sex MUST be extracted - look for "M", "F", "MALE", "FEMALE", "M/V", or "SEX" field. Return as "M" or "F"
6. Date of Birth (DOB/Geboortedatum) is CRITICAL - look for the birth date field or extract from MRZ line 2 (format: YYMMDD after the nationality code)
7. If you cannot read a field clearly, use null
8. Return ONLY valid JSON, no additional text

MRZ PARSING HELP:
- Line 2 format: PassportNumber<CheckDigit>Nationality>YYMMDD<CheckDigit>Gender>ExpiryYYMMDD<CheckDigit>...
- Example: NPDPDF914<8NLD8505202M3405237<<<...
  - Birth date: 850520 = 1985-05-20
  - Gender: M
  - Expiry: 340523 = 2034-05-23

Always respond with this exact JSON structure:
{
  "success": true/false,
  "confidence": 0.0-1.0,
  "data": {
    "firstName": "string",
    "lastName": "string", 
    "fullName": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "nationality": "string",
    "gender": "M" or "F",
    "passportNumber": "string",
    "passportExpiry": "YYYY-MM-DD",
    "passportIssueDate": "YYYY-MM-DD" or null,
    "passportCountry": "string"
  }
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all personal information from this passport image. Return the data as JSON."
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "high"
              }
            }
          ]
        }
      ]
    });

    const content = response.choices[0]?.message?.content || "";
    console.log("[Passport OCR] Raw response:", content);

    // Parse the JSON response
    try {
      // Remove any markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      
      const parsed = JSON.parse(cleanedContent);
      
      return {
        success: parsed.success !== false,
        confidence: parsed.confidence || 0.8,
        data: parsed.data,
        rawResponse: content
      };
    } catch (parseError) {
      console.error("[Passport OCR] Failed to parse response:", parseError);
      return {
        success: false,
        confidence: 0,
        error: "Failed to parse OCR response",
        rawResponse: content
      };
    }
  } catch (error: any) {
    console.error("[Passport OCR] Error:", error);
    return {
      success: false,
      confidence: 0,
      error: error.message || "Unknown error occurred"
    };
  }
}

/**
 * Convert base64 image to data URL for OpenAI
 */
export function base64ToDataUrl(base64: string, mimeType: string = "image/jpeg"): string {
  // Remove any existing data URL prefix
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, "");
  return `data:${mimeType};base64,${cleanBase64}`;
}

/**
 * Validate passport data
 */
export function validatePassportData(data: PassportOCRResult["data"]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data) {
    return { valid: false, errors: ["No data extracted"] };
  }

  if (!data.firstName || !data.lastName) {
    errors.push("Name is missing or incomplete");
  }

  if (!data.passportNumber) {
    errors.push("Passport number is missing");
  }

  if (!data.dateOfBirth) {
    errors.push("Date of birth is missing");
  }

  if (!data.passportExpiry) {
    errors.push("Passport expiry date is missing");
  } else {
    // Check if passport is expired
    const expiry = new Date(data.passportExpiry);
    if (expiry < new Date()) {
      errors.push("Passport is expired");
    }
  }

  if (!data.nationality) {
    errors.push("Nationality is missing");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}





