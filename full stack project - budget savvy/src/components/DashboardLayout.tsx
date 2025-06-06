
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSupabase } from "@/components/SupabaseProvider";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { TrendingDown, Target, Settings, User, LayoutDashboard, TrendingUp, Menu, X, PiggyBank } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut } = useSupabase();
  const location = useLocation();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navItems = [
    {
      title: "Budget",
      href: "/budget",
      icon: <LayoutDashboard className="mr-2 h-4 w-4" />,
    },
    {
      title: "Expenses",
      href: "/expenses",
      icon: <TrendingDown className="mr-2 h-4 w-4" />,
    },
    {
      title: "Income",
      href: "/income",
      icon: <TrendingUp className="mr-2 h-4 w-4" />,
    },
    {
      title: "Goals",
      href: "/goals",
      icon: <Target className="mr-2 h-4 w-4" />,
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="mr-2 h-4 w-4" />,
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border flex items-center justify-between px-3 sm:px-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 sm:h-8 sm:w-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
              <PiggyBank className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold text-primary">Budget Savvy</span>
          </div>
          <div className="w-8 sm:w-9" />
        </header>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "glassmorphism fixed inset-y-0 left-0 z-40 w-56 sm:w-64 transform transition-transform duration-300 ease-in-out border-r border-border",
          isMobile 
            ? sidebarOpen 
              ? "translate-x-0" 
              : "-translate-x-full"
            : "translate-x-0",
          isMobile && "top-14 sm:top-16"
        )}
      >
        <div className="flex h-full flex-col justify-between p-3 sm:p-4">
          <div className="space-y-4 sm:space-y-6">
            {/* Desktop Header */}
            {!isMobile && (
              <div className="flex items-center justify-center py-3 sm:py-4">
                <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <PiggyBank className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
                <span className="ml-3 text-lg sm:text-2xl font-bold text-primary">Budget Savvy</span>
              </div>
            )}

            {/* Mobile Close Button */}
            {isMobile && (
              <div className="flex justify-end">
                <button
                  onClick={toggleSidebar}
                  className="p-2 hover:bg-accent rounded-md transition-colors"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            )}

            {/* Navigation */}
            <nav className="space-y-1">
              {navItems.map((item) => (
                <Link key={item.href} to={item.href} onClick={() => isMobile && setSidebarOpen(false)}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm sm:text-base py-2 sm:py-3",
                      location.pathname === item.href &&
                        "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                  >
                    {item.icon}
                    {item.title}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          {/* User profile */}
          <div className="space-y-3 sm:space-y-4 mt-auto">
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-md bg-background/20 border border-border/50">
              <Avatar className="border-2 border-primary h-6 w-6 sm:h-8 sm:w-8">
                <AvatarFallback className="bg-primary/20">
                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                </AvatarFallback>
                <AvatarImage src="" />
              </Avatar>
              <div className="space-y-0.5 flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">{user?.email}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {user?.id.substring(0, 8)}...
                </p>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full text-xs sm:text-sm py-2" 
              onClick={handleSignOut}
              size="sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen w-full",
          isMobile 
            ? "pt-14 sm:pt-16 px-2 sm:px-4" 
            : "pl-56 sm:pl-64 pr-2 sm:pr-4",
          "overflow-x-hidden"
        )}
      >
        <div className="container mx-auto py-4 sm:py-6 md:py-8 max-w-7xl px-2 sm:px-4">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
