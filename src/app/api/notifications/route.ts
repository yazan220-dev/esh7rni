import { NextRequest, NextResponse } from "next/server";
import { apiSecurity } from "@/lib/security/api";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

const prisma = new PrismaClient();

/**
 * GET /api/notifications - Get user notifications
 * POST /api/notifications - Mark notifications as read
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
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const status = searchParams.get("status"); // "read", "unread", or null for all
    
    // Build query
    const query: any = {
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc" as const,
      },
      take: limit,
      skip: offset,
    };
    
    // Add status filter if provided
    if (status === "read" || status === "unread") {
      query.where.read = status === "read";
    }
    
    // Get notifications
    const notifications = await prisma.notification.findMany(query);
    
    // Get total count
    const totalCount = await prisma.notification.count({
      where: query.where,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get notifications" },
      { status: 500 }
    );
  }
}

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
    const { ids, all } = body;
    
    if (!ids && !all) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    if (all) {
      // Mark all notifications as read
      await prisma.notification.updateMany({
        where: {
          userId: user.id,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      
      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else if (ids && Array.isArray(ids)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: {
            in: ids,
          },
          userId: user.id,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });
      
      return NextResponse.json({
        success: true,
        message: `${ids.length} notifications marked as read`,
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export { apiSecurity(GET) as GET, apiSecurity(POST) as POST };
