"use client";

import { useEffect, useState, useCallback } from 'react';
import { 
  UTMParams, 
  getEffectiveUTM, 
  captureUTM, 
  formatUTMForAPI 
} from '@/lib/utils/utm-tracking';

/**
 * Hook for capturing and using UTM parameters
 * 
 * Usage:
 * ```tsx
 * const { utm, hasUTM, getFormData } = useUTMTracking();
 * 
 * // Check if visitor came from tracked link
 * if (hasUTM) {
 *   console.log('Visitor from:', utm.utm_source);
 * }
 * 
 * // Include UTM data when submitting forms
 * const handleSubmit = async (formData) => {
 *   await fetch('/api/lead', {
 *     method: 'POST',
 *     body: JSON.stringify({
 *       ...formData,
 *       ...getFormData(), // Includes UTM parameters
 *     }),
 *   });
 * };
 * ```
 */
export function useUTMTracking() {
  const [utm, setUTM] = useState<UTMParams>({});
  const [initialized, setInitialized] = useState(false);

  // Capture UTM on mount
  useEffect(() => {
    // First, capture and store any new UTM params from URL
    captureUTM();
    
    // Then get the effective UTM (URL or stored)
    const effectiveUTM = getEffectiveUTM();
    setUTM(effectiveUTM);
    setInitialized(true);
  }, []);

  // Check if we have any UTM data
  const hasUTM = Object.keys(utm).length > 0;

  // Get UTM data formatted for API submission
  const getFormData = useCallback(() => {
    return formatUTMForAPI(utm);
  }, [utm]);

  // Get source display name
  const getSourceDisplay = useCallback(() => {
    if (!utm.utm_source) return 'Direct';
    
    const sourceNames: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      google: 'Google',
      tiktok: 'TikTok',
      youtube: 'YouTube',
      line: 'LINE',
      whatsapp: 'WhatsApp',
      email: 'Email',
      partner: 'Partner',
      qr: 'QR Code',
    };
    
    return sourceNames[utm.utm_source] || utm.utm_source;
  }, [utm]);

  return {
    utm,
    hasUTM,
    initialized,
    getFormData,
    getSourceDisplay,
    source: utm.utm_source,
    medium: utm.utm_medium,
    campaign: utm.utm_campaign,
  };
}

export default useUTMTracking;

