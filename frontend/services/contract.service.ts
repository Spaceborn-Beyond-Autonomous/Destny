import { apiClient } from '@/lib/api-client';
import { Contract, Milestone, Comment } from '@/types/freelance';

class ContractService {
  async getContracts(filters?: {
    status?: string;
    freelancerId?: string;
    clientId?: string;
  }): Promise<Contract[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    return await apiClient.get<Contract[]>(`/api/v1/contracts?${params.toString()}`);
  }

  async getContract(id: string): Promise<Contract> {
    return await apiClient.get<Contract>(`/api/v1/contracts/${id}`);
  }

  async createContract(data: Partial<Contract>): Promise<Contract> {
    return await apiClient.post<Contract>('/api/v1/contracts', data);
  }

  async updateContract(id: string, data: Partial<Contract>): Promise<Contract> {
    return await apiClient.put<Contract>(`/api/v1/contracts/${id}`, data);
  }

  async updateWorkspace(id: string, data: {
    progress?: number;
    freelancerNote?: string;
    status?: 'active' | 'completed' | 'cancelled';
  }): Promise<Contract> {
    return await apiClient.put<Contract>(`/api/v1/contracts/${id}/workspace`, data);
  }

  async getActiveContract(): Promise<Contract | null> {
    return await apiClient.get<Contract | null>('/api/v1/contracts/active');
  }

  async addMilestone(contractId: string, milestone: Partial<Milestone>): Promise<Milestone> {
    return await apiClient.post<Milestone>(`/api/v1/contracts/${contractId}/milestones`, milestone);
  }

  async updateMilestone(contractId: string, milestoneId: string, data: Partial<Milestone>): Promise<Milestone> {
    return await apiClient.put<Milestone>(
      `/api/v1/contracts/${contractId}/milestones/${milestoneId}`,
      data
    );
  }

  async createContractPaymentOrder(contractId: string, data: {
    amount: number;
    milestoneId?: string;
    purpose: 'milestone' | 'final';
  }): Promise<{
    amount: number;
    currency: string;
    razorpayOrderId: string;
    keyId: string;
    split?: {
      platformFee: number;
      freelancerAmount: number;
      platformFeePercentage: number;
      platformUpiId: string;
      freelancerUpiId: string;
    };
  }> {
    return await apiClient.post(`/api/v1/contracts/${contractId}/payment/create-order`, data);
  }

  async verifyContractPayment(contractId: string, data: {
    amount: number;
    milestoneId?: string;
    purpose: 'milestone' | 'final';
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }): Promise<{
    contract?: Contract;
    milestone?: Milestone;
    feeBreakdown: {
      totalAmount: number;
      platformFee: number;
      freelancerAmount: number;
      platformFeePercentage: number;
    };
  }> {
    return await apiClient.post(`/api/v1/contracts/${contractId}/payment/verify`, data);
  }

  async markContractPaymentFailed(contractId: string, data: {
    razorpayOrderId?: string;
    failureReason?: string;
  }): Promise<void> {
    await apiClient.post(`/api/v1/contracts/${contractId}/payment/fail`, data);
  }

  async addComment(contractId: string, content: string): Promise<Comment> {
    return await apiClient.post<Comment>(`/api/v1/contracts/${contractId}/comments`, { content });
  }

  async getContractStats(): Promise<{
    active: number;
    completed: number;
    cancelled: number;
    totalValue: number;
  }> {
    return await apiClient.get('/api/v1/contracts/stats');
  }

  async rateFreelancer(contractId: string, data: { rating: number; review?: string }): Promise<{
    freelancerId: string;
    rating: number;
    reviews: number;
  }> {
    return await apiClient.post(`/api/v1/contracts/${contractId}/rate`, data);
  }
}

export const contractService = new ContractService();
