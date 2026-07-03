import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft, ArrowRight, Chrome, Github, Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get('mode') || 'login';
  const redirect = searchParams.get('redirect') || '/freelance';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (!isLogin && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    // ✅ ALWAYS ACCEPT - Mock successful login/signup
    try {
      // Create user data
      const userData = {
        id: '1',
        name: isLogin ? email.split('@')[0] : fullName || email.split('@')[0],
        email: email,
        role: 'client',
        avatar: (isLogin ? email.split('@')[0] : fullName || email.split('@')[0])
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      };

      // Store user data in localStorage
      localStorage.setItem('auth_token', 'mock_token_' + Date.now());
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      toast({
        title: isLogin ? "Welcome back! 👋" : "Account created! 🎉",
        description: isLogin 
          ? `Logged in as ${userData.name}` 
          : `Welcome ${userData.name}! Your account has been created.`,
      });
      
      // Redirect to the intended page (dashboard if coming from Post a Job)
      navigate(redirect);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Mock Google login - always successful
    setLoading(true);
    setTimeout(() => {
      const userData = {
        id: 'google_' + Date.now(),
        name: 'Google User',
        email: 'user@gmail.com',
        role: 'client',
        avatar: 'GU'
      };
      localStorage.setItem('auth_token', 'google_mock_token_' + Date.now());
      localStorage.setItem('user_data', JSON.stringify(userData));
      toast({
        title: "Welcome! 👋",
        description: "Logged in with Google successfully",
      });
      navigate(redirect);
      setLoading(false);
    }, 800);
  };

  const handleGithubLogin = () => {
    // Mock GitHub login - always successful
    setLoading(true);
    setTimeout(() => {
      const userData = {
        id: 'github_' + Date.now(),
        name: 'GitHub User',
        email: 'user@github.com',
        role: 'client',
        avatar: 'GU'
      };
      localStorage.setItem('auth_token', 'github_mock_token_' + Date.now());
      localStorage.setItem('user_data', JSON.stringify(userData));
      toast({
        title: "Welcome! 👋",
        description: "Logged in with GitHub successfully",
      });
      navigate(redirect);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
          Back to home
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
                {isLogin ? "Welcome Back" : "Create Account"}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Sign in to your Destny Freelance account" 
                  : "Join Destny Freelance Marketplace"}
              </CardDescription>
              <div className="mt-2 text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-1.5">
                🔧 Demo Mode: Any credentials will work
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
                      minLength={3} 
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
                    Any password works in demo mode
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
                        minLength={3} 
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
                      onClick={() => toast({ title: "Reset Password", description: "Password reset link sent to your email (Demo)" })}
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
              
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                >
                  <Chrome className="h-4 w-4" />
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 border-border/50 hover:bg-primary/5 hover:border-primary/30 transition-all"
                  onClick={handleGithubLogin}
                  disabled={loading}
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </Button>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      navigate(`/auth?mode=${isLogin ? 'signup' : 'login'}`);
                    }}
                    className="text-primary font-semibold hover:underline"
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </button>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Demo: Use any email and password (min 3 characters)
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