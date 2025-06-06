import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { IncomeForm } from "@/components/IncomeForm";
import { IncomeVisualization } from "@/components/IncomeVisualization";
import { IncomeAnalysisDialog } from "@/components/IncomeAnalysisDialog";
import { IncomeHealthScoreCard } from "@/components/IncomeHealthScoreCard";
import { FinancialCalendar } from "@/components/FinancialCalendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabase } from "@/components/SupabaseProvider";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, TrendingUp, Calendar, ArrowUpNarrowWide, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Define types
interface Income {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  created_at: string;
}

const IncomeDashboard = () => {
  const { supabase, user } = useSupabase();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalIncome, setTotalIncome] = useState(0);
  const [recentActivity, setRecentActivity] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchIncomes();
    
    // Set up real-time listener for income table changes
    if (user) {
      const channel = supabase
        .channel("schema-db-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "incomes",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Refresh incomes when there's a change
            fetchIncomes();
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchIncomes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("incomes")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      if (data) {
        setIncomes(data);
        // Calculate total
        const total = data.reduce((sum, income) => sum + income.amount, 0);
        setTotalIncome(total);
        
        // Calculate recent activity (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentTotal = data
          .filter(income => new Date(income.date) >= oneWeekAgo)
          .reduce((sum, income) => sum + income.amount, 0);
        setRecentActivity(recentTotal);
      }
    } catch (error) {
      console.error("Error fetching incomes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncomeAdded = () => {
    fetchIncomes();
  };

  const handleDeleteIncome = async (id: string) => {
    if (!user) return;

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from("incomes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Income deleted successfully");
      fetchIncomes();
    } catch (error: any) {
      console.error("Error deleting income:", error);
      toast.error(`Failed to delete income: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get unique sources from incomes
  const getUniqueSources = () => {
    const sources = new Set<string>();
    incomes.forEach(income => sources.add(income.source));
    return sources.size;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
          <h1 className="text-2xl sm:text-3xl font-bold nebula-text">Income Dashboard</h1>
          <IncomeAnalysisDialog />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="cosmic-card">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span>Total Income</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {loading ? (
                <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
              ) : (
                <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalIncome)}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                <span>Last 7 Days</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {loading ? (
                <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
              ) : (
                <div className="text-lg sm:text-2xl font-bold">{formatCurrency(recentActivity)}</div>
              )}
            </CardContent>
          </Card>

          <Card className="cosmic-card">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                <ArrowUpNarrowWide className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span>Sources</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {loading ? (
                <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
              ) : (
                <div className="text-lg sm:text-2xl font-bold">{getUniqueSources()}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="cosmic-card">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                <span>Recent Activity</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {loading ? (
                <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
              ) : (
                <div className="text-base sm:text-xl">
                  {incomes.length} income entries
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Health Score and Income Form Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <IncomeHealthScoreCard />
          <div>
            <IncomeForm onSuccess={handleIncomeAdded} />
          </div>
        </div>
        
        {/* Financial Calendar Row */}
        <div className="grid grid-cols-1">
          <FinancialCalendar />
        </div>

        {/* Visualization Row */}
        <div className="grid grid-cols-1">
          <IncomeVisualization />
        </div>

        <Card className="cosmic-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Recent Income</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {loading ? (
              <Skeleton className="h-48 sm:h-64 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption className="text-xs sm:text-sm">A list of your recent income.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-white text-xs sm:text-sm">Source</TableHead>
                      <TableHead className="text-white text-xs sm:text-sm hidden sm:table-cell">Description</TableHead>
                      <TableHead className="text-right text-white text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="text-right text-white text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incomes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs sm:text-sm">
                          No income recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      incomes.slice(0, 5).map((income) => (
                        <TableRow key={income.id}>
                          <TableCell className="text-xs sm:text-sm">{formatDate(income.date)}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{income.source}</TableCell>
                          <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{income.description || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-xs sm:text-sm">
                            ${income.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteIncome(income.id)}
                              disabled={deletingId === income.id}
                              className="h-6 w-6 sm:h-8 sm:w-8"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                              <span className="sr-only">Delete income</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default IncomeDashboard;
