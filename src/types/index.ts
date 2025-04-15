// User types
export interface User {
  id: string;
  name?: string;
  email: string;
  image?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// SMMCOST API types
export interface SMMService {
  service: number;
  name: string;
  category: string;
  type: string;
  rate: number;
  min: number;
  max: number;
  dripfeed: boolean;
  refill: boolean;
  description?: string;
  originalRate?: number; // To track markup
}

export interface SMMCategory {
  id: string;
  name: string;
  services: SMMService[];
}

// Order types
export interface Order {
  id: string;
  userId: string;
  serviceId: number;
  link: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'canceled' | 'failed';
  apiOrderId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment types
export interface Payment {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  method: 'paypal' | 'binance' | 'googlepay';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// SMMCOST API specific types
export interface SMMCOSTBalanceResponse {
  balance: string;
  currency: string;
}

export interface SMMCOSTServiceResponse {
  service: number;
  name: string;
  type: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  dripfeed: boolean;
  refill: boolean;
}

export interface SMMCOSTOrderResponse {
  order: number;
}

export interface SMMCOSTOrderStatusResponse {
  charge: string;
  start_count: string;
  status: string;
  remains: string;
  currency: string;
}

// Theme type
export type Theme = 'light' | 'dark';
