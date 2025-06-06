
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, Navigate, useNavigate } from "react-router-dom";
import SpaceBackground from "@/components/SpaceBackground";
import { useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, PiggyBank } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useSupabase();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/budget" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email?.trim() || !password?.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      await signIn(email.trim(), password);
      navigate("/budget");
    } catch (error: any) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-space-dark p-4 sm:p-6 lg:p-8">
      <SpaceBackground />
      
      <div className="w-full max-w-sm sm:max-w-md glassmorphism rounded-xl p-6 sm:p-8 relative z-10">
        <div className="mb-6 text-center">
          <Link to="/" className="inline-block">
            <div className="flex items-center justify-center">
              <div className="relative">
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <PiggyBank className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold ml-3 text-white">
                Budget Savvy
              </h1>
            </div>
          </Link>
          <h2 className="text-lg sm:text-xl font-semibold mt-6 text-white">Welcome back</h2>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="relative">
              <Label htmlFor="email" className="text-white text-sm">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="you@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-space-purple focus:ring-space-purple/20 mt-1"
                required
                disabled={loading}
              />
              <div className="absolute top-8 right-3 pointer-events-none opacity-40 text-space-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
            </div>
            
            <div className="relative">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-white text-sm">Password</Label>
                <Link to="#" className="text-xs text-space-purple hover:text-space-pink transform hover:scale-105 transition-all">
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-space-purple focus:ring-space-purple/20 mt-1"
                required
                disabled={loading}
              />
              <div className="absolute top-8 right-3 pointer-events-none opacity-40 text-space-purple">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[18px] sm:h-[18px]">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full cosmos-button text-white relative overflow-hidden text-sm sm:text-base py-2 sm:py-3"
            disabled={loading}
          >
            <span className="relative z-10">
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </div>
              ) : "Sign in"}
            </span>
          </Button>
        </form>
        
        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <Link to="/register" className="text-space-purple hover:text-space-pink transition-all hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
