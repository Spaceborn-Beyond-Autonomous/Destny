import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, 
  Users, 
  DollarSign, 
  Clock, 
  Eye,
  Edit,
  XCircle,
  CheckCircle,
  Calendar,
  FileText,
  PlusCircle,
  ArrowLeft,
  Star,
  MapPin,
  User as UserIcon,
  ThumbsUp,
  MessageCircle,
  Wallet,
  TrendingDown,
  IndianRupee,
  Check,
  X,
  UserCheck,
  Clock as ClockIcon,
  FileCheck,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FreelanceNavbar from "../components/freelance/FreelanceNavbar";
import Footer from "../components/Footer";
import PostJobDialog from "../components/freelance/PostJobDialog";
import ChatWindow from "../components/freelance/ChatWindow";
import PaymentDialog from "../components/freelance/PaymentDialog";
import FeeSummary from "../components/freelance/FeeSummary";

// Types
interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  company?: string;
  joinedAt?: string;
}

interface Job {
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
  freelancerId?: string;
  freelancerName?: string;
  hiredFreelancerId?: string;
  hiredFreelancerName?: string;
  hiredAt?: string;
}

interface Contract {
  id: string;
  jobId: string;
  title: string;
  freelancerName: string;
  freelancerId: string;
  freelancerAvatar: string;
  freelancerRole: string;
  freelancerRating: number;
  freelancerJobs: number;
  amount: number;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  startedAt: string;
  milestones: Milestone[];
  progress?: number;
  nextMilestone?: string;
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'completed';
  dueDate?: string;
  completedAt?: string;
}

interface Proposal {
  id: string;
  jobId: string;
  jobTitle: string;
  freelancerId: string;
  name: string;
  title: string;
  avatar: string;
  rating: number;
  jobs: number;
  location: string;
  amount: number;
  type: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  submittedAt: string;
  estimatedDays?: number;
  coverLetter?: string;
}

// Mock user data
const MOCK_USER: User = {
  id: '1',
  name: 'Rohit Singhania',
  email: 'rohit@learnbridge.com',
  role: 'client',
  avatar: 'RS',
  company: 'LearnBridge',
  joinedAt: '2025-01-15'
};

// Initial jobs
const INITIAL_JOBS: Job[] = [
  {
    id: '1',
    title: 'Custom Drone Frame Design & 3D Print',
    category: '3D Printing',
    description: 'Physical print required. Design and print custom drone frame with specific dimensions.',
    budget: { min: 8000, max: 15000, type: 'Fixed' },
    skills: ['Fusion 360', 'FDM Printing', 'CAD'],
    proposals: 5,
    dueDate: '2026-07-25',
    createdAt: '2026-07-20',
    status: 'open',
    postedBy: 'Client',
    freelancerId: 'f1',
    freelancerName: 'Arjun Sharma'
  },
  {
    id: '2',
    title: 'AI-Powered Invoice Processing Automation',
    category: 'AI Automation',
    description: 'Automate extraction of line items, GST amounts, vendor names from scanned invoices.',
    budget: { min: 25000, max: 45000, type: 'Fixed' },
    skills: ['Python', 'LLMs', 'OCR', 'FastAPI'],
    proposals: 12,
    dueDate: '2026-08-10',
    createdAt: '2026-07-21',
    status: 'open',
    postedBy: 'Client',
    freelancerId: 'f2',
    freelancerName: 'Priya Nair'
  }
];

const MOCK_CONTRACT: Contract = {
  id: '1',
  jobId: '1',
  title: 'EdTech MVP — Student Progress Dashboard',
  freelancerName: 'Arjun Sharma',
  freelancerId: 'f1',
  freelancerAvatar: 'AS',
  freelancerRole: 'Full-Stack Developer',
  freelancerRating: 4.9,
  freelancerJobs: 28,
  amount: 80000,
  status: 'active',
  startedAt: '2026-06-15',
  progress: 60,
  nextMilestone: 'Backend & API Integration',
  milestones: [
    { id: 'm1', title: 'Discovery & Planning', amount: 12000, status: 'released', completedAt: '2026-06-25' },
    { id: 'm2', title: 'Frontend — Student Dashboard', amount: 28000, status: 'funded', dueDate: '2026-07-15' },
    { id: 'm3', title: 'Backend & API Integration', amount: 28000, status: 'pending', dueDate: '2026-08-01' },
    { id: 'm4', title: 'Testing, QA & Deployment', amount: 12000, status: 'pending', dueDate: '2026-08-15' },
  ]
};

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'p1',
    jobId: '1',
    jobTitle: 'Custom Drone Frame Design & 3D Print',
    freelancerId: 'f1',
    name: 'Arjun Sharma',
    title: 'Full-Stack Developer',
    avatar: 'AS',
    rating: 4.9,
    jobs: 28,
    location: 'Mumbai',
    amount: 144000,
    type: 'Fixed bid',
    message: "I've carefully reviewed your brief and I'm confident I can deliver this. My recent React project was similar in scope and completed 3 days early.",
    status: 'pending',
    submittedAt: '2026-07-19',
    estimatedDays: 14,
    coverLetter: 'I have extensive experience with React and Node.js. I can start immediately.'
  },
  {
    id: 'p2',
    jobId: '1',
    jobTitle: 'Custom Drone Frame Design & 3D Print',
    freelancerId: 'f2',
    name: 'Priya Nair',
    title: 'AI / ML Engineer',
    avatar: 'PN',
    rating: 4.8,
    jobs: 18,
    location: 'Bangalore',
    amount: 117000,
    type: 'Fixed bid',
    message: "I've carefully reviewed your brief and I'm confident I can deliver this. My recent Python project was similar in scope and completed 3 days early.",
    status: 'pending',
    submittedAt: '2026-07-18',
    estimatedDays: 20,
    coverLetter: 'I specialize in AI automation and can deliver high-quality results.'
  }
];

const FreelanceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'proposals' | 'contracts' | 'ongoing'>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showProposalDetails, setShowProposalDetails] = useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{
    orderId: string;
    orderTitle: string;
    participantName: string;
    participantRole?: string;
  } | null>(null);

  // Payment state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    orderId: string;
    amount: number;
    title: string;
    freelancerName: string;
    freelancerId?: string;
  } | null>(null);

  // Ongoing projects
  const [ongoingProjects, setOngoingProjects] = useState<Job[]>([]);

  const calculateFees = (amount: number) => {
    const platformFee = Math.round(amount * 0.2);
    const freelancerAmount = amount - platformFee;
    return { platformFee, freelancerAmount };
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          navigate('/auth?mode=login&redirect=/freelance/dashboard');
          return;
        }

        setUser(MOCK_USER);
        
        const savedJobs = localStorage.getItem('freelance_jobs');
        if (savedJobs) {
          setJobs(JSON.parse(savedJobs));
        } else {
          localStorage.setItem('freelance_jobs', JSON.stringify(INITIAL_JOBS));
          setJobs(INITIAL_JOBS);
        }
        
        setContract(MOCK_CONTRACT);
        setProposals(MOCK_PROPOSALS);
        
        // Set ongoing projects from jobs with hired freelancer
        const hiredJobs = JSON.parse(savedJobs || JSON.stringify(INITIAL_JOBS))
          .filter((job: Job) => job.hiredFreelancerId);
        setOngoingProjects(hiredJobs);
        
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [navigate, toast]);

  const handlePostJob = async (jobData: any) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const userName = userData?.name || 'Client';
      
      const newJob: Job = {
        ...jobData,
        id: 'job_' + Date.now(),
        proposals: 0,
        createdAt: new Date().toISOString(),
        status: 'open',
        postedBy: userName
      };

      setJobs(prevJobs => {
        const updated = [newJob, ...prevJobs];
        localStorage.setItem('freelance_jobs', JSON.stringify(updated));
        
        const allJobs = JSON.parse(localStorage.getItem('all_freelance_jobs') || '[]');
        localStorage.setItem('all_freelance_jobs', JSON.stringify([newJob, ...allJobs]));
        
        return updated;
      });

      toast({
        title: "Job posted! 🎉",
        description: `"${newJob.title}" has been posted successfully.`,
      });

      setIsPostJobOpen(false);
      return newJob;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleAcceptProposal = async (proposal: Proposal) => {
    try {
      // Update proposal status
      setProposals(prev => 
        prev.map(p => 
          p.id === proposal.id 
            ? { ...p, status: 'accepted' }
            : p
        )
      );

      // Update job with hired freelancer
      setJobs(prev => 
        prev.map(job => 
          job.id === proposal.jobId 
            ? { 
                ...job, 
                status: 'in_progress',
                hiredFreelancerId: proposal.freelancerId,
                hiredFreelancerName: proposal.name,
                hiredAt: new Date().toISOString()
              }
            : job
        )
      );

      // Create contract
      const newContract: Contract = {
        id: 'contract_' + Date.now(),
        jobId: proposal.jobId,
        title: proposal.jobTitle,
        freelancerName: proposal.name,
        freelancerId: proposal.freelancerId,
        freelancerAvatar: proposal.avatar,
        freelancerRole: proposal.title,
        freelancerRating: proposal.rating,
        freelancerJobs: proposal.jobs,
        amount: proposal.amount,
        status: 'active',
        startedAt: new Date().toISOString(),
        progress: 0,
        nextMilestone: 'Discovery & Planning',
        milestones: [
          { id: 'm1', title: 'Discovery & Planning', amount: Math.round(proposal.amount * 0.15), status: 'pending' },
          { id: 'm2', title: 'Development Phase 1', amount: Math.round(proposal.amount * 0.35), status: 'pending' },
          { id: 'm3', title: 'Development Phase 2', amount: Math.round(proposal.amount * 0.35), status: 'pending' },
          { id: 'm4', title: 'Testing & Deployment', amount: Math.round(proposal.amount * 0.15), status: 'pending' },
        ]
      };

      setContract(newContract);

      // Add to ongoing projects
      const hiredJob = jobs.find(j => j.id === proposal.jobId);
      if (hiredJob) {
        setOngoingProjects(prev => [...prev, { ...hiredJob, hiredFreelancerName: proposal.name }]);
      }

      toast({
        title: "Proposal accepted! 🎉",
        description: `${proposal.name} has been hired for this project.`,
      });

      setShowProposalDetails(false);
      setSelectedProposal(null);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept proposal. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeclineProposal = async (proposalId: string) => {
    setProposals(prev => 
      prev.map(p => 
        p.id === proposalId 
          ? { ...p, status: 'declined' }
          : p
      )
    );
    
    toast({
      title: "Proposal declined",
      description: "The freelancer has been notified.",
    });
  };

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowProposalDetails(true);
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('proposals');
  };

  const handleChatSelect = (orderId: string, orderTitle: string, participantName: string) => {
    setSelectedChat({ 
      orderId, 
      orderTitle, 
      participantName,
      participantRole: 'freelancer'
    });
    setChatOpen(true);
  };

  const handleChatClose = () => {
    setChatOpen(false);
    setSelectedChat(null);
  };

  const handlePaymentSuccess = (paymentData: any) => {
    toast({
      title: "Payment Successful! 🎉",
      description: `₹${paymentData.amount.toLocaleString()} has been paid. Platform fee (20%) deducted.`,
    });
    setPaymentDialogOpen(false);
    
    // Update milestone status
    if (contract) {
      const updatedMilestones: Milestone[] = contract.milestones.map(m => 
        m.status === 'pending' ? { ...m, status: 'funded' as const } : m
      );
      setContract({ ...contract, milestones: updatedMilestones });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-green-500/10 text-green-500 border border-green-500/20',
      in_progress: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
      completed: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
      cancelled: 'bg-red-500/10 text-red-500 border border-red-500/20',
      pending: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
      accepted: 'bg-green-500/10 text-green-500 border border-green-500/20',
      declined: 'bg-red-500/10 text-red-500 border border-red-500/20',
      active: 'bg-green-500/10 text-green-500 border border-green-500/20'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <FreelanceNavbar />
        <div className="flex items-center justify-center min-h-screen pt-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      icon: Briefcase, 
      label: 'Active Contracts', 
      value: contract ? 1 : 0,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      icon: FileText, 
      label: 'Open Jobs', 
      value: jobs.filter(j => j.status === 'open' && !j.hiredFreelancerId).length,
      color: 'text-green-500',
      bg: 'bg-green-500/10'
    },
    { 
      icon: Users, 
      label: 'Total Proposals', 
      value: jobs.reduce((acc, j) => acc + j.proposals, 0),
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    },
    { 
      icon: DollarSign, 
      label: 'Total Spent', 
      value: `₹${contract?.amount.toLocaleString() || '0'}`,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <FreelanceNavbar />
      
      {/* Post Job Dialog */}
      <PostJobDialog
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onPost={handlePostJob}
      />

      {/* Payment Dialog */}
      {selectedPayment && (
        <PaymentDialog
          isOpen={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          onSuccess={handlePaymentSuccess}
          orderId={selectedPayment.orderId}
          amount={selectedPayment.amount}
          title={selectedPayment.title}
          freelancerName={selectedPayment.freelancerName}
          freelancerId={selectedPayment.freelancerId}
          clientName={user?.name || 'Client'}
        />
      )}

      {/* Proposal Details Modal */}
      {showProposalDetails && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-border shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Proposal Details</h2>
                <p className="text-muted-foreground">Review the freelancer's proposal</p>
              </div>
              <button
                onClick={() => setShowProposalDetails(false)}
                className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Freelancer Info */}
            <div className="flex items-start gap-4 p-4 bg-muted/10 rounded-xl mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary/20">
                {selectedProposal.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-xl">{selectedProposal.name}</h3>
                <p className="text-sm text-primary font-medium">{selectedProposal.title}</p>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    {selectedProposal.rating}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">{selectedProposal.jobs} jobs done</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {selectedProposal.location}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary text-2xl">₹{selectedProposal.amount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{selectedProposal.type}</p>
              </div>
            </div>

            {/* Proposal Message */}
            <div className="mb-4">
              <h4 className="font-semibold text-foreground mb-2">Proposal Message</h4>
              <p className="text-muted-foreground p-3 bg-muted/10 rounded-xl">
                {selectedProposal.message}
              </p>
            </div>

            {/* Cover Letter */}
            {selectedProposal.coverLetter && (
              <div className="mb-4">
                <h4 className="font-semibold text-foreground mb-2">Cover Letter</h4>
                <p className="text-muted-foreground p-3 bg-muted/10 rounded-xl">
                  {selectedProposal.coverLetter}
                </p>
              </div>
            )}

            {/* Fee Breakdown */}
            <div className="mb-4">
              <h4 className="font-semibold text-foreground mb-2">Fee Breakdown</h4>
              <FeeSummary 
                totalAmount={selectedProposal.amount}
                platformFee={Math.round(selectedProposal.amount * 0.2)}
                freelancerAmount={Math.round(selectedProposal.amount * 0.8)}
                platformFeePercentage={20}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button 
                className="flex-1 glow-primary gap-2"
                onClick={() => handleAcceptProposal(selectedProposal)}
              >
                <ThumbsUp className="h-4 w-4" />
                Accept & Hire
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                onClick={() => {
                  handleDeclineProposal(selectedProposal.id);
                  setShowProposalDetails(false);
                }}
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
            </div>
          </motion.div>
        </div>
      )}
      
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

          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <p className="text-muted-foreground">
                    {user?.company || 'Client Account'}
                  </p>
                  <span className="text-muted-foreground">·</span>
                  <p className="text-sm text-muted-foreground">
                    Joined {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
              <Button 
                className="glow-primary gap-2"
                onClick={() => setIsPostJobOpen(true)}
              >
                <PlusCircle className="h-4 w-4" />
                Post a Job
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
            {stats.map((stat, index) => (
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
            {['jobs', 'proposals', 'contracts', 'ongoing'].map((tab) => (
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
                {tab === 'ongoing' && ongoingProjects.length > 0 && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {ongoingProjects.length}
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
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {jobs.filter(j => !j.hiredFreelancerId).length === 0 ? (
                  <div className="text-center py-12 glass rounded-2xl border border-border">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-muted-foreground">No open jobs</p>
                    <Button 
                      variant="outline" 
                      className="mt-4 gap-2 border-primary/30 text-primary hover:bg-primary/10"
                      onClick={() => setIsPostJobOpen(true)}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Post Your First Job
                    </Button>
                  </div>
                ) : (
                  jobs.filter(j => !j.hiredFreelancerId).map((job) => (
                    <div key={job.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${getStatusColor(job.status)}`}>
                              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                            </span>
                            <span className="text-xs text-muted-foreground">{job.category}</span>
                            {job.postedBy && (
                              <span className="text-xs text-muted-foreground">· Posted by {job.postedBy}</span>
                            )}
                          </div>
                          <h3 className="font-bold text-foreground text-lg">{job.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{job.description}</p>
                          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              Posted {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              Due {new Date(job.dueDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {job.proposals} proposals
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {job.skills?.slice(0, 3).map((skill) => (
                                <span key={skill} className="bg-muted/30 text-foreground text-xs px-2 py-0.5 rounded-full">
                                  {skill}
                                </span>
                              ))}
                              {job.skills?.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{job.skills.length - 3}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">
                            ₹{job.budget.min.toLocaleString()} - ₹{job.budget.max.toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">{job.budget.type}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                        <Button 
                          size="sm" 
                          className="gap-2 glow-primary"
                          onClick={() => handleJobSelect(job.id)}
                        >
                          <Eye className="h-4 w-4" />
                          View Proposals ({job.proposals})
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10">
                          <XCircle className="h-4 w-4" />
                          Close
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'proposals' && (
              <div className="space-y-4">
                {proposals.filter(p => p.status === 'pending').length === 0 ? (
                  <div className="text-center py-12 glass rounded-2xl border border-border">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-muted-foreground">No pending proposals</p>
                    <p className="text-xs text-muted-foreground mt-1">When freelancers apply, you'll see them here</p>
                  </div>
                ) : (
                  proposals.filter(p => p.status === 'pending').map((proposal) => (
                    <div key={proposal.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20 flex-shrink-0">
                            {proposal.avatar}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground text-lg">{proposal.name}</h4>
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(proposal.status)}`}>
                                {proposal.status}
                              </span>
                            </div>
                            <p className="text-sm text-primary font-medium">{proposal.title}</p>
                            <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
                              <span className="flex items-center gap-1 text-yellow-500">
                                <Star className="h-4 w-4 fill-current" />
                                {proposal.rating}
                              </span>
                              <span className="text-muted-foreground">·</span>
                              <span className="text-muted-foreground">{proposal.jobs} jobs done</span>
                              <span className="text-muted-foreground">·</span>
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                {proposal.location}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{proposal.message}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>Submitted: {new Date(proposal.submittedAt).toLocaleDateString()}</span>
                              <span>·</span>
                              <span>Estimated: {proposal.estimatedDays} days</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <p className="font-bold text-primary text-xl">₹{proposal.amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{proposal.type}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="gap-1 glow-primary"
                              onClick={() => handleViewProposal(proposal)}
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                              onClick={() => handleDeclineProposal(proposal.id)}
                            >
                              <X className="h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'contracts' && (
              <div>
                {contract ? (
                  <div className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                            ✅ Active
                          </span>
                          <span className="text-xs text-muted-foreground">Contract</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="text-xs text-muted-foreground">
                            Progress: {contract.progress || 0}%
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{contract.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          with {contract.freelancerName} · Started {new Date(contract.startedAt).toLocaleDateString()}
                        </p>
                        {contract.nextMilestone && (
                          <p className="text-xs text-primary mt-1">
                            Next milestone: {contract.nextMilestone}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{contract.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Agreed price</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{contract.progress || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${contract.progress || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="mb-4">
                      <FeeSummary 
                        totalAmount={contract.amount}
                        platformFee={Math.round(contract.amount * 0.2)}
                        freelancerAmount={Math.round(contract.amount * 0.8)}
                        platformFeePercentage={20}
                      />
                    </div>

                    {/* Milestones */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                      {contract.milestones.map((milestone) => (
                        <div key={milestone.id} className="bg-muted/20 p-3 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            {milestone.status === 'released' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {milestone.status === 'funded' && <CheckCircle className="h-4 w-4 text-blue-500" />}
                            {milestone.status === 'completed' && <FileCheck className="h-4 w-4 text-green-500" />}
                            {milestone.status === 'pending' && <Clock className="h-4 w-4 text-gray-400" />}
                            <span className="text-xs text-muted-foreground">{milestone.title}</span>
                          </div>
                          <p className="font-semibold text-foreground">₹{milestone.amount.toLocaleString()}</p>
                          <span className={`text-xs font-medium ${
                            milestone.status === 'released' ? 'text-green-500' :
                            milestone.status === 'funded' ? 'text-blue-500' :
                            milestone.status === 'completed' ? 'text-green-500' :
                            'text-gray-400'
                          }`}>
                            {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                          </span>
                          {milestone.dueDate && (
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-2">
                      {contract.milestones.some(m => m.status === 'pending') && (
                        <Button 
                          size="sm" 
                          className="gap-2 glow-primary"
                          onClick={() => {
                            const pendingMilestone = contract.milestones.find(m => m.status === 'pending');
                            setSelectedPayment({
                              orderId: contract.id,
                              amount: pendingMilestone?.amount || contract.amount,
                              title: contract.title,
                              freelancerName: contract.freelancerName,
                              freelancerId: contract.freelancerId
                            });
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <Wallet className="h-4 w-4" />
                          Fund Next Milestone
                        </Button>
                      )}
                      <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                        View Workspace →
                      </Button>
                      <Button 
                        variant="outline" 
                        className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                        onClick={() => handleChatSelect(contract.id, contract.title, contract.freelancerName)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        Message {contract.freelancerName}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 glass rounded-2xl border border-border">
                    <div className="text-6xl mb-4">📄</div>
                    <p className="text-muted-foreground">No active contracts</p>
                    <p className="text-xs text-muted-foreground mt-1">Hire a freelancer to start a contract</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ongoing' && (
              <div>
                {ongoingProjects.length === 0 ? (
                  <div className="text-center py-12 glass rounded-2xl border border-border">
                    <div className="text-6xl mb-4">🚀</div>
                    <p className="text-muted-foreground">No ongoing projects</p>
                    <p className="text-xs text-muted-foreground mt-1">Hire a freelancer to start a project</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ongoingProjects.map((project) => (
                      <div key={project.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                In Progress
                              </span>
                              <span className="text-xs text-muted-foreground">{project.category}</span>
                            </div>
                            <h3 className="font-bold text-foreground text-lg">{project.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3.5 w-3.5 text-green-500" />
                                Hired: {project.hiredFreelancerName || 'Assigned'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Started: {project.hiredAt ? new Date(project.hiredAt).toLocaleDateString() : 'Recently'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                Due: {new Date(project.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <p className="font-bold text-primary">
                                ₹{project.budget.min.toLocaleString()} - ₹{project.budget.max.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">{project.budget.type}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => handleChatSelect(project.id, project.title, project.hiredFreelancerName || 'Freelancer')}
                              >
                                <MessageCircle className="h-4 w-4" />
                                Message
                              </Button>
                              <Button size="sm" className="gap-2 glow-primary">
                                <Eye className="h-4 w-4" />
                                View Progress
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />

      {/* Chat Window */}
      {selectedChat && (
        <ChatWindow
          isOpen={chatOpen}
          onClose={handleChatClose}
          orderId={selectedChat.orderId}
          orderTitle={selectedChat.orderTitle}
          freelancerName={selectedChat.participantName}
          clientName={user?.name || 'Client'}
          currentUserId={user?.id || '1'}
          currentUserRole="client"
        />
      )}
    </div>
  );
};

export default FreelanceDashboard;
