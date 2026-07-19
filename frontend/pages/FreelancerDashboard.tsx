import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  Clock, 
  Eye,
  CheckCircle,
  Calendar,
  FileText,
  ArrowLeft,
  Star,
  MapPin,
  Wallet,
  Filter,
  Search,
  Loader2,
  ChevronRight,
  Edit3,
  MessageCircle,
  XCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import FreelanceNavbar from "../components/freelance/FreelanceNavbar";
import Footer from "../components/Footer";
import { jobService } from "@/services/job.service";
import { freelancerService } from "@/services/freelancer.service";
import { authService } from "@/services/auth.service";
import { contractService } from "@/services/contract.service";
import ChatWindow from "../components/freelance/ChatWindow";
import { useChat } from "@/context/ChatContext";

// Local types
interface Freelancer {
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
  rate?: number;
  availability?: string;
  upiId?: string;
}

interface FreelancerStats {
  thisMonth: number;
  thisMonthJobs: number;
  lastMonth: number;
  lastMonthJobs: number;
  pendingPayout: number;
  totalEarned: number;
  totalJobs: number;
  averageRating: number;
}

interface JobFeed {
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

interface Proposal {
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

interface Contract {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  amount: number;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  progress?: number;
  freelancerNote?: string;
  lastProgressAt?: string;
  startedAt: string;
  milestone: {
    title: string;
    amount: number;
    status: 'funded' | 'released' | 'pending';
  };
  endDate?: string;
}

const getFreelancerNetAmount = (grossAmount: number, storedNetAmount?: number) => {
  if (storedNetAmount && storedNetAmount > 0) return storedNetAmount;
  const platformFee = Math.round(grossAmount * 0.15);
  return Math.max(grossAmount - platformFee, 0);
};

const mapContract = (item: any): Contract => {
  const grossAmount = Number(item.amount || 0);
  const firstMilestone = item.milestones?.[0];
  const grossMilestoneAmount = Number(firstMilestone?.amount || grossAmount);

  return {
    id: item._id || item.id || '',
    title: item.title,
    clientName: item.clientName || 'Client',
    clientId: item.clientId || '',
    amount: getFreelancerNetAmount(grossAmount, Number(item.freelancerAmount || 0)),
    status: (item.status || 'pending') as Contract['status'],
    progress: Number(item.progress || 0),
    freelancerNote: item.freelancerNote || '',
    lastProgressAt: item.lastProgressAt,
    startedAt: item.createdAt || item.startedAt || new Date().toISOString(),
    milestone: {
      title: firstMilestone?.title || 'Project work',
      amount: getFreelancerNetAmount(grossMilestoneAmount, Number(firstMilestone?.freelancerAmount || 0)),
      status: firstMilestone?.status === 'completed' || firstMilestone?.status === 'released' ? 'released' : firstMilestone?.status === 'funded' || firstMilestone?.status === 'in progress' ? 'funded' : 'pending',
    },
    endDate: item.completedAt || item.withdrawnAt,
  };
};

interface Earning {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'milestone' | 'contract' | 'bonus';
  status?: 'pending' | 'completed';
}

const mapJob = (job: any): JobFeed => ({
  id: job._id || job.id,
  title: job.title,
  category: job.category,
  budget: job.budget || { min: 0, max: 0, type: 'Fixed' },
  skills: job.skills || [],
  proposals: Number(job.proposals || 0),
  postedBy: job.clientName || job.postedByName || 'Client',
  postedAt: job.createdAt || new Date().toISOString(),
  dueDate: job.dueDate || new Date().toISOString(),
  description: job.description,
  clientId: job.clientKey || job.postedBy,
});

const getInitials = (name: string) =>
  name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

const mapApplicationToProposal = (job: any, application: any): Proposal => ({
  id: application._id || `${job._id || job.id}-${application.createdAt}`,
  jobId: job._id || job.id,
  jobTitle: job.title,
  category: job.category,
  bidAmount: Number(application.rate || 0),
  status: application.status === 'rejected' ? 'rejected' : application.status,
  totalProposals: Number(job.proposals || job.applications?.length || 0),
  postedAt: application.createdAt || job.createdAt || new Date().toISOString(),
  coverLetter: application.proposal,
});

const FreelancerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { chatSummaries, refreshChats } = useChat();
  const [activeTab, setActiveTab] = useState<'feed' | 'proposals' | 'contracts' | 'finished' | 'earnings'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for data
  const [profile, setProfile] = useState<Freelancer | null>(null);
  const [stats, setStats] = useState<FreelancerStats | null>(null);
  const [jobFeed, setJobFeed] = useState<JobFeed[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [activeContracts, setActiveContracts] = useState<Contract[]>([]);
  const [finishedContracts, setFinishedContracts] = useState<Contract[]>([]);
  const [workspaceDrafts, setWorkspaceDrafts] = useState<Record<string, { progress: number; note: string }>>({});
  const [workspaceSavingId, setWorkspaceSavingId] = useState<string | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
  const [chatContract, setChatContract] = useState<Contract | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [proposalDialogJob, setProposalDialogJob] = useState<JobFeed | null>(null);
  const [proposalSubmitting, setProposalSubmitting] = useState(false);
  const [proposalForm, setProposalForm] = useState({ bidAmount: '', coverLetter: '' });
  const [withdrawContract, setWithdrawContract] = useState<Contract | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    title: '',
    location: '',
    bio: '',
    skills: '',
    rate: '',
    availability: 'available',
    avatar: '',
    upiId: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    totalPages: 1,
    hasNext: false
  });

  const getContractUnreadCount = (contractId: string) =>
    chatSummaries.find((chat) => chat.orderId === contractId)?.unreadCount || 0;

  const renderMessageIcon = (contractId: string) => (
    <span className="relative inline-flex">
      <MessageCircle className="h-4 w-4" />
      {getContractUnreadCount(contractId) > 0 && (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
      )}
    </span>
  );

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const user = await authService.getCurrentUser(true);
        setCurrentUser({
          id: user._id || user.id || '',
          name: user.name,
        });
        const title = 'Freelancer';
        const savedFreelancer = await freelancerService.createFreelancer({
          name: user.name,
          title,
          location: 'Remote',
          skills: [],
          rate: 0,
          availability: 'available',
          bio: '',
          avatar: getInitials(user.name),
        } as any);

        const freelancerId = String(savedFreelancer._id || savedFreelancer.id || '');
        const jobsResponse = await jobService.getJobs({ limit: 20 });
        const activeJobs = jobsResponse.data.map(mapJob);
        const ownProposals = jobsResponse.data.flatMap((job: any) =>
          (job.applications || [])
            .filter((application: any) => String(application.applicantId || '') === String(freelancerId || ''))
            .map((application: any) => mapApplicationToProposal(job, application))
        );
        const contracts = freelancerId
          ? await contractService.getContracts({ freelancerId })
          : [];
        const mappedContracts = contracts.map(mapContract);
        const ongoingContracts = mappedContracts.filter((item) => item.status === 'active' || item.status === 'pending');
        const completedContracts = mappedContracts.filter((item) => item.status === 'completed');
        const draftMap = ongoingContracts.reduce<Record<string, { progress: number; note: string }>>((acc, item) => {
          acc[item.id] = {
            progress: item.progress || 0,
            note: item.freelancerNote || '',
          };
          return acc;
        }, {});
        const totalEarned = Number((savedFreelancer as any).totalEarnings || 0);
        const completedProjects = Number(savedFreelancer.completedProjects || 0);

        setProfile({
          id: freelancerId,
          name: savedFreelancer.name,
          title: savedFreelancer.title,
          location: savedFreelancer.location || 'Remote',
          rating: savedFreelancer.rating || 0,
          jobsCompleted: completedProjects,
          avatar: savedFreelancer.avatar || getInitials(user.name),
          totalEarned,
          activeContracts: ongoingContracts.length,
          proposalsSent: ownProposals.length,
          profileViews: 0,
          skills: savedFreelancer.skills || [],
          about: savedFreelancer.bio,
          verified: true,
          responseTime: 'Not set',
          rate: Number((savedFreelancer as any).rate || 0),
          availability: savedFreelancer.availability || 'available',
          upiId: (savedFreelancer as any).upiId || '',
        });
        setStats({
          thisMonth: 0,
          thisMonthJobs: 0,
          lastMonth: 0,
          lastMonthJobs: 0,
          pendingPayout: 0,
          totalEarned,
          totalJobs: completedProjects,
          averageRating: Number(savedFreelancer.rating || 0),
        });
        setActiveContracts(ongoingContracts);
        setWorkspaceDrafts(draftMap);
        setFinishedContracts(completedContracts);
        setEarnings([]);
        setJobFeed(activeJobs);
        setProposals(ownProposals);
        setPagination({
          page: 1,
          total: jobsResponse.total,
          totalPages: jobsResponse.totalPages,
          hasNext: jobsResponse.hasNext
        });
        await refreshChats();
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [refreshChats]);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      name: profile.name || '',
      title: profile.title || '',
      location: profile.location || 'Remote',
      bio: profile.about || '',
      skills: (profile.skills || []).join(', '),
      rate: profile.rate ? String(profile.rate) : '',
      availability: profile.availability || 'available',
      avatar: profile.avatar || '',
      upiId: profile.upiId || '',
    });
  }, [profile]);

  const openProposalDialog = (job: JobFeed) => {
    setProposalDialogJob(job);
    setProposalForm({
      bidAmount: String(job.budget?.max || job.budget?.min || ''),
      coverLetter: `I can help with "${job.title}".`,
    });
  };

  const closeProposalDialog = () => {
    if (proposalSubmitting) return;
    setProposalDialogJob(null);
    setProposalForm({ bidAmount: '', coverLetter: '' });
  };

  const handleApplyJob = async () => {
    if (!proposalDialogJob) return;
    try {
      const job = proposalDialogJob;
      const bidAmount = Number(proposalForm.bidAmount);
      if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
        toast({
          title: "Invalid bid",
          description: "Enter a valid bid amount.",
          variant: "destructive",
        });
        return;
      }
      const proposalText = proposalForm.coverLetter.trim();
      if (!proposalText) {
        toast({
          title: "Proposal required",
          description: "Add a short proposal before submitting.",
          variant: "destructive",
        });
        return;
      }

      setProposalSubmitting(true);
      await jobService.applyToJob(job.id, proposalText, bidAmount, {
        name: profile?.name,
        freelancerId: profile?.id,
      });

      const newProposal: Proposal = {
        id: `${job.id}-${Date.now()}`,
        jobId: job.id,
        jobTitle: job?.title || 'Project',
        category: job?.category || 'Freelance',
        bidAmount,
        status: 'pending',
        totalProposals: (job?.proposals || 0) + 1,
        postedAt: new Date().toISOString(),
        coverLetter: proposalText,
        estimatedDays: 7,
      };

      setProposals((current) => {
        return [newProposal, ...current.filter((item) => item.jobId !== job.id)];
      });
      
      toast({
        title: "Application submitted! ✅",
        description: "Your proposal has been sent to the client.",
      });
      
      // Update proposals count
      setJobFeed(prev => 
        prev.map(job => 
          job.id === proposalDialogJob.id 
            ? { ...job, proposals: job.proposals + 1 }
            : job
        )
      );
      setProposalDialogJob(null);
      setProposalForm({ bidAmount: '', coverLetter: '' });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to submit application",
        variant: "destructive"
      });
    } finally {
      setProposalSubmitting(false);
    }
  };

  const handleEditProfile = () => {
    if (!profile?.id) return;
    setProfileDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profile?.id) return;
    const parsedRate = profileForm.rate ? Number(profileForm.rate) : 0;
    if (!Number.isFinite(parsedRate) || parsedRate < 0) {
      toast({
        title: "Invalid rate",
        description: "Enter a valid hourly rate.",
        variant: "destructive",
      });
      return;
    }

    try {
      setProfileSaving(true);
      const skills = profileForm.skills
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean);
      const updated = await freelancerService.updateFreelancer(profile.id, {
        name: profileForm.name.trim() || profile.name,
        title: profileForm.title.trim() || 'Freelancer',
        location: profileForm.location.trim() || 'Remote',
        bio: profileForm.bio.trim(),
        skills,
        rate: parsedRate,
        availability: profileForm.availability,
        avatar: profileForm.avatar.trim(),
        upiId: profileForm.upiId.trim(),
      } as any);
      setProfile((current) => current ? {
        ...current,
        name: updated.name || current.name,
        title: updated.title || current.title,
        location: updated.location || current.location,
        about: updated.bio || '',
        skills: updated.skills || [],
        rate: Number(updated.rate || 0),
        availability: updated.availability || 'available',
        avatar: updated.avatar || current.avatar,
        upiId: (updated as any).upiId || '',
      } : current);
      setProfileDialogOpen(false);
      toast({
        title: "Profile updated",
        description: "Your freelancer profile was saved.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleViewProposal = (proposal: Proposal) => {
    const match = jobFeed.find((job) => job.id === proposal.jobId);
    if (match) {
      setActiveTab('feed');
      setSearchQuery(match.title);
      setJobFeed([match]);
      return;
    }

    toast({
      title: "Proposal details",
      description: proposal.coverLetter || "No cover letter was stored for this proposal.",
    });
  };

  const updateWorkspaceDraft = (contractId: string, patch: Partial<{ progress: number; note: string }>) => {
    setWorkspaceDrafts((current) => ({
      ...current,
      [contractId]: {
        progress: current[contractId]?.progress || 0,
        note: current[contractId]?.note || '',
        ...patch,
      },
    }));
  };

  const openContractChat = (targetContract: Contract) => {
    setChatContract(targetContract);
  };

  const handleWorkspaceUpdate = async (targetContract: Contract, updates: {
    progress?: number;
    freelancerNote?: string;
    status?: 'active' | 'completed' | 'cancelled';
  }) => {
    try {
      setWorkspaceSavingId(targetContract.id);
      const updated = await contractService.updateWorkspace(targetContract.id, updates);
      const nextContract = mapContract(updated);
      if (nextContract.status === 'completed') {
        setActiveContracts((current) => current.filter((item) => item.id !== nextContract.id));
        setFinishedContracts((current) => [nextContract, ...current.filter((item) => item.id !== nextContract.id)]);
        setActiveTab('finished');
      } else if (nextContract.status === 'cancelled') {
        setActiveContracts((current) => current.filter((item) => item.id !== nextContract.id));
        setWithdrawContract(null);
      } else {
        setActiveContracts((current) => current.map((item) => item.id === nextContract.id ? nextContract : item));
        updateWorkspaceDraft(nextContract.id, {
          progress: nextContract.progress || 0,
          note: nextContract.freelancerNote || '',
        });
      }
      toast({
        title: updates.status === 'completed' ? 'Contract marked completed' : updates.status === 'cancelled' ? 'Contract withdrawn' : 'Progress updated',
        description: 'The hirer can now see the latest workspace status.',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.response?.data?.message || err.message || 'Failed to update contract workspace.',
        variant: 'destructive',
      });
    } finally {
      setWorkspaceSavingId(null);
    }
  };

  const handleSearch = () => {
    if (searchQuery) {
      const filtered = jobFeed.filter(job =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setJobFeed(filtered);
    } else {
      jobService.getJobs({ limit: 20 }).then((response) => {
        setJobFeed(response.data.map(mapJob));
        setPagination({
          page: response.page,
          total: response.total,
          totalPages: response.totalPages,
          hasNext: response.hasNext,
        });
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <FreelanceNavbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <FreelanceNavbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="glow-primary">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { 
      icon: Briefcase, 
      label: 'Active Contracts', 
      value: profile?.activeContracts || 0,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      icon: FileText, 
      label: 'Proposals Sent', 
      value: profile?.proposalsSent || 0,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    { 
      icon: CheckCircle, 
      label: 'Jobs Completed', 
      value: profile?.jobsCompleted || 0,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    { 
      icon: Wallet, 
      label: 'Total Earned', 
      value: `₹${((profile?.totalEarned || 0) / 100000).toFixed(1)}L`,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FreelanceNavbar />
      
      <main className="pt-28 px-6 pb-20">
        <div className="container mx-auto max-w-7xl">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate('/freelance')}
            className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Freelance</span>
          </motion.button>

          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-6 border border-border mb-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary/20">
                  {profile?.avatar || profile?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    {profile?.name || 'Freelancer'}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <p className="text-primary font-medium">{profile?.title || 'Freelancer'}</p>
                    <span className="text-muted-foreground">·</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {profile?.location || 'Remote'}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      {profile?.rating || 0}
                    </span>
                    <span className="text-muted-foreground">Â·</span>
                    <span className={profile?.upiId ? "text-green-500 text-sm" : "text-yellow-500 text-sm"}>
                      {profile?.upiId ? `UPI: ${profile.upiId}` : "UPI missing"}
                    </span>
                  </div>
                </div>
              </div>
              <Button className="glow-primary gap-2" onClick={handleEditProfile}>
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {statCards.map((stat, index) => (
              <div key={index} className="glass rounded-xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex gap-2 mb-6 border-b border-border"
          >
            {['feed', 'proposals', 'contracts', 'finished', 'earnings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'finished' && finishedContracts.length > 0 && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500">
                    {finishedContracts.length}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {activeTab === 'feed' && (
              <div>
                <div className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search jobs by title, category, or skill..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                    />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 border-border hover:border-primary/30" onClick={handleSearch}>
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </div>

                <div className="space-y-4">
                  {jobFeed.map((job) => (
                    <div key={job.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {job.category}
                            </span>
                            <span className="text-xs text-muted-foreground">by {job.postedBy} · {new Date(job.postedAt).toLocaleDateString()}</span>
                          </div>
                          <h3 className="font-bold text-foreground text-lg">{job.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Due {new Date(job.dueDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {job.proposals} proposals
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {job.skills.map((skill) => (
                              <span key={skill} className="bg-muted/30 text-foreground text-xs px-2.5 py-1 rounded-full">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              ₹{job.budget.min.toLocaleString()} - ₹{job.budget.max.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">{job.budget.type}</p>
                          </div>
                          <Button 
                            size="sm" 
                            className="gap-1 glow-primary"
                            onClick={() => openProposalDialog(job)}
                          >
                            <Briefcase className="h-4 w-4" />
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {jobFeed.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📋</div>
                      <h3 className="text-xl font-semibold text-foreground mb-2">No jobs found</h3>
                      <p className="text-muted-foreground">Try adjusting your search criteria</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="space-y-4">
                {/* Active Contracts */}
                {activeContracts.map((contract) => (
                  <div key={contract.id} className="glass rounded-2xl p-6 border border-green-500/20 bg-green-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                        ✅ Contract Active
                      </span>
                      <span className="text-xs text-muted-foreground">· {contract.status}</span>
                    </div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-foreground text-lg">{contract.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          for {contract.clientName} · {new Date(contract.startedAt).toLocaleDateString()}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">Milestone: {contract.milestone.title}</span>
                          <span className="font-medium text-primary">₹{contract.milestone.amount.toLocaleString()}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            contract.milestone.status === 'funded' ? 'bg-blue-500/10 text-blue-500' :
                            contract.milestone.status === 'released' ? 'bg-green-500/10 text-green-500' :
                            'bg-yellow-500/10 text-yellow-500'
                          }`}>
                            {contract.milestone.status.charAt(0).toUpperCase() + contract.milestone.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => setActiveTab('contracts')}
                        >
                          Open contract workspace <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                          onClick={() => openContractChat(contract)}
                        >
                          {renderMessageIcon(contract.id)}
                          Message Client
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Proposals List */}
                {proposals.length > 0 ? (
                  proposals.map((proposal) => (
                    <div key={proposal.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                              proposal.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                              proposal.status === 'accepted' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                              proposal.status === 'rejected' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                              'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                            }`}>
                              {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">{proposal.category}</span>
                          </div>
                          <h4 className="font-semibold text-foreground">{proposal.jobTitle}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>Submitted bid: <strong className="text-foreground">₹{proposal.bidAmount.toLocaleString()}</strong></span>
                            <span>·</span>
                            <span>{proposal.totalProposals} total proposals</span>
                            <span>·</span>
                            <span>{new Date(proposal.postedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-border hover:border-primary/30" onClick={() => handleViewProposal(proposal)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No proposals sent</h3>
                    <p className="text-muted-foreground">Start applying to jobs to see your proposals here</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'contracts' && (
              <div className="space-y-4">
                {activeContracts.length > 0 ? (
                  activeContracts.map((contract) => {
                    const draft = workspaceDrafts[contract.id] || {
                      progress: contract.progress || 0,
                      note: contract.freelancerNote || '',
                    };
                    const isSaving = workspaceSavingId === contract.id;

                    return (
                  <div key={contract.id} className="glass rounded-2xl p-6 border border-border">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                            contract.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            contract.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {contract.status === 'cancelled' ? 'Withdrawn' : contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contract.lastProgressAt ? `Updated ${new Date(contract.lastProgressAt).toLocaleDateString()}` : 'Workspace'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">{contract.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          for {contract.clientName} · Started {new Date(contract.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{contract.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Contract value</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Progress</span>
                        <span className="text-sm font-bold text-primary">{draft.progress}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={draft.progress}
                        disabled={isSaving || contract.status !== 'active'}
                        onChange={(event) => updateWorkspaceDraft(contract.id, { progress: Number(event.target.value) })}
                        className="w-full accent-primary"
                      />
                      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${draft.progress}%` }} />
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="text-sm font-medium text-foreground" htmlFor={`contract-progress-note-${contract.id}`}>
                        Progress note
                      </label>
                      <textarea
                        id={`contract-progress-note-${contract.id}`}
                        value={draft.note}
                        disabled={isSaving || contract.status !== 'active'}
                        onChange={(event) => updateWorkspaceDraft(contract.id, { note: event.target.value })}
                        placeholder="Share what changed, what is done, and what is next."
                        className="mt-2 w-full min-h-28 rounded-xl border border-border bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                      <div className="bg-muted/20 p-3 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Milestone</p>
                        <p className="font-semibold text-foreground">{contract.milestone.title}</p>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Milestone amount</p>
                        <p className="font-semibold text-foreground">₹{contract.milestone.amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-muted/20 p-3 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-1">Funding</p>
                        <p className="font-semibold text-foreground capitalize">{contract.milestone.status}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                      <Button
                        className="gap-2 glow-primary"
                        disabled={isSaving || contract.status !== 'active'}
                        onClick={() => handleWorkspaceUpdate(contract, { progress: draft.progress, freelancerNote: draft.note, status: 'active' })}
                      >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                        Save progress
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 border-green-500/30 text-green-500 hover:bg-green-500/10"
                        disabled={isSaving || contract.status !== 'active'}
                        onClick={() => handleWorkspaceUpdate(contract, { progress: 100, freelancerNote: draft.note, status: 'completed' })}
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark completed
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                        disabled={isSaving || contract.status !== 'active'}
                        onClick={() => setWithdrawContract(contract)}
                      >
                        <XCircle className="h-4 w-4" />
                        Withdraw
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => openContractChat(contract)}
                      >
                        {renderMessageIcon(contract.id)}
                        Message Client
                      </Button>
                    </div>
                  </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 glass rounded-2xl border border-border">
                    <p className="text-muted-foreground">No contract workspace yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Accepted proposals will open here.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'finished' && (
              <div>
                {finishedContracts.length === 0 ? (
                  <div className="text-center py-12 glass rounded-2xl border border-border">
                    <p className="text-muted-foreground">No finished contracts yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Completed contracts will move here automatically.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {finishedContracts.map((finishedContract) => (
                      <div key={finishedContract.id} className="glass rounded-2xl p-6 border border-border">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                Completed
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {finishedContract.endDate ? new Date(finishedContract.endDate).toLocaleDateString() : 'Finished'}
                              </span>
                            </div>
                            <h3 className="font-bold text-foreground text-lg">{finishedContract.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              for {finishedContract.clientName} · ₹{finishedContract.amount.toLocaleString()}
                            </p>
                            {finishedContract.freelancerNote && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{finishedContract.freelancerNote}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-500">{finishedContract.progress || 100}%</p>
                            <p className="text-xs text-muted-foreground">Final progress</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'earnings' && (
              <div>
                {/* Earnings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="glass rounded-xl p-4 border border-border">
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-foreground">₹{(stats?.thisMonth || 0).toLocaleString()}</p>
                    <p className="text-xs text-green-500">From {stats?.thisMonthJobs || 0} jobs</p>
                  </div>
                  <div className="glass rounded-xl p-4 border border-border">
                    <p className="text-sm text-muted-foreground">Last Month</p>
                    <p className="text-2xl font-bold text-foreground">₹{(stats?.lastMonth || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{stats?.lastMonthJobs || 0} contracts closed</p>
                  </div>
                  <div className="glass rounded-xl p-4 border border-border">
                    <p className="text-sm text-muted-foreground">Pending Payout</p>
                    <p className="text-2xl font-bold text-yellow-500">₹{(stats?.pendingPayout || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Awaiting approval</p>
                  </div>
                </div>

                {/* Recent Transactions */}
                <h3 className="font-semibold text-foreground text-lg mb-4">Recent Transactions</h3>
                {earnings.length > 0 ? (
                  <div className="space-y-3">
                    {earnings.map((earning) => (
                      <div key={earning.id} className="glass rounded-xl p-4 border border-border flex justify-between items-center">
                        <div>
                          <p className="font-medium text-foreground">{earning.description}</p>
                          <p className="text-xs text-muted-foreground">{new Date(earning.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-500">+₹{earning.amount.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            earning.type === 'milestone' ? 'bg-blue-500/10 text-blue-500' :
                            earning.type === 'contract' ? 'bg-green-500/10 text-green-500' :
                            'bg-purple-500/10 text-purple-500'
                          }`}>
                            {earning.type.charAt(0).toUpperCase() + earning.type.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💰</div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No earnings yet</h3>
                    <p className="text-muted-foreground">Complete projects to start earning</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {profileDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-border shadow-2xl"
          >
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Edit Freelancer Profile</h2>
                <p className="text-sm text-muted-foreground">This information is shown to hirers and used for UPI payouts.</p>
              </div>
              <button
                onClick={() => setProfileDialogOpen(false)}
                className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
                disabled={profileSaving}
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Name</span>
                <input
                  value={profileForm.name}
                  onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Title</span>
                <input
                  value={profileForm.title}
                  onChange={(event) => setProfileForm((current) => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Location</span>
                <input
                  value={profileForm.location}
                  onChange={(event) => setProfileForm((current) => ({ ...current, location: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Hourly rate (INR)</span>
                <input
                  type="number"
                  min="0"
                  value={profileForm.rate}
                  onChange={(event) => setProfileForm((current) => ({ ...current, rate: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Availability</span>
                <select
                  value={profileForm.availability}
                  onChange={(event) => setProfileForm((current) => ({ ...current, availability: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">UPI ID</span>
                <input
                  value={profileForm.upiId}
                  onChange={(event) => setProfileForm((current) => ({ ...current, upiId: event.target.value }))}
                  placeholder="name@bank"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Avatar text or image URL</span>
                <input
                  value={profileForm.avatar}
                  onChange={(event) => setProfileForm((current) => ({ ...current, avatar: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Skills</span>
                <input
                  value={profileForm.skills}
                  onChange={(event) => setProfileForm((current) => ({ ...current, skills: event.target.value }))}
                  placeholder="React, CAD, Python"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium text-foreground">Bio</span>
                <textarea
                  value={profileForm.bio}
                  onChange={(event) => setProfileForm((current) => ({ ...current, bio: event.target.value }))}
                  rows={5}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-2 mt-6 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setProfileDialogOpen(false)} disabled={profileSaving}>
                Cancel
              </Button>
              <Button className="glow-primary gap-2" onClick={handleSaveProfile} disabled={profileSaving}>
                {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
                Save Profile
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <Dialog open={!!proposalDialogJob} onOpenChange={(open) => !open && closeProposalDialog()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Send Proposal</DialogTitle>
            <DialogDescription>
              {proposalDialogJob ? `Apply for ${proposalDialogJob.title}` : 'Add your bid and cover letter.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Bid amount</span>
              <input
                type="number"
                min="1"
                value={proposalForm.bidAmount}
                onChange={(event) => setProposalForm((current) => ({ ...current, bidAmount: event.target.value }))}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-foreground">Proposal</span>
              <textarea
                value={proposalForm.coverLetter}
                onChange={(event) => setProposalForm((current) => ({ ...current, coverLetter: event.target.value }))}
                rows={5}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeProposalDialog} disabled={proposalSubmitting}>
              Cancel
            </Button>
            <Button className="glow-primary gap-2" onClick={handleApplyJob} disabled={proposalSubmitting}>
              {proposalSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Briefcase className="h-4 w-4" />}
              Submit Proposal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!withdrawContract} onOpenChange={(open) => !open && setWithdrawContract(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw Contract</DialogTitle>
            <DialogDescription>
              {withdrawContract ? `Withdraw from "${withdrawContract.title}"? The hirer will see it as withdrawn.` : 'Confirm contract withdrawal.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWithdrawContract(null)} disabled={!!workspaceSavingId}>
              Keep Contract
            </Button>
            <Button
              variant="outline"
              className="border-red-500/30 text-red-500 hover:bg-red-500/10"
              disabled={!withdrawContract || workspaceSavingId === withdrawContract?.id}
              onClick={() => {
                if (!withdrawContract) return;
                const draft = workspaceDrafts[withdrawContract.id] || { progress: withdrawContract.progress || 0, note: withdrawContract.freelancerNote || '' };
                handleWorkspaceUpdate(withdrawContract, { freelancerNote: draft.note, status: 'cancelled' });
              }}
            >
              {workspaceSavingId === withdrawContract?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />

      {chatContract && currentUser && (
        <ChatWindow
          isOpen={!!chatContract}
          onClose={() => setChatContract(null)}
          orderId={chatContract.id}
          orderTitle={chatContract.title}
          freelancerName={profile?.name || currentUser.name}
          clientName={chatContract.clientName}
          currentUserId={currentUser.id}
          currentUserRole="freelancer"
        />
      )}
    </div>
  );
};

export default FreelancerDashboard;

