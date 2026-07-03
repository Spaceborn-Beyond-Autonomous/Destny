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
  ThumbsUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import FreelanceNavbar from "../components/freelance/FreelanceNavbar";
import Footer from "../components/Footer";
import PostJobDialog from "../components/freelance/PostJobDialog";

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
}

interface Contract {
  id: string;
  title: string;
  freelancerName: string;
  freelancerAvatar: string;
  freelancerRole: string;
  freelancerRating: number;
  freelancerJobs: number;
  amount: number;
  status: 'active' | 'completed' | 'pending';
  startedAt: string;
  milestones: Milestone[];
}

interface Milestone {
  id: string;
  title: string;
  amount: number;
  status: 'pending' | 'funded' | 'released' | 'completed';
}

interface Proposal {
  id: string;
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
    postedBy: 'Client'
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
    postedBy: 'Client'
  }
];

const MOCK_CONTRACT: Contract = {
  id: '1',
  title: 'EdTech MVP — Student Progress Dashboard',
  freelancerName: 'Arjun Sharma',
  freelancerAvatar: 'AS',
  freelancerRole: 'Full-Stack Developer',
  freelancerRating: 4.9,
  freelancerJobs: 28,
  amount: 80000,
  status: 'active',
  startedAt: '2026-06-15',
  milestones: [
    { id: 'm1', title: 'Discovery & Planning', amount: 12000, status: 'released' },
    { id: 'm2', title: 'Frontend — Student Dashboard', amount: 28000, status: 'funded' },
    { id: 'm3', title: 'Backend & API Integration', amount: 28000, status: 'pending' },
    { id: 'm4', title: 'Testing, QA & Deployment', amount: 12000, status: 'pending' },
  ]
};

const MOCK_PROPOSALS: Proposal[] = [
  {
    id: 'p1',
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
    status: 'pending'
  },
  {
    id: 'p2',
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
    status: 'pending'
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
  const [activeTab, setActiveTab] = useState<'jobs' | 'proposals' | 'contracts'>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          navigate('/auth?mode=login&redirect=/freelance/dashboard');
          return;
        }

        // Load user data
        setUser(MOCK_USER);
        
        // Load jobs from localStorage
        const savedJobs = localStorage.getItem('freelance_jobs');
        if (savedJobs) {
          setJobs(JSON.parse(savedJobs));
        } else {
          localStorage.setItem('freelance_jobs', JSON.stringify(INITIAL_JOBS));
          setJobs(INITIAL_JOBS);
        }
        
        // Load contract
        setContract(MOCK_CONTRACT);
        
        // Load proposals
        setProposals(MOCK_PROPOSALS);
        
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
      console.log('📝 Posting job:', jobData);
      
      // Get user name from localStorage
      const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
      const userName = userData?.name || 'Client';
      
      // Create the new job
      const newJob: Job = {
        ...jobData,
        id: 'job_' + Date.now(),
        proposals: 0,
        createdAt: new Date().toISOString(),
        status: 'open',
        postedBy: userName
      };

      console.log('✅ New job created:', newJob);

      // Update state and save to localStorage
      setJobs(prevJobs => {
        const updated = [newJob, ...prevJobs];
        
        // Save to freelance_jobs (for dashboard)
        localStorage.setItem('freelance_jobs', JSON.stringify(updated));
        
        // Update global jobs for Browse Jobs page
        const allJobs = JSON.parse(localStorage.getItem('all_freelance_jobs') || '[]');
        localStorage.setItem('all_freelance_jobs', JSON.stringify([newJob, ...allJobs]));
        
        console.log('💾 Jobs saved to localStorage:', updated.length);
        
        return updated;
      });

      toast({
        title: "Job posted! 🎉",
        description: `"${newJob.title}" has been posted successfully.`,
      });

      // Close dialog
      setIsPostJobOpen(false);
      
      return newJob;
    } catch (error) {
      console.error('❌ Error posting job:', error);
      toast({
        title: "Error",
        description: "Failed to post job. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    toast({
      title: "Proposal accepted!",
      description: "The freelancer has been notified.",
    });
  };

  const handleDeclineProposal = async (proposalId: string) => {
    toast({
      title: "Proposal declined",
      description: "The freelancer has been notified.",
    });
  };

  const handleJobSelect = (jobId: string) => {
    setSelectedJobId(jobId);
    setActiveTab('proposals');
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
      value: jobs.filter(j => j.status === 'open').length,
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
            {['jobs', 'proposals', 'contracts'].map((tab) => (
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
                    <div key={job.id} className="glass rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                              job.status === 'open' 
                                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                : job.status === 'in_progress'
                                ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                : job.status === 'completed'
                                ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                : 'bg-red-500/10 text-red-500 border border-red-500/20'
                            }`}>
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
                            onClick={() => handleAcceptProposal(proposal.id)}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Accept
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-1 border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <UserIcon className="h-4 w-4" />
                            View Profile
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="gap-1 border-red-500/30 text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeclineProposal(proposal.id)}
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
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                            Active
                          </span>
                          <span className="text-xs text-muted-foreground">Contract</span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground">{contract.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          with {contract.freelancerName} · Started {new Date(contract.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{contract.amount.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Agreed price</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border">
                      {contract.milestones.map((milestone) => (
                        <div key={milestone.id} className="bg-muted/20 p-3 rounded-xl">
                          <div className="flex items-center gap-2 mb-1">
                            {milestone.status === 'released' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {milestone.status === 'funded' && <CheckCircle className="h-4 w-4 text-blue-500" />}
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
                      <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                        Open contract workspace →
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
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreelanceDashboard;