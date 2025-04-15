import { NextRequest, NextResponse } from "next/server";
import { apiSecurity } from "@/lib/security/api";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { ethers } from "ethers";

const prisma = new PrismaClient();

// USDT contract ABI (simplified for token transfers)
const USDT_ABI = [
  "function transfer(address to, uint value) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint value)"
];

// Optimism USDT contract address
const USDT_CONTRACT_ADDRESS = "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58"; // USDT on Optimism

/**
 * POST /api/credits/purchase/usdt - Purchase credits with USDT on Optimism
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
    const { amount, transactionHash } = body;
    
    // Validate required fields
    if (!amount || !transactionHash) {
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
    
    // Connect to Optimism network
    const provider = new ethers.providers.JsonRpcProvider(process.env.OPTIMISM_RPC_URL);
    
    // Verify transaction
    const transaction = await provider.getTransaction(transactionHash);
    
    if (!transaction) {
      return NextResponse.json(
        { success: false, error: "Transaction not found" },
        { status: 400 }
      );
    }
    
    // Wait for transaction to be confirmed
    const receipt = await transaction.wait();
    
    if (!receipt.status) {
      return NextResponse.json(
        { success: false, error: "Transaction failed" },
        { status: 400 }
      );
    }
    
    // Verify the transaction is to our address
    const receiverAddress = process.env.USDT_RECEIVER_ADDRESS;
    
    if (transaction.to.toLowerCase() !== USDT_CONTRACT_ADDRESS.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction: not sent to USDT contract" },
        { status: 400 }
      );
    }
    
    // Create USDT contract instance
    const contract = new ethers.Contract(USDT_CONTRACT_ADDRESS, USDT_ABI, provider);
    
    // Parse transaction logs to verify it's a transfer to our address
    const transferEvent = receipt.logs
      .map(log => {
        try {
          return contract.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter(event => event && event.name === "Transfer")
      .find(event => event.args.to.toLowerCase() === receiverAddress.toLowerCase());
    
    if (!transferEvent) {
      return NextResponse.json(
        { success: false, error: "Invalid transaction: not a transfer to our address" },
        { status: 400 }
      );
    }
    
    // Verify amount (USDT has 6 decimals on Optimism)
    const transferAmount = ethers.utils.formatUnits(transferEvent.args.value, 6);
    
    if (parseFloat(transferAmount) < parseFloat(amount)) {
      return NextResponse.json(
        { success: false, error: "Transaction amount is less than requested amount" },
        { status: 400 }
      );
    }
    
    // Check if this transaction has already been processed
    const existingPayment = await prisma.payment.findFirst({
      where: {
        transactionId: transactionHash,
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
        method: "USDT_OPTIMISM",
        status: "completed",
        transactionId: transactionHash,
        paymentResponse: JSON.stringify({
          transactionHash,
          amount: transferAmount,
          blockNumber: receipt.blockNumber,
        }),
        creditAmount: parseFloat(amount), // 1:1 ratio for credits to USD
      },
    });
    
    // Add credits to user account
    const credit = await prisma.credit.create({
      data: {
        userId: user.id,
        amount: parseFloat(amount),
        transactionId: transactionHash,
        type: "purchase",
        description: `Purchased ${amount} credits with USDT on Optimism`,
      },
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "credit_purchase",
        content: `You have successfully purchased ${amount} credits with USDT.`,
        status: "sent",
        metadata: JSON.stringify({
          amount,
          transactionHash,
          method: "USDT_OPTIMISM",
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
    console.error("Error processing USDT payment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process USDT payment" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export { apiSecurity(POST) as POST };
