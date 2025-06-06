import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ExpenseVisualization } from "@/components/ExpenseVisualization";
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
import { DollarSign, TrendingDown, Calendar, ArrowDownWideNarrow, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Define types
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

const ExpenseDashboard = () => {
  const { supabase, user } = useSupabase();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [recentActivity, setRecentActivity] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
    
    // Set up real-time listener for expense table changes
    if (user) {
      const channel = supabase
        .channel("schema-db-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "expenses",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Refresh expenses when there's a change
            fetchExpenses();
          }
        )
        .subscribe();
  
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchExpenses = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;

      if (data) {
        setExpenses(data);
        // Calculate total (expenses are stored as negative values)
        const total = data.reduce((sum, expense) => sum + Math.abs(expense.amount), 0);
        setTotalExpenses(total);
        
        // Calculate recent activity (last 7 days)
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const recentTotal = data
          .filter(expense => new Date(expense.date) >= oneWeekAgo)
          .reduce((sum, expense) => sum + Math.abs(expense.amount), 0);
        setRecentActivity(recentTotal);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseAdded = () => {
    fetchExpenses();
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;

    try {
      setDeletingId(id);
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Expense deleted successfully");
      fetchExpenses();
    } catch (error: any) {
      console.error("Error deleting expense:", error);
      toast.error(`Failed to delete expense: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Format date to a more readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Get unique categories from expenses
  const getUniqueCategories = () => {
    const categories = new Set<string>();
    expenses.forEach(expense => categories.add(expense.category));
    return categories.size;
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl sm:text-3xl font-bold nebula-text">Expense Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="cosmic-card">
            <CardHeader className="pb-2 p-3 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-xs sm:text-sm font-medium">
                <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                <span>Total Expenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {loading ? (
                <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
              ) : (
                <div className="text-lg sm:text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
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
                <ArrowDownWideNarrow className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                <span>Categories</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0">
              {loading ? (
                <Skeleton className="h-6 sm:h-8 w-24 sm:w-32" />
              ) : (
                <div className="text-lg sm:text-2xl font-bold">{getUniqueCategories()}</div>
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
                  {expenses.length} expense entries
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          <div>
            <ExpenseForm onSuccess={handleExpenseAdded} />
          </div>
          <div>
            <ExpenseVisualization />
          </div>
        </div>

        <Card className="cosmic-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Recent Expenses</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {loading ? (
              <Skeleton className="h-48 sm:h-64 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableCaption className="text-xs sm:text-sm">A list of your recent expenses.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-white text-xs sm:text-sm">Category</TableHead>
                      <TableHead className="text-white text-xs sm:text-sm hidden sm:table-cell">Description</TableHead>
                      <TableHead className="text-right text-white text-xs sm:text-sm">Amount</TableHead>
                      <TableHead className="text-right text-white text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs sm:text-sm">
                          No expenses recorded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      expenses.slice(0, 5).map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="text-xs sm:text-sm">{formatDate(expense.date)}</TableCell>
                          <TableCell className="text-xs sm:text-sm">{expense.category}</TableCell>
                          <TableCell className="text-xs sm:text-sm hidden sm:table-cell">{expense.description || "-"}</TableCell>
                          <TableCell className="text-right font-mono text-xs sm:text-sm">
                            {expense.currency} {Math.abs(expense.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteExpense(expense.id)}
                              disabled={deletingId === expense.id}
                              className="h-6 w-6 sm:h-8 sm:w-8"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                              <span className="sr-only">Delete expense</span>
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

export default ExpenseDashboard;
