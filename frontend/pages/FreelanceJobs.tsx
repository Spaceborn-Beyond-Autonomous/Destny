import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Filter, Clock, Users, Briefcase, ChevronRight, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FreelanceNavbar from "../components/freelance/FreelanceNavbar";
import Footer from "../components/Footer";
import { useJobs } from "../hooks/useJobs";

const categories = ['All', '3D Printing', 'AI Automation', 'MVP Dev', 'Drone Software', 'Design', 'Other'];

const FreelanceJobs = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const { jobs, loading, error, fetchJobs, loadMore, pagination } = useJobs({
    limit: 6,
  });

  useEffect(() => {
    const filters: any = {};
    if (selectedCategory !== 'All') filters.category = selectedCategory;
    if (searchQuery) filters.search = searchQuery;
    fetchJobs(filters);
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <FreelanceNavbar />
      
      <main className="pt-28 px-6 pb-20">
        <div className="container mx-auto max-w-6xl">
          {/* Back Button */}
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => navigate(-1)}
            className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back</span>
          </motion.button>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                  Browse Jobs
                </h1>
                <p className="text-muted-foreground text-lg mt-1">
                  {jobs.length} jobs found
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by title or skill..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-2 border-border hover:border-primary/30">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-10"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-destructive">Error loading jobs: {error}</p>
              <Button onClick={() => fetchJobs()} className="mt-4 glow-primary">
                Retry
              </Button>
            </div>
          ) : (
            <>
              {/* Job Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                {jobs.map((job, index) => (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group glass hover:bg-primary/5 rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 cursor-pointer hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                          {job.category}
                        </span>
                        <h3 className="font-bold text-foreground text-lg mt-2 truncate">
                          {job.title}
                        </h3>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="font-bold text-primary text-lg">
                          ₹{job.budget?.min?.toLocaleString() || '0'} - ₹{job.budget?.max?.toLocaleString() || '0'}
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full inline-block mt-0.5">
                          {job.budget?.type || 'Fixed'}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {job.skills?.slice(0, 4).map((skill) => (
                        <span 
                          key={skill} 
                          className="bg-muted/30 text-foreground text-xs px-2.5 py-1 rounded-full font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.skills?.length > 4 && (
                        <span className="text-xs text-muted-foreground px-2.5 py-1">
                          +{job.skills.length - 4}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Due {job.dueDate ? new Date(job.dueDate).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {job.proposals || 0} proposals
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full">
                        {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Empty State */}
              {jobs.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No jobs found</h3>
                  <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                </div>
              )}

              {/* Load More */}
              {pagination?.hasNext && (
                <div className="text-center mt-10">
                  <Button
                    variant="outline"
                    className="group gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-300"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></span>
                        Loading...
                      </span>
                    ) : (
                      <>
                        Load More
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FreelanceJobs;