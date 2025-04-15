import { NextRequest, NextResponse } from "next/server";
import { apiSecurity } from "@/lib/security/api";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

const prisma = new PrismaClient();

/**
 * GET /api/admin/users/[id] - Get a specific user (admin only)
 * PATCH /api/admin/users/[id] - Update a user's role (admin only)
 * DELETE /api/admin/users/[id] - Delete a user (admin only)
 */

async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = params.id;
    
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: targetUser });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get user" },
      { status: 500 }
    );
  }
}

async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = params.id;
    const body = await request.json();
    
    // Only allow updating role for now
    if (!body.role || !["user", "admin"].includes(body.role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }
    
    // Prevent admin from changing their own role
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot change your own role" },
        { status: 400 }
      );
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: body.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    return NextResponse.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update user" },
      { status: 500 }
    );
  }
}

async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const userId = params.id;
    
    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json(
        { success: false, error: "Cannot delete your own account" },
        { status: 400 }
      );
    }
    
    await prisma.user.delete({
      where: { id: userId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete user" },
      { status: 500 }
    );
  }
}

// Apply security middleware
const securedGET = apiSecurity(GET);
const securedPATCH = apiSecurity(PATCH);
const securedDELETE = apiSecurity(DELETE);

export { securedGET as GET, securedPATCH as PATCH, securedDELETE as DELETE };
