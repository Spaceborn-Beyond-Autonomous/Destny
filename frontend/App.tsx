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
import AdminRoute from "./components/AdminRoute";
import ProtectedRoute from "./components/ProtectedRoute";
import axios from "axios";

// Configure axios interceptor to attach the access token to requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
        <ScrollToHash />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/3d-printing" element={<ProtectedRoute><Printing3D /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
          <Route path="/dashboard/customers/:mode/:customerKey/orders" element={<AdminRoute><AdminCustomerOrders /></AdminRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/quotes" element={<ProtectedRoute><YourQuotes /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
