import { apiClient } from '@/lib/api-client';
import { Category } from '@/types/freelance';

class CategoryService {
  async getCategories(): Promise<Category[]> {
    return await apiClient.get<Category[]>('/api/v1/categories');
  }

  async getCategory(id: string): Promise<Category> {
    return await apiClient.get<Category>(`/api/v1/categories/${id}`);
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    return await apiClient.post<Category>('/api/v1/categories', data);
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    return await apiClient.put<Category>(`/api/v1/categories/${id}`, data);
  }

  async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/categories/${id}`);
  }

  async getCategoryStats(): Promise<Array<{
    category: string;
    jobCount: number;
    freelancerCount: number;
  }>> {
    return await apiClient.get('/api/v1/categories/stats');
  }
}

export const categoryService = new CategoryService();