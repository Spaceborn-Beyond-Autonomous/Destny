import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Menu, 
  X, 
  Briefcase, 
  Users, 
  LogIn, 
  ChevronDown,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/auth.service";
import destnyLogo from "@/assets/destny-logo.png";

interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role?: string;
  avatar?: string;
  accountType?: string;
}

const FreelanceNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const me = await authService.getCurrentUser(true);
        setIsLoggedIn(true);
        setUser(me);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoggedIn(false);
        setUser(null);
        authService.clearSession();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      setIsProfileOpen(false);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/freelance');
    }
  };

  const isActive = (path: string) => {
    if (path === '/freelance' && location.pathname === '/freelance') return true;
    if (path !== '/freelance' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navLinks = [
    { 
      label: "Freelance", 
      href: "/freelance",
      icon: <Briefcase className="h-4 w-4" />
    },
    { 
      label: "Browse Jobs", 
      href: "/freelance/jobs",
      icon: <Briefcase className="h-4 w-4" />
    },
    { 
      label: "Find Freelancers", 
      href: "/freelance/freelancers",
      icon: <Users className="h-4 w-4" />
    },
  ];

  const dashboardPath = user?.accountType === 'freelancer'
    ? '/freelance/freelancer-dashboard'
    : '/freelance/dashboard';
  const dashboardLabel = user?.accountType === 'freelancer' ? 'Freelancer Dashboard' : 'Hire Dashboard';

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong border-b border-border/50"
    >
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
        {/* Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2 shrink-0" 
          aria-label="Destny home"
        >
          <img
            src={destnyLogo}
            alt="Destny"
            className="h-7 sm:h-8 w-auto object-contain"
            width={941}
            height={277}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6 lg:gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          {isLoggedIn && (
            <Link
              to={dashboardPath}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                isActive(dashboardPath)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              {dashboardLabel}
            </Link>
          )}
        </div>

        {/* Right side buttons */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-20 h-9 bg-muted/30 rounded-full animate-pulse"></div>
          ) : isLoggedIn && user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-muted/30 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-foreground hidden lg:block">
                  {user.name?.split(' ')[0] || 'User'}
                </span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 glass-strong rounded-xl border border-border shadow-xl py-2"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-semibold text-foreground text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    
                    <Link
                      to={dashboardPath}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      {dashboardLabel}
                    </Link>
                    
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-muted/30 transition-colors border border-primary/20"
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
              >
                <LogIn className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary hidden sm:inline">Dashboard</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`} />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-64 glass-strong rounded-xl border border-border shadow-xl py-2"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-border">
                      <p className="font-semibold text-foreground text-sm">Continue as</p>
                      <p className="text-xs text-muted-foreground">Choose your dashboard type</p>
                    </div>

                    <button
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors w-full text-left"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/auth?flow=hire&mode=login&redirect=/freelance/dashboard');
                      }}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Hire a freelancer
                    </button>

                    <button
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors w-full text-left"
                      onClick={() => {
                        setIsProfileOpen(false);
                        navigate('/auth?flow=freelancer&mode=login&redirect=/freelance/freelancer-dashboard');
                      }}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Apply as freelancer
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-foreground p-2 hover:bg-muted/20 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass-strong border-t border-border/50 overflow-hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {/* Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              
              {isLoggedIn && (
                <Link
                  to={dashboardPath}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(dashboardPath)
                      ? 'text-primary bg-primary/5'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/10'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {dashboardLabel}
                </Link>
              )}

              <div className="border-t border-border/50 my-2"></div>

              {/* Auth Section */}
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                </div>
              ) : isLoggedIn && user ? (
                <>
                  <div className="px-3 py-3">
                    <p className="font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Button
                  variant="outline"
                  className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate('/auth?flow=hire&mode=login&redirect=/freelance/dashboard');
                  }}
                >
                  <LogIn className="h-4 w-4" />
                  Hire Dashboard
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default FreelanceNavbar;
