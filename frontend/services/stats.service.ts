import { apiClient } from '@/lib/api-client';
import { Stats } from '@/types/freelance';

class StatsService {
  async getStats(): Promise<Stats> {
    return await apiClient.get<Stats>('/api/v1/stats');
  }

  async getFreelancerStats(): Promise<{
    total: number;
    active: number;
    topSkills: Array<{ skill: string; count: number }>;
    growth: Array<{ month: string; count: number }>;
  }> {
    return await apiClient.get('/api/v1/stats/freelancers');
  }

  async getJobStats(): Promise<{
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    categories: Array<{ category: string; count: number }>;
  }> {
    return await apiClient.get('/api/v1/stats/jobs');
  }

  async getPayoutStats(): Promise<{
    total: number;
    thisMonth: number;
    average: number;
    chart: Array<{ month: string; amount: number }>;
  }> {
    return await apiClient.get('/api/v1/stats/payouts');
  }
}

export const statsService = new StatsService();