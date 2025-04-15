import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

/**
 * PayPal API Client
 * Handles all interactions with the PayPal API
 */
export class PayPalClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env.PAYPAL_CLIENT_ID || '';
    this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  }

  /**
   * Get access token for PayPal API
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if it's still valid
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/oauth2/token`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
        },
        data: 'grant_type=client_credentials'
      });

      this.accessToken = response.data.access_token;
      // Set token expiry (subtract 60 seconds to be safe)
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      
      return this.accessToken;
    } catch (error) {
      console.error('Error getting PayPal access token:', error);
      throw new Error('Failed to get PayPal access token');
    }
  }

  /**
   * Create a PayPal order
   */
  async createOrder(amount: number, currency: string = 'USD', orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v2/checkout/orders`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          intent: 'CAPTURE',
          purchase_units: [
            {
              reference_id: orderId,
              description: 'Esh7rni SMM Service',
              amount: {
                currency_code: currency,
                value: amount.toFixed(2)
              }
            }
          ],
          application_context: {
            brand_name: 'Esh7rni',
            landing_page: 'NO_PREFERENCE',
            user_action: 'PAY_NOW',
            return_url: `${process.env.NEXTAUTH_URL}/payment/success`,
            cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`
          }
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      throw new Error('Failed to create PayPal order');
    }
  }

  /**
   * Capture a PayPal payment
   */
  async capturePayment(paypalOrderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error capturing PayPal payment:', error);
      throw new Error('Failed to capture PayPal payment');
    }
  }

  /**
   * Verify a PayPal webhook signature
   */
  async verifyWebhookSignature(
    headers: Record<string, string>,
    body: string,
    webhookId: string
  ): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/v1/notifications/verify-webhook-signature`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        data: {
          webhook_id: webhookId,
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_event: JSON.parse(body)
        }
      });
      
      return response.data.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Error verifying PayPal webhook signature:', error);
      return false;
    }
  }
}

/**
 * Binance Pay API Client
 * Handles all interactions with the Binance Pay API
 */
export class BinancePayClient {
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.BINANCE_API_KEY || '';
    this.apiSecret = process.env.BINANCE_API_SECRET || '';
    this.baseUrl = 'https://bpay.binanceapi.com';
  }

  /**
   * Generate signature for Binance Pay API
   */
  private generateSignature(timestamp: number, payload: string): string {
    const crypto = require('crypto');
    const message = timestamp + '\n' + payload;
    return crypto.createHmac('sha512', this.apiSecret).update(message).digest('hex').toUpperCase();
  }

  /**
   * Create a Binance Pay order
   */
  async createOrder(amount: number, currency: string = 'USDT', orderId: string): Promise<any> {
    try {
      const timestamp = Date.now();
      const nonce = timestamp.toString();
      
      const payload = JSON.stringify({
        env: {
          terminalType: 'WEB'
        },
        merchantTradeNo: orderId,
        orderAmount: amount.toFixed(2),
        currency: currency,
        goods: {
          goodsType: 'VIRTUAL_GOODS',
          goodsCategory: 'SMM_SERVICES',
          referenceGoodsId: orderId,
          goodsName: 'Esh7rni SMM Service',
          goodsDetail: 'Social Media Marketing Service'
        },
        returnUrl: `${process.env.NEXTAUTH_URL}/payment/success`,
        cancelUrl: `${process.env.NEXTAUTH_URL}/payment/cancel`
      });
      
      const signature = this.generateSignature(timestamp, payload);
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/binancepay/openapi/order`,
        headers: {
          'Content-Type': 'application/json',
          'BinancePay-Timestamp': timestamp.toString(),
          'BinancePay-Nonce': nonce,
          'BinancePay-Certificate-SN': this.apiKey,
          'BinancePay-Signature': signature
        },
        data: payload
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating Binance Pay order:', error);
      throw new Error('Failed to create Binance Pay order');
    }
  }

  /**
   * Query a Binance Pay order
   */
  async queryOrder(orderId: string): Promise<any> {
    try {
      const timestamp = Date.now();
      const nonce = timestamp.toString();
      
      const payload = JSON.stringify({
        merchantTradeNo: orderId
      });
      
      const signature = this.generateSignature(timestamp, payload);
      
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/binancepay/openapi/order/query`,
        headers: {
          'Content-Type': 'application/json',
          'BinancePay-Timestamp': timestamp.toString(),
          'BinancePay-Nonce': nonce,
          'BinancePay-Certificate-SN': this.apiKey,
          'BinancePay-Signature': signature
        },
        data: payload
      });
      
      return response.data;
    } catch (error) {
      console.error('Error querying Binance Pay order:', error);
      throw new Error('Failed to query Binance Pay order');
    }
  }

  /**
   * Verify a Binance Pay webhook signature
   */
  verifyWebhookSignature(
    headers: Record<string, string>,
    body: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const timestamp = headers['binancepay-timestamp'];
      const nonce = headers['binancepay-nonce'];
      const signature = headers['binancepay-signature'];
      
      const message = timestamp + '\n' + nonce + '\n' + body + '\n';
      const expectedSignature = crypto.createHmac('sha512', this.apiSecret).update(message).digest('hex').toUpperCase();
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('Error verifying Binance Pay webhook signature:', error);
      return false;
    }
  }
}

/**
 * Create a payment record
 */
export async function createPayment(
  userId: string,
  orderId: string,
  amount: number,
  method: 'paypal' | 'binance' | 'googlepay'
) {
  try {
    const payment = await prisma.payment.create({
      data: {
        userId,
        orderId,
        amount,
        method,
        status: 'pending',
      },
    });
    
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error creating payment:', error);
    return { success: false, message: 'Failed to create payment' };
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(
  paymentId: string,
  status: 'pending' | 'completed' | 'failed',
  transactionId?: string
) {
  try {
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status,
        transactionId,
        updatedAt: new Date(),
      },
    });
    
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { success: false, message: 'Failed to update payment status' };
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(paymentId: string) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        order: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }
    
    return { success: true, data: payment };
  } catch (error) {
    console.error('Error getting payment:', error);
    return { success: false, message: 'Failed to get payment' };
  }
}

/**
 * Get payments by user ID
 */
export async function getPaymentsByUserId(userId: string) {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return { success: true, data: payments };
  } catch (error) {
    console.error('Error getting payments:', error);
    return { success: false, message: 'Failed to get payments' };
  }
}

/**
 * Get all payments (admin only)
 */
export async function getAllPayments() {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        order: true,
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
    
    return { success: true, data: payments };
  } catch (error) {
    console.error('Error getting all payments:', error);
    return { success: false, message: 'Failed to get all payments' };
  }
}
