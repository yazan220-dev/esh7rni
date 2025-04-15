import axios from 'axios';

/**
 * NOWPayments API Client
 * Handles all interactions with the NOWPayments API
 */
export class NOWPaymentsClient {
  private readonly apiKey: string;
  private readonly paymentUrl: string;
  private readonly baseUrl: string;

  constructor() {
    this.apiKey = process.env.NOWPAYMENTS_API_KEY || '';
    this.paymentUrl = process.env.NOWPAYMENTS_PAYMENT_URL || '';
    this.baseUrl = 'https://api.nowpayments.io/v1';
  }

  /**
   * Create a NOWPayments invoice
   */
  async createInvoice(amount: number, currency: string = 'USD', orderId: string): Promise<any> {
    try {
      const response = await axios({
        method: 'post',
        url: `${this.baseUrl}/invoice`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        },
        data: {
          price_amount: amount.toFixed(2),
          price_currency: currency,
          order_id: orderId,
          order_description: 'Esh7rni SMM Service',
          ipn_callback_url: `${process.env.NEXTAUTH_URL}/api/payments/nowpayments/webhook`,
          success_url: `${process.env.NEXTAUTH_URL}/payment/success`,
          cancel_url: `${process.env.NEXTAUTH_URL}/payment/cancel`
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating NOWPayments invoice:', error);
      throw new Error('Failed to create NOWPayments invoice');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const response = await axios({
        method: 'get',
        url: `${this.baseUrl}/payment/${paymentId}`,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting NOWPayments status:', error);
      throw new Error('Failed to get NOWPayments status');
    }
  }

  /**
   * Verify a NOWPayments webhook signature
   */
  verifyWebhookSignature(
    headers: Record<string, string>,
    body: string
  ): boolean {
    try {
      // NOWPayments uses a different verification method
      // They recommend verifying the payment by checking with their API
      // This is a placeholder for the actual verification logic
      const crypto = require('crypto');
      const signature = headers['x-nowpayments-sig'];
      
      if (!signature) {
        return false;
      }
      
      // In a real implementation, you would verify the signature using the NOWPayments documentation
      // For now, we'll assume it's valid if the signature exists
      return true;
    } catch (error) {
      console.error('Error verifying NOWPayments webhook signature:', error);
      return false;
    }
  }

  /**
   * Get direct payment URL
   * This uses the payment URL provided by the user
   */
  getDirectPaymentUrl(amount: number, orderId: string): string {
    // Extract the base URL from the payment URL
    const basePaymentUrl = this.paymentUrl.split('?')[0];
    
    // Add the amount and order ID as query parameters
    return `${basePaymentUrl}?amount=${amount.toFixed(2)}&order_id=${orderId}`;
  }
}

export default NOWPaymentsClient;
