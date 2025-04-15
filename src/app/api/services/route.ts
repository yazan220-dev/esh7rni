import { NextRequest, NextResponse } from 'next/server';
import { syncServices, getAllCategories, getServiceById, updateServiceMarkup, updateServiceDescription } from '@/lib/api/services';
import { isAdmin } from '@/lib/auth/session';

// GET /api/services - Get all services categorized
export async function GET(request: NextRequest) {
  try {
    const categories = await getAllCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

// POST /api/services/sync - Sync services from SMMCOST API (admin only)
export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const result = await syncServices();
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error syncing services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync services' },
      { status: 500 }
    );
  }
}
