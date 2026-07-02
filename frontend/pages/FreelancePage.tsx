import React from 'react';
import FreelanceNavbar from '../components/freelance/FreelanceNavbar';
import Footer from '../components/Footer';
import FreelanceHero from '../components/freelance/FreelanceHero';
import FreelanceStats from '../components/freelance/FreelanceStats';
import ActiveContract from '../components/freelance/ActiveContract';
import FreelanceCategories from '../components/freelance/FreelanceCategories';
import HowItWorks from '../components/freelance/HowItWorks';
import TopFreelancers from '../components/freelance/TopFreelancers';
import FreelanceCTA from '../components/freelance/FreelanceCTA';

const FreelancePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <FreelanceNavbar />
      <main>
        <FreelanceHero />
        <FreelanceStats />
        <ActiveContract />
        <FreelanceCategories />
        <HowItWorks />
        <TopFreelancers />
        <FreelanceCTA />
      </main>
      <Footer />
    </div>
  );
};

export default FreelancePage;