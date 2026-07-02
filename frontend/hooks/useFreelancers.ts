import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface Freelancer {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviews: number;
  location: string;
  bio: string;
  skills: string[];
  rate: number;
  availability: string;
  avatar: string;
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
      
      // Hardcoded data for now - replace with API call
      const mockData: Freelancer[] = [
        {
          id: '1',
          name: 'Arjun Sharma',
          title: 'Full-Stack Developer',
          rating: 4.9,
          reviews: 34,
          location: 'Mumbai',
          bio: '4 years building scalable web apps. Ex-Razorpay intern. Complex requirements → clean, fast products.',
          skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'AWS'],
          rate: 800,
          availability: 'available',
          avatar: 'AS',
          completedProjects: 28
        },
        {
          id: '2',
          name: 'Priya Nair',
          title: 'AI / ML Engineer',
          rating: 4.8,
          reviews: 21,
          location: 'Bangalore',
          bio: 'IIT-B grad specializing in document intelligence and LLM pipelines. 6 production ML systems deployed.',
          skills: ['Python', 'LLMs', 'OCR', 'FastAPI', 'PyTorch'],
          rate: 650,
          availability: 'available',
          avatar: 'PN',
          completedProjects: 18
        },
        {
          id: '3',
          name: 'Rohit Verma',
          title: '3D Designer & Maker',
          rating: 4.7,
          reviews: 45,
          location: 'Delhi',
          bio: 'Industrial designer with a 4-printer workshop. Functional prototypes for aerospace and consumer products.',
          skills: ['Fusion 360', 'FDM Printing', 'Rhino 3D', 'CAD', 'SolidWorks'],
          rate: 400,
          availability: 'available',
          avatar: 'RV',
          completedProjects: 41
        },
        {
          id: '4',
          name: 'Sneha Patel',
          title: 'UI/UX Designer',
          rating: 4.9,
          reviews: 35,
          location: 'Pune',
          bio: 'Award-winning designer with 6 years experience in product design. Specialized in SaaS and mobile apps.',
          skills: ['Figma', 'UI/UX', 'Adobe XD', 'Design Systems', 'Prototyping'],
          rate: 700,
          availability: 'busy',
          avatar: 'SP',
          completedProjects: 35
        },
        {
          id: '5',
          name: 'Vikram Singh',
          title: 'Drone Software Engineer',
          rating: 4.6,
          reviews: 15,
          location: 'Hyderabad',
          bio: 'Drone software specialist with experience in mission planning, computer vision, and autonomous systems.',
          skills: ['Python', 'C++', 'ROS', 'OpenCV', 'PX4'],
          rate: 900,
          availability: 'unavailable',
          avatar: 'VS',
          completedProjects: 15
        }
      ];

      // Filter based on search query
      let filteredData = mockData;
      if (mergedFilters.search) {
        const search = mergedFilters.search.toLowerCase();
        filteredData = mockData.filter(f => 
          f.name.toLowerCase().includes(search) ||
          f.title.toLowerCase().includes(search) ||
          f.skills.some(s => s.toLowerCase().includes(search))
        );
      }

      setFreelancers(filteredData);
      setPagination({
        hasNext: false,
        page: 1,
        total: filteredData.length,
        totalPages: 1,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch freelancers');
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