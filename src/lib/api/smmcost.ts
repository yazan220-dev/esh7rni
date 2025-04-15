import axios from 'axios';
import { SMMCOSTBalanceResponse, SMMCOSTOrderResponse, SMMCOSTOrderStatusResponse, SMMCOSTServiceResponse } from '@/types';

const API_URL = 'https://smmcost.com/api/v2';
const API_KEY = process.env.SMMCOST_API_KEY;

/**
 * SMMCOST API Client
 * Handles all interactions with the SMMCOST API
 */
export class SMMCOSTClient {
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor() {
    this.apiUrl = API_URL;
    this.apiKey = API_KEY || '';
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<SMMCOSTBalanceResponse> {
    const params = {
      key: this.apiKey,
      action: 'balance',
    };

    const response = await axios.post(this.apiUrl, new URLSearchParams(params));
    return response.data;
  }

  /**
   * Get all services
   */
  async getServices(): Promise<SMMCOSTServiceResponse[]> {
    const params = {
      key: this.apiKey,
      action: 'services',
    };

    const response = await axios.post(this.apiUrl, new URLSearchParams(params));
    return response.data;
  }

  /**
   * Place a new order
   */
  async placeOrder(
    service: number,
    link: string,
    quantity: number
  ): Promise<SMMCOSTOrderResponse> {
    const params = {
      key: this.apiKey,
      action: 'add',
      service: service.toString(),
      link,
      quantity: quantity.toString(),
    };

    const response = await axios.post(this.apiUrl, new URLSearchParams(params));
    return response.data;
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: number): Promise<SMMCOSTOrderStatusResponse> {
    const params = {
      key: this.apiKey,
      action: 'status',
      order: orderId.toString(),
    };

    const response = await axios.post(this.apiUrl, new URLSearchParams(params));
    return response.data;
  }

  /**
   * Get multiple orders status
   */
  async getMultipleOrdersStatus(orderIds: number[]): Promise<Record<string, SMMCOSTOrderStatusResponse>> {
    const params = {
      key: this.apiKey,
      action: 'status',
      orders: orderIds.join(','),
    };

    const response = await axios.post(this.apiUrl, new URLSearchParams(params));
    return response.data;
  }
}
