import { NextRequest, NextResponse } from 'next/server';
import NOWPaymentsClient from '@/lib/api/nowpayments';
import { updatePaymentStatus } from '@/lib/api/payments';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const nowpaymentsClient = new NOWPaymentsClient();

/**
 * NOWPayments webhook handler
 * POST /api/payments/nowpayments/webhook
 */
export async function POST(req: NextRequest) {
  try {
    // Get the raw request body
    const body = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // Verify webhook signature
    const isValid = nowpaymentsClient.verifyWebhookSignature(headers, body);
    
    if (!isValid) {
      console.error('Invalid NOWPayments webhook signature');
      return NextResponse.json(
        { success: false, message: 'Invalid signature' },
        { status: 400 }
      );
    }
    
    // Parse the webhook payload
    const payload = JSON.parse(body);
    
    // Extract payment information
    const { 
      payment_id,
      order_id,
      payment_status,
      pay_amount,
      pay_currency
    } = payload;
    
    if (!order_id || !payment_status) {
      console.error('Missing required fields in NOWPayments webhook');
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Find the payment record in our database
    const payment = await prisma.payment.findFirst({
      where: { orderId: order_id }
    });
    
    if (!payment) {
      console.error(`Payment not found for order ID: ${order_id}`);
      return NextResponse.json(
        { success: false, message: 'Payment not found' },
        { status: 404 }
      );
    }
    
    // Map NOWPayments status to our status
    let status: 'pending' | 'completed' | 'failed';
    
    switch (payment_status) {
      case 'finished':
      case 'confirmed':
        status = 'completed';
        break;
      case 'failed':
      case 'expired':
      case 'refunded':
        status = 'failed';
        break;
      default:
        status = 'pending';
    }
    
    // Update payment status in our database
    await updatePaymentStatus(payment.id, status, payment_id);
    
    // If payment is completed, process the order
    if (status === 'completed') {
      // Find the order
      const order = await prisma.order.findUnique({
        where: { id: payment.orderId }
      });
      
      if (order) {
        // Update order status to processing
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'processing' }
        });
        
        // TODO: Send order to SMMCOST API
        // This would typically be handled by a separate process
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing NOWPayments webhook:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
