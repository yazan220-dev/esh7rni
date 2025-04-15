import { NextRequest, NextResponse } from "next/server";
import { apiSecurity } from "@/lib/security/api";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

const prisma = new PrismaClient();

/**
 * POST /api/credits/purchase/paypal - Purchase credits with PayPal
 */
async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { amount, paymentId, payerId } = body;
    
    // Validate required fields
    if (!amount || !paymentId || !payerId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate amount (minimum 10 USD)
    if (parseFloat(amount) < 10) {
      return NextResponse.json(
        { success: false, error: "Minimum amount is 10 USD" },
        { status: 400 }
      );
    }
    
    // Initialize PayPal client
    const paypal = require('@paypal/checkout-server-sdk');
    const environment = process.env.NODE_ENV === 'production'
      ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET)
      : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_SECRET);
    const client = new paypal.core.PayPalHttpClient(environment);
    
    // Capture the payment
    const request = new paypal.orders.OrdersCaptureRequest(paymentId);
    request.requestBody({});
    
    const response = await client.execute(request);
    
    if (response.result.status !== 'COMPLETED') {
      return NextResponse.json(
        { success: false, error: "Payment capture failed" },
        { status: 400 }
      );
    }
    
    // Check if this transaction has already been processed
    const existingPayment = await prisma.payment.findFirst({
      where: {
        transactionId: paymentId,
      },
    });
    
    if (existingPayment) {
      return NextResponse.json(
        { success: false, error: "Transaction already processed" },
        { status: 400 }
      );
    }
    
    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        currency: "USD",
        method: "PAYPAL",
        status: "completed",
        transactionId: paymentId,
        paymentIntent: payerId,
        paymentResponse: JSON.stringify(response.result),
        creditAmount: parseFloat(amount), // 1:1 ratio for credits to USD
      },
    });
    
    // Add credits to user account
    const credit = await prisma.credit.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        transactionId: paymentId,
        type: "purchase",
        description: `Purchased ${amount} credits with PayPal`,
      },
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "credit_purchase",
        content: `You have successfully purchased ${amount} credits with PayPal.`,
        status: "sent",
        metadata: JSON.stringify({
          amount,
          transactionId: paymentId,
          method: "PAYPAL",
        }),
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        payment,
        credit,
      },
    });
  } catch (error) {
    console.error("Error processing PayPal payment for credits:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process PayPal payment" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export { apiSecurity(POST) as POST };
