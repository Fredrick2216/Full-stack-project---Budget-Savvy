
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/components/SupabaseProvider";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, TrendingUp, Calendar, Plus, Edit } from "lucide-react";
import { toast } from "sonner";
import { BudgetForm } from "@/components/BudgetForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Budget {
  id: string;
  user_id: string;
  amount: number;
  period: string;
  created_at: string;
  updated_at: string;
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

const BudgetDashboard = () => {
  const { supabase, user } = useSupabase();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
      
      const channel = supabase
        .channel("budget-dashboard-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "budgets",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            console.log("Budget change detected, refreshing data...");
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
          () => {
            console.log("Expense change detected, refreshing data...");
            fetchData();
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, supabase]);

  const fetchData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const [budgetResponse, expenseResponse] = await Promise.all([
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("expenses")
          .select("*")
          .eq("user_id", user.id)
      ]);

      if (budgetResponse.error) {
        console.error("Budget fetch error:", budgetResponse.error);
        toast.error("Failed to fetch budget data");
      } else {
        setBudgets(budgetResponse.data || []);
      }

      if (expenseResponse.error) {
        console.error("Expense fetch error:", expenseResponse.error);
        toast.error("Failed to fetch expense data");
      } else {
        setExpenses(expenseResponse.data || []);
      }
      
      console.log("Data fetched - Budgets:", budgetResponse.data?.length || 0, "Expenses:", expenseResponse.data?.length || 0);
      
    } catch (error) {
      console.error("Error fetching budget data:", error);
      toast.error("Failed to fetch budget data");
    } finally {
      setLoading(false);
    }
  };

  const handleBudgetSuccess = () => {
    setIsDialogOpen(false);
    fetchData();
  };

  const getBudgetStatus = () => {
    if (!budgets.length) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        percentage: 0,
        status: 'no-data' as const,
        remainingBudget: 0
      };
    }

    const currentBudget = budgets[0];
    const totalBudget = Math.max(0, currentBudget.amount || 0);
    
    const now = new Date();
    let startDate: Date;
    
    switch (currentBudget.period) {
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    const periodExpenses = expenses.filter(expense => {
      if (!expense.date) return false;
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= now;
    });
    
    const totalSpent = periodExpenses.reduce((sum, expense) => {
      const amount = expense.amount || 0;
      return sum + Math.abs(amount);
    }, 0);
    
    const percentage = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
    
    let status: 'within' | 'warning' | 'exceeded' | 'no-data';
    if (percentage <= 75) {
      status = 'within';
    } else if (percentage <= 100) {
      status = 'warning';
    } else {
      status = 'exceeded';
    }
    
    return {
      totalBudget,
      totalSpent,
      percentage,
      status,
      remainingBudget: totalBudget - totalSpent
    };
  };

  const getSmartRecommendations = () => {
    const recommendations = [];
    
    if (!budgets.length) {
      recommendations.push("Start by setting your first budget to track spending effectively.");
      return recommendations;
    }

    const budgetStatus = getBudgetStatus();
    
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      const amount = Math.abs(expense.amount || 0);
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += amount;
    });
    
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (budgetStatus.status === 'exceeded') {
      recommendations.push("Your spending has exceeded the budget. Consider reducing expenses in your top spending categories.");
      if (topCategories.length > 0) {
        const [topCategory, amount] = topCategories[0];
        recommendations.push(`Focus on reducing ${topCategory} expenses (${formatCurrency(amount)} this period).`);
      }
    } else if (budgetStatus.status === 'warning') {
      recommendations.push("You're approaching your budget limit. Monitor spending carefully for the remainder of this period.");
      if (topCategories.length > 0) {
        const [topCategory] = topCategories[0];
        recommendations.push(`Consider limiting ${topCategory} expenses for the rest of this period.`);
      }
    } else if (budgetStatus.status === 'within') {
      recommendations.push("Great job staying within budget! Consider allocating surplus to savings or emergency fund.");
      if (budgetStatus.percentage < 50) {
        recommendations.push("You're using less than 50% of your budget. You might be able to increase savings or investments.");
      }
    }

    return recommendations;
  };

  const budgetStatus = getBudgetStatus();
  const smartRecommendations = getSmartRecommendations();

  const getStatusColor = () => {
    switch (budgetStatus.status) {
      case 'within':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'exceeded':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (budgetStatus.status) {
      case 'within':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'exceeded':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (budgetStatus.status) {
      case 'within':
        return `You're within budget! ${formatCurrency(Math.abs(budgetStatus.remainingBudget))} remaining.`;
      case 'warning':
        return `Approaching budget limit. ${formatCurrency(Math.abs(budgetStatus.remainingBudget))} remaining.`;
      case 'exceeded':
        return `Budget exceeded by ${formatCurrency(Math.abs(budgetStatus.remainingBudget))}!`;
      default:
        return 'Set up a budget to track your spending.';
    }
  };

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Please log in</h2>
            <p className="text-muted-foreground">You need to be logged in to view your budget dashboard.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold nebula-text">Budget Dashboard</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 w-full sm:w-auto">
                {budgets.length > 0 ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {budgets.length > 0 ? "Edit Budget" : "Create Budget"}
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>
                  {budgets.length > 0 ? "Edit Budget" : "Create New Budget"}
                </DialogTitle>
                <DialogDescription>
                  {budgets.length > 0 
                    ? "Update your budget amount and period to better track your spending."
                    : "Set up a budget to track your spending and get smart recommendations."
                  }
                </DialogDescription>
              </DialogHeader>
              <BudgetForm 
                onSuccess={handleBudgetSuccess}
                existingBudget={budgets.length > 0 ? budgets[0] : null}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Budget Status Overview - Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <Card className="cosmic-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <span>Total Budget</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div>
                  <div className="text-xl md:text-2xl font-bold break-words">
                    {formatCurrency(budgetStatus.totalBudget)}
                  </div>
                  {budgets.length > 0 && (
                    <div className="text-sm text-muted-foreground mt-1">
                      {budgets[0].period.charAt(0).toUpperCase() + budgets[0].period.slice(1)} Budget
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-red-500 flex-shrink-0" />
                <span>Total Spent</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="text-xl md:text-2xl font-bold break-words">
                  {formatCurrency(budgetStatus.totalSpent)}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="cosmic-card sm:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                {getStatusIcon()}
                <span>Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <div className="space-y-2">
                  <Badge 
                    variant="outline" 
                    className={`${getStatusColor()} text-white text-xs`}
                  >
                    {budgetStatus.status === 'within' ? 'Within Budget' : 
                     budgetStatus.status === 'warning' ? 'Budget Warning' :
                     budgetStatus.status === 'exceeded' ? 'Budget Exceeded' : 'No Budget Set'}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budget Progress */}
        <Card className="cosmic-card">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Budget Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-sm">
                    <span className="break-words">Spent: {formatCurrency(budgetStatus.totalSpent)}</span>
                    <span className="break-words">Budget: {formatCurrency(budgetStatus.totalBudget)}</span>
                  </div>
                  <Progress 
                    value={budgetStatus.percentage} 
                    className="h-3"
                    indicatorClassName={getStatusColor()}
                  />
                  <div className="text-center text-sm text-muted-foreground">
                    {budgetStatus.percentage.toFixed(1)}% of budget used
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border border-border bg-card/50">
                  <p className="text-center text-sm md:text-base break-words">{getStatusMessage()}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Smart Budget Recommendations */}
        <Card className="cosmic-card">
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Smart Budget Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <div className="space-y-3">
                {smartRecommendations.length > 0 ? (
                  smartRecommendations.map((recommendation, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${
                      budgetStatus.status === 'exceeded' ? 'bg-red-500/10 border-red-500/20' :
                      budgetStatus.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' :
                      budgetStatus.status === 'within' ? 'bg-green-500/10 border-green-500/20' :
                      'bg-blue-500/10 border-blue-500/20'
                    }`}>
                      <p className="text-sm break-words">
                        {budgetStatus.status === 'exceeded' ? '⚠️' :
                         budgetStatus.status === 'warning' ? '🔔' :
                         budgetStatus.status === 'within' ? '✅' : '📊'} 
                        <strong> {index === 0 ? 'Key Insight:' : 'Tip:'}</strong> {recommendation}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg border bg-card/50">
                    <p className="text-sm text-muted-foreground text-center">
                      No recommendations available. Start by creating a budget or adding some expenses.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default BudgetDashboard;
