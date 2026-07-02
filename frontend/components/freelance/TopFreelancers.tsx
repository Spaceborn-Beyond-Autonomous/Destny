import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MapPin, Briefcase, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const freelancersData = [
  {
    id: 1,
    name: 'Arjun Sharma',
    title: 'Full-Stack Developer',
    rating: 4.9,
    reviews: 34,
    location: 'Mumbai',
    bio: '4 years building scalable web apps. Ex-Razorpay intern. Complex requirements → clean, fast products.',
    skills: ['React', 'Node.js', 'MongoDB'],
    rate: 800,
    availability: 'Available now',
    avatar: 'AS'
  },
  {
    id: 2,
    name: 'Priya Nair',
    title: 'AI / ML Engineer',
    rating: 4.8,
    reviews: 21,
    location: 'Bangalore',
    bio: 'IIT-B grad specializing in document intelligence and LLM pipelines. 6 production ML systems deployed.',
    skills: ['Python', 'LLMs', 'OCR'],
    rate: 650,
    availability: 'Available now',
    avatar: 'PN'
  },
  {
    id: 3,
    name: 'Rohit Verma',
    title: '3D Designer & Maker',
    rating: 4.7,
    reviews: 45,
    location: 'Delhi',
    bio: 'Industrial designer with a 4-printer workshop. Functional prototypes for aerospace and consumer products.',
    skills: ['Fusion 360', 'FDM Printing', 'Rhino 3D'],
    rate: 400,
    availability: 'Available now',
    avatar: 'RV'
  }
];

const TopFreelancers: React.FC = () => {
  const [viewAll, setViewAll] = useState(false);
  const displayed = viewAll ? freelancersData : freelancersData.slice(0, 3);

  return (
    <section className="py-20 px-4 bg-muted/20">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-12 gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
                Top freelancers
              </h2>
              <p className="text-muted-foreground text-lg mt-1">
                Vetted talent, ready to start.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setViewAll(!viewAll)}
              className="group gap-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/60 transition-all duration-300"
            >
              {viewAll ? 'View Less' : 'View All'}
              <ChevronRight className={`h-4 w-4 transition-transform duration-300 ${viewAll ? 'rotate-180' : 'group-hover:translate-x-1'}`} />
            </Button>
          </div>

          {/* Freelancer Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {displayed.map((freelancer, index) => (
              <motion.div
                key={freelancer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="group glass hover:bg-primary/5 rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-xl cursor-pointer"
              >
                {/* Avatar & Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border-2 border-primary/20 group-hover:border-primary/40 transition-colors flex-shrink-0">
                    {freelancer.avatar}
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
                        <span className="font-medium text-foreground">{freelancer.rating}</span>
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{freelancer.reviews} reviews</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="truncate">{freelancer.location}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {freelancer.bio}
                </p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {freelancer.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-muted/30 text-foreground text-xs px-3 py-1 rounded-full font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Rate & Availability */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <span className="font-bold text-primary text-xl">
                      ₹{freelancer.rate}
                    </span>
                    <span className="text-muted-foreground text-sm">/hr</span>
                  </div>
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                    {freelancer.availability}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State (if no freelancers) */}
          {displayed.length === 0 && (
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