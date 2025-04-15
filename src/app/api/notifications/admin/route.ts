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
 * POST /api/notifications/admin - Send notification to admin
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
    const { subject, message, orderId, type = "general" } = body;
    
    // Validate required fields
    if (!subject || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: { role: "admin" },
    });
    
    if (admins.length === 0) {
      return NextResponse.json(
        { success: false, error: "No admin users found" },
        { status: 404 }
      );
    }
    
    // Prepare email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Admin Notification</h2>
        <p>A notification has been sent by ${user.name || user.email}:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Type:</strong> ${type}</p>
          ${orderId ? `<p><strong>Order ID:</strong> #${orderId}</p>` : ''}
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong> ${message}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        </div>
        ${orderId ? `<p>You can view the order details in the <a href="${process.env.NEXTAUTH_URL}/dashboard/admin/orders/${orderId}" style="color: #007bff;">admin dashboard</a>.</p>` : ''}
        <p>Best regards,<br>The Esh7rni System</p>
      </div>
    `;
    
    // Send email to all admins
    const emailPromises = admins.map(admin => 
      transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: admin.email,
        subject: `Admin Notification: ${subject}`,
        html,
      })
    );
    
    const emailResults = await Promise.all(emailPromises);
    
    // Create notifications for all admins
    const notificationPromises = admins.map(admin => 
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: type,
          content: message,
          orderId,
          status: "sent",
          metadata: JSON.stringify({
            subject,
            senderUserId: user.id,
          }),
        },
      })
    );
    
    const notifications = await Promise.all(notificationPromises);
    
    return NextResponse.json({
      success: true,
      data: {
        notificationIds: notifications.map(n => n.id),
        messageIds: emailResults.map(r => r.messageId),
      },
    });
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send admin notification" },
      { status: 500 }
    );
  }
}

// Apply security middleware
export { apiSecurity(POST) as POST };
