import { useState, useEffect, useCallback } from 'react';
import { jobService } from '@/services/job.service';
import { Job, JobFilters, PaginatedResponse } from '@/types/freelance';

export function useJobs(initialFilters?: JobFilters) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });
  const [filters, setFilters] = useState<JobFilters>(initialFilters || {});

  const fetchJobs = useCallback(async (newFilters?: JobFilters) => {
    setLoading(true);
    setError(null);
    try {
      const mergedFilters = { ...filters, ...newFilters };
      setFilters(mergedFilters);
      
      const response = await jobService.getJobs(mergedFilters);
      setJobs(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadMore = useCallback(async () => {
    if (pagination.hasNext) {
      await fetchJobs({ ...filters, page: pagination.page + 1 });
    }
  }, [pagination.hasNext, pagination.page, filters, fetchJobs]);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await jobService.searchJobs(query);
      setJobs(response.data);
      setPagination({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev,
      });
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterByCategory = useCallback(async (category: string) => {
    await fetchJobs({ ...filters, category });
  }, [filters, fetchJobs]);

  useEffect(() => {
    if (initialFilters) {
      fetchJobs(initialFilters);
    } else {
      fetchJobs();
    }
  }, []);

  return {
    jobs,
    loading,
    error,
    pagination,
    filters,
    fetchJobs,
    loadMore,
    search,
    filterByCategory,
  };
}