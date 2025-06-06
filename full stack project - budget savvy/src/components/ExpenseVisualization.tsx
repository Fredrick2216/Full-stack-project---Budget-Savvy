
import React, { useState, useEffect } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Expense } from "@/types/expenses";
import { FilterButtons } from "./charts/FilterButtons";
import { CategoryPieChart } from "./charts/CategoryPieChart";
import { MonthlyTrendChart } from "./charts/MonthlyTrendChart";
import { RadarChartComponent } from "./charts/RadarChart";
import { TreemapChart } from "./charts/TreemapChart";
import { DailyLineChart } from "./charts/DailyLineChart";
import {
  getCategoryData,
  getDailyData,
  getMonthlyData,
  getRadarData,
  getTreemapData,
} from "@/utils/expenseUtils";

export function ExpenseVisualization() {
  const { supabase, user } = useSupabase();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "week", "month", "year"
  const [activeCurrency, setActiveCurrency] = useState("USD");
  const [activeChart, setActiveChart] = useState("category");

  useEffect(() => {
    fetchExpenses();
    // Set up real-time listener for expense table changes
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "expenses",
          filter: user ? `user_id=eq.${user.id}` : undefined,
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

      if (error) {
        throw error;
      }

      if (data) {
        setExpenses(data);
        // Set default active currency from first expense if available
        if (data.length > 0) {
          setActiveCurrency(data[0].currency);
        }
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  };

  const categoryData = getCategoryData(expenses, activeFilter, activeCurrency);
  const monthlyData = getMonthlyData(expenses, activeFilter, activeCurrency);
  const dailyData = getDailyData(expenses, activeFilter, activeCurrency);
  const radarData = getRadarData(expenses, activeFilter, activeCurrency);
  const treemapData = getTreemapData(expenses, activeFilter, activeCurrency);

  // Calculate total expenses
  const totalExpenses = categoryData.reduce(
    (sum, item) => sum + item.value,
    0
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold nebula-text">Expense Analysis</h2>
        <FilterButtons 
          activeFilter={activeFilter} 
          setActiveFilter={setActiveFilter} 
        />
      </div>

      <Card className="cosmic-card">
        <CardHeader>
          <CardTitle>Total Expenses: {formatCurrency(totalExpenses)}</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No expense data available. Add some expenses to see visualizations.
            </p>
          ) : (
            <Tabs defaultValue="category" onValueChange={setActiveChart} className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="category">Category</TabsTrigger>
                <TabsTrigger value="trend">Trends</TabsTrigger>
                <TabsTrigger value="radar">Radar</TabsTrigger>
                <TabsTrigger value="treemap">Treemap</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
              </TabsList>
              
              <TabsContent value="category" className="mt-0">
                <CategoryPieChart data={categoryData} />
              </TabsContent>
              
              <TabsContent value="trend" className="mt-0">
                <MonthlyTrendChart data={monthlyData} />
              </TabsContent>
              
              <TabsContent value="radar" className="mt-0">
                <RadarChartComponent data={radarData} />
              </TabsContent>
              
              <TabsContent value="treemap" className="mt-0">
                <TreemapChart data={treemapData} />
              </TabsContent>
              
              <TabsContent value="daily" className="mt-0">
                <DailyLineChart data={dailyData} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
