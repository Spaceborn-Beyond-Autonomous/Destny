// Types for Freelance Marketplace

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  company?: string;
  joinedAt?: string;
}

export interface Freelancer {
  id: string;
  name: string;
  title: string;
  location: string;
  rating: number;
  jobsCompleted: number;
  avatar: string;
  totalEarned: number;
  activeContracts: number;
  proposalsSent: number;
  profileViews: number;
  skills?: string[];
  about?: string;
  experience?: number;
  verified?: boolean;
  responseTime?: string;
}

export interface FreelancerStats {
  thisMonth: number;
  thisMonthJobs: number;
  lastMonth: number;
  lastMonthJobs: number;
  pendingPayout: number;
  totalEarned: number;
  totalJobs: number;
  averageRating: number;
}

export interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: {
    min: number;
    max: number;
    type: string;
  };
  skills: string[];
  proposals: number;
  dueDate: string;
  createdAt: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  postedBy?: string;
}

export interface JobFeed {
  id: string;
  title: string;
  category: string;
  budget: {
    min: number;
    max: number;
    type: string;
  };
  skills: string[];
  proposals: number;
  postedBy: string;
  postedAt: string;
  dueDate: string;
  description?: string;
  clientId?: string;
}

export interface Proposal {
  id: string;
  jobId: string;
  jobTitle: string;
  category: string;
  bidAmount: number;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  totalProposals: number;
  postedAt: string;
  coverLetter?: string;
  estimatedDays?: number;
}

export interface Contract {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  amount: number;
  status: 'active' | 'completed' | 'pending';
  startedAt: string;
  milestone: {
    title: string;
    amount: number;
    status: 'funded' | 'released' | 'pending';
  };
  endDate?: string;
}

export interface Earning {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'milestone' | 'contract' | 'bonus';
  status?: 'pending' | 'completed';
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'completed';
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  jobCount: number;
  freelancerCount: number;
  createdAt: string;
}

export interface Stats {
  totalFreelancers: number;
  totalJobs: number;
  totalPayouts: number;
  completionRate: number;
  activeContracts: number;
  averageResponseTime: string;
  topSkills: Array<{ skill: string; count: number }>;
  monthlyGrowth: Array<{ month: string; count: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FreelancerFilters {
  search?: string;
  skills?: string[];
  minRate?: number;
  maxRate?: number;
  location?: string;
  availability?: string;
  rating?: number;
  page?: number;
  limit?: number;
  sortBy?: 'rating' | 'rate' | 'experience' | 'reviews';
  sortOrder?: 'asc' | 'desc';
}

export interface JobFilters {
  search?: string;
  category?: string;
  minBudget?: number;
  maxBudget?: number;
  skills?: string[];
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'budget' | 'proposals';
  sortOrder?: 'asc' | 'desc';
}