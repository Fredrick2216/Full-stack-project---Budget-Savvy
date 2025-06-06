
import { Navigate } from "react-router-dom";
import { useSupabase } from "./SupabaseProvider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, supabase } = useSupabase();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full galaxy-bg">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-space-purple animate-spin mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  // Show configuration error if supabase is not initialized
  if (!supabase) {
    return (
      <div className="flex items-center justify-center h-screen w-full galaxy-bg p-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive" className="bg-red-900/50 border-red-500">
            <AlertTriangle className="h-5 w-5" />
            <AlertTitle>Configuration Error</AlertTitle>
            <AlertDescription>
              Supabase configuration is missing. Please set up your environment variables:
              <ul className="list-disc pl-6 mt-2 space-y-1">
                <li>VITE_SUPABASE_URL</li>
                <li>VITE_SUPABASE_ANON_KEY</li>
              </ul>
              <p className="mt-2">Contact support if you need assistance.</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
