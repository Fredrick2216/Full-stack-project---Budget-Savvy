
import { createContext, useContext, useState, useEffect } from "react";
import { createClient, SupabaseClient, User, Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SupabaseContextProps {
  supabase: SupabaseClient;
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  updateProfile: (data: { fullName?: string, avatar_url?: string }) => Promise<void>;
}

const SupabaseContext = createContext<SupabaseContextProps | undefined>(undefined);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function getSession() {
      try {
        setLoading(true);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error fetching session:", error);
          return;
        }
        
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error("Failed to get session:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    getSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (isMounted) {
          console.log("Auth state changed:", event, newSession?.user?.email);
          setSession(newSession);
          setUser(newSession?.user ?? null);
          setLoading(false);
        }
      }
    );
    
    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!email?.trim() || !password?.trim()) {
      const error = new Error("Email and password are required");
      toast({
        title: "Missing information",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      throw error;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });
      
      if (error) {
        toast({
          title: "Error signing in",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
    } catch (error: any) {
      console.error("Sign-in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!email?.trim() || !password?.trim() || !fullName?.trim()) {
      const error = new Error("All fields are required");
      toast({
        title: "Missing information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      throw error;
    }

    try {
      const siteUrl = window.location.origin;
      
      const { error, data } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: `${siteUrl}/budget`,
        },
      });
      
      if (error) {
        toast({
          title: "Error signing up",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      if (data.user && !data.session) {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration.",
        });
      } else {
        toast({
          title: "Welcome!",
          description: "Your account has been created successfully.",
        });
      }

      console.log("User signed up successfully with ID:", data.user?.id);
    } catch (error: any) {
      console.error("Sign-up error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Error signing out",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error: any) {
      console.error("Sign-out error:", error);
      throw error;
    }
  };

  const updateProfile = async (data: { fullName?: string, avatar_url?: string }) => {
    try {
      if (!user) throw new Error("User not authenticated");

      const updateData: any = {};
      if (data.fullName?.trim()) {
        updateData.full_name = data.fullName.trim();
      }
      if (data.avatar_url) {
        updateData.avatar_url = data.avatar_url;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: updateData,
      });

      if (updateError) throw updateError;

      const updates = {
        user_id: user.id,
        full_name: data.fullName?.trim(),
        avatar_url: data.avatar_url,
        updated_at: new Date().toISOString(),
      };
        
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(updates);
        
      if (profileError) throw profileError;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    supabase,
    user,
    session,
    signIn,
    signUp,
    signOut,
    loading,
    updateProfile,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}
