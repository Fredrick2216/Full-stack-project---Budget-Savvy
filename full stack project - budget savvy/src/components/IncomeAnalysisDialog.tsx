
import React, { useState } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChartLine, Calendar, ArrowUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

interface Income {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  created_at: string;
}

interface AnalysisCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  value: string | number;
  color: string;
}

const AnalysisCard = ({ title, icon, description, value, color }: AnalysisCardProps) => (
  <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card/30 hover:bg-card/50 transition-all">
    <div className="flex justify-between items-center">
      <h3 className="font-medium text-sm">{title}</h3>
      <div className={`p-2 rounded-full ${color}`}>{icon}</div>
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{description}</p>
  </div>
);

export function IncomeAnalysisDialog() {
  const { supabase, user } = useSupabase();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchIncomeData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("incomes")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });

      if (error) {
        throw error;
      }

      setIncomes(data || []);
    } catch (error) {
      console.error("Error fetching incomes:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateInsights = () => {
    // Empty insights for empty incomes
    if (!incomes.length) {
      return {
        totalIncome: 0,
        avgMonthlyIncome: 0,
        mostProfitableSource: "None",
        mostProfitableAmount: 0,
        growthRate: 0,
        suggestion: "Start tracking your income to get personalized insights."
      };
    }

    // Calculate total income
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    
    // Group by source to find most profitable
    const sourceMap: Record<string, number> = {};
    incomes.forEach(income => {
      if (!sourceMap[income.source]) sourceMap[income.source] = 0;
      sourceMap[income.source] += income.amount;
    });
    
    // Find most profitable source
    let mostProfitableSource = "None";
    let mostProfitableAmount = 0;
    Object.entries(sourceMap).forEach(([source, amount]) => {
      if (amount > mostProfitableAmount) {
        mostProfitableAmount = amount;
        mostProfitableSource = source;
      }
    });
    
    // Group by month to calculate monthly averages and growth
    const monthlyMap: Record<string, number> = {};
    incomes.forEach(income => {
      const date = new Date(income.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!monthlyMap[monthYear]) monthlyMap[monthYear] = 0;
      monthlyMap[monthYear] += income.amount;
    });
    
    // Create monthly data array sorted by date
    const monthlyData = Object.entries(monthlyMap)
      .map(([monthYear, amount]) => {
        const [month, year] = monthYear.split('/').map(Number);
        return { monthYear, month, year, amount };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
    
    // Calculate average monthly income
    const avgMonthlyIncome = totalIncome / monthlyData.length;
    
    // Calculate growth rate if we have at least 2 months of data
    let growthRate = 0;
    if (monthlyData.length >= 2) {
      // Use last 3 months if available, otherwise use what we have
      const recentMonths = monthlyData.slice(-Math.min(3, monthlyData.length));
      if (recentMonths.length >= 2) {
        const firstAmount = recentMonths[0].amount;
        const lastAmount = recentMonths[recentMonths.length - 1].amount;
        if (firstAmount > 0) {
          growthRate = ((lastAmount - firstAmount) / firstAmount) * 100;
        }
      }
    }

    // Generate personalized suggestion
    let suggestion = "";
    if (growthRate < 0) {
      suggestion = `Your income from ${mostProfitableSource} is your highest earning source. Consider focusing on increasing revenue from this area to offset recent declines.`;
    } else if (growthRate > 15) {
      suggestion = `Great job growing your income! Your ${mostProfitableSource} source is performing well. Consider diversifying to protect your growth.`;
    } else {
      suggestion = `Your ${mostProfitableSource} source generates the most income. Look for ways to increase revenue from this source or diversify your income streams.`;
    }
    
    return {
      totalIncome,
      avgMonthlyIncome,
      mostProfitableSource,
      mostProfitableAmount,
      growthRate,
      suggestion
    };
  };

  const insights = calculateInsights();
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        fetchIncomeData();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ChartLine className="h-4 w-4" />
          <span>AI Income Analysis</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle className="nebula-text">Income Analysis Assistant</DialogTitle>
          <DialogDescription>
            AI-powered analysis and insights based on your income data.
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <AnalysisCard
                title="Monthly Average"
                icon={<Calendar className="h-5 w-5 text-white" />}
                description="Your average monthly income"
                value={formatCurrency(insights.avgMonthlyIncome)}
                color="bg-blue-500/20"
              />
              
              <AnalysisCard
                title="Top Income Source"
                icon={<ArrowUp className="h-5 w-5 text-white" />}
                description={`Total from ${insights.mostProfitableSource}`}
                value={formatCurrency(insights.mostProfitableAmount)}
                color="bg-green-500/20"
              />
              
              <AnalysisCard
                title="Recent Growth"
                icon={<ChartLine className="h-5 w-5 text-white" />}
                description="Based on your last few months"
                value={`${insights.growthRate.toFixed(1)}%`}
                color={`${insights.growthRate >= 0 ? "bg-green-500/20" : "bg-red-500/20"}`}
              />
              
              <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card/30 col-span-1 md:col-span-2">
                <h3 className="font-medium">Personalized Insight</h3>
                <p className="text-sm">{insights.suggestion}</p>
              </div>
            </div>
            
            <DialogFooter>
              <p className="text-xs text-muted-foreground mr-auto">
                Analysis based on {incomes.length} income entries
              </p>
              <Button onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
