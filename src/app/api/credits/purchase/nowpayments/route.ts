import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a credit purchase with NOWPayments
 * POST /api/credits/purchase/nowpayments
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
    
    const { amount, transactionId } = await req.json();
    
    if (!amount || !transactionId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create credit transaction
    const transaction = await prisma.creditTransaction.create({
      data: {
        userId: session.user.id,
        amount: amount,
        type: 'purchase',
        method: 'nowpayments',
        status: 'completed',
        transactionId: transactionId,
      },
    });
    
    // Update user's credit balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }
    
    const currentCredits = user.credits || 0;
    
    await prisma.user.update({
      where: { id: session.user.id },
      data: { credits: currentCredits + amount },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        transaction,
        newBalance: currentCredits + amount,
      },
    });
  } catch (error) {
    console.error('Error processing NOWPayments credit purchase:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process credit purchase' },
      { status: 500 }
    );
  }
}
