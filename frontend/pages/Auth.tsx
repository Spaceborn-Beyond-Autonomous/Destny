import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "axios";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let interval: any;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async () => {
    try {
      setSendingOtp(true);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/send-otp`, { email });
      setOtpSent(true);
      setTimer(60);
      toast({
        title: "OTP Sent",
        description: "Please check your email for the OTP.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async () => {
    try {
      setVerifyingOtp(true);
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/verify-otp`, { email, otp });
      setOtpVerified(true);
      toast({
        title: "Success",
        description: "Email verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Invalid OTP",
        variant: "destructive"
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/update-password`, {
          email,
          newPassword: password,
          OTP: otp
        });
        toast({
          title: "Success",
          description: "Password updated successfully. You can now sign in.",
        });
        setIsForgotPassword(false);
        setIsLogin(true);
        setOtp("");
        setOtpSent(false);
        setOtpVerified(false);
        setPassword("");
      } else if (isLogin) {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/loginUser`, {
          email,
          password
        }, {
          withCredentials: true
        });
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        navigate("/");
      } else {
        const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/users/register`, {
          name: fullName,
          email,
          password
        });
        toast({
          title: "Account created",
          description: "You can now sign in with your credentials.",
        });
        setIsLogin(true);
      }
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.message || error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <Card className="glass border-border/40">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-display">
              {isForgotPassword ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isForgotPassword ? "Enter your email to receive an OTP and reset your password" : isLogin ? "Sign in to your dashboard" : "Join Destny today"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="name" placeholder="Your name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="pl-10" required />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" required disabled={(!isLogin || isForgotPassword) && otpVerified} />
                  </div>
                  {(!isLogin || isForgotPassword) && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleSendOTP} 
                      disabled={!email || sendingOtp || verifyingOtp || otpVerified || timer > 0}
                    >
                      {sendingOtp ? "Sending..." : timer > 0 ? `Resend in ${timer}s` : otpSent ? "Resend OTP" : "Send OTP"}
                    </Button>
                  )}
                </div>
              </div>

              {(!isLogin || isForgotPassword) && otpSent && (
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <div className="flex gap-2">
                    <Input 
                      id="otp" 
                      type="text" 
                      placeholder="Enter OTP sent to email" 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                      disabled={otpVerified}
                      required={!isLogin} 
                    />
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handleVerifyOTP} 
                      disabled={!otp || sendingOtp || verifyingOtp || otpVerified}
                    >
                      {verifyingOtp ? "Verifying..." : otpVerified ? "Verified" : "Verify"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">{isForgotPassword ? "New Password" : "Password"}</Label>
                  {isLogin && !isForgotPassword && (
                    <button type="button" onClick={() => { setIsForgotPassword(true); setIsLogin(false); setOtpSent(false); setOtpVerified(false); setOtp(""); }} className="text-xs text-primary hover:underline font-medium">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10" required minLength={6} />
                </div>
              </div>
              <Button type="submit" className="w-full glow-primary" disabled={loading || ((!isLogin || isForgotPassword) && !otpVerified)}>
                {loading ? "Loading..." : isForgotPassword ? "Reset Password" : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {isForgotPassword ? (
                <>
                  Remember your password?{" "}
                  <button onClick={() => { setIsForgotPassword(false); setIsLogin(true); setOtpSent(false); setOtpVerified(false); setOtp(""); }} className="text-primary hover:underline font-medium" type="button">
                    Sign in
                  </button>
                </>
              ) : isLogin ? (
                <>
                  Don't have an account?{" "}
                  <button onClick={() => { setIsLogin(false); setOtpSent(false); setOtpVerified(false); setOtp(""); }} className="text-primary hover:underline font-medium" type="button">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => { setIsLogin(true); setIsForgotPassword(false); setOtpSent(false); setOtpVerified(false); setOtp(""); }} className="text-primary hover:underline font-medium" type="button">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
