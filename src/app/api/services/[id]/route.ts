import { NextRequest, NextResponse } from 'next/server';
import { getServiceById, updateServiceMarkup, updateServiceDescription } from '@/lib/api/services';
import { isAdmin } from '@/lib/auth/session';

// GET /api/services/[id] - Get service by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const serviceId = parseInt(params.id);
    
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid service ID' },
        { status: 400 }
      );
    }
    
    const service = await getServiceById(serviceId);
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: 'Service not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: service });
  } catch (error) {
    console.error('Error fetching service:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service' },
      { status: 500 }
    );
  }
}

// PATCH /api/services/[id] - Update service description (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const serviceId = parseInt(params.id);
    
    if (isNaN(serviceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid service ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { description } = body;
    
    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      );
    }
    
    const result = await updateServiceDescription(serviceId, description);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating service description:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update service description' },
      { status: 500 }
    );
  }
}
