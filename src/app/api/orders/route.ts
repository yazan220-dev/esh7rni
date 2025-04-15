import { NextRequest, NextResponse } from 'next/server';
import { createOrder, submitOrderToAPI, getOrderById, getOrdersByUserId, getAllOrders, syncOrderStatus, syncAllOrderStatuses } from '@/lib/api/orders';
import { getCurrentUser, isAdmin } from '@/lib/auth/session';

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { serviceId, link, quantity } = body;
    
    if (!serviceId || !link || !quantity) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const result = await createOrder(user.id, serviceId, link, quantity);
    
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
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/orders - Get orders for current user or all orders for admin
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const admin = await isAdmin();
    
    let result;
    if (admin) {
      result = await getAllOrders();
    } else {
      result = await getOrdersByUserId(user.id);
    }
    
    if (result.success) {
      return NextResponse.json({ success: true, data: result.data });
    } else {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error getting orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get orders' },
      { status: 500 }
    );
  }
}
