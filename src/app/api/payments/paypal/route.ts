import { NextRequest, NextResponse } from 'next/server';
import { createPayment, PayPalClient, BinancePayClient } from '@/lib/api/payments';
import { getCurrentUser } from '@/lib/auth/session';
import { getOrderById } from '@/lib/api/orders';

const paypalClient = new PayPalClient();
const binancePayClient = new BinancePayClient();

// POST /api/payments/paypal - Create a PayPal payment
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
    const { orderId } = body;
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }
    
    // Get order details
    const orderResult = await getOrderById(orderId, user.id);
    
    if (!orderResult.success) {
      return NextResponse.json(
        { success: false, error: orderResult.message },
        { status: 404 }
      );
    }
    
    const order = orderResult.data;
    
    // Create payment record
    const paymentResult = await createPayment(
      user.id,
      orderId,
      order.amount,
      'paypal'
    );
    
    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.message },
        { status: 500 }
      );
    }
    
    // Create PayPal order
    const paypalOrder = await paypalClient.createOrder(
      order.amount,
      'USD',
      order.id
    );
    
    return NextResponse.json({
      success: true,
      data: {
        paymentId: paymentResult.data.id,
        paypalOrderId: paypalOrder.id,
        approvalUrl: paypalOrder.links.find((link: any) => link.rel === 'approve').href
      }
    });
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create PayPal payment' },
      { status: 500 }
    );
  }
}
