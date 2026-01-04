/**
 * TM30 Add Accommodation API
 * 
 * This API manages accommodation registration requests
 * and triggers the GitHub Actions workflow to add them to TM30
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Tm30AccomRequestStatus } from '@prisma/client';

// Default owner data (RUEDEEKORN - from TM30 profile)
const DEFAULT_OWNER = {
  sameAsRegistrant: true,
  nationalType: 'THAI' as const,
  nationalId: '1770500036961',
  firstName: 'ฤดีกร',
  lastName: 'จันทร์เกิด',
  telephone: '0986261646',
};

/**
 * GET: List all accommodation requests
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as Tm30AccomRequestStatus | null;
    
    const requests = await prisma.tm30_accommodation_request.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    
    return NextResponse.json({
      success: true,
      requests,
      total: requests.length,
    });
  } catch (error: any) {
    console.error('Error fetching accommodation requests:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Create a new accommodation request or trigger the workflow
 * 
 * Body options:
 * 1. Create request: { action: 'create', data: {...} }
 * 2. Trigger workflow: { action: 'trigger', requestId: '...' }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'create') {
      // Create a new accommodation request
      const { data } = body;
      
      if (!data.accommodationName || !data.address) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields: accommodationName, address' },
          { status: 400 }
        );
      }
      
      const newRequest = await prisma.tm30_accommodation_request.create({
        data: {
          // Owner (default to RUEDEEKORN)
          ownerSameAsRegistrant: data.ownerSameAsRegistrant ?? DEFAULT_OWNER.sameAsRegistrant,
          ownerNationalType: data.ownerNationalType ?? DEFAULT_OWNER.nationalType,
          ownerNationalId: data.ownerNationalId ?? DEFAULT_OWNER.nationalId,
          ownerFirstName: data.ownerFirstName ?? DEFAULT_OWNER.firstName,
          ownerLastName: data.ownerLastName ?? DEFAULT_OWNER.lastName,
          ownerTelephone: data.ownerTelephone ?? DEFAULT_OWNER.telephone,
          ownerMiddleName: data.ownerMiddleName,
          ownerGender: data.ownerGender,
          ownerPassportNumber: data.ownerPassportNumber,
          
          // Type
          entityType: data.entityType ?? 'INDIVIDUAL',
          houseIdNumber: data.houseIdNumber,
          
          // Accommodation
          accommodationType: data.accommodationType ?? 'Private house', // Default
          accommodationName: data.accommodationName,
          position: data.position,
          positionOther: data.positionOther,
          
          // Address
          addressNumber: data.address.addressNumber,
          villageNumber: data.address.villageNumber,
          alley: data.address.alley,
          road: data.address.road,
          province: data.address.province,
          district: data.address.district,
          subDistrict: data.address.subDistrict,
          postalCode: data.address.postalCode,
          latitude: data.address.latitude,
          longitude: data.address.longitude,
          
          // Documents
          houseRegistrationUrl: data.houseRegistrationUrl,
          houseRegistrationPath: data.houseRegistrationPath,
          
          // Status
          status: Tm30AccomRequestStatus.DRAFT,
          
          // Property link
          propertyId: data.propertyId,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Accommodation request created',
        request: newRequest,
      });
    }
    
    if (action === 'trigger') {
      // Trigger the GitHub Actions workflow
      const { requestId, dryRun = true } = body;
      
      if (!requestId) {
        return NextResponse.json(
          { success: false, error: 'Missing requestId' },
          { status: 400 }
        );
      }
      
      // Get the request from database
      const accomRequest = await prisma.tm30_accommodation_request.findUnique({
        where: { id: requestId },
      });
      
      if (!accomRequest) {
        return NextResponse.json(
          { success: false, error: 'Request not found' },
          { status: 404 }
        );
      }
      
      // Check status
      if (accomRequest.status === Tm30AccomRequestStatus.APPROVED) {
        return NextResponse.json(
          { success: false, error: 'Request already approved' },
          { status: 400 }
        );
      }
      
      if (accomRequest.status === Tm30AccomRequestStatus.PROCESSING) {
        return NextResponse.json(
          { success: false, error: 'Request is currently being processed' },
          { status: 400 }
        );
      }
      
      // Build the payload for the workflow
      const payload = {
        requestId: accomRequest.id,
        owner: {
          sameAsRegistrant: accomRequest.ownerSameAsRegistrant,
          nationalType: accomRequest.ownerNationalType as 'THAI' | 'FOREIGNER',
          nationalId: accomRequest.ownerNationalId,
          passportNumber: accomRequest.ownerPassportNumber,
          firstName: accomRequest.ownerFirstName,
          middleName: accomRequest.ownerMiddleName,
          lastName: accomRequest.ownerLastName,
          telephone: accomRequest.ownerTelephone,
          gender: accomRequest.ownerGender as 'M' | 'F' | undefined,
        },
        entityType: accomRequest.entityType as 'INDIVIDUAL' | 'JURISTIC',
        houseIdNumber: accomRequest.houseIdNumber,
        accommodationType: accomRequest.accommodationType,
        accommodationName: accomRequest.accommodationName,
        position: accomRequest.position,
        positionOther: accomRequest.positionOther,
        address: {
          addressNumber: accomRequest.addressNumber,
          villageNumber: accomRequest.villageNumber,
          alley: accomRequest.alley,
          road: accomRequest.road,
          province: accomRequest.province,
          district: accomRequest.district,
          subDistrict: accomRequest.subDistrict,
          postalCode: accomRequest.postalCode,
          latitude: accomRequest.latitude,
          longitude: accomRequest.longitude,
        },
        houseRegistrationPath: accomRequest.houseRegistrationPath,
        dryRun,
      };
      
      // Trigger GitHub Actions workflow
      const githubToken = process.env.GITHUB_TOKEN;
      const repo = process.env.TM30_GITHUB_REPO || 'wulle-net/tm30-automation';
      
      if (!githubToken) {
        return NextResponse.json(
          { success: false, error: 'GitHub token not configured' },
          { status: 500 }
        );
      }
      
      // Update status to PROCESSING
      await prisma.tm30_accommodation_request.update({
        where: { id: requestId },
        data: { status: Tm30AccomRequestStatus.PROCESSING },
      });
      
      // Dispatch repository event
      const response = await fetch(
        `https://api.github.com/repos/${repo}/dispatches`,
        {
          method: 'POST',
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event_type: 'tm30-action',
            client_payload: {
              action: 'add_accommodation',
              data: {
                accommodationData: payload,
              },
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub dispatch error:', errorText);
        
        // Revert status
        await prisma.tm30_accommodation_request.update({
          where: { id: requestId },
          data: { 
            status: Tm30AccomRequestStatus.FAILED,
            errorMessage: `GitHub dispatch failed: ${response.status}`,
          },
        });
        
        return NextResponse.json(
          { success: false, error: `GitHub dispatch failed: ${response.status}` },
          { status: 500 }
        );
      }
      
      return NextResponse.json({
        success: true,
        message: dryRun 
          ? 'Workflow triggered (DRY RUN - will not save)'
          : 'Workflow triggered (LIVE - will submit to TM30)',
        requestId: accomRequest.id,
        dryRun,
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "create" or "trigger"' },
      { status: 400 }
    );
    
  } catch (error: any) {
    console.error('Error processing accommodation request:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH: Update a request status (callback from GitHub Actions)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify callback secret
    const callbackSecret = request.headers.get('X-TM30-Callback-Secret');
    if (callbackSecret !== process.env.TM30_CALLBACK_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { requestId, success, tm30Id, error: errorMessage } = body;
    
    if (!requestId) {
      return NextResponse.json(
        { success: false, error: 'Missing requestId' },
        { status: 400 }
      );
    }
    
    const updateData: any = {};
    
    if (success) {
      if (tm30Id) {
        // Fully approved with TM30 ID
        updateData.status = Tm30AccomRequestStatus.APPROVED;
        updateData.tm30Id = tm30Id;
        updateData.approvedAt = new Date();
      } else {
        // Submitted but waiting for approval
        updateData.status = Tm30AccomRequestStatus.SUBMITTED;
        updateData.submittedAt = new Date();
      }
    } else {
      updateData.status = Tm30AccomRequestStatus.FAILED;
      updateData.errorMessage = errorMessage;
    }
    
    const updatedRequest = await prisma.tm30_accommodation_request.update({
      where: { id: requestId },
      data: updateData,
    });
    
    // If approved with TM30 ID, also create/update the Tm30Accommodation cache
    if (success && tm30Id) {
      await prisma.tm30_accommodation.upsert({
        where: { tm30_id: tm30Id },
        create: {
          id: crypto.randomUUID(),
          tm30_id: tm30Id,
          name: updatedRequest.accommodationName,
          address: `${updatedRequest.addressNumber}, ${updatedRequest.subDistrict}, ${updatedRequest.district}, ${updatedRequest.province}`,
          status: 'Approved',
          propertyId: updatedRequest.propertyId,
          matchedBy: 'add_accommodation_workflow',
          matchedAt: new Date(),
          syncSource: 'workflow',
        },
        update: {
          name: updatedRequest.accommodationName,
          address: `${updatedRequest.addressNumber}, ${updatedRequest.subDistrict}, ${updatedRequest.district}, ${updatedRequest.province}`,
          status: 'Approved',
          propertyId: updatedRequest.propertyId,
          lastSyncedAt: new Date(),
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Request updated',
      request: updatedRequest,
    });
    
  } catch (error: any) {
    console.error('Error updating accommodation request:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

