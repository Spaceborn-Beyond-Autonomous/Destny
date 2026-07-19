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
  FileCheck,
  X,
  IndianRupee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FreelanceNavbar from "../components/freelance/FreelanceNavbar";
import Footer from "../components/Footer";
import PostJobDialog from "../components/freelance/PostJobDialog";
import { jobService } from "@/services/job.service";
import { authService } from "@/services/auth.service";
import { contractService } from "@/services/contract.service";
import ChatWindow from "../components/freelance/ChatWindow";
import PaymentDialog from "../components/freelance/PaymentDialog";
import FeeSummary from "../components/freelance/FeeSummary";
import { useChat } from "@/context/ChatContext";


// Types
interface User {
  _id?: string;
  id: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  company?: string;
  joinedAt?: string;
}

interface Job {
  _id?: string;
  id?: string;
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
  dueDate: string | null;
  createdAt: string;
  active?: boolean;
  postedBy?: string;
}


interface Contract {
  _id?: string;
  id: string;
  freelancerId?: string;
  title: string;
  freelancerName: string;
  freelancerUpiId?: string;
  freelancerAvatar: string;
  freelancerRole: string;
  freelancerRating: number;
  freelancerJobs: number;
  amount: number;
  status: 'active' | 'completed' | 'pending' | 'cancelled';
  paidAmount?: number;
  paymentStatus?: 'unpaid' | 'partially_funded' | 'funded' | 'released';
  platformFee?: number;
  freelancerAmount?: number;
  progress?: number;
  freelancerNote?: string;
  lastProgressAt?: string;
  releasedAt?: string;
  startedAt: string;
  createdAt?: string;
  milestones: Milestone[];
}

interface Milestone {
  _id?: string;
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'completed';
}

interface Proposal {
  id: string;
  applicationId?: string;
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
  status: 'pending' | 'accepted' | 'declined';
}

const getJobId = (job: Job) => job._id || job.id || '';
const getContractId = (contract: Contract) => contract._id || contract.id;

const mapContract = (item: any): Contract => ({
  id: item._id || item.id,
  _id: item._id,
  freelancerId: item.freelancerId,
  title: item.title,
  freelancerName: item.freelancerName || 'Freelancer',
  freelancerUpiId: item.freelancerUpiId || '',
  freelancerAvatar: (item.freelancerName || 'F').charAt(0).toUpperCase(),
  freelancerRole: item.freelancerEmail || 'Freelancer',
  freelancerRating: 0,
  freelancerJobs: 0,
  amount: Number(item.amount || 0),
  status: (item.status || 'pending') as Contract['status'],
  paidAmount: Number(item.paidAmount || 0),
  paymentStatus: item.paymentStatus || 'unpaid',
  platformFee: Number(item.platformFee || 0),
  freelancerAmount: Number(item.freelancerAmount || 0),
  progress: Number(item.progress || 0),
  freelancerNote: item.freelancerNote || '',
  lastProgressAt: item.lastProgressAt,
  releasedAt: item.releasedAt,
  startedAt: item.createdAt,
  createdAt: item.createdAt,
  milestones: (item.milestones || []).map((milestone: any) => ({
    id: milestone._id || milestone.id,
    _id: milestone._id,
    title: milestone.title,
    amount: Number(milestone.amount || 0),
    status: milestone.status === 'completed' ? 'released' : milestone.status === 'in progress' ? 'funded' : 'pending',
  })),
});

const mapApplicationToProposal = (application: any): Proposal => ({
  id: application._id || application.id || application.createdAt,
  applicationId: application._id || application.id || application.createdAt,
  freelancerId: application.applicantId || '',
  name: application.applicantName || 'Applicant',
  title: 'Freelancer',
  avatar: (application.applicantName || 'A').charAt(0).toUpperCase(),
  rating: 0,
  jobs: 0,
  location: 'Remote',
  amount: Number(application.rate) || 0,
  type: 'Proposed rate',
  message: application.proposal || '',
  status: application.status === 'rejected' ? 'declined' : application.status,
});

const FreelanceDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { chatSummaries, refreshChats } = useChat();
  const [user, setUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'jobs' | 'proposals' | 'contracts' | 'ongoing' | 'finished'>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [showProposalDetails, setShowProposalDetails] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<{
    orderId: string;
    orderTitle: string;
    participantName: string;
  } | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<{
    contractId: string;
    milestoneId?: string;
    amount: number;
    title: string;
    freelancerName: string;
    freelancerId?: string;
    freelancerUpiId?: string;
    purpose: 'milestone' | 'final';
  } | null>(null);

  const refreshJobs = async () => {
    const response = await jobService.getMyJobs({ limit: 10 });
    setJobs(response.data);
  };

  const refreshContracts = async (clientId?: string) => {
    const targetClientId = clientId || user?._id;
    if (!targetClientId) return;
    const clientContracts = await contractService.getContracts({ clientId: targetClientId });
    setContracts(clientContracts.map(mapContract));
  };

  const calculateFees = (amount: number) => {
    const platformFee = Math.round(amount * 0.15);
    const freelancerAmount = amount - platformFee;
    return { platformFee, freelancerAmount };
  };

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

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const me = await authService.getCurrentUser(true);
        setUser({
          _id: me._id,
          id: me._id || me.id || '',
          name: me.name,
          email: me.email,
          company: me.accountType === 'client' ? 'Hiring Account' : 'Client Account',
          joinedAt: me.createdAt,
        });

        const [response, clientContracts] = await Promise.all([
          jobService.getMyJobs({ limit: 10 }),
          contractService.getContracts({ clientId: me._id }),
        ]);
        setJobs(response.data);
        setContracts(clientContracts.map(mapContract));
        setProposals([]);
        await refreshChats();
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
  }, [navigate, refreshChats, toast]);

  const handlePostJob = async (jobData: any) => {
    try {
      // backend assigns postedBy from logged-in user
      const payload = {
        title: jobData.title,
        category: jobData.category,
        description: jobData.description,
        skills: jobData.skills,
        budget: jobData.budget,
        dueDate: jobData.dueDate,
        clientName: user?.name,
      };

      const createdJob = await jobService.createJob(payload);
      setJobs((prevJobs) => [createdJob, ...prevJobs]);

      toast({
        title: 'Job posted! 🎉',
        description: `"${createdJob.title}" has been posted successfully.`,
      });

      setIsPostJobOpen(false);
      return createdJob;
    } catch (error) {
      console.error('❌ Error posting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to post job. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      if (!selectedJobId) {
        toast({
          title: 'Error',
          description: 'Select a job first.',
          variant: 'destructive',
        });
        return;
      }

      const createdContract = await jobService.acceptProposal(selectedJobId, proposalId);

      await refreshJobs();
      if (user?._id) {
        await refreshContracts(user._id);
      } else if (createdContract) {
        setContracts((current) => [mapContract(createdContract), ...current]);
      }

      toast({
        title: 'Proposal accepted!',
        description: 'Contract created successfully.',
      });

      setProposals((current) => current.map((proposal) => ({
        ...proposal,
        status: (proposal.applicationId || proposal.id) === proposalId ? 'accepted' : 'declined',
      })));
      setActiveTab('contracts');
      setShowProposalDetails(false);
      setSelectedProposal(null);
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'Failed to accept proposal.',
        variant: 'destructive',
      });
    }
  };

  const handleDeclineProposal = async (proposalId: string) => {
    if (!selectedJobId) return;
    try {
      await jobService.declineProposal(selectedJobId, proposalId);
      setProposals((current) => current.map((proposal) => (
        (proposal.applicationId || proposal.id) === proposalId ? { ...proposal, status: 'declined' } : proposal
      )));
      toast({
        title: 'Proposal declined',
        description: 'The proposal was updated.',
      });
      await refreshJobs();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'Failed to decline proposal.',
        variant: 'destructive',
      });
    }
  };

  const handleCloseJob = async (job: Job) => {
    const confirmed = window.confirm(`Delete "${job.title}" permanently? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await jobService.deleteJob(getJobId(job));
      await refreshJobs();
      if (selectedJobId === getJobId(job)) {
        setSelectedJobId(null);
        setProposals([]);
      }
      setActiveTab('jobs');
      toast({ title: 'Job deleted', description: `"${job.title}" was removed from your dashboard.` });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'Failed to delete job.',
        variant: 'destructive',
      });
    }
  };

  const handleEditJob = async (job: Job) => {
    const nextTitle = window.prompt('Edit job title', job.title);
    const nextDescription = window.prompt('Edit job description', job.description || '');

    if (nextTitle === null && nextDescription === null) return;

    const payload: Partial<Job> = {};
    if (nextTitle !== null) {
      const trimmedTitle = nextTitle.trim();
      if (trimmedTitle) {
        payload.title = trimmedTitle;
      }
    }
    if (nextDescription !== null) {
      payload.description = nextDescription.trim();
    }

    if (Object.keys(payload).length === 0) return;

    try {
      const updated = await jobService.updateJob(getJobId(job), payload);
      setJobs((current) => current.map((item) => getJobId(item) === getJobId(job) ? updated : item));
      await refreshJobs();
      toast({ title: 'Job updated', description: 'Your job post was saved.' });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'Failed to edit job.',
        variant: 'destructive',
      });
    }
  };

  const handleJobSelect = async (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('proposals');
    try {
      const applications = await jobService.getJobApplications(jobId);
      setProposals(applications.map(mapApplicationToProposal));
    } catch (e: any) {
      setProposals([]);
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e?.message || 'Failed to load proposals.',
        variant: 'destructive',
      });
    }
  };

  const handleViewProfile = (proposal: Proposal) => {
    const profileName = proposal.name?.trim();
    if (!profileName) {
      toast({
        title: 'Profile unavailable',
        description: 'This proposal is not linked to a freelancer profile yet.',
      });
      return;
    }

    navigate(`/freelance/freelancers?search=${encodeURIComponent(profileName)}`);
  };

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setShowProposalDetails(true);
  };

  const handleChatSelect = (orderId: string, orderTitle: string, participantName: string) => {
    setSelectedChat({ orderId, orderTitle, participantName });
    setChatOpen(true);
  };

  const openMilestonePayment = (contract: Contract) => {
    const pendingMilestone = contract.milestones.find((milestone) => milestone.status === 'pending');
    setSelectedPayment({
      contractId: getContractId(contract),
      milestoneId: pendingMilestone?.id,
      amount: pendingMilestone?.amount || contract.amount,
      title: pendingMilestone ? `${contract.title} - ${pendingMilestone.title}` : contract.title,
      freelancerName: contract.freelancerName,
      freelancerId: contract.freelancerId,
      freelancerUpiId: contract.freelancerUpiId,
      purpose: 'milestone',
    });
    setPaymentDialogOpen(true);
  };

  const openFinishedContractPayment = (contract: Contract) => {
    const remainingAmount = Math.max(Number(contract.amount || 0) - Number(contract.paidAmount || 0), 0);
    if (remainingAmount <= 0) {
      toast({
        title: 'Already paid',
        description: 'This finished contract has no pending balance.',
      });
      return;
    }

    setSelectedPayment({
      contractId: getContractId(contract),
      amount: remainingAmount,
      title: `${contract.title} - Final payment`,
      freelancerName: contract.freelancerName,
      freelancerId: contract.freelancerId,
      freelancerUpiId: contract.freelancerUpiId,
      purpose: 'final',
    });
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = async (paymentData: any) => {
    if (!selectedPayment) return;

    const targetContract = contracts.find((item) => getContractId(item) === selectedPayment.contractId);
    if (!targetContract) return;

    try {
      const paymentResult = paymentData.verification;
      if (!paymentResult?.contract) {
        throw new Error('Razorpay payment verified, but no contract update was returned.');
      }
      const updatedContract = mapContract(paymentResult.contract);
      setContracts((current) => current.map((item) => (
        getContractId(item) === selectedPayment.contractId ? updatedContract : item
      )));
    } catch (error) {
      console.error('Failed to persist contract payment:', error);
      toast({
        title: 'Payment sync failed',
        description: 'Payment completed, but the contract could not be updated. Please refresh and try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Payment successful!',
      description: `₹${paymentData.amount.toLocaleString()} has been paid for ${targetContract.freelancerName}.`,
    });
    setPaymentDialogOpen(false);
    setSelectedPayment(null);
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

  const ongoingContracts = contracts.filter((item) => item.status === 'active' || item.status === 'pending');
  const finishedContracts = contracts.filter((item) => item.status === 'completed');
  const contract = ongoingContracts[0] || null;
  const totalSpent = contracts.reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);

  const stats = [
    { 
      icon: Briefcase, 
      label: 'Active Contracts', 
      value: ongoingContracts.length,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    { 
      icon: FileText, 
      label: 'Open Jobs', 
      value: jobs.filter(j => j.active !== false).length,
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
      value: `₹${totalSpent.toLocaleString()}`,
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

      {selectedPayment && (
        <PaymentDialog
          isOpen={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            setSelectedPayment(null);
          }}
          onSuccess={handlePaymentSuccess}
          orderId={selectedPayment.contractId}
          amount={selectedPayment.amount}
          title={selectedPayment.title}
          freelancerName={selectedPayment.freelancerName}
          freelancerId={selectedPayment.freelancerId}
          freelancerUpiId={selectedPayment.freelancerUpiId}
          clientName={user?.name || 'Client'}
          paymentMode="freelance"
          paymentPurpose={selectedPayment.purpose}
          milestoneId={selectedPayment.milestoneId}
        />
      )}

      {showProposalDetails && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-border shadow-2xl"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Proposal Details</h2>
                <p className="text-muted-foreground">Review this freelancer before accepting.</p>
              </div>
              <button
                onClick={() => setShowProposalDetails(false)}
                className="p-2 hover:bg-muted/20 rounded-lg transition-colors"
              >
                <XCircle className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex items-start gap-4 p-4 bg-muted/10 rounded-xl mb-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary/20">
                {selectedProposal.avatar}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground text-xl">{selectedProposal.name}</h3>
                <p className="text-sm text-primary font-medium">{selectedProposal.title}</p>
                <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
                  <span className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    {selectedProposal.rating}
                  </span>
                  <span className="text-muted-foreground">{selectedProposal.jobs} jobs done</span>
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

            <div className="mb-4">
              <h4 className="font-semibold text-foreground mb-2">Proposal Message</h4>
              <div className="bg-muted/10 rounded-xl p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-line">{selectedProposal.message}</p>
              </div>
            </div>

            <FeeSummary
              totalAmount={selectedProposal.amount}
              platformFee={calculateFees(selectedProposal.amount).platformFee}
              freelancerAmount={calculateFees(selectedProposal.amount).freelancerAmount}
              platformFeePercentage={15}
            />

            <div className="flex flex-wrap gap-2 justify-end mt-6 pt-4 border-t border-border">
              <Button
                variant="outline"
                className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => handleViewProfile(selectedProposal)}
              >
                <UserIcon className="h-4 w-4" />
                View Profile
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10"
                onClick={() => handleDeclineProposal(selectedProposal.applicationId || selectedProposal.id)}
              >
                <X className="h-4 w-4" />
                Decline
              </Button>
              <Button
                className="gap-2 glow-primary"
                onClick={() => handleAcceptProposal(selectedProposal.applicationId || selectedProposal.id)}
              >
                <ThumbsUp className="h-4 w-4" />
                Accept Proposal
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
            {['jobs', 'proposals', 'contracts', 'ongoing', 'finished'].map((tab) => (
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
                {tab === 'ongoing' && ongoingContracts.length > 0 && (
                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {ongoingContracts.length}
                  </span>
                )}
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
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                {jobs.length === 0 ? (
                  <div className="text-center py-12 glass rounded-2xl border border-border">
                    <p className="text-muted-foreground">No jobs posted yet</p>
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
                  jobs.map((job) => (
                    <div key={job._id || job.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                              job.active === false
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : 'bg-green-500/10 text-green-500 border border-green-500/20'
                            }`}>
                              {job.active === false ? 'Closed' : 'Open'}
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
                              Due {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'N/A'}
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
                          onClick={() => handleJobSelect(getJobId(job))}
                        >
                          <Eye className="h-4 w-4" />
                          View Proposals ({job.proposals})
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10" onClick={() => handleEditJob(job)}>
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="gap-2 border-red-500/30 text-red-500 hover:bg-red-500/10" onClick={() => handleCloseJob(job)}>
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
                {proposals.map((proposal) => (
                  <div key={proposal.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20 flex-shrink-0">
                          {proposal.avatar}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground text-lg">{proposal.name}</h4>
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
                          <p className="text-sm text-muted-foreground mt-2">{proposal.message}</p>
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
                            className="gap-1 border-primary/30 text-primary hover:bg-primary/10"
                            onClick={() => handleViewProfile(proposal)}
                          >
                            <UserIcon className="h-4 w-4" />
                            View Profile
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeclineProposal(proposal.applicationId || proposal.id)}
                          >
                            <XCircle className="h-4 w-4" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {proposals.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No proposals yet for this job</p>
                  </div>
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
                          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                            contract.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                            contract.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                            {contract.status === 'cancelled' ? 'Withdrawn' : contract.status.charAt(0).toUpperCase() + contract.status.slice(1)}
                          </span>
                          <span className="text-xs text-muted-foreground">Contract</span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{contract.title}</h3>
                        <p className="text-xs text-primary mt-1">
                          Next milestone: {contract.milestones.find((milestone) => milestone.status === 'pending')?.title || 'All milestones funded'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          with {contract.freelancerName} · Started {new Date(contract.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{contract.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Agreed price</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">Freelancer progress</span>
                        <span className="text-sm font-bold text-primary">{contract.progress || 0}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${contract.progress || 0}%` }} />
                      </div>
                      {contract.freelancerNote && (
                        <div className="mt-3 rounded-xl bg-muted/20 p-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            Latest freelancer update{contract.lastProgressAt ? ` · ${new Date(contract.lastProgressAt).toLocaleDateString()}` : ''}
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-line">{contract.freelancerNote}</p>
                        </div>
                      )}
                    </div>

                    <div className="mb-4">
                      <FeeSummary
                        totalAmount={contract.amount}
                        platformFee={calculateFees(contract.amount).platformFee}
                        freelancerAmount={calculateFees(contract.amount).freelancerAmount}
                        platformFeePercentage={15}
                      />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                      {(contract.milestones.length > 0 ? contract.milestones : [{
                        id: 'project-funding',
                        title: 'Project funding',
                        amount: contract.amount,
                        status: 'pending' as const,
                      }]).map((milestone) => (
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
                            'text-gray-400'
                          }`}>
                            {milestone.status.charAt(0).toUpperCase() + milestone.status.slice(1)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border">
                      {(!contract.milestones.length || contract.milestones.some((milestone) => milestone.status === 'pending')) && (
                        <Button
                          className="gap-2 glow-primary mr-2 mb-2"
                          onClick={() => openMilestonePayment(contract)}
                        >
                          <Wallet className="h-4 w-4" />
                          Fund Next Milestone
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        className="gap-2 border-primary/30 text-primary hover:bg-primary/10 mb-2"
                        onClick={() => toast({ title: 'Contract workspace', description: 'Milestones and status are shown here for this contract.' })}
                      >
                        Open contract workspace →
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 border-primary/30 text-primary hover:bg-primary/10 ml-2 mb-2"
                        onClick={() => handleChatSelect(contract._id || contract.id, contract.title, contract.freelancerName)}
                      >
                        {renderMessageIcon(contract._id || contract.id)}
                        Message {contract.freelancerName}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No active contracts</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ongoing' && (
              <div>
                {ongoingContracts.length === 0 ? (
                  <div className="text-center py-12 glass rounded-2xl border border-border">
                    <p className="text-muted-foreground">No ongoing projects</p>
                    <p className="text-xs text-muted-foreground mt-1">Accept a proposal to start a project.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {ongoingContracts.map((project) => (
                      <div key={getContractId(project)} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                                project.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                project.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                'bg-blue-500/10 text-blue-500 border-blue-500/20'
                              }`}>
                                {project.status === 'cancelled' ? 'Withdrawn' : project.status === 'active' ? 'In Progress' : project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">Contract</span>
                            </div>
                            <h3 className="font-bold text-foreground text-lg">{project.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              with {project.freelancerName}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Started {project.startedAt ? new Date(project.startedAt).toLocaleDateString() : 'Recently'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Wallet className="h-3.5 w-3.5 text-primary" />
                                ₹{project.amount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                {project.progress || 0}% freelancer progress
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                              onClick={() => handleChatSelect(getContractId(project), project.title, project.freelancerName)}
                            >
                              {renderMessageIcon(getContractId(project))}
                              Message
                            </Button>
                            <Button
                              size="sm"
                              className="gap-2 glow-primary"
                              onClick={() => {
                                setActiveTab('contracts');
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              View Progress
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

{activeTab === 'finished' && (
              <div>
                {finishedContracts.length === 0 ? (
                  <div className="text-center py-12 glass rounded-2xl border border-border">
                    <p className="text-muted-foreground">No finished contracts</p>
                    <p className="text-xs text-muted-foreground mt-1">Completed contracts will move here automatically.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {finishedContracts.map((project) => {
                      const paidAmount = Number(project.paidAmount || 0);
                      const remainingAmount = Math.max(Number(project.amount || 0) - paidAmount, 0);
                      const isPaid = remainingAmount <= 0 || project.paymentStatus === 'released';

const existingRating: any = undefined; // legacy placeholder; backend prevents duplicates




                      return (
                        <div key={getContractId(project)} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">

                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                  Completed
                                </span>
                                <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                                  isPaid
                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                    : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                                }`}>
                                  {isPaid ? 'Paid' : 'Payment due'}
                                </span>
                              </div>
                              <h3 className="font-bold text-foreground text-lg">{project.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                with {project.freelancerName}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  Started {project.startedAt ? new Date(project.startedAt).toLocaleDateString() : 'Recently'}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Wallet className="h-3.5 w-3.5 text-primary" />
                                  ₹{project.amount.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <IndianRupee className="h-3.5 w-3.5 text-green-500" />
                                  Paid ₹{paidAmount.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                  {project.progress || 100}% completed
                                </span>
                              </div>
                              {project.freelancerNote && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{project.freelancerNote}</p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {!isPaid && (
                                <Button
                                  size="sm"
                                  className="gap-2 glow-primary"
                                  onClick={() => openFinishedContractPayment(project)}
                                >
                                  <Wallet className="h-4 w-4" />
                                  Pay ₹{remainingAmount.toLocaleString()}
                                </Button>
                              )}

                              {isPaid && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                                  onClick={() => {
                                    const nextRating = window.prompt(
                                      'Rate freelancer (1 to 5 stars)',
                                      '5'
                                    );
                                    if (nextRating === null) return;
                                    const stars = Number(nextRating);
                                    if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
                                      toast({
                                        title: 'Invalid rating',
                                        description: 'Please enter a number between 1 and 5',
                                        variant: 'destructive',
                                      });
                                      return;
                                    }
                                    const review = window.prompt('Optional review / feedback', '') ?? '';
                                    contractService
                                      .rateFreelancer(getContractId(project), { rating: stars, review })
                                      .then(async () => {
                                        toast({
                                          title: 'Thanks for your rating! ⭐',
                                          description: 'Freelancer rating updated.',
                                        });
                                        if (user?._id) {
                                          await refreshContracts(user._id);
                                        }
                                      })
                                      .catch((e: any) => {
                                        toast({
                                          title: 'Rating failed',
                                          description:
                                            e?.response?.data?.message ||
                                            e?.message ||
                                            'Could not save rating',
                                          variant: 'destructive',
                                        });
                                      });
                                  }}
                                >
                                  <Star className="h-4 w-4" />
                                  Add Rating
                                </Button>
                              )}


                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 border-primary/30 text-primary hover:bg-primary/10"
                                onClick={() => handleChatSelect(getContractId(project), project.title, project.freelancerName)}
                              >
                                {renderMessageIcon(getContractId(project))}
                                Message
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      <Footer />

{selectedChat && user && (
        <ChatWindow
          isOpen={chatOpen}
          onClose={() => {
            setChatOpen(false);
            setSelectedChat(null);
          }}
          orderId={selectedChat!.orderId}
          orderTitle={selectedChat!.orderTitle}
          freelancerName={selectedChat!.participantName}
          clientName={user.name}
          currentUserId={user._id || user.id}
          currentUserRole="client"
        />
      )}
    </div>
  );
};

export default FreelanceDashboard;
