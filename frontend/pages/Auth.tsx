import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react";
import { authService } from "@/services/auth.service";

const flowConfig = {
  printing: {
    title: "3D Printing Login",
    signupTitle: "Create 3D Printing Account",
    description: "Sign in to upload files, get quotes, and manage 3D printing orders.",
    signupDescription: "Create a dedicated account for 3D printing quotes and orders.",
    accountType: "printing",
    backTo: "/",
    secureLabel: "3D printing account",
  },
  hire: {
    title: "Hire Freelancer Login",
    signupTitle: "Create Hiring Account",
    description: "Sign in to post jobs, review proposals, and manage freelancer contracts.",
    signupDescription: "Create a dedicated client account for hiring freelancers.",
    accountType: "client",
    backTo: "/freelance",
    secureLabel: "client hiring account",
  },
  freelancer: {
    title: "Freelancer Login",
    signupTitle: "Apply as Freelancer",
    description: "Sign in to browse jobs, send proposals, and manage your freelancer profile.",
    signupDescription: "Create a dedicated freelancer account to apply for work.",
    accountType: "freelancer",
    backTo: "/freelance",
    secureLabel: "freelancer account",
  },
  default: {
    title: "Welcome Back",
    signupTitle: "Create Account",
    description: "Sign in to your Destny account.",
    signupDescription: "Create your Destny account.",
    accountType: "general",
    backTo: "/",
    secureLabel: "secure account",
  },
} as const;

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'login';
  const flow = searchParams.get('flow') || 'default';
  const config = flowConfig[(flow as keyof typeof flowConfig)] || flowConfig.default;
  const defaultRedirect =
    flow === 'printing' ? '/3d-printing' :
    flow === 'hire' ? '/freelance/dashboard' :
    flow === 'freelancer' ? '/freelance/freelancer-dashboard' :
    '/orders';
  const redirect = searchParams.get('redirect') || defaultRedirect;
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    setIsLogin(mode === 'login');
  }, [mode]);

  useEffect(() => {
    let mounted = true;

    authService
      .getCurrentUser(true)
      .then(() => {
        if (mounted) {
          navigate(redirect, { replace: true });
        }
      })
      .catch(() => {
        // Not logged in yet; show the auth form.
      });

    return () => {
      mounted = false;
    };
  }, [navigate, redirect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!isLogin && password !== confirmPassword) {
        setError("Passwords do not match");
        toast({
          title: "Error",
          description: "Passwords do not match",
          variant: "destructive",
        });
        return;
      }

      const scopedAccountType = flow === 'default' ? undefined : config.accountType;
      const credentials = {
        email: email.trim(),
        password,
        ...(isLogin ? {} : { name: fullName.trim() }),
        ...(scopedAccountType ? { accountType: scopedAccountType } : {}),
      };

      if (isLogin) {
        // Backend sets httpOnly cookies; we don't store mock tokens.
        // Auth API expects /api/v1/users/loginUser (see backend routes).
        await authService.login({
          email: credentials.email,
          password: credentials.password,
          accountType: scopedAccountType,
        });
        toast({
          title: "Welcome back! 👋",
          description: "Logged in successfully.",
        });
      } else {
        if (!fullName.trim()) {
          setError("Full name is required");
          return;
        }
        await authService.signup({
          name: fullName.trim(),
          email: credentials.email,
          password: credentials.password,
          accountType: scopedAccountType || config.accountType,
        });
        toast({
          title: "Account created! 🎉",
          description: "Your account was created successfully.",
        });
      }

      navigate(redirect, { replace: true });
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || "Something went wrong. Please try again.";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link 
          to={config.backTo}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back
        </Link>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass border-border/40 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {isLogin ? (
                    <Lock className="h-8 w-8 text-primary" />
                  ) : (
                    <User className="h-8 w-8 text-primary" />
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl font-display">
                {isLogin ? config.title : config.signupTitle}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? config.description 
                  : config.signupDescription}
              </CardDescription>
              <div className="mt-2 text-xs text-muted-foreground bg-muted/30 border border-border rounded-lg px-3 py-1.5">
                {config.secureLabel}
              </div>
            </CardHeader>
            
            <CardContent>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm rounded-xl p-3 mb-4">
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-medium">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="name" 
                        placeholder="Your full name" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                        required={!isLogin}
                      />
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="you@example.com" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                      required 
                      minLength={8} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use at least 8 characters
                  </p>
                </div>
                
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="confirmPassword" 
                        type={showConfirmPassword ? "text" : "password"} 
                        placeholder="Confirm your password" 
                        value={confirmPassword} 
                        onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="pl-10 pr-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all"
                        required={!isLogin} 
                        minLength={8} 
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
                
                {isLogin && (
                  <div className="text-right">
                    <button 
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => toast({ title: "Reset Password", description: "Password reset is not enabled yet." })}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  size="lg"
                  className="w-full glow-primary gap-2" 
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                      Loading...
                    </span>
                  ) : (
                    <>
                      {isLogin ? "Sign In" : "Create Account"}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
              
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      navigate(`/auth?flow=${flow}&mode=${isLogin ? 'signup' : 'login'}&redirect=${encodeURIComponent(redirect)}`);
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Use your real email and password.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
