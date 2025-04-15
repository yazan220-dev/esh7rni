import { NextRequest, NextResponse } from "next/server";
import { apiSecurity } from "@/lib/security/api";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

const prisma = new PrismaClient();

/**
 * GET /api/admin/users - Get all users (admin only)
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
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error("Error getting users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get users" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export { apiSecurity(GET) as GET };
