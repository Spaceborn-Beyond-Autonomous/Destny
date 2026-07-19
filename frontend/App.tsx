import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "@/pages/Index";
import Printing3D from "@/pages/Printing3D";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import AdminCustomerOrders from "@/pages/AdminCustomerOrders";
import NotFound from "@/pages/NotFound";
import Orders from "@/pages/Orders";
import YourQuotes from "@/pages/YourQuotes";
import FreelancePage from "@/pages/FreelancePage";
import FreelanceJobs from "@/pages/FreelanceJobs";
import FreelanceFreelancers from "@/pages/FreelanceFreelancers";
import FreelanceDashboard from "@/pages/FreelanceDashboard";
import FreelancerDashboard from "@/pages/FreelancerDashboard";
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import { ChatProvider } from "@/context/ChatContext";

const queryClient = new QueryClient();

const ScrollToHash = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      if (hash) {
        const target = document.getElementById(hash.slice(1));
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }, [pathname, hash]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ChatProvider>
          <ScrollToHash />
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/3d-printing" element={<ProtectedRoute authPath="/auth?flow=printing&mode=login&redirect=/3d-printing"><Printing3D /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Freelance Routes */}
            <Route path="/freelance" element={<FreelancePage />} />
            <Route path="/freelance/jobs" element={<FreelanceJobs />} />
            <Route path="/freelance/freelancers" element={<FreelanceFreelancers />} />
            <Route path="/freelance/dashboard" element={<ProtectedRoute authPath="/auth?flow=hire&mode=login&redirect=/freelance/dashboard"><FreelanceDashboard /></ProtectedRoute>} />
            <Route path="/freelance/freelancer-dashboard" element={<ProtectedRoute authPath="/auth?flow=freelancer&mode=login&redirect=/freelance/freelancer-dashboard"><FreelancerDashboard /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/dashboard/customers/:mode/:customerKey/orders" element={<AdminRoute><AdminCustomerOrders /></AdminRoute>} />
            
            {/* Protected Routes */}
            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
            <Route path="/quotes" element={<ProtectedRoute><YourQuotes /></ProtectedRoute>} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ChatProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
