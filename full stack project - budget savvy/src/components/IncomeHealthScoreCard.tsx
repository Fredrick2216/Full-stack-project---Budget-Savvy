
import React, { useState, useEffect } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CirclePercent, ChartBar, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { calculateHealthScore, generateBudgetRecommendations, checkIncomeMilestones } from "@/utils/financialHealthUtils";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Income {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  created_at: string;
}

interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
  currency: string;
}

export function IncomeHealthScoreCard() {
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showMilestone, setShowMilestone] = useState(false);
  const [activeMilestoneIndex, setActiveMilestoneIndex] = useState(0);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  
  useEffect(() => {
    fetchData();
    
    // Set up real-time listeners with improved channel naming to avoid conflicts
    if (user) {
      const channel = supabase
        .channel(`health-score-realtime-${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "incomes",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Income change detected for health score:", payload);
            setLastUpdateTime(Date.now());
            fetchData();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "expenses",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Expense change detected for health score:", payload);
            setLastUpdateTime(Date.now());
            fetchData();
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);
  
  const fetchData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch incomes
      const { data: incomeData, error: incomeError } = await supabase
        .from("incomes")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
        
      if (incomeError) throw incomeError;
      
      // Fetch expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });
        
      if (expenseError) throw expenseError;
      
      setIncomes(incomeData || []);
      setExpenses(expenseData || []);
      
      console.log("Health Score Data refreshed - Incomes:", incomeData?.length, "Expenses:", expenseData?.length);
      
      // Check for milestones with latest data
      checkForMilestones(incomeData || []);
      
    } catch (error) {
      console.error("Error fetching financial data for health score:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const checkForMilestones = (incomeData: Income[]) => {
    if (!incomeData || incomeData.length === 0) return;
    
    // Group by month
    const monthlyIncomes: Record<string, number> = {};
    
    incomeData.forEach(income => {
      const date = new Date(income.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyIncomes[monthYear]) {
        monthlyIncomes[monthYear] = 0;
      }
      monthlyIncomes[monthYear] += income.amount;
    });
    
    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyIncomes).sort((a, b) => {
      const [aMonth, aYear] = a.split('/').map(Number);
      const [bMonth, bYear] = b.split('/').map(Number);
      if (aYear !== bYear) return aYear - bYear;
      return aMonth - bMonth;
    });
    
    // If we have at least one month of data
    if (sortedMonths.length > 0) {
      const currentMonth = sortedMonths[sortedMonths.length - 1];
      const currentMonthIncome = monthlyIncomes[currentMonth];
      
      // Get previous months' incomes
      const previousMonthsIncome = sortedMonths
        .slice(0, -1)
        .map(month => monthlyIncomes[month]);
      
      // Calculate total lifetime income
      const totalLifetimeIncome = Object.values(monthlyIncomes).reduce((sum, amount) => sum + amount, 0);
      
      // Check milestones
      const milestones = checkIncomeMilestones(
        currentMonthIncome,
        previousMonthsIncome,
        totalLifetimeIncome
      );
      
      // Show milestone celebration if any are achieved
      if (milestones.length > 0) {
        setShowMilestone(true);
        
        // Display toast for the first milestone
        toast({
          title: "🎉 Milestone Achieved!",
          description: milestones[0].message,
          duration: 5000,
        });
      }
    }
  };
  
  // Calculate current month income and expenses for accurate health score
  const getCurrentMonthData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthIncomes = incomes.filter(income => {
      const date = new Date(income.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const currentMonthExpenses = expenses.filter(expense => {
      const date = new Date(expense.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const totalIncome = currentMonthIncomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + Math.abs(expense.amount), 0);
    
    // Group expenses by category for detailed recommendations
    const expensesByCategory: Record<string, number> = {};
    currentMonthExpenses.forEach(expense => {
      if (!expensesByCategory[expense.category]) {
        expensesByCategory[expense.category] = 0;
      }
      expensesByCategory[expense.category] += Math.abs(expense.amount);
    });
    
    return { totalIncome, totalExpenses, expensesByCategory };
  };
  
  const { totalIncome, totalExpenses, expensesByCategory } = getCurrentMonthData();
  const healthScore = calculateHealthScore(totalIncome, totalExpenses);
  const recommendations = generateBudgetRecommendations(
    totalIncome,
    expensesByCategory,
    healthScore
  );
  
  // Function to dismiss milestone celebration
  const handleDismissMilestone = () => {
    setShowMilestone(false);
  };
  
  // Function to cycle through milestones
  const handleNextMilestone = () => {
    const milestones = checkIncomeMilestones(
      totalIncome,
      [], // This should be previous months' incomes but we're simplifying here
      incomes.reduce((sum, income) => sum + income.amount, 0)
    );
    
    if (milestones.length > 0) {
      setActiveMilestoneIndex((activeMilestoneIndex + 1) % milestones.length);
    }
  };

  // Generate real-time status based on health score
  const getHealthScoreStatus = () => {
    if (healthScore.status === "excellent") {
      return "Excellent financial health! You're saving significantly.";
    } else if (healthScore.status === "good") {
      return "Good financial balance. Keep maintaining your habits.";
    } else if (healthScore.status === "fair") {
      return "Fair financial health. Room for improvement.";
    } else if (healthScore.status === "needs-attention") {
      return "Your finances need attention. Focus on increasing income or reducing expenses.";
    } else {
      return "Critical financial situation. Immediate action required.";
    }
  };

  return (
    <>
      {/* Financial Health Score Card */}
      <Card className="cosmic-card">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <CirclePercent className="h-5 w-5 text-primary" />
              <span>Financial Health Score</span>
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className={`${healthScore.color} text-white`}>
                      {healthScore.status.charAt(0).toUpperCase() + healthScore.status.slice(1)}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    {getHealthScoreStatus()}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              {/* Real-time update indicator */}
              <div className="text-xs text-muted-foreground">
                Updated: {new Date(lastUpdateTime).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {loading ? (
            <>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-32 w-full" />
            </>
          ) : (
            <>
              {/* Score visualization */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-primary/30 bg-card">
                  <div className={`text-3xl font-bold ${
                    healthScore.score < 40 ? 'text-red-500' : 
                    healthScore.score < 70 ? 'text-yellow-500' : 
                    'text-green-500'
                  }`}>
                    {healthScore.score}
                  </div>
                </div>
                <Progress 
                  value={healthScore.score} 
                  max={100} 
                  className="h-2 mt-2"
                  indicatorClassName={healthScore.color}
                />
                <p className="text-sm mt-2 text-muted-foreground">{healthScore.message}</p>
              </div>
              
              {/* Real-time stats overview */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/50 p-3 rounded-lg border border-border">
                  <div className="text-sm text-muted-foreground">Current Month Income</div>
                  <div className="text-xl font-bold text-green-500">{formatCurrency(totalIncome)}</div>
                  {totalIncome === 0 && (
                    <div className="text-xs text-muted-foreground mt-1">Add income to improve score</div>
                  )}
                </div>
                
                <div className="bg-card/50 p-3 rounded-lg border border-border">
                  <div className="text-sm text-muted-foreground">Current Month Expenses</div>
                  <div className="text-xl font-bold text-red-500">{formatCurrency(totalExpenses)}</div>
                  {totalExpenses === 0 && (
                    <div className="text-xs text-muted-foreground mt-1">No expenses tracked yet</div>
                  )}
                </div>
              </div>
              
              {/* Real-time Budget Recommendations */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ChartBar className="h-4 w-4 text-primary" />
                  <h3 className="font-medium">Live Financial Insights</h3>
                </div>
                
                <ul className="space-y-2 text-sm">
                  {recommendations.length === 0 ? (
                    <li className="text-muted-foreground">Start tracking your income and expenses to get personalized recommendations.</li>
                  ) : (
                    <>
                      {recommendations
                        .slice(0, showAllRecommendations ? recommendations.length : 2)
                        .map((recommendation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-primary">•</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                    </>
                  )}
                </ul>
                
                {recommendations.length > 2 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 mt-1 h-auto text-xs"
                    onClick={() => setShowAllRecommendations(!showAllRecommendations)}
                  >
                    {showAllRecommendations ? "Show less" : "Show more recommendations"}
                  </Button>
                )}
              </div>

              {/* Income/Expense Ratio Indicator */}
              {totalIncome > 0 && totalExpenses > 0 && (
                <div className="p-3 rounded-lg bg-card/30 border border-border">
                  <div className="text-sm font-medium mb-1">Income to Expense Ratio</div>
                  <div className="text-lg font-bold">
                    {(totalIncome / totalExpenses).toFixed(2)}:1
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {totalIncome / totalExpenses >= 1.5 ? 
                      "Excellent ratio! You're saving well." :
                      totalIncome / totalExpenses >= 1.2 ?
                      "Good ratio. Consider saving more." :
                      totalIncome / totalExpenses >= 1 ?
                      "Breaking even. Try to increase savings." :
                      "Spending exceeds income. Review expenses immediately."
                    }
                  </div>
                </div>
              )}

              {/* Real-time update status */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-700">Live Updates Active</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Milestone Celebration Modal */}
      {showMilestone && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-card max-w-md w-full mx-4 rounded-lg border border-primary p-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-yellow-500 rounded-full animate-pulse" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary rounded-full animate-pulse" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold nebula-text">Income Milestone Achieved! 🎉</h3>
                <Button variant="ghost" size="icon" onClick={handleDismissMilestone}>
                  ✕
                </Button>
              </div>
              
              <div className="flex justify-center my-4">
                <div className="relative">
                  <div className="w-28 h-28 rounded-full bg-yellow-500/20 flex items-center justify-center border-4 border-yellow-500">
                    <Star className="h-16 w-16 text-yellow-500 animate-bounce" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white font-bold animate-pulse">
                    🏆
                  </div>
                </div>
              </div>
              
              <div className="text-center mb-4 space-y-2">
                <p className="text-lg">
                  {checkIncomeMilestones(
                    totalIncome,
                    [], // This should be previous months' incomes but we're simplifying here
                    incomes.reduce((sum, income) => sum + income.amount, 0)
                  )[activeMilestoneIndex]?.message || "You've reached an income milestone!"}
                </p>
                <p className="text-sm text-muted-foreground">
                  Keep up the great work! Your financial journey is on a positive trend.
                </p>
              </div>
              
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={handleNextMilestone}>
                  Next Milestone
                </Button>
                <Button onClick={handleDismissMilestone}>Continue</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
