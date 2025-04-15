import { NextRequest, NextResponse } from "next/server";
import { apiSecurity } from "@/lib/security/api";
import { PrismaClient } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import nodemailer from "nodemailer";

const prisma = new PrismaClient();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  secure: Number(process.env.EMAIL_SERVER_PORT) === 465,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

/**
 * POST /api/notifications/order-status - Send order status notification
 */
async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { orderId } = body;
    
    // Validate required fields
    if (!orderId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        service: true,
      },
    });
    
    if (!order) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Prepare email content
    const subject = `Order Status Update: ${order.status} - Order #${order.id}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Status Update</h2>
        <p>Hello ${order.user.name || order.user.email},</p>
        <p>Your order status has been updated:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Service:</strong> ${order.service.name}</p>
          <p><strong>Status:</strong> <span style="color: ${
            order.status === 'completed' ? '#28a745' : 
            order.status === 'processing' ? '#ffc107' : 
            order.status === 'failed' ? '#dc3545' : '#17a2b8'
          };">${order.status.toUpperCase()}</span></p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <p>You can view the details of your order in your <a href="${process.env.NEXTAUTH_URL}/dashboard/orders/${order.id}" style="color: #007bff;">dashboard</a>.</p>
        <p>Thank you for using our services!</p>
        <p>Best regards,<br>The Esh7rni Team</p>
      </div>
    `;
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: order.user.email,
      subject,
      html,
    });
    
    // Log notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: order.userId,
        type: "order_status",
        content: `Your order #${order.id} status has been updated to ${order.status}`,
        orderId: order.id,
        status: "sent",
        metadata: JSON.stringify({
          messageId: info.messageId,
          orderStatus: order.status,
        }),
      },
    });
    
    return NextResponse.json({
      success: true,
      data: {
        notificationId: notification.id,
        messageId: info.messageId,
      },
    });
  } catch (error) {
    console.error("Error sending order status notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send order status notification" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export { apiSecurity(POST) as POST };
