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
}

export const contractService = new ContractService();