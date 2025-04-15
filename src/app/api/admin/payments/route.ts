import { NextRequest, NextResponse } from "next/server";
import { apiSecurity } from "@/lib/security/api";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

const prisma = new PrismaClient();

/**
 * GET /api/admin/payments - Get all payments (admin only)
 */
async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const payments = await prisma.payment.findMany({
      include: {
        order: {
          include: {
            service: {
              select: {
                name: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ success: true, data: payments });
  } catch (error) {
    console.error("Error getting payments:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get payments" },
      { status: 500 }
    );
  }
}

// Apply security middleware
const securedGET = apiSecurity(GET);
export { securedGET as GET };
