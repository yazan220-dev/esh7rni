import { NextRequest, NextResponse } from 'next/server';
import { createPayment, BinancePayClient } from '@/lib/api/payments';
import { getCurrentUser } from '@/lib/auth/session';
import { getOrderById } from '@/lib/api/orders';

const binancePayClient = new BinancePayClient();

// POST /api/payments/binance - Create a Binance Pay payment
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
      'binance'
    );
    
    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.message },
        { status: 500 }
      );
    }
    
    // Create Binance Pay order
    const binanceOrder = await binancePayClient.createOrder(
      order.amount,
      'USDT',
      order.id
    );
    
    if (binanceOrder.status !== 'SUCCESS') {
      return NextResponse.json(
        { success: false, error: 'Failed to create Binance Pay order' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        paymentId: paymentResult.data.id,
        binanceOrderId: binanceOrder.data.prepayId,
        checkoutUrl: binanceOrder.data.checkoutUrl
      }
    });
  } catch (error) {
    console.error('Error creating Binance Pay payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create Binance Pay payment' },
      { status: 500 }
    );
  }
}
