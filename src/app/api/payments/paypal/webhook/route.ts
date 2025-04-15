import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentStatus, PayPalClient } from '@/lib/api/payments';
import { submitOrderToAPI } from '@/lib/api/orders';

const paypalClient = new PayPalClient();

// POST /api/payments/paypal/webhook - Handle PayPal webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers);
    
    // Verify webhook signature
    const webhookId = process.env.PAYPAL_WEBHOOK_ID || '';
    const isValid = await paypalClient.verifyWebhookSignature(headers, body, webhookId);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }
    
    const data = JSON.parse(body);
    
    // Check if this is a payment capture completed event
    if (data.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
      return NextResponse.json({ success: true, message: 'Webhook received but not processed' });
    }
    
    const resource = data.resource;
    const transactionId = resource.id;
    const purchaseUnit = resource.purchase_units?.[0];
    
    if (!purchaseUnit || !purchaseUnit.reference_id) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook data' },
        { status: 400 }
      );
    }
    
    const orderId = purchaseUnit.reference_id;
    
    // Find the payment by order ID
    const prisma = new (await import('@prisma/client')).PrismaClient();
    const payment = await prisma.payment.findFirst({
      where: { orderId },
    });
    
    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Update payment status
    const paymentResult = await updatePaymentStatus(
      payment.id,
      'completed',
      transactionId
    );
    
    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.message },
        { status: 500 }
      );
    }
    
    // Submit order to SMMCOST API
    await submitOrderToAPI(orderId);
    
    return NextResponse.json({
      success: true,
      message: 'Payment completed and order submitted successfully'
    });
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
