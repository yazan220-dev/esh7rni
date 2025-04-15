import { SMMCOSTClient } from '@/lib/api/smmcost';
import { PrismaClient } from '@prisma/client';
import { getServiceById } from '@/lib/api/services';

const prisma = new PrismaClient();
const smmcostClient = new SMMCOSTClient();

/**
 * Create a new order
 */
export async function createOrder(
  userId: string,
  serviceId: number,
  link: string,
  quantity: number
) {
  try {
    // Get service details
    const service = await getServiceById(serviceId);
    
    if (!service) {
      return { success: false, message: 'Service not found' };
    }
    
    // Validate quantity
    if (quantity < service.min || quantity > service.max) {
      return { 
        success: false, 
        message: `Quantity must be between ${service.min} and ${service.max}` 
      };
    }
    
    // Calculate amount
    const amount = service.rate * quantity / 1000;
    
    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId,
        serviceId: (await prisma.service.findUnique({ where: { serviceId } }))?.id || '',
        link,
        quantity,
        amount,
        status: 'pending',
      },
    });
    
    return { 
      success: true, 
      message: 'Order created successfully', 
      data: { orderId: order.id } 
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, message: 'Failed to create order' };
  }
}

/**
 * Submit order to SMMCOST API
 */
export async function submitOrderToAPI(orderId: string) {
  try {
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { service: true },
    });
    
    if (!order) {
      return { success: false, message: 'Order not found' };
    }
    
    // Check if order is already submitted
    if (order.apiOrderId) {
      return { success: false, message: 'Order already submitted to API' };
    }
    
    // Submit order to SMMCOST API
    const response = await smmcostClient.placeOrder(
      order.service.serviceId,
      order.link,
      order.quantity
    );
    
    // Update order with API order ID
    await prisma.order.update({
      where: { id: orderId },
      data: {
        apiOrderId: response.order.toString(),
        status: 'processing',
      },
    });
    
    return { 
      success: true, 
      message: 'Order submitted to API successfully', 
      data: { apiOrderId: response.order } 
    };
  } catch (error) {
    console.error('Error submitting order to API:', error);
    return { success: false, message: 'Failed to submit order to API' };
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string, userId?: string) {
  try {
    const whereClause: any = { id: orderId };
    
    // If userId is provided, ensure the order belongs to the user
    if (userId) {
      whereClause.userId = userId;
    }
    
    const order = await prisma.order.findUnique({
      where: whereClause,
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!order) {
      return { success: false, message: 'Order not found' };
    }
    
    return { success: true, data: order };
  } catch (error) {
    console.error('Error getting order:', error);
    return { success: false, message: 'Failed to get order' };
  }
}

/**
 * Get orders by user ID
 */
export async function getOrdersByUserId(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: orders };
  } catch (error) {
    console.error('Error getting orders:', error);
    return { success: false, message: 'Failed to get orders' };
  }
}

/**
 * Get all orders (admin only)
 */
export async function getAllOrders() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        service: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: orders };
  } catch (error) {
    console.error('Error getting all orders:', error);
    return { success: false, message: 'Failed to get all orders' };
  }
}

/**
 * Sync order status from SMMCOST API
 */
export async function syncOrderStatus(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });
    
    if (!order || !order.apiOrderId) {
      return { success: false, message: 'Order not found or not submitted to API' };
    }
    
    // Get order status from SMMCOST API
    const response = await smmcostClient.getOrderStatus(parseInt(order.apiOrderId));
    
    // Map API status to our status
    let status = 'processing';
    
    switch (response.status) {
      case 'Completed':
        status = 'completed';
        break;
      case 'Processing':
        status = 'processing';
        break;
      case 'In progress':
        status = 'processing';
        break;
      case 'Partial':
        status = 'completed';
        break;
      case 'Canceled':
        status = 'canceled';
        break;
      case 'Failed':
        status = 'failed';
        break;
      default:
        status = 'processing';
    }
    
    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
    
    return { 
      success: true, 
      message: 'Order status synced successfully', 
      data: { status } 
    };
  } catch (error) {
    console.error('Error syncing order status:', error);
    return { success: false, message: 'Failed to sync order status' };
  }
}

/**
 * Sync all order statuses from SMMCOST API
 */
export async function syncAllOrderStatuses() {
  try {
    // Get all orders with API order IDs
    const orders = await prisma.order.findMany({
      where: {
        apiOrderId: { not: null },
        status: { notIn: ['completed', 'canceled', 'failed'] },
      },
    });
    
    if (orders.length === 0) {
      return { success: true, message: 'No orders to sync' };
    }
    
    // Get order IDs
    const apiOrderIds = orders.map(order => parseInt(order.apiOrderId!));
    
    // Get order statuses from SMMCOST API
    const response = await smmcostClient.getMultipleOrdersStatus(apiOrderIds);
    
    // Update order statuses
    for (const order of orders) {
      const apiOrderId = order.apiOrderId!;
      const apiStatus = response[apiOrderId]?.status;
      
      if (!apiStatus) continue;
      
      // Map API status to our status
      let status = 'processing';
      
      switch (apiStatus) {
        case 'Completed':
          status = 'completed';
          break;
        case 'Processing':
          status = 'processing';
          break;
        case 'In progress':
          status = 'processing';
          break;
        case 'Partial':
          status = 'completed';
          break;
        case 'Canceled':
          status = 'canceled';
          break;
        case 'Failed':
          status = 'failed';
          break;
        default:
          status = 'processing';
      }
      
      // Update order status
      await prisma.order.update({
        where: { id: order.id },
        data: { status },
      });
    }
    
    return { 
      success: true, 
      message: 'All order statuses synced successfully' 
    };
  } catch (error) {
    console.error('Error syncing all order statuses:', error);
    return { success: false, message: 'Failed to sync all order statuses' };
  }
}
