import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { freelancerService } from '@/services/freelancer.service';
import type { Freelancer } from '@/types/freelance';

const TopFreelancers: React.FC = () => {
  const [viewAll, setViewAll] = useState(false);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadFreelancers = async () => {
      try {
        const response = viewAll
          ? await freelancerService.getFreelancers({ limit: 12 })
          : { data: await freelancerService.getTopFreelancers(3) };

        if (mounted) {
          setFreelancers(response.data || []);
        }
      } catch {
        if (mounted) {
          setFreelancers([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    setLoading(true);
    loadFreelancers();

    return () => {
      mounted = false;
    };
  }, [viewAll]);

  return (
    <section className="py-20 px-4 bg-muted/20">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                Top freelancers
              </h2>
              <p className="text-muted-foreground text-lg mt-1">
                Real profiles from the marketplace.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setViewAll(!viewAll)}
              className="group gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-300"
              disabled={loading}
            >
              {viewAll ? 'View Less' : 'View All'}
              <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${viewAll ? 'rotate-180' : 'group-hover:translate-x-1'}`} />
            </Button>
          </div>

          {loading ? (
            <div className="grid md:grid-cols-3 gap-6">
              {[0, 1, 2].map((item) => (
                <div key={item} className="glass rounded-2xl p-6 border border-border">
                  <div className="h-16 w-16 rounded-full bg-muted/30 animate-pulse mb-4" />
                  <div className="h-5 w-40 bg-muted/30 animate-pulse rounded mb-2" />
                  <div className="h-4 w-28 bg-muted/30 animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : freelancers.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {freelancers.map((freelancer, index) => (
                <motion.div
                  key={freelancer._id || freelancer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="group glass hover:bg-primary/5 rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20 group-hover:border-primary/40 transition-colors flex-shrink-0">
                      {freelancer.avatar || freelancer.name?.charAt(0)?.toUpperCase() || 'F'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-foreground text-lg truncate">
                        {freelancer.name}
                      </h4>
                      <p className="text-sm text-primary font-medium">
                        {freelancer.title}
                      </p>
                      <div className="flex items-center gap-3 text-sm mt-1">
                        <span className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="font-medium text-foreground">{freelancer.rating || 0}</span>
                        </span>
                        <span className="text-muted-foreground">{freelancer.reviews || 0} reviews</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">{freelancer.location || 'Remote'}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {freelancer.bio || 'No bio added yet.'}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {(freelancer.skills || []).slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="bg-muted/30 text-foreground text-xs px-3 py-1 rounded-full font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <span className="font-bold text-primary text-xl">
                        ₹{freelancer.rate || 0}
                      </span>
                      <span className="text-muted-foreground text-sm">/hr</span>
                    </div>
                    <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                      {freelancer.availability || 'available'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground">No freelancers available at the moment.</p>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default TopFreelancers;
