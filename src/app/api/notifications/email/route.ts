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
 * POST /api/notifications/email - Send email notification
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
    const { to, subject, text, html, orderId } = body;
    
    // Validate required fields
    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // If orderId is provided, verify that the user has access to this order
    if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });
      
      if (!order) {
        return NextResponse.json(
          { success: false, error: "Order not found" },
          { status: 404 }
        );
      }
      
      // Only allow admin or the order owner to send notifications about an order
      if (user.role !== "admin" && order.userId !== user.id) {
        return NextResponse.json(
          { success: false, error: "Unauthorized" },
          { status: 401 }
        );
      }
    }
    
    // Send email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    
    // Log notification in database
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: "email",
        content: text || html,
        orderId,
        status: "sent",
        metadata: JSON.stringify(info),
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
    console.error("Error sending email notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send email notification" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export { apiSecurity(POST) as POST };
