import { NextRequest, NextResponse } from 'next/server';
import { syncOrderStatus } from '@/lib/api/orders';
import { getCurrentUser, isAdmin } from '@/lib/auth/session';
import { getOrderById } from '@/lib/api/orders';

// POST /api/orders/[id]/sync - Sync order status
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const orderId = params.id;
    
    // Verify the order belongs to the user or user is admin
    const admin = await isAdmin();
    const orderResult = await getOrderById(orderId, admin ? undefined : user.id);
    
    if (!orderResult.success) {
      return NextResponse.json(
        { success: false, error: orderResult.message },
        { status: 404 }
      );
    }
    
    const result = await syncOrderStatus(orderId);
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message,
        data: result.data
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error syncing order status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sync order status' },
      { status: 500 }
    );
  }
}
