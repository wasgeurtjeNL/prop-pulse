/**
 * TM30 Document Storage Helper
 * 
 * Generates consistent file paths for owner documents
 * Structure: owners/{ownerId}/id-card.jpg
 *           owners/{ownerId}/bluebook-{propertyId}.jpg
 */

export interface DocumentPathOptions {
  ownerId: string;
  documentType: "ID_CARD" | "BLUEBOOK" | "PASSPORT" | "OTHER";
  propertyId?: string;
  extension?: string;
}

/**
 * Generate a consistent storage path for owner documents
 */
export function generateDocumentPath(options: DocumentPathOptions): string {
  const { ownerId, documentType, propertyId, extension = "jpg" } = options;

  switch (documentType) {
    case "ID_CARD":
      return `owners/${ownerId}/id-card.${extension}`;
    
    case "BLUEBOOK":
      if (!propertyId) {
        // If no property, use timestamp
        return `owners/${ownerId}/bluebook-${Date.now()}.${extension}`;
      }
      return `owners/${ownerId}/bluebook-${propertyId}.${extension}`;
    
    case "PASSPORT":
      return `owners/${ownerId}/passport.${extension}`;
    
    default:
      return `owners/${ownerId}/document-${Date.now()}.${extension}`;
  }
}

/**
 * Extract owner ID from a document path
 */
export function extractOwnerIdFromPath(path: string): string | null {
  const match = path.match(/owners\/([^/]+)\//);
  return match ? match[1] : null;
}

/**
 * Extract property ID from a bluebook path
 */
export function extractPropertyIdFromPath(path: string): string | null {
  const match = path.match(/bluebook-([^.]+)\./);
  return match ? match[1] : null;
}

/**
 * Get document type from file path
 */
export function getDocumentTypeFromPath(path: string): "ID_CARD" | "BLUEBOOK" | "PASSPORT" | "OTHER" {
  if (path.includes("id-card")) return "ID_CARD";
  if (path.includes("bluebook")) return "BLUEBOOK";
  if (path.includes("passport")) return "PASSPORT";
  return "OTHER";
}

/**
 * Generate full ImageKit URL from path
 */
export function getImageKitUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "https://ik.imagekit.io/proppulse";
  return `${baseUrl}/${path}`;
}

/**
 * Format phone number for storage lookup
 * Removes spaces, dashes, and ensures consistent format
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d+]/g, "");
  
  // Ensure it starts with + for international format
  if (!normalized.startsWith("+")) {
    // Assume Thai number if starts with 0
    if (normalized.startsWith("0")) {
      normalized = "+66" + normalized.slice(1);
    } else if (normalized.startsWith("66")) {
      normalized = "+" + normalized;
    } else {
      normalized = "+" + normalized;
    }
  }
  
  return normalized;
}

/**
 * Check if a phone number is Thai
 */
export function isThaiPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return normalized.startsWith("+66");
}






