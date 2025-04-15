import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentStatus, BinancePayClient } from '@/lib/api/payments';
import { submitOrderToAPI } from '@/lib/api/orders';

const binancePayClient = new BinancePayClient();

// POST /api/payments/binance/webhook - Handle Binance Pay webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers);
    
    // Verify webhook signature
    const isValid = binancePayClient.verifyWebhookSignature(headers, body);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }
    
    const data = JSON.parse(body);
    
    // Check if this is a payment completion event
    if (data.bizType !== 'PAY' || data.bizStatus !== 'PAY_SUCCESS') {
      return NextResponse.json({ success: true, message: 'Webhook received but not processed' });
    }
    
    const orderId = data.data.merchantTradeNo;
    const transactionId = data.data.transactionId;
    
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
    console.error('Error processing Binance Pay webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
