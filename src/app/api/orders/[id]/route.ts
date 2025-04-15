import { NextRequest, NextResponse } from 'next/server';
import { getOrderById, submitOrderToAPI, syncOrderStatus } from '@/lib/api/orders';
import { getCurrentUser, isAdmin } from '@/lib/auth/session';

// GET /api/orders/[id] - Get order by ID
export async function GET(
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
    const admin = await isAdmin();
    
    // If admin, get any order. If regular user, only get their own orders
    const result = await getOrderById(orderId, admin ? undefined : user.id);
    
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error getting order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get order' },
      { status: 500 }
    );
  }
}

// POST /api/orders/[id]/submit - Submit order to SMMCOST API
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
    
    const result = await submitOrderToAPI(orderId);
    
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
    console.error('Error submitting order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit order' },
      { status: 500 }
    );
  }
}
