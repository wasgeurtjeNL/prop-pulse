/**
 * TM30 GitHub Workflow Trigger
 * 
 * Triggers the TM30 automation workflow on GitHub Actions
 */

export interface TM30WorkflowPayload {
  requestId: string;
  houseIdNumber: string;
  accommodationType: string;
  accommodationName: string;
  position: string;
  owner: {
    sameAsRegistrant: boolean;
    nationalType: 'THAI' | 'FOREIGNER';
    firstName: string;
    lastName: string;
    telephone: string;
    gender: 'Male' | 'Female';
  };
  address: {
    addressNumber: string;
    villageNumber?: string;
    alley?: string;
    road?: string;
    province: string;
    district: string;
    subDistrict: string;
    postalCode: string;
  };
  idCardPath?: string;   // ImageKit URL
  houseBookPath?: string; // ImageKit URL
  dryRun?: boolean;
}

export interface TM30WorkflowResult {
  success: boolean;
  workflowRunId?: string;
  message: string;
  error?: string;
}

/**
 * Trigger the TM30 add_accommodation workflow via GitHub repository_dispatch
 */
export async function triggerTM30Workflow(payload: TM30WorkflowPayload): Promise<TM30WorkflowResult> {
  const GITHUB_TOKEN = process.env.GITHUB_TM30_TOKEN;
  const GITHUB_REPO = process.env.GITHUB_TM30_REPO || 'wasgeurtjeNL/tm30-automation';

  if (!GITHUB_TOKEN) {
    console.error('[TM30 Workflow] GITHUB_TM30_TOKEN not configured');
    return {
      success: false,
      message: 'GitHub token not configured',
      error: 'GITHUB_TM30_TOKEN environment variable not set',
    };
  }

  try {
    console.log('[TM30 Workflow] Triggering workflow for:', payload.accommodationName);
    console.log('[TM30 Workflow] Request ID:', payload.requestId);

    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'tm30-action',
          client_payload: {
            action: 'add_accommodation',
            accommodationData: payload,
          },
        }),
      }
    );

    if (response.status === 204) {
      // Success - GitHub returns 204 No Content for dispatches
      console.log('[TM30 Workflow] ✅ Workflow triggered successfully');
      return {
        success: true,
        message: 'TM30 workflow started. Processing will take 2-3 minutes.',
      };
    } else {
      const errorText = await response.text();
      console.error('[TM30 Workflow] Failed to trigger:', response.status, errorText);
      return {
        success: false,
        message: 'Failed to start TM30 workflow',
        error: `GitHub API error: ${response.status} - ${errorText}`,
      };
    }
  } catch (error: any) {
    console.error('[TM30 Workflow] Error:', error);
    return {
      success: false,
      message: 'Error triggering TM30 workflow',
      error: error.message,
    };
  }
}

/**
 * Create the workflow payload from session data
 */
export function createTM30Payload(data: {
  requestId: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  phone: string;
  houseIdNumber: string;
  addressNumber: string;
  villageNumber?: string;
  province: string;
  district: string;
  subDistrict: string;
  postalCode: string;
  accommodationName: string;
  idCardUrl?: string;
  bluebookUrl?: string;
  dryRun?: boolean;
}): TM30WorkflowPayload {
  return {
    requestId: data.requestId,
    houseIdNumber: data.houseIdNumber,
    accommodationType: 'House', // Default - can be expanded later
    accommodationName: data.accommodationName,
    position: 'Owner', // Default
    owner: {
      sameAsRegistrant: true,
      nationalType: 'THAI',
      firstName: data.firstName,
      lastName: data.lastName,
      telephone: data.phone.replace(/^\+66/, '0').replace(/^66/, '0'), // Convert to local format
      gender: data.gender,
    },
    address: {
      addressNumber: data.addressNumber,
      villageNumber: data.villageNumber || '',
      province: data.province,
      district: data.district,
      subDistrict: data.subDistrict,
      postalCode: data.postalCode,
    },
    idCardPath: data.idCardUrl,
    houseBookPath: data.bluebookUrl,
    dryRun: data.dryRun ?? false, // Default to live mode
  };
}




