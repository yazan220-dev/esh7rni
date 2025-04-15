import { NextRequest, NextResponse } from "next/server";
import { apiSecurity } from "@/lib/security/api";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

const prisma = new PrismaClient();

/**
 * GET /api/credits - Get user credits
 * POST /api/credits/purchase - Purchase credits
 */

async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Get user's current credit balance
    const credits = await prisma.credit.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Calculate total balance
    const balance = credits.reduce((total, credit) => {
      if (credit.type === "purchase" || credit.type === "bonus") {
        return total + credit.amount;
      } else if (credit.type === "usage" || credit.type === "refund") {
        return total - credit.amount;
      }
      return total;
    }, 0);
    
    // Get recent transactions
    const recentTransactions = credits.slice(0, 10);
    
    return NextResponse.json({
      success: true,
      data: {
        balance,
        recentTransactions,
      },
    });
  } catch (error) {
    console.error("Error getting credits:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get credits" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export { apiSecurity(GET) as GET };
