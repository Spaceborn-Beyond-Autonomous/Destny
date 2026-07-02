import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Star, MapPin, Briefcase, Mail, Calendar, Filter, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import FreelanceNavbar from "../components/freelance/FreelanceNavbar";
import Footer from "../components/Footer";
import { useFreelancers } from "../hooks/useFreelancers";

const FreelanceFreelancers = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { freelancers, loading, error, fetchFreelancers, loadMore, pagination } = useFreelancers({
    limit: 6,
  });

  useEffect(() => {
    const filters: any = {};
    if (searchQuery) filters.search = searchQuery;
    fetchFreelancers(filters);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      <FreelanceNavbar />
      
      <main className="pt-28 px-6 pb-20">
        <div className="container mx-auto max-w-5xl">
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
                  Find Freelancers
                </h1>
                <p className="text-muted-foreground text-lg mt-1">
                  {freelancers.length} freelancers available
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search by name, skill, or role..."
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

          {/* Loading State */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-destructive">Error loading freelancers: {error}</p>
              <Button onClick={() => fetchFreelancers()} className="mt-4 glow-primary">
                Retry
              </Button>
            </div>
          ) : (
            <>
              {/* Freelancer Cards */}
              <div className="space-y-4">
                {freelancers.map((freelancer, index) => (
                  <motion.div
                    key={freelancer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="group glass hover:bg-primary/5 rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
                  >
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Left: Avatar & Info */}
                      <div className="flex items-start gap-4 md:gap-6 flex-1">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-2 border-primary/20 group-hover:border-primary/40 transition-colors flex-shrink-0">
                          {freelancer.avatar || freelancer.name?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-foreground text-xl truncate">
                            {freelancer.name}
                          </h3>
                          <p className="text-sm text-primary font-medium">
                            {freelancer.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-sm mt-1">
                            <span className="flex items-center gap-1 text-yellow-500">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-medium text-foreground">{freelancer.rating || 0}</span>
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="text-muted-foreground">
                              {freelancer.completedProjects || freelancer.reviews || 0} jobs
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5" />
                              {freelancer.location || 'Remote'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Rate & Availability */}
                      <div className="md:ml-auto flex flex-row md:flex-col items-center md:items-end gap-3 md:gap-2">
                        <div className="font-bold text-primary text-2xl">
                          ₹{freelancer.rate || 0}
                          <span className="text-sm font-normal text-muted-foreground">/hr</span>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                          freelancer.availability === 'available'
                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                            : freelancer.availability === 'busy'
                            ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                            : 'bg-gray-500/10 text-gray-500 border border-gray-500/20'
                        }`}>
                          {freelancer.availability === 'available' ? 'Available now' : 
                           freelancer.availability === 'busy' ? 'Busy' : 'Unavailable'}
                        </span>
                      </div>
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-muted-foreground mt-4 line-clamp-2">
                      {freelancer.bio}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {freelancer.skills?.slice(0, 5).map((skill) => (
                        <span 
                          key={skill} 
                          className="bg-muted/30 text-foreground text-xs px-3 py-1 rounded-full font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                      {freelancer.skills?.length > 5 && (
                        <span className="text-xs text-muted-foreground px-3 py-1">
                          +{freelancer.skills.length - 5} more
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border">
                      <Button size="sm" className="gap-2 glow-primary">
                        <Briefcase className="h-4 w-4" />
                        Hire
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
                        <Mail className="h-4 w-4" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2 border-border hover:border-primary/30">
                        <Calendar className="h-4 w-4" />
                        Schedule
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Empty State */}
              {freelancers.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No freelancers found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria</p>
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

export default FreelanceFreelancers;