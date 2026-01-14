import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, User, FileText, Phone, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isSignUp = searchParams.get("mode") === "signup";

  const [mode, setMode] = useState<"signin" | "signup">(isSignUp ? "signup" : "signin");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });

  // OTP verification state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState(""); // For demo mode
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check if user is already logged in (non-blocking)
  useEffect(() => {
    let mounted = true;

    // Check session asynchronously without blocking render
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          navigate("/dashboard");
        }
      } catch (error) {
        // Silently fail - user can still use the page
        console.error("Session check error:", error);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted && session?.user) {
        navigate("/dashboard");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Reset OTP state if phone number changes
    if (e.target.name === "phone") {
      setOtpSent(false);
      setIsPhoneVerified(false);
      setOtp("");
      setGeneratedOtp("");
    }
  };

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Send OTP handler (Demo mode - generates and shows OTP in toast)
  const handleSendOtp = async () => {
    if (!formData.phone || formData.phone.length < 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);

    try {
      // Demo mode: Generate a random 6-digit OTP
      const demoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(demoOtp);

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setOtpSent(true);
      setResendCooldown(30); // 30 second cooldown

      toast({
        title: "OTP Sent! (Demo Mode)",
        description: `Your verification code is: ${demoOtp}`,
        duration: 10000,
      });
    } catch (error: any) {
      toast({
        title: "Error Sending OTP",
        description: error.message || "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit OTP.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingOtp(true);

    try {
      // Demo mode: Verify against generated OTP
      await new Promise(resolve => setTimeout(resolve, 500));

      if (otp === generatedOtp) {
        setIsPhoneVerified(true);
        toast({
          title: "Phone Verified!",
          description: "Your mobile number has been verified successfully.",
        });
      } else {
        toast({
          title: "Invalid OTP",
          description: "The OTP you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === "signup") {
        // Phone verification is optional for now (coming soon feature)
        // When you integrate real OTP, uncomment the check below:
        // if (!isPhoneVerified && formData.phone) {
        //   toast({
        //     title: "Phone Verification Required",
        //     description: "Please verify your mobile number before creating an account.",
        //     variant: "destructive",
        //   });
        //   setIsLoading(false);
        //   return;
        // }

        const redirectUrl = `${window.location.origin}/dashboard`;

        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: formData.name,
              phone: formData.phone,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else if (data.user) {
          toast({
            title: "Account created!",
            description: "Welcome to SmartDocs. Redirecting to dashboard...",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Invalid credentials",
              description: "Please check your email and password and try again.",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "Redirecting to dashboard...",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        // Check for specific error about provider not being enabled
        if (error.message?.includes("not enabled") || error.message?.includes("provider is not enabled")) {
          toast({
            title: "Google Sign-In Not Configured",
            description: "Google OAuth needs to be enabled in your Supabase project. See console for setup instructions.",
            variant: "destructive",
            duration: 8000,
          });
          console.error("❌ Google OAuth is not enabled in Supabase.");
          console.log("📋 To enable Google OAuth:");
          console.log("1. Go to https://supabase.com/dashboard");
          console.log("2. Select your project");
          console.log("3. Navigate to Authentication > Providers");
          console.log("4. Enable Google provider");
          console.log("5. Add your Google OAuth credentials (Client ID & Secret)");
          console.log("6. Add redirect URL:", `${window.location.origin}/dashboard`);
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 relative">
        {/* Background Pattern - Memoized to prevent regeneration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-[0.02]">
            {useMemo(() => {
              const patternItems = Array.from({ length: 30 }, (_, i) => {
                const left = (i % 5) * 20 + Math.random() * 10;
                const top = Math.floor(i / 5) * 15 + Math.random() * 5;
                const rotation = Math.random() * 10 - 5;
                const text = ["DOC", "PAN", "PDF", "BILL", "SEC", "DATA"][i % 6];
                return { left, top, rotation, text, key: i };
              });
              return patternItems;
            }, []).map((item) => (
              <div
                key={item.key}
                className="absolute text-[10px] font-mono text-foreground whitespace-nowrap"
                style={{
                  left: `${item.left}%`,
                  top: `${item.top}%`,
                  transform: `rotate(${item.rotation}deg)`,
                }}
              >
                {item.text}
              </div>
            ))}
          </div>
        </div>

        {/* Back to Home */}
        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-md mx-auto w-full relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-lg blur-lg" />
                <div className="relative bg-primary/10 p-3 rounded-xl border border-primary/20">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
              </div>
            </Link>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary hover:underline"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("signin")}
                    className="text-primary hover:underline"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>

          {/* Google Auth Button */}
          <div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleAuth}
              className="w-full h-12 border-border text-foreground font-medium transition-all duration-300 hover:border-primary hover:shadow-md hover:scale-[1.02] hover:bg-secondary/80 hover:text-foreground bg-background"
            >
              <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-sm">Or continue with email</span>
            <Separator className="flex-1" />
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {mode === "signup" && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 h-12 bg-secondary border-border focus:border-primary"
                    required
                  />
                </div>
              </div>
            )}

            {/* Mobile Number with OTP Verification - Only in signup mode (Optional - Coming Soon) */}
            {mode === "signup" && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30">
                    Coming Soon
                  </span>
                  <span className="text-xs text-muted-foreground">(Optional)</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className={`pl-10 h-12 bg-secondary border-border focus:border-primary ${isPhoneVerified ? 'border-green-500 pr-10' : ''}`}
                      disabled={isPhoneVerified}
                    />
                    {isPhoneVerified && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  {!isPhoneVerified && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || !formData.phone || formData.phone.length < 10 || resendCooldown > 0}
                      className="h-12 px-4 whitespace-nowrap"
                    >
                      {isSendingOtp ? (
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      ) : resendCooldown > 0 ? (
                        `Resend (${resendCooldown}s)`
                      ) : otpSent ? (
                        "Resend OTP"
                      ) : (
                        "Send OTP"
                      )}
                    </Button>
                  )}
                </div>

                {/* OTP Input Section */}
                {otpSent && !isPhoneVerified && (
                  <div className="mt-4 p-4 rounded-lg bg-secondary/50 border border-border space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Enter the 6-digit OTP sent to your mobile
                    </div>
                    <div className="flex items-center gap-4">
                      <InputOTP
                        maxLength={6}
                        value={otp}
                        onChange={setOtp}
                        className="gap-2"
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="h-12 w-12 text-lg bg-background" />
                          <InputOTPSlot index={1} className="h-12 w-12 text-lg bg-background" />
                          <InputOTPSlot index={2} className="h-12 w-12 text-lg bg-background" />
                          <InputOTPSlot index={3} className="h-12 w-12 text-lg bg-background" />
                          <InputOTPSlot index={4} className="h-12 w-12 text-lg bg-background" />
                          <InputOTPSlot index={5} className="h-12 w-12 text-lg bg-background" />
                        </InputOTPGroup>
                      </InputOTP>
                      <Button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || otp.length !== 6}
                        className="h-12 bg-primary hover:bg-primary/90"
                      >
                        {isVerifyingOtp ? (
                          <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        ) : (
                          "Verify"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Phone Verified Message */}
                {isPhoneVerified && (
                  <div className="flex items-center gap-2 text-sm text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    Mobile number verified
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 h-12 bg-secondary border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" && (
                  <button type="button" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10 h-12 bg-secondary border-border focus:border-primary"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium glow-primary"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : mode === "signin" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{" "}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Right Panel - Visual (Enhanced) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Animated Mesh Gradient Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[conic-gradient(from_0deg,transparent,var(--tw-gradient-stops),transparent)] from-primary/10 via-cyan-500/10 to-primary/10 rounded-full blur-3xl animate-spin" style={{ animationDuration: '20s' }} />
        </div>

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {useMemo(() => (
            Array.from({ length: 20 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-primary/40 rounded-full animate-pulse"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDuration: `${2 + Math.random() * 3}s`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))
          ), [])}
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center w-full">
          {/* Floating Cards */}
          <div className="relative">
            {/* Glow Effect Behind Card */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-cyan-500/40 rounded-3xl blur-2xl scale-105 animate-pulse" style={{ animationDuration: '3s' }} />

            {/* Main Card */}
            <div className="relative backdrop-blur-xl bg-slate-900/80 rounded-2xl border border-white/10 p-8 max-w-sm animate-float shadow-2xl shadow-primary/20 hover:shadow-primary/30 transition-shadow duration-500">
              {/* Card Header with Gradient Border */}
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-white/10">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary to-cyan-400 rounded-xl blur animate-pulse" />
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-cyan-500 flex items-center justify-center shadow-lg">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-xl text-white tracking-tight">SmartDocs</h3>
                  <p className="text-sm text-slate-400">Digital Document Vault</p>
                </div>
              </div>

              {/* Document Items with Staggered Animation */}
              <div className="space-y-3">
                {[
                  { name: "Aadhaar Card", icon: "🪪", color: "from-orange-500/20 to-orange-600/20" },
                  { name: "PAN Card", icon: "💳", color: "from-blue-500/20 to-blue-600/20" },
                  { name: "Electricity Bill", icon: "⚡", color: "from-yellow-500/20 to-yellow-600/20" },
                ].map((doc, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-white/5 to-white/[0.02] border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all duration-300 cursor-pointer"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${doc.color} flex items-center justify-center text-lg group-hover:scale-110 transition-transform duration-300`}>
                      {doc.icon}
                    </div>
                    <span className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{doc.name}</span>
                    <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      <CheckCircle className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Upload Progress Animation (Decorative) */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Storage Used</span>
                  <span className="text-primary">2.4 GB / 10 GB</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[24%] bg-gradient-to-r from-primary to-cyan-400 rounded-full relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Security Badge - Animated */}
            <div className="absolute -top-4 -right-4 animate-bounce" style={{ animationDuration: '2s' }}>
              <div className="relative">
                <div className="absolute inset-0 bg-primary rounded-full blur-md animate-pulse" />
                <div className="relative px-4 py-2 rounded-full bg-gradient-to-r from-primary to-green-500 text-white text-sm font-semibold shadow-lg shadow-primary/50 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Secured
                </div>
              </div>
            </div>

            {/* Additional Floating Elements */}
            <div className="absolute -bottom-6 -left-6 px-3 py-1.5 rounded-lg bg-slate-800/80 backdrop-blur border border-white/10 text-xs text-slate-300 flex items-center gap-2 animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Bank-Grade Security
            </div>
          </div>

          {/* Enhanced Stats */}
          <div className="flex gap-6 mt-16">
            {[
              { value: "10K+", label: "Documents Stored", icon: "📄" },
              { value: "99.9%", label: "Uptime", icon: "⚡" },
              { value: "256-bit", label: "Encryption", icon: "🔐" },
            ].map((stat, i) => (
              <div key={i} className="text-center group cursor-default">
                <div className="text-3xl mb-1">{stat.icon}</div>
                <div className="text-2xl font-bold text-white group-hover:text-primary transition-colors">{stat.value}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.label}</div>
                <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-300 mt-2 mx-auto" />
              </div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="flex items-center gap-4 mt-10">
            {["🔒 SSL Secured", "🛡️ GDPR Compliant", "☁️ Cloud Backup"].map((badge, i) => (
              <div key={i} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400 hover:border-primary/50 hover:text-white transition-all duration-300">
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;