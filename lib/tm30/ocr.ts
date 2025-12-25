/**
 * TM30 Document OCR using ChatGPT Vision API
 * 
 * Extracts data from:
 * - Thai ID cards (บัตรประชาชน)
 * - House registration books (ทะเบียนบ้าน / Bluebook)
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// TYPES
// ============================================

export interface IdCardOcrResult {
  success: boolean;
  firstName?: string;
  lastName?: string;
  gender?: 'Male' | 'Female';
  nationalId?: string;
  dateOfBirth?: string;
  error?: string;
  confidence?: number;
  rawResponse?: string;
}

export interface BluebookOcrResult {
  success: boolean;
  houseIdNumber?: string;
  addressNumber?: string;
  villageNumber?: string;
  alley?: string;
  road?: string;
  subDistrict?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  error?: string;
  confidence?: number;
  rawResponse?: string;
}

// ============================================
// ID CARD OCR
// ============================================

/**
 * Extract data from Thai ID card image using ChatGPT Vision
 */
export async function extractIdCardData(imageUrl: string): Promise<IdCardOcrResult> {
  try {
    console.log('[TM30 OCR] Extracting ID card data from:', imageUrl);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an OCR expert specializing in Thai ID cards (บัตรประชาชน).
Extract the following information from the Thai ID card image:
1. First name (ชื่อ) - in English/Romanized form
2. Last name (นามสกุล) - in English/Romanized form  
3. Gender (เพศ) - Male or Female
4. National ID number (เลขประจำตัวประชาชน) - 13 digits

Respond ONLY in this exact JSON format:
{
  "firstName": "RUEDEEKORN",
  "lastName": "CHUNKERD",
  "gender": "Female",
  "nationalId": "1234567890123",
  "confidence": 0.95
}

If you cannot read the card clearly, respond with:
{
  "error": "Cannot read card - [reason]",
  "confidence": 0
}

Use UPPERCASE for names. Convert Thai names to their romanized equivalent.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the owner information from this Thai ID card:'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1, // Low temperature for accurate extraction
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('[TM30 OCR] ID Card raw response:', content);

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Could not parse OCR response',
        rawResponse: content,
      };
    }

    const data = JSON.parse(jsonMatch[0]);

    if (data.error) {
      return {
        success: false,
        error: data.error,
        confidence: data.confidence || 0,
        rawResponse: content,
      };
    }

    return {
      success: true,
      firstName: data.firstName?.toUpperCase(),
      lastName: data.lastName?.toUpperCase(),
      gender: data.gender === 'Male' ? 'Male' : 'Female',
      nationalId: data.nationalId,
      dateOfBirth: data.dateOfBirth,
      confidence: data.confidence || 0.8,
      rawResponse: content,
    };

  } catch (error: any) {
    console.error('[TM30 OCR] ID Card extraction error:', error);
    return {
      success: false,
      error: error.message || 'OCR failed',
    };
  }
}

// ============================================
// BLUEBOOK OCR
// ============================================

/**
 * Extract data from Thai house registration book (Bluebook) image
 */
export async function extractBluebookData(imageUrl: string): Promise<BluebookOcrResult> {
  try {
    console.log('[TM30 OCR] Extracting Bluebook data from:', imageUrl);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an OCR expert specializing in Thai house registration books (ทะเบียนบ้าน / Tabienbaan / Bluebook).

Extract the following information:
1. House ID number (เลขรหัสประจำบ้าน) - format like "8392-013427-3" (may have letters that should be numbers)
2. Address number (บ้านเลขที่) - e.g., "46/27"
3. Village number (หมู่ที่) - e.g., "4"
4. Alley (ซอย) - optional
5. Road (ถนน) - optional
6. Sub-district/Tambon (ตำบล/แขวง) - e.g., "Rawai"
7. District/Amphoe (อำเภอ/เขต) - e.g., "Mueang Phuket"
8. Province (จังหวัด) - e.g., "PHUKET"
9. Postal code (รหัสไปรษณีย์) - 5 digits, e.g., "83130"

IMPORTANT for House ID:
- House ID should ONLY contain numbers and hyphens
- If you see letters like S, O, I, L, B - they are OCR errors from the original document
- Convert: S→8, O→0, I→1, L→1, B→8
- Example: "S392-013427-3" should become "8392-013427-3"

Respond ONLY in this exact JSON format:
{
  "houseIdNumber": "8392-013427-3",
  "addressNumber": "46/27",
  "villageNumber": "4",
  "alley": "",
  "road": "",
  "subDistrict": "Rawai",
  "district": "Mueang Phuket",
  "province": "PHUKET",
  "postalCode": "83130",
  "confidence": 0.95
}

If you cannot read the document clearly, respond with:
{
  "error": "Cannot read document - [reason]",
  "confidence": 0
}

Use English/Romanized names for locations. Province should be UPPERCASE.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract the address and house ID information from this Thai house registration book (Bluebook/ทะเบียนบ้าน):'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('[TM30 OCR] Bluebook raw response:', content);

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        error: 'Could not parse OCR response',
        rawResponse: content,
      };
    }

    const data = JSON.parse(jsonMatch[0]);

    if (data.error) {
      return {
        success: false,
        error: data.error,
        confidence: data.confidence || 0,
        rawResponse: content,
      };
    }

    // Sanitize House ID - ensure only numbers and hyphens
    let houseId = data.houseIdNumber || '';
    houseId = houseId
      .replace(/S/gi, '8')
      .replace(/O/gi, '0')
      .replace(/I/gi, '1')
      .replace(/L/gi, '1')
      .replace(/B/gi, '8')
      .replace(/[^0-9-]/g, '');

    return {
      success: true,
      houseIdNumber: houseId,
      addressNumber: data.addressNumber,
      villageNumber: data.villageNumber || '',
      alley: data.alley || '',
      road: data.road || '',
      subDistrict: data.subDistrict,
      district: data.district,
      province: data.province?.toUpperCase(),
      postalCode: data.postalCode,
      confidence: data.confidence || 0.8,
      rawResponse: content,
    };

  } catch (error: any) {
    console.error('[TM30 OCR] Bluebook extraction error:', error);
    return {
      success: false,
      error: error.message || 'OCR failed',
    };
  }
}




