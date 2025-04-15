import { NextRequest, NextResponse } from "next/server";
import { apiSecurity } from "@/lib/security/api";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";

const prisma = new PrismaClient();

/**
 * POST /api/orders/credit - Place an order using credits
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
    const { serviceId, link, quantity } = body;
    
    // Validate required fields
    if (!serviceId || !link || !quantity) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });
    
    if (!service) {
      return NextResponse.json(
        { success: false, error: "Service not found" },
        { status: 404 }
      );
    }
    
    // Validate quantity
    if (quantity < service.min || quantity > service.max) {
      return NextResponse.json(
        { success: false, error: `Quantity must be between ${service.min} and ${service.max}` },
        { status: 400 }
      );
    }
    
    // Calculate order amount
    const amount = (service.rate * quantity) / 1000;
    
    // Get user's credit balance
    const credits = await prisma.credit.findMany({
      where: {
        userId: user.id,
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
    
    // Check if user has enough credits
    if (balance < amount) {
      return NextResponse.json(
        { success: false, error: `Insufficient credits. You have $${balance.toFixed(2)} but need $${amount.toFixed(2)}` },
        { status: 400 }
      );
    }
    
    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        serviceId: service.id,
        link,
        quantity,
        amount,
        status: "pending",
      },
    });
    
    // Deduct credits from user account
    await prisma.credit.create({
      data: {
        userId: user.id,
        amount,
        type: "usage",
        description: `Order #${order.id} - ${service.name}`,
        orderId: order.id,
      },
    });
    
    // Send order to SMMCOST API
    const smmcostApi = await import("@/lib/api/smmcost");
    const apiResponse = await smmcostApi.placeOrder({
      service: service.serviceId,
      link,
      quantity,
    });
    
    // Update order with API response
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        apiOrderId: apiResponse.order,
        apiResponse: JSON.stringify(apiResponse),
        status: "processing",
      },
    });
    
    // Create notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "order_placed",
        content: `Your order #${order.id} for ${service.name} has been placed successfully.`,
        orderId: order.id,
        status: "sent",
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder,
        remainingCredits: balance - amount,
      },
    });
  } catch (error) {
    console.error("Error placing order with credits:", error);
    return NextResponse.json(
      { success: false, error: "Failed to place order" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export { apiSecurity(POST) as POST };
