
import { Button } from "@/components/ui/button";
import SpaceBackground from "@/components/SpaceBackground";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, Sparkles, Star, TrendingUp, TrendingDown, Target, Wallet, DollarSign, PieChart, PiggyBank } from "lucide-react";
import { useSupabase } from "@/components/SupabaseProvider";
import { formatCurrency } from "@/lib/utils";

const LandingPage = () => {
  const { supabase, user } = useSupabase();
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState(0);
  const [userMetrics, setUserMetrics] = useState({
    monthlySavings: 0,
    expensesTracked: 0,
    budgetGoals: { achieved: 0, total: 5 },
    financialScore: 0
  });
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    const createParticle = () => {
      const particle = document.createElement('div');
      const size = Math.random() * 3 + 1;
      const duration = Math.random() * 10 + 5;
      const delay = Math.random() * 5;
      
      particle.classList.add('star');
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}vw`;
      particle.style.bottom = '-10px';
      particle.style.opacity = `${Math.random() * 0.7 + 0.3}`;
      particle.style.animation = `float-slow ${duration}s ${delay}s ease-in-out infinite`;
      
      document.getElementById('particle-container')?.appendChild(particle);
      
      setTimeout(() => {
        particle.remove();
      }, (duration + delay) * 1000);
    };
    
    const particleInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        createParticle();
      }
    }, 300);

    // Auto-rotate demo metrics
    const metricInterval = setInterval(() => {
      setActiveMetric((prev) => (prev + 1) % 4);
    }, 2000);
    
    // Fetch user data if logged in
    if (user) {
      fetchUserFinancialData();
    }
    
    return () => {
      clearInterval(particleInterval);
      clearInterval(metricInterval);
    };
  }, [user]);

  const fetchUserFinancialData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch current month's expenses
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      
      const { data: expenses, error: expensesError } = await supabase
        .from("expenses")
        .select("amount, currency")
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString());
        
      if (expensesError) throw expensesError;
      
      // Fetch current month's income
      const { data: incomes, error: incomesError } = await supabase
        .from("incomes")
        .select("amount")
        .eq("user_id", user.id)
        .gte("date", startOfMonth.toISOString());
        
      if (incomesError) throw incomesError;
      
      // Fetch budget data
      const { data: budgets, error: budgetsError } = await supabase
        .from("budgets")
        .select("amount, period")
        .eq("user_id", user.id);
        
      if (budgetsError) throw budgetsError;
      
      // Calculate metrics
      const totalExpenses = expenses?.reduce((sum, expense) => sum + Math.abs(expense.amount), 0) || 0;
      const totalIncome = incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
      const monthlySavings = totalIncome - totalExpenses;
      
      // Calculate financial score (0-100 based on savings rate)
      const savingsRate = totalIncome > 0 ? (monthlySavings / totalIncome) : 0;
      let financialScore = 50; // Base score
      
      if (savingsRate >= 0.3) financialScore = 95;
      else if (savingsRate >= 0.2) financialScore = 85;
      else if (savingsRate >= 0.1) financialScore = 70;
      else if (savingsRate >= 0) financialScore = 60;
      else financialScore = 30;
      
      // Budget goals calculation
      const monthlyBudgets = budgets?.filter(b => b.period === 'monthly') || [];
      const budgetGoalsTotal = Math.max(monthlyBudgets.length, 5);
      const budgetGoalsAchieved = monthlyBudgets.filter(budget => totalExpenses <= budget.amount).length;
      
      setUserMetrics({
        monthlySavings,
        expensesTracked: totalExpenses,
        budgetGoals: { achieved: budgetGoalsAchieved, total: budgetGoalsTotal },
        financialScore
      });
      
    } catch (error) {
      console.error("Error fetching user financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayMetrics = () => {
    if (!user || loading) {
      // Demo metrics for non-logged in users
      return [
        { label: "Monthly Savings", value: "$1,240", trend: "+18%", icon: TrendingUp, color: "text-green-400" },
        { label: "Expenses Tracked", value: "$3,680", trend: "-5%", icon: TrendingDown, color: "text-red-400" },
        { label: "Budget Goals", value: "4/5", trend: "80%", icon: Target, color: "text-blue-400" },
        { label: "Financial Score", value: "87/100", trend: "+12", icon: Star, color: "text-yellow-400" }
      ];
    }
    
    // Real user metrics
    const savingsTrend = userMetrics.monthlySavings >= 0 ? "+" : "";
    const expensesTrend = userMetrics.expensesTracked > 0 ? "-" : "";
    const budgetPercentage = Math.round((userMetrics.budgetGoals.achieved / userMetrics.budgetGoals.total) * 100);
    
    return [
      { 
        label: "Monthly Savings", 
        value: formatCurrency(userMetrics.monthlySavings), 
        trend: `${savingsTrend}${Math.abs(userMetrics.monthlySavings).toFixed(0)}`, 
        icon: userMetrics.monthlySavings >= 0 ? TrendingUp : TrendingDown, 
        color: userMetrics.monthlySavings >= 0 ? "text-green-400" : "text-red-400" 
      },
      { 
        label: "Expenses Tracked", 
        value: formatCurrency(userMetrics.expensesTracked), 
        trend: `${expensesTrend}${userMetrics.expensesTracked.toFixed(0)}`, 
        icon: TrendingDown, 
        color: "text-red-400" 
      },
      { 
        label: "Budget Goals", 
        value: `${userMetrics.budgetGoals.achieved}/${userMetrics.budgetGoals.total}`, 
        trend: `${budgetPercentage}%`, 
        icon: Target, 
        color: budgetPercentage >= 80 ? "text-green-400" : budgetPercentage >= 60 ? "text-yellow-400" : "text-red-400" 
      },
      { 
        label: "Financial Score", 
        value: `${userMetrics.financialScore}/100`, 
        trend: `+${userMetrics.financialScore}`, 
        icon: Star, 
        color: userMetrics.financialScore >= 80 ? "text-green-400" : userMetrics.financialScore >= 60 ? "text-yellow-400" : "text-red-400" 
      }
    ];
  };

  const displayMetrics = getDisplayMetrics();

  return (
    <div className="flex flex-col min-h-screen bg-space-dark text-white relative overflow-hidden">
      <SpaceBackground />
      <div id="particle-container" className="fixed inset-0 pointer-events-none z-0"></div>
      
      {/* Navigation */}
      <header className="relative z-10 w-full py-4 px-4 md:px-6 lg:px-10 flex justify-between items-center backdrop-blur-sm bg-space-dark/30 border-b border-white/5">
        <div className="flex items-center">
          <div className="relative cosmic-glow">
            <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-space-purple to-space-pink rounded-full flex items-center justify-center animate-cosmic-pulse">
              <PiggyBank className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
            <div className="h-4 w-4 md:h-5 md:w-5 bg-space-pink rounded-full absolute -bottom-1 -right-1 flex items-center justify-center animate-space-glow">
              <DollarSign className="h-2 w-2 md:h-2.5 md:w-2.5 text-white" />
            </div>
          </div>
          <h1 className="text-lg md:text-2xl font-bold ml-2 md:ml-3 nebula-text">
            Budget Savvy
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard">
              <Button className="cosmos-button text-white text-sm md:text-base px-3 md:px-4">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="text-sm md:text-base text-white hover:text-space-purple hover:bg-white/5 px-3 md:px-4">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="cosmos-button text-white text-sm md:text-base px-3 md:px-4">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>
      
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 text-center relative z-10">
        <div className="max-w-4xl mx-auto w-full">
          <div className="mb-2 flex justify-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-space-purple/20 border border-space-purple/30 text-space-purple text-xs md:text-sm">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              <span>Smart Budget Management</span>
            </div>
          </div>
          <h2 className={`text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold mb-4 md:mb-6 nebula-text animate-float-slow ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000 leading-tight`}>
            Navigate Your Financial Universe
          </h2>
          <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-gray-300 max-w-2xl mx-auto animate-twinkle-delay leading-relaxed">
            Budget Savvy helps you track expenses, set financial goals, and reach for the stars with your savings. Take control of your financial journey today.
          </p>
          {!user && (
            <Link to="/register" className="w-full sm:w-auto inline-block">
              <Button className="cosmos-button text-white text-base md:text-lg px-6 md:px-8 py-4 md:py-6 transform hover:scale-105 transition-all duration-300 w-full sm:w-auto group">
                <span className="relative z-10">Start Your Journey</span>
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          )}
          
          {/* Cosmic decorative elements */}
          <div className="relative mt-16 md:mt-20">
            <div className="absolute -top-16 left-1/4 h-1 w-1 bg-space-purple rounded-full animate-twinkle"></div>
            <div className="absolute -top-12 left-1/3 h-1.5 w-1.5 bg-space-pink rounded-full animate-twinkle-delay"></div>
            <div className="absolute -top-20 right-1/4 h-2 w-2 bg-space-purple rounded-full animate-twinkle-delay-2"></div>
            <div className="absolute -top-16 right-1/3 h-1 w-1 bg-space-light rounded-full animate-twinkle"></div>
          </div>
        </div>
      </main>

      {/* Features */}
      <section className="py-12 md:py-16 px-4 md:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-8 md:mb-12 text-center nebula-text">
              Discover the Galaxy of Features
            </h3>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -z-10 w-40 h-40 rounded-full bg-space-purple/5 blur-2xl"></div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                title: "Track Expenses",
                description: "Log and categorize your expenses with ease",
                animation: "animate-twinkle",
                icon: <Star className="h-6 w-6 text-space-purple" />,
              },
              {
                title: "Set Budgets",
                description: "Create monthly budgets and track your progress",
                animation: "animate-twinkle-delay",
                icon: <Star className="h-6 w-6 text-space-pink" />,
              },
              {
                title: "Visualize Data",
                description: "Beautiful charts to understand your spending habits",
                animation: "animate-twinkle-delay-2",
                icon: <Star className="h-6 w-6 text-space-light" />,
              },
              {
                title: "Recurring Expenses",
                description: "Never miss a bill with recurring expense reminders",
                animation: "animate-twinkle",
                icon: <Star className="h-6 w-6 text-space-purple" />,
              },
              {
                title: "Secure & Private",
                description: "Your financial data is encrypted and secure",
                animation: "animate-twinkle-delay",
                icon: <Star className="h-6 w-6 text-space-pink" />,
              },
              {
                title: "Sync Across Devices",
                description: "Access your budget from anywhere, anytime",
                animation: "animate-twinkle-delay-2",
                icon: <Star className="h-6 w-6 text-space-light" />,
              },
            ].map((feature, index) => (
              <div key={index} className="cosmic-card p-4 md:p-6 flex flex-col items-center text-center transform hover:scale-105 transition-all duration-300 group hover:border-space-purple/50">
                <div className={`h-12 w-12 md:h-14 md:w-14 rounded-full bg-space-nebula flex items-center justify-center mb-3 md:mb-4 ${feature.animation} cosmic-glow flex-shrink-0 group-hover:bg-space-purple/20`}>
                  {feature.icon}
                </div>
                <h4 className="text-lg md:text-xl font-semibold mb-2 text-white">{feature.title}</h4>
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Live Financial Dashboard Preview */}
      <section className="py-12 md:py-16 px-4 md:px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-4 nebula-text">
              {user ? "Your Financial Universe" : "Your Financial Universe in Real-Time"}
            </h3>
            <p className="text-gray-300 text-sm md:text-base max-w-2xl mx-auto">
              {user 
                ? "Here's your current financial data transformed into actionable insights" 
                : "See how Budget Savvy transforms your financial data into actionable insights with our live dashboard preview"
              }
            </p>
            {loading && (
              <p className="text-space-purple text-sm mt-2">Loading your financial data...</p>
            )}
          </div>
          
          <div className="cosmic-card p-6 md:p-8 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
              {displayMetrics.map((metric, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-500 cursor-pointer ${
                    activeMetric === index 
                      ? 'bg-space-purple/20 border-space-purple/50 scale-105' 
                      : 'bg-space-nebula/30 border-space-dark/50 hover:border-space-purple/30'
                  }`}
                  onClick={() => setActiveMetric(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    <span className={`text-xs font-medium ${metric.color}`}>
                      {metric.trend}
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mb-1">{metric.label}</p>
                  <p className="text-white text-lg font-bold">{metric.value}</p>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                  <PieChart className="h-8 w-8 text-space-purple animate-pulse" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Interactive Charts</h4>
                    <p className="text-gray-400 text-sm">Visualize your spending patterns</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="h-8 w-8 text-space-pink animate-pulse" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Smart Goals</h4>
                    <p className="text-gray-400 text-sm">AI-powered financial recommendations</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Wallet className="h-8 w-8 text-space-light animate-pulse" />
                  <div>
                    <h4 className="text-lg font-semibold text-white">Budget Tracking</h4>
                    <p className="text-gray-400 text-sm">Real-time expense monitoring</p>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-auto">
                {user ? (
                  <Link to="/dashboard">
                    <Button className="cosmos-button text-white text-lg px-8 py-4 w-full md:w-auto group">
                      <DollarSign className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                ) : (
                  <Link to="/register">
                    <Button className="cosmos-button text-white text-lg px-8 py-4 w-full md:w-auto group">
                      <DollarSign className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                      Try Live Dashboard
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-6 md:py-8 px-4 md:px-6 border-t border-white/10 relative z-10 backdrop-blur-sm bg-space-dark/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm md:text-base text-center md:text-left">
            &copy; 2025 Budget Savvy. All rights reserved.
          </p>
          <div className="flex gap-4 md:gap-6">
            <a href="#" className="text-gray-400 hover:text-space-purple transition-colors duration-300 text-sm md:text-base">
              Terms
            </a>
            <a href="#" className="text-gray-400 hover:text-space-purple transition-colors duration-300 text-sm md:text-base">
              Privacy
            </a>
            <a href="#" className="text-gray-400 hover:text-space-purple transition-colors duration-300 text-sm md:text-base">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
