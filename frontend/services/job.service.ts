import { apiClient } from '@/lib/api-client';

// Keep this service compile-time independent from missing frontend type files.
// The backend response is treated as `any` to avoid false/mock fallback data.

export type JobFilters = {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type Job = any;

class JobService {
  async getJobs(filters?: JobFilters): Promise<PaginatedResponse<Job>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return apiClient.get<PaginatedResponse<Job>>(`/api/v1/jobs?${params.toString()}`);
  }

  async getMyJobs(filters?: Pick<JobFilters, 'page' | 'limit'> & { clientKey?: string }): Promise<PaginatedResponse<Job>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    return apiClient.get<PaginatedResponse<Job>>(`/api/v1/jobs/mine?${params.toString()}`);
  }

  async getJob(id: string): Promise<Job> {
    return apiClient.get<Job>(`/api/v1/jobs/${id}`);
  }

  async createJob(data: Partial<Job>): Promise<Job> {
    return apiClient.post<Job>('/api/v1/jobs', data);
  }

  async updateJob(id: string, data: Partial<Job>): Promise<Job> {
    return apiClient.put<Job>(`/api/v1/jobs/${id}`, data);
  }

  async deleteJob(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/jobs/${id}`);
  }

  async searchJobs(query: string): Promise<PaginatedResponse<Job>> {
    return apiClient.get<PaginatedResponse<Job>>(
      `/api/v1/jobs/search?q=${encodeURIComponent(query)}`
    );
  }

  async applyToJob(
    jobId: string,
    proposal: string,
    rate: number,
    applicant?: { name?: string; freelancerKey?: string; freelancerId?: string }
  ): Promise<void> {
    await apiClient.post(`/api/v1/jobs/${jobId}/apply`, {
      proposal,
      rate,
      applicantName: applicant?.name,
      freelancerKey: applicant?.freelancerKey,
      freelancerId: applicant?.freelancerId,
    });
  }

  async acceptProposal(jobId: string, applicationId: string): Promise<any> {
    return apiClient.post(`/api/v1/jobs/${jobId}/accept`, { applicationId });
  }

  async declineProposal(jobId: string, applicationId: string): Promise<any> {
    return apiClient.post(`/api/v1/jobs/${jobId}/applications/${applicationId}/decline`);
  }

  async getJobApplications(jobId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/api/v1/jobs/${jobId}/applications`);
  }

  async getJobCategories(): Promise<string[]> {
    return apiClient.get<string[]>('/api/v1/jobs/categories');
  }
}

export const jobService = new JobService();
