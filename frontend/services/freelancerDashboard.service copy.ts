import { apiClient } from '@/lib/api-client';
import { 
  Freelancer, 
  FreelancerStats, 
  JobFeed, 
  Proposal, 
  Contract, 
  Earning,
  PaginatedResponse,
  ApiResponse
} from '@/types/freelance';

class FreelancerDashboardService {
  // Get freelancer profile
  async getProfile(): Promise<Freelancer> {
    const response = await apiClient.get<ApiResponse<Freelancer>>('/api/v1/freelancers/profile');
    return response.data;
  }

  // Get freelancer stats
  async getStats(): Promise<FreelancerStats> {
    const response = await apiClient.get<ApiResponse<FreelancerStats>>('/api/v1/freelancers/stats');
    return response.data;
  }

  // Get job feed with pagination and filters
  async getJobFeed(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    minBudget?: number;
    maxBudget?: number;
  }): Promise<PaginatedResponse<JobFeed>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<ApiResponse<PaginatedResponse<JobFeed>>>(
      `/api/v1/freelancers/jobs?${queryParams.toString()}`
    );
    return response.data;
  }

  // Get freelancer's proposals
  async getProposals(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Proposal>> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<ApiResponse<PaginatedResponse<Proposal>>>(
      `/api/v1/freelancers/proposals?${queryParams.toString()}`
    );
    return response.data;
  }

  // Get active contract
  async getActiveContract(): Promise<Contract | null> {
    const response = await apiClient.get<ApiResponse<Contract | null>>(
      '/api/v1/freelancers/contracts/active'
    );
    return response.data;
  }

  // Get earnings history
  async getEarnings(params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<Earning[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get<ApiResponse<Earning[]>>(
      `/api/v1/freelancers/earnings?${queryParams.toString()}`
    );
    return response.data;
  }

  // Apply to a job
  async applyToJob(jobId: string, proposal: {
    bidAmount: number;
    coverLetter: string;
    estimatedDays: number;
  }): Promise<void> {
    await apiClient.post(`/api/v1/freelancers/jobs/${jobId}/apply`, proposal);
  }

  // Update freelancer profile
  async updateProfile(data: Partial<Freelancer>): Promise<Freelancer> {
    const response = await apiClient.put<ApiResponse<Freelancer>>(
      '/api/v1/freelancers/profile',
      data
    );
    return response.data;
  }

  // Get earnings summary
  async getEarningsSummary(): Promise<{
    thisMonth: number;
    thisMonthJobs: number;
    lastMonth: number;
    lastMonthJobs: number;
    pendingPayout: number;
    totalEarned: number;
  }> {
    const response = await apiClient.get<ApiResponse<{
      thisMonth: number;
      thisMonthJobs: number;
      lastMonth: number;
      lastMonthJobs: number;
      pendingPayout: number;
      totalEarned: number;
    }>>('/api/v1/freelancers/earnings/summary');
    return response.data;
  }

  // Withdraw earnings
  async withdrawEarnings(amount: number, method: 'bank' | 'upi' | 'paypal'): Promise<void> {
    await apiClient.post('/api/v1/freelancers/withdraw', { amount, method });
  }
}

export const freelancerDashboardService = new FreelancerDashboardService();