import { apiClient } from '@/lib/api-client';
import { 
  Freelancer, 
  FreelancerFilters, 
  PaginatedResponse,
} from '@/types/freelance';

class FreelancerService {
  async getFreelancers(filters?: FreelancerFilters): Promise<PaginatedResponse<Freelancer>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });
    }
    
    const response = await apiClient.get<PaginatedResponse<Freelancer>>(
      `/api/v1/freelancers?${params.toString()}`
    );
    return response;
  }

  async getFreelancer(id: string): Promise<Freelancer> {
    return await apiClient.get<Freelancer>(`/api/v1/freelancers/${id}`);
  }

  async createFreelancer(data: Partial<Freelancer>): Promise<Freelancer> {
    return await apiClient.post<Freelancer>('/api/v1/freelancers', data);
  }

  async updateFreelancer(id: string, data: Partial<Freelancer>): Promise<Freelancer> {
    return await apiClient.put<Freelancer>(`/api/v1/freelancers/${id}`, data);
  }

  async deleteFreelancer(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/freelancers/${id}`);
  }

  async searchFreelancers(query: string): Promise<PaginatedResponse<Freelancer>> {
    return await apiClient.get<PaginatedResponse<Freelancer>>(
      `/api/v1/freelancers/search?q=${encodeURIComponent(query)}`
    );
  }

  async getTopFreelancers(limit: number = 3): Promise<Freelancer[]> {
    return await apiClient.get<Freelancer[]>(`/api/v1/freelancers/top?limit=${limit}`);
  }

  async getFreelancerStats(id: string): Promise<{
    totalJobs: number;
    completionRate: number;
    averageRating: number;
    totalEarnings: number;
  }> {
    return await apiClient.get(`/api/v1/freelancers/${id}/stats`);
  }

  async getFreelancerPortfolio(id: string): Promise<string[]> {
    return await apiClient.get<string[]>(`/api/v1/freelancers/${id}/portfolio`);
  }

  async uploadPortfolio(id: string, files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => formData.append('portfolio', file));
    return await apiClient.upload<string[]>(`/api/v1/freelancers/${id}/portfolio`, formData);
  }

  async rateFreelancer(id: string, rating: number, review: string): Promise<void> {
    await apiClient.post(`/api/v1/freelancers/${id}/rate`, { rating, review });
  }
}

export const freelancerService = new FreelancerService();