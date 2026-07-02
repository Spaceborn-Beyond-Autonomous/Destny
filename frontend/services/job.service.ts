import { apiClient } from '@/lib/api-client';
import { Job, JobFilters, PaginatedResponse } from '@/types/freelance';

class JobService {
  async getJobs(filters?: JobFilters): Promise<PaginatedResponse<Job>> {
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
    
    return await apiClient.get<PaginatedResponse<Job>>(`/api/v1/jobs?${params.toString()}`);
  }

  async getJob(id: string): Promise<Job> {
    return await apiClient.get<Job>(`/api/v1/jobs/${id}`);
  }

  async createJob(data: Partial<Job>): Promise<Job> {
    return await apiClient.post<Job>('/api/v1/jobs', data);
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    return await apiClient.put<Job>(`/api/v1/jobs/${id}`, data);
  }

  async deleteJob(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/jobs/${id}`);
  }

  async searchJobs(query: string): Promise<PaginatedResponse<Job>> {
    return await apiClient.get<PaginatedResponse<Job>>(
      `/api/v1/jobs/search?q=${encodeURIComponent(query)}`
    );
  }

  async applyToJob(jobId: string, proposal: string, rate: number): Promise<void> {
    await apiClient.post(`/api/v1/jobs/${jobId}/apply`, { proposal, rate });
  }

  async getJobApplications(jobId: string): Promise<any[]> {
    return await apiClient.get<any[]>(`/api/v1/jobs/${jobId}/applications`);
  }

  async getJobCategories(): Promise<string[]> {
    return await apiClient.get<string[]>('/api/v1/jobs/categories');
  }
}

export const jobService = new JobService();