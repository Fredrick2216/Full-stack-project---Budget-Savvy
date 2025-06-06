
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Navigate, useNavigate } from "react-router-dom";
import SpaceBackground from "@/components/SpaceBackground";
import { useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ui/use-toast";
import { PiggyBank } from "lucide-react";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signUp } = useSupabase();
  const { toast } = useToast();
  const navigate = useNavigate();

  // If user is already logged in, redirect to budget dashboard instead of dashboard
  if (user) {
    return <Navigate to="/budget" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !fullName) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password should be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // Save email to localStorage for the verification page
      localStorage.setItem("pendingVerificationEmail", email);
      await signUp(email, password, fullName);
      navigate("/verify-email");
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-space-dark p-4">
      <SpaceBackground />
      
      <div className="w-full max-w-md glassmorphism rounded-xl p-8 relative z-10">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="h-12 w-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <PiggyBank className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold ml-3 text-white">
                Budget Savvy
              </h1>
            </div>
          </Link>
          <h2 className="text-xl font-semibold mt-6 text-white">Create your account</h2>
          <p className="text-gray-400 mt-2">Start your financial journey today</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="fullName" className="text-white">Full Name</Label>
              <Input 
                id="fullName" 
                type="text" 
                placeholder="John Doe" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-space-purple focus:ring-space-purple/20"
                required
              />
              <div className="absolute top-8 right-3 pointer-events-none opacity-40 text-space-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-space-purple focus:ring-space-purple/20"
                required
              />
              <div className="absolute top-8 right-3 pointer-events-none opacity-40 text-space-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-space-purple focus:ring-space-purple/20"
                required
              />
              <div className="absolute top-8 right-3 pointer-events-none opacity-40 text-space-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="••••••••" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-space-purple focus:ring-space-purple/20"
                required
              />
              <div className="absolute top-8 right-3 pointer-events-none opacity-40 text-space-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full cosmos-button text-white relative overflow-hidden"
            disabled={loading}
          >
            <span className="relative z-10">
              {loading ? "Creating account..." : "Create account"}
            </span>
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-space-purple hover:text-space-pink transition-all hover:underline">
              Sign in
            </Link>
          </p>
        </div>
        
        {/* Decorative stars */}
        <div className="absolute -top-2 -left-2 h-4 w-4 bg-space-purple rounded-full animate-twinkle opacity-60"></div>
        <div className="absolute top-1/4 -right-1 h-3 w-3 bg-space-pink rounded-full animate-twinkle-delay opacity-60"></div>
        <div className="absolute bottom-1/3 -left-3 h-2 w-2 bg-space-light rounded-full animate-twinkle-delay-2 opacity-40"></div>
      </div>
    </div>
  );
};

export default Register;
