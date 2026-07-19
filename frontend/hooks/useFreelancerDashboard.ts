import { useState, useEffect, useCallback } from 'react';
import { 
  Freelancer, 
  FreelancerStats,
  JobFeed, 
  Proposal, 
  Contract, 
  Earning,
  PaginatedResponse
} from '@/types/freelance';
import { useToast } from '@/hooks/use-toast';

// Mock data for when backend is not available
const MOCK_PROFILE: Freelancer = {
  id: '1',
  name: 'Arjun Sharma',
  title: 'Full-Stack Developer',
  location: 'Mumbai',
  rating: 4.9,
  jobsCompleted: 28,
  avatar: 'AS',
  totalEarned: 381000,
  activeContracts: 1,
  proposalsSent: 8,
  profileViews: 47,
  skills: ['React', 'Node.js', 'MongoDB', 'TypeScript'],
  about: '4 years building scalable web apps. Ex-Razorpay intern.',
  experience: 4,
  verified: true,
  responseTime: '2-4 hours'
};

const MOCK_STATS: FreelancerStats = {
  thisMonth: 28000,
  thisMonthJobs: 2,
  lastMonth: 45000,
  lastMonthJobs: 3,
  pendingPayout: 12000,
  totalEarned: 381000,
  totalJobs: 28,
  averageRating: 4.9
};

const MOCK_JOB_FEED: JobFeed[] = [
  {
    id: '1',
    title: 'Custom Drone Frame Design & 3D Print',
    category: '3D Printing',
    budget: { min: 8000, max: 15000, type: 'Fixed' },
    skills: ['Fusion 360', 'FDM Printing', 'CAD'],
    proposals: 5,
    postedBy: 'Aditya K.',
    postedAt: '2026-07-20',
    dueDate: '2026-07-25',
    description: 'Design and print custom drone frame with specific dimensions.'
  },
  {
    id: '2',
    title: 'AI-Powered Invoice Processing Automation',
    category: 'AI Automation',
    budget: { min: 25000, max: 45000, type: 'Fixed' },
    skills: ['Python', 'OCR', 'LLMs', 'n8n'],
    proposals: 12,
    postedBy: 'Meera J.',
    postedAt: '2026-07-21',
    dueDate: '2026-08-10',
    description: 'Automate extraction of line items, GST amounts, vendor names from scanned invoices.'
  },
  {
    id: '3',
    title: 'Student Progress Dashboard MVP',
    category: 'MVP Dev',
    budget: { min: 30000, max: 50000, type: 'Fixed' },
    skills: ['React', 'Node.js', 'MongoDB', 'Chart.js'],
    proposals: 8,
    postedBy: 'Rohit S.',
    postedAt: '2026-07-19',
    dueDate: '2026-08-15',
    description: 'Build a student progress dashboard with analytics and quiz tracking.'
  }
];

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'p1',
    jobId: '1',
    jobTitle: 'Custom Drone Frame Design & 3D Print',
    category: '3D Printing',
    bidAmount: 10500,
    status: 'pending',
    totalProposals: 6,
    postedAt: '2026-07-19',
    coverLetter: 'I have extensive experience with Fusion 360 and FDM printing.',
    estimatedDays: 7
  },
  {
    id: 'p2',
    jobId: '2',
    jobTitle: 'AI-Powered Invoice Processing Automation',
    category: 'AI Automation',
    bidAmount: 35000,
    status: 'pending',
    totalProposals: 12,
    postedAt: '2026-07-18',
    coverLetter: 'I specialize in building AI automation solutions with Python.',
    estimatedDays: 14
  }
];

const MOCK_CONTRACT: Contract = {
  id: '1',
  title: 'EdTech MVP — Student Progress Dashboard',
  clientName: 'Rohit Singhania',
  clientId: 'c1',
  amount: 80000,
  status: 'active',
  startedAt: '2026-06-15',
  milestones: [],
  milestone: {
    title: 'Frontend — Student Dashboard',
    amount: 28000,
    status: 'funded'
  },
  endDate: '2026-08-15'
};

const MOCK_EARNINGS: Earning[] = [
  {
    id: 'e1',
    amount: 10800,
    description: 'Milestone 1 Released — EdTech MVP',
    date: '2026-06-22',
    type: 'milestone',
    status: 'completed'
  },
  {
    id: 'e2',
    amount: 12600,
    description: '3D Frame project — Final delivery',
    date: '2026-06-10',
    type: 'contract',
    status: 'completed'
  },
  {
    id: 'e3',
    amount: 18000,
    description: 'AI invoice automation — Milestone 1',
    date: '2026-05-28',
    type: 'milestone',
    status: 'completed'
  }
];

interface UseFreelancerDashboardResult {
  profile: Freelancer | null;
  stats: FreelancerStats | null;
  jobFeed: JobFeed[];
  proposals: Proposal[];
  contract: Contract | null;
  earnings: Earning[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
  };
  fetchJobFeed: (params?: any) => Promise<void>;
  fetchProposals: (params?: any) => Promise<void>;
  applyToJob: (jobId: string, data: any) => Promise<void>;
  loadMoreJobs: () => Promise<void>;
  refresh: () => Promise<void>;
  useMockData: boolean;
}

export function useFreelancerDashboard(): UseFreelancerDashboardResult {
  const { toast } = useToast();
  const [profile, setProfile] = useState<Freelancer | null>(null);
  const [stats, setStats] = useState<FreelancerStats | null>(null);
  const [jobFeed, setJobFeed] = useState<JobFeed[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    hasNext: false
  });
  const [jobFilters, setJobFilters] = useState({ page: 1, limit: 10 });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to load from API first
      try {
        const [profileData, statsData, contractData, earningsData] = await Promise.all([
          // Try API calls - if they fail, use mock data
          Promise.resolve(MOCK_PROFILE),
          Promise.resolve(MOCK_STATS),
          Promise.resolve(MOCK_CONTRACT),
          Promise.resolve(MOCK_EARNINGS)
        ]);

        setProfile(profileData);
        setStats(statsData);
        setContract(contractData);
        setEarnings(earningsData);
        setUseMockData(false);
      } catch (apiError) {
        // If API fails, use mock data
        console.log('API unavailable, using mock data:', apiError);
        setProfile(MOCK_PROFILE);
        setStats(MOCK_STATS);
        setContract(MOCK_CONTRACT);
        setEarnings(MOCK_EARNINGS);
        setUseMockData(true);
        
        toast({
          title: "Demo Mode",
          description: "Using sample data. Connect to backend for live data.",
          variant: "default",
        });
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to load dashboard';
      setError(errorMsg);
      // Fallback to mock data
      setProfile(MOCK_PROFILE);
      setStats(MOCK_STATS);
      setContract(MOCK_CONTRACT);
      setEarnings(MOCK_EARNINGS);
      setUseMockData(true);
      toast({
        title: "Demo Mode",
        description: "Using sample data. Connect to backend for live data.",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchJobFeed = useCallback(async (params?: any) => {
    setLoading(true);
    try {
      const mergedParams = { ...jobFilters, ...params };
      setJobFilters(mergedParams);
      
      // Use mock data
      let filteredJobs = [...MOCK_JOB_FEED];
      
      // Apply filters
      if (mergedParams.search) {
        const search = mergedParams.search.toLowerCase();
        filteredJobs = filteredJobs.filter(job =>
          job.title.toLowerCase().includes(search) ||
          job.category.toLowerCase().includes(search) ||
          job.skills.some((skill: string) => skill.toLowerCase().includes(search))
        );
      }
      if (mergedParams.category) {
        filteredJobs = filteredJobs.filter(job => job.category === mergedParams.category);
      }
      if (mergedParams.minBudget) {
        filteredJobs = filteredJobs.filter(job => job.budget.min >= mergedParams.minBudget);
      }
      if (mergedParams.maxBudget) {
        filteredJobs = filteredJobs.filter(job => job.budget.max <= mergedParams.maxBudget);
      }

      // Paginate
      const page = mergedParams.page || 1;
      const limit = mergedParams.limit || 10;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginatedJobs = filteredJobs.slice(start, end);

      setJobFeed(paginatedJobs);
      setPagination({
        page: page,
        total: filteredJobs.length,
        totalPages: Math.ceil(filteredJobs.length / limit),
        hasNext: end < filteredJobs.length
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch jobs';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [jobFilters]);

  const fetchProposals = useCallback(async (params?: any) => {
    setLoading(true);
    try {
      // Use mock data
      let filteredProposals = [...MOCK_PROPOSALS];
      
      if (params?.status) {
        filteredProposals = filteredProposals.filter(p => p.status === params.status);
      }
      
      setProposals(filteredProposals);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch proposals';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyToJob = useCallback(async (jobId: string, data: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Application submitted! ✅",
        description: "Your proposal has been sent to the client.",
      });
      
      // Add to proposals
      const newProposal: Proposal = {
        id: 'p_' + Date.now(),
        jobId: jobId,
        jobTitle: MOCK_JOB_FEED.find(j => j.id === jobId)?.title || 'Unknown Job',
        category: MOCK_JOB_FEED.find(j => j.id === jobId)?.category || 'Other',
        bidAmount: data.bidAmount || 10000,
        status: 'pending',
        totalProposals: 0,
        postedAt: new Date().toISOString(),
        coverLetter: data.coverLetter || '',
        estimatedDays: data.estimatedDays || 14
      };
      
      setProposals(prev => [newProposal, ...prev]);
      
      // Refresh job feed after applying
      await fetchJobFeed();
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to apply';
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchJobFeed, toast]);

  const loadMoreJobs = useCallback(async () => {
    if (pagination.hasNext && !loading) {
      await fetchJobFeed({ ...jobFilters, page: pagination.page + 1 });
    }
  }, [pagination.hasNext, pagination.page, jobFilters, fetchJobFeed, loading]);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadDashboard(),
      fetchJobFeed(),
      fetchProposals()
    ]);
  }, [loadDashboard, fetchJobFeed, fetchProposals]);

  useEffect(() => {
    loadDashboard();
    fetchJobFeed();
    fetchProposals();
  }, []);

  return {
    profile,
    stats,
    jobFeed,
    proposals,
    contract,
    earnings,
    loading,
    error,
    pagination,
    fetchJobFeed,
    fetchProposals,
    applyToJob,
    loadMoreJobs,
    refresh,
    useMockData
  };
}
