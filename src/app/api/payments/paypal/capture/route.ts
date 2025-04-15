import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentStatus, PayPalClient } from '@/lib/api/payments';
import { submitOrderToAPI } from '@/lib/api/orders';

const paypalClient = new PayPalClient();

// POST /api/payments/paypal/capture - Capture a PayPal payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paypalOrderId, paymentId } = body;
    
    if (!paypalOrderId || !paymentId) {
      return NextResponse.json(
        { success: false, error: 'PayPal order ID and payment ID are required' },
        { status: 400 }
      );
    }
    
    // Capture the payment
    const captureResult = await paypalClient.capturePayment(paypalOrderId);
    
    if (captureResult.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: 'Failed to capture payment' },
        { status: 500 }
      );
    }
    
    // Update payment status
    const paymentResult = await updatePaymentStatus(
      paymentId,
      'completed',
      captureResult.id
    );
    
    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.message },
        { status: 500 }
      );
    }
    
    // Get the order ID from the payment
    const payment = paymentResult.data;
    
    // Submit order to SMMCOST API
    const orderResult = await submitOrderToAPI(payment.orderId);
    
    return NextResponse.json({
      success: true,
      message: 'Payment captured and order submitted successfully',
      data: {
        payment: payment,
        order: orderResult.success ? orderResult.data : null
      }
    });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to capture PayPal payment' },
      { status: 500 }
    );
  }
}
