import { NextRequest, NextResponse } from 'next/server';
import { syncOrderStatus, syncAllOrderStatuses } from '@/lib/api/orders';
import { isAdmin } from '@/lib/auth/session';

// POST /api/orders/sync - Sync all order statuses (admin only)
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

    const result = await syncAllOrderStatuses();
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error syncing order statuses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync order statuses' },
      { status: 500 }
    );
  }
}
