// Base API configuration
const API_BASE_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000/api' : 'http://localhost:3000/api';

export interface DoorDashOrderRequest {
  deliveryAddress?: string;
  scheduleTime?: string;
  beerPreference?: string;
  quantity?: number;
}

export interface DoorDashOrderResponse {
  success: boolean;
  orderId?: string;
  cancelWindowSeconds?: number;
  message?: string;
  error?: string;
  errorCode?: string;
}

export interface CancelOrderRequest {
  orderId: string;
}

export interface CancelOrderResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface OrderStatus {
  orderId: string;
  status: string;
  timeRemaining?: number;
  message?: string;
}

// API class for handling DoorDash operations
export class DoorDashAPI {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data as T;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Place a beer order
  static async placeOrder(request: DoorDashOrderRequest = {}): Promise<DoorDashOrderResponse> {
    return this.request<DoorDashOrderResponse>('/order-beer', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Cancel an order
  static async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    return this.request<CancelOrderResponse>('/cancel-order', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  }

  // Get order status
  static async getOrderStatus(orderId: string): Promise<OrderStatus> {
    return this.request<OrderStatus>(`/order-status/${orderId}`);
  }

  // Check server health
  static async healthCheck(): Promise<{ success: boolean; message: string; activeOrders: number; activeLowballSessions: number }> {
    return this.request('/health');
  }
}

export default DoorDashAPI;