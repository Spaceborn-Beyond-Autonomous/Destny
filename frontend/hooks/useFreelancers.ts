import { useState, useEffect, useCallback } from 'react';
import { freelancerService } from '@/services/freelancer.service';

interface Freelancer {
  _id?: string;
  id: string;
  name: string;
  title: string;
  rating?: number;
  reviews?: number;
  location?: string;
  bio?: string;
  skills?: string[];
  rate?: number;
  availability?: string;
  avatar?: string;
  completedProjects?: number;
}

interface UseFreelancersResult {
  freelancers: Freelancer[];
  loading: boolean;
  error: string | null;
  fetchFreelancers: (filters?: any) => Promise<void>;
  loadMore: () => Promise<void>;
  pagination: {
    hasNext: boolean;
    page: number;
    total: number;
    totalPages: number;
  };
}

export function useFreelancers(initialFilters?: any): UseFreelancersResult {
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    hasNext: false,
    page: 1,
    total: 0,
    totalPages: 1,
  });
  const [filters, setFilters] = useState(initialFilters || { limit: 6 });

  const fetchFreelancers = useCallback(async (newFilters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const mergedFilters = { ...filters, ...newFilters };
      setFilters(mergedFilters);

      const response = await freelancerService.getFreelancers(mergedFilters);
      setFreelancers(response.data.map((freelancer: any) => ({
        ...freelancer,
        id: freelancer._id || freelancer.id,
      })));
      setPagination({
        hasNext: response.hasNext,
        page: response.page,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to fetch freelancers');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (pagination.hasNext) {
      await fetchFreelancers({ ...filters, page: pagination.page + 1 });
    }
  }, [pagination.hasNext, pagination.page, filters, fetchFreelancers]);

  useEffect(() => {
    fetchFreelancers(initialFilters);
  }, []);

  return {
    freelancers,
    loading,
    error,
    fetchFreelancers,
    loadMore,
    pagination,
  };
}
