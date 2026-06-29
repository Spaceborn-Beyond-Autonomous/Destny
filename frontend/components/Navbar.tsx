import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import destnyLogo from "@/assets/destny-logo.png";
import axios from "axios";

const navItems = [
  { label: "About", href: "/#about" },
  { label: "Services", href: "/#services" },
  { label: "3D Printing", href: "/3d-printing" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Developers", href: "/#developers" },
  { label: "Contact", href: "/#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/current-user`, {
        withCredentials: true,
      })
      .then((res) => {
        setIsLoggedIn(true);
        setIsAdmin(res.data?.data?.admin === true);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setIsAdmin(false);
      });
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/v1/users/logout`,
        {},
        { withCredentials: true }
      );
    } catch {
      // even if the request fails, clear local state
    }
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
    >
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link to="/#home" className="flex items-center gap-2" aria-label="Destny home">
          <img
            src={destnyLogo}
            alt="Destny"
            className="h-8 w-auto object-contain"
            width={941}
            height={277}
          />
        </Link>

        <div className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Logout
            </button>
          ) : (
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
          )}
          {isLoggedIn && (
            <Link
              to="/orders"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              {isAdmin ? "My Orders" : "Your Orders"}
            </Link>
          )}
          {isAdmin && (
            <Link to="/dashboard">
              <Button variant="default" size="sm" className="glow-primary">
                Dashboard
              </Button>
            </Link>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden text-foreground"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden glass-strong overflow-hidden"
          >
            <div className="flex flex-col gap-4 px-6 py-4">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  Logout
                </button>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Login
                </Link>
              )}
              {isLoggedIn && (
                <Link
                  to="/orders"
                  onClick={() => setOpen(false)}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2 block"
                >
                  {isAdmin ? "My Orders" : "Your Orders"}
                </Link>
              )}
              {isAdmin && (
                <Link to="/dashboard" onClick={() => setOpen(false)}>
                  <Button variant="default" size="sm" className="glow-primary w-full">
                    Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
