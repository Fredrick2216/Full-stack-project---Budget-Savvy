
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import SpaceBackground from "@/components/SpaceBackground";
import { useEffect, useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const VerifyEmail = () => {
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    // Check for email in localStorage that was saved during registration
    const storedEmail = localStorage.getItem("pendingVerificationEmail");
    if (storedEmail) {
      setEmail(storedEmail);
    }
    
    // If user is already verified and logged in, redirect to dashboard
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        title: "Email address missing",
        description: "Please return to the login page and try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setResending(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) throw error;
      
      toast({
        title: "Verification email resent",
        description: "Please check your inbox and spam folder.",
      });
    } catch (error: any) {
      toast({
        title: "Error resending verification email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-space-dark p-4">
      <SpaceBackground />
      
      <div className="w-full max-w-md glassmorphism rounded-xl p-8 text-center relative z-10">
        <div className="flex justify-center mb-6">
          <div className="relative cosmic-glow">
            <div className="h-16 w-16 bg-space-purple rounded-full animate-cosmic-pulse"></div>
            <div className="h-10 w-10 bg-space-pink rounded-full absolute -bottom-2 -right-2 animate-space-glow"></div>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4 nebula-text">Check your inbox</h1>
        
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            We've sent you a verification link to complete your registration.
          </p>
          <p className="text-gray-300">
            Click the link in the email to verify your account and continue your journey.
          </p>
        </div>
        
        {/* Animated email icon */}
        <div className="my-8 relative">
          <div className="w-16 h-12 border-2 border-space-purple mx-auto relative overflow-hidden rounded-md animate-float">
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-space-purple to-space-pink"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-6 border-t-2 border-space-light transform -rotate-6 animate-twinkle-delay"></div>
            </div>
          </div>
          <div className="w-4 h-4 bg-space-glow rounded-full absolute -top-2 -right-2 animate-star-zoom"></div>
        </div>
        
        <div className="space-y-4">
          <Link to="/login">
            <Button variant="outline" className="w-full border-space-purple text-white hover:bg-space-purple/20">
              Back to Login
            </Button>
          </Link>
          
          <div className="text-sm text-gray-400">
            <p>Didn't receive an email? Check your spam folder or</p>
            <Button 
              variant="link" 
              className="text-space-purple p-0 h-auto hover:text-space-pink"
              onClick={handleResendVerification}
              disabled={resending}
            >
              {resending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Resend verification link"
              )}
            </Button>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-3 -left-3 h-6 w-6 bg-space-purple rounded-full opacity-20 animate-twinkle"></div>
        <div className="absolute top-1/2 -right-2 h-4 w-4 bg-space-pink rounded-full opacity-20 animate-twinkle-delay"></div>
        <div className="absolute -bottom-2 -left-4 h-5 w-5 bg-space-glow rounded-full opacity-20 animate-twinkle-delay-2"></div>
      </div>
    </div>
  );
};

export default VerifyEmail;
