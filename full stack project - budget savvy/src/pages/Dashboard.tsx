
import React from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/components/SupabaseProvider";
import { Link } from "react-router-dom";
import { 
  TrendingUp, 
  Target, 
  PieChart,
  ArrowRight,
  PiggyBank,
  Calendar,
  TrendingDown
} from "lucide-react";

const Dashboard = () => {
  const { user } = useSupabase();

  const quickActions = [
    {
      title: "Track Expenses",
      description: "Log your daily expenses",
      icon: TrendingDown,
      href: "/expenses",
      color: "text-red-500"
    },
    {
      title: "Manage Income",
      description: "Record your income sources",
      icon: TrendingUp,
      href: "/income",
      color: "text-green-500"
    },
    {
      title: "Set Budgets",
      description: "Create and manage budgets",
      icon: Target,
      href: "/budget",
      color: "text-blue-500"
    },
    {
      title: "Financial Goals",
      description: "Track your financial goals",
      icon: PieChart,
      href: "/goals",
      color: "text-purple-500"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Welcome Section */}
        <div className="cosmic-card p-4 sm:p-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <PiggyBank className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-bold nebula-text">
                Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ''}!
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Take control of your financial future with Budget Savvy
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} to={action.href}>
              <Card className="cosmic-card hover:border-space-purple/50 transition-all duration-300 cursor-pointer group h-full">
                <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <action.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${action.color}`} />
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 group-hover:text-space-purple transition-colors" />
                  </div>
                  <CardTitle className="text-base sm:text-lg">{action.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <p className="text-gray-400 text-xs sm:text-sm">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Getting Started Section */}
        <Card className="cosmic-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-space-purple" />
              Getting Started with Budget Savvy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-lg border border-space-purple/20 bg-space-purple/5">
                <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">1. Set Up Your Budget</h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-3">
                  Create monthly budgets to track your spending and stay on target.
                </p>
                <Link to="/budget">
                  <button className="text-space-purple hover:text-space-pink transition-colors text-xs sm:text-sm font-medium">
                    Create Budget →
                  </button>
                </Link>
              </div>
              
              <div className="p-3 sm:p-4 rounded-lg border border-space-pink/20 bg-space-pink/5">
                <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">2. Track Expenses</h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-3">
                  Log your daily expenses to understand your spending patterns.
                </p>
                <Link to="/expenses">
                  <button className="text-space-pink hover:text-space-purple transition-colors text-xs sm:text-sm font-medium">
                    Add Expense →
                  </button>
                </Link>
              </div>
              
              <div className="p-3 sm:p-4 rounded-lg border border-space-light/20 bg-space-light/5">
                <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">3. Record Income</h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-3">
                  Add your income sources to get a complete financial picture.
                </p>
                <Link to="/income">
                  <button className="text-space-light hover:text-space-purple transition-colors text-xs sm:text-sm font-medium">
                    Add Income →
                  </button>
                </Link>
              </div>
              
              <div className="p-3 sm:p-4 rounded-lg border border-green-500/20 bg-green-500/5">
                <h3 className="font-semibold mb-2 text-white text-sm sm:text-base">4. Set Financial Goals</h3>
                <p className="text-gray-400 text-xs sm:text-sm mb-3">
                  Define and track your financial goals for the future.
                </p>
                <Link to="/goals">
                  <button className="text-green-400 hover:text-space-purple transition-colors text-xs sm:text-sm font-medium">
                    Set Goals →
                  </button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
