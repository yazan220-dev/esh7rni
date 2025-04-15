import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import NOWPaymentsClient from '@/lib/api/nowpayments';
import { createPayment, updatePaymentStatus } from '@/lib/api/payments';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const nowpaymentsClient = new NOWPaymentsClient();

/**
 * Create a NOWPayments payment
 * POST /api/payments/nowpayments
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { amount, orderId } = await req.json();
    
    if (!amount || !orderId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create payment record in database
    const paymentResult = await createPayment(
      session.user.id,
      orderId,
      amount,
      'nowpayments'
    );
    
    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, message: paymentResult.message },
        { status: 500 }
      );
    }
    
    // Get direct payment URL
    const paymentUrl = nowpaymentsClient.getDirectPaymentUrl(amount, orderId);
    
    return NextResponse.json({
      success: true,
      data: {
        paymentId: paymentResult.data.id,
        paymentUrl
      }
    });
  } catch (error) {
    console.error('Error creating NOWPayments payment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

/**
 * Get NOWPayments payment status
 * GET /api/payments/nowpayments?paymentId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const url = new URL(req.url);
    const paymentId = url.searchParams.get('paymentId');
    
    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'Missing payment ID' },
        { status: 400 }
      );
    }
    
    // Get payment status from NOWPayments
    const status = await nowpaymentsClient.getPaymentStatus(paymentId);
    
    return NextResponse.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('Error getting NOWPayments status:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get payment status' },
      { status: 500 }
    );
  }
}
