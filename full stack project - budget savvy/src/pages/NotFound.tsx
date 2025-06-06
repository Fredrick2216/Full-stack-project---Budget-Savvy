
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-dark">
      <div className="text-center z-10 relative">
        <h1 className="text-6xl font-bold mb-4 nebula-text">404</h1>
        <p className="text-2xl text-white mb-6">Oops! Page not found</p>
        <Link to="/" className="text-space-purple hover:text-space-pink underline transition-all hover:scale-105 inline-block">
          Return to Home
        </Link>
      </div>
      
      {/* Add some decorative stars */}
      <div className="absolute h-3 w-3 bg-space-purple rounded-full animate-pulse top-1/4 left-1/4 opacity-60"></div>
      <div className="absolute h-2 w-2 bg-space-pink rounded-full animate-twinkle top-1/3 right-1/3 opacity-40"></div>
      <div className="absolute h-4 w-4 bg-space-light rounded-full animate-twinkle-delay bottom-1/4 right-1/4 opacity-50"></div>
    </div>
  );
};

export default NotFound;
