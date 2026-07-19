export interface ApiResponse<T = unknown> {
  statusCode: number;
  data: T;
  message?: string;
  success?: boolean;
}

export interface ApiError {
  statusCode?: number;
  message: string;
  errors?: unknown[];
}

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  admin?: boolean;
  role?: string;
  accountType?: "general" | "printing" | "client" | "freelancer";
  accountTypes?: Array<"general" | "printing" | "client" | "freelancer">;
  avatar?: string;
  company?: string;
  joinedAt?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  accountType?: string;
}

export interface SignupCredentials extends LoginCredentials {
  name: string;
}

export interface GoogleAuthPayload {
  token?: string;
  credential?: string;
}

export interface AuthResponse {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface JobFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface Job {
  _id?: string;
  id?: string;
  title: string;
  category: string;
  description: string;
  skills: string[];
  budget: {
    min: number;
    max: number;
    type: string;
  };
  proposals: number;
  dueDate?: string | null;
  createdAt?: string;
  active?: boolean;
  postedBy?: string;
  applications?: unknown[];
}

export interface Freelancer {
  _id?: string;
  id?: string;
  name: string;
  title: string;
  rating?: number;
  reviews?: number;
  location?: string;
  bio?: string;
  skills?: string[];
  rate?: number;
  upiId?: string;
  availability?: string;
  avatar?: string;
  completedProjects?: number;
  jobsCompleted?: number;
  totalEarned?: number;
  activeContracts?: number;
  proposalsSent?: number;
  profileViews?: number;
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

export interface FreelancerFilters {
  search?: string;
  category?: string;
  skills?: string[];
  availability?: string;
  page?: number;
  limit?: number;
}

export interface Milestone {
  _id?: string;
  id?: string;
  title: string;
  description?: string;
  amount: number;
  dueDate?: string | null;
  status: string;
}

export interface Comment {
  _id?: string;
  id?: string;
  authorName: string;
  content: string;
  createdAt?: string;
}

export interface Contract {
  _id?: string;
  id?: string;
  freelancerId?: string;
  clientId?: string;
  title: string;
  description?: string;
  amount: number;
  status: string;
  paidAmount?: number;
  paymentStatus?: "unpaid" | "partially_funded" | "funded" | "released";
  platformFee?: number;
  freelancerAmount?: number;
  platformUpiId?: string;
  finalPlatformUpiId?: string;
  finalFreelancerUpiId?: string;
  payoutStatus?: "pending" | "queued" | "paid";
  progress?: number;
  freelancerNote?: string;
  lastProgressAt?: string;
  releasedAt?: string;
  finalPaymentId?: string;
  completedAt?: string;
  withdrawnAt?: string;
  milestones: Milestone[];
  comments?: Comment[];
  createdAt?: string;
  freelancerName?: string;
  freelancerEmail?: string;
  freelancerUpiId?: string;
  clientName?: string;
  startedAt?: string;
  milestone?: {
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

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface Stats {
  freelancers?: number;
  jobs?: number;
  contracts?: number;
  revenue?: number;
}
