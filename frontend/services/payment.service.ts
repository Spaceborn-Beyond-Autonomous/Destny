import { apiClient } from '@/lib/api-client';

export interface Order {
  _id: string;
  title: string;
  description: string;
  amount: number;
  platformFee: number;
  freelancerAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'delivering' | 'completed' | 'paid' | 'cancelled';
  clientId: {
    _id: string;
    name: string;
    email: string;
  };
  freelancerId?: {
    _id: string;
    name: string;
    email: string;
  };
  category: string;
  skills: string[];
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPayment {
  orderId?: string;
  amount: number;
  currency: string;
  razorpayOrderId: string;
  keyId: string;
}

export interface FeeBreakdown {
  platformFee: number;
  freelancerAmount: number;
  totalAmount: number;
  platformFeePercentage: number;
}

class PaymentService {
  private readonly platformFeePercentage: number;

  constructor() {
    this.platformFeePercentage = parseFloat(import.meta.env.VITE_PLATFORM_FEE_PERCENTAGE || '15');
  }

  // Calculate platform fee of the total amount.
  calculateFees(amount: number): FeeBreakdown {
    const platformFee = Math.round((amount * this.platformFeePercentage) / 100);
    const freelancerAmount = amount - platformFee;
    
    return {
      platformFee,
      freelancerAmount,
      totalAmount: amount,
      platformFeePercentage: this.platformFeePercentage
    };
  }

  // Get all orders
  async getOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/api/v1/orders/my-orders');
    return response;
  }

  // Get order by ID
  async getOrder(orderId: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/api/v1/orders/${orderId}`);
    return response;
  }

  // Create a new order (job post)
  async createOrder(orderData: Partial<Order>): Promise<Order> {
    // Calculate fees before creating order
    if (orderData.amount) {
      const fees = this.calculateFees(orderData.amount);
      orderData.platformFee = fees.platformFee;
      orderData.freelancerAmount = fees.freelancerAmount;
    }
    const response = await apiClient.post<Order>('/api/v1/orders', orderData);
    return response;
  }

  // Create Razorpay order for payment
  async createPaymentOrder(orderId: string, amount: number): Promise<OrderPayment> {
    const fees = this.calculateFees(amount);
    const response = await apiClient.post<OrderPayment>(
      `/api/v1/orders/${orderId}/payment/create-order`,
      { 
        amount,
        platformFee: fees.platformFee,
        freelancerAmount: fees.freelancerAmount
      }
    );
    return response;
  }

  // Verify payment
  async verifyPayment(orderId: string, paymentData: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>(
      `/api/v1/orders/${orderId}/payment/verify`,
      paymentData
    );
    return response;
  }

  // Mark payment as failed
  async markPaymentFailed(orderId: string): Promise<void> {
    await apiClient.post(`/api/v1/orders/${orderId}/payment/fail`);
  }

  // Mark order as paid (Admin only)
  async markOrderAsPaid(orderId: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/api/v1/orders/${orderId}/paid`);
    return response;
  }

  // Get platform fee summary for dashboard
  async getPlatformFeeSummary(): Promise<{
    totalFees: number;
    totalTransactions: number;
    pendingFees: number;
    recentTransactions: Array<{
      orderId: string;
      title: string;
      amount: number;
      platformFee: number;
      freelancerAmount: number;
      date: string;
      status: string;
    }>;
  }> {
    const response = await apiClient.get<{
      totalFees: number;
      totalTransactions: number;
      pendingFees: number;
      recentTransactions: Array<{
        orderId: string;
        title: string;
        amount: number;
        platformFee: number;
        freelancerAmount: number;
        date: string;
        status: string;
      }>;
    }>('/api/v1/orders/fee-summary');
    return response;
  }

  // Get freelancer earnings
  async getFreelancerEarnings(): Promise<{
    totalEarned: number;
    pendingPayout: number;
    nextPayoutDate: string;
    transactions: Array<{
      orderId: string;
      title: string;
      amount: number;
      date: string;
      status: string;
    }>;
  }> {
    const response = await apiClient.get<{
      totalEarned: number;
      pendingPayout: number;
      nextPayoutDate: string;
      transactions: Array<{
        orderId: string;
        title: string;
        amount: number;
        date: string;
        status: string;
      }>;
    }>('/api/v1/orders/freelancer-earnings');
    return response;
  }

  // Release payment to freelancer (after milestone completion)
  async releasePayment(orderId: string, milestoneId?: string): Promise<void> {
    await apiClient.post(`/api/v1/orders/${orderId}/release-payment`, { milestoneId });
  }
}

export const paymentService = new PaymentService();
