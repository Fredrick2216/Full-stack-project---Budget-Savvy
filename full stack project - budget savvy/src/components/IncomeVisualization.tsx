import React, { useState, useEffect } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Income {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  description: string | null;
  date: string;
  created_at: string;
}

interface MonthlyData {
  month: string;
  amount: number;
  forecast?: boolean;
}

export function IncomeVisualization() {
  const { supabase, user } = useSupabase();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastMonths, setForecastMonths] = useState(3);

  useEffect(() => {
    fetchIncomes();
    
    // Set up real-time listener for income table changes
    if (user) {
      const channel = supabase
        .channel("income-visualization-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "incomes",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Income visualization update:", payload);
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

      if (error) {
        throw error;
      }

      if (data) {
        setIncomes(data);
        console.log("Income visualization data fetched:", data.length, "records");
      }
    } catch (error) {
      console.error("Error fetching incomes for visualization:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const getSourceData = () => {
    const sourceMap: Record<string, number> = {};
    
    incomes.forEach(income => {
      if (!sourceMap[income.source]) {
        sourceMap[income.source] = 0;
      }
      sourceMap[income.source] += income.amount;
    });
    
    return Object.entries(sourceMap).map(([name, value]) => ({
      name,
      value
    }));
  };
  
  const getMonthlyData = () => {
    const monthlyMap: Record<string, number> = {};
    
    const sortedIncomes = [...incomes].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    sortedIncomes.forEach(income => {
      const date = new Date(income.date);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyMap[monthYear]) {
        monthlyMap[monthYear] = 0;
      }
      monthlyMap[monthYear] += income.amount;
    });
    
    const monthlyData: MonthlyData[] = Object.entries(monthlyMap).map(([month, amount]) => ({
      month,
      amount
    }));
    
    if (monthlyData.length >= 2) {
      let totalGrowth = 0;
      for (let i = 1; i < monthlyData.length; i++) {
        const prevAmount = monthlyData[i-1].amount;
        const currentAmount = monthlyData[i].amount;
        if (prevAmount > 0) {
          totalGrowth += (currentAmount - prevAmount) / prevAmount;
        }
      }
      const avgGrowth = totalGrowth / (monthlyData.length - 1) || 0;
      
      const lastMonth = monthlyData[monthlyData.length - 1];
      const [lastMonthNum, lastYear] = lastMonth.month.split('/').map(Number);
      let currentAmount = lastMonth.amount;
      
      for (let i = 1; i <= forecastMonths; i++) {
        let newMonth = lastMonthNum + i;
        let newYear = lastYear;
        
        if (newMonth > 12) {
          newMonth = newMonth - 12;
          newYear++;
        }
        
        currentAmount = currentAmount * (1 + avgGrowth);
        
        monthlyData.push({
          month: `${newMonth}/${newYear}`,
          amount: currentAmount,
          forecast: true
        });
      }
    }
    
    return monthlyData;
  };
  
  const sourceData = getSourceData();
  const monthlyData = getMonthlyData();
  
  const totalIncome = incomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold nebula-text">Income Analysis</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForecastMonths(3)}
            className={forecastMonths === 3 ? "bg-primary text-primary-foreground" : ""}
          >
            3 Months
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForecastMonths(6)}
            className={forecastMonths === 6 ? "bg-primary text-primary-foreground" : ""}
          >
            6 Months
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setForecastMonths(12)}
            className={forecastMonths === 12 ? "bg-primary text-primary-foreground" : ""}
          >
            12 Months
          </Button>
        </div>
      </div>

      <Card className="cosmic-card">
        <CardHeader>
          <CardTitle>Total Income: {formatCurrency(totalIncome)}</CardTitle>
        </CardHeader>
        <CardContent>
          {incomes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No income data available. Add some income entries to see visualizations.
            </p>
          ) : (
            <Tabs defaultValue="forecast" className="w-full">
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="forecast">Income Forecast</TabsTrigger>
                <TabsTrigger value="sources">Income Sources</TabsTrigger>
              </TabsList>
              
              <TabsContent value="forecast" className="mt-0">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), "Amount"]}
                      />
                      <Legend />
                      <ReferenceLine x={monthlyData.findIndex(d => 'forecast' in d)} 
                                    stroke="red" 
                                    strokeDasharray="3 3" 
                                    label="Forecast Start" />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke="#8884d8" 
                        strokeWidth={2} 
                        dot={{ strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Forecast based on your historical income trends (showing next {forecastMonths} months)
                </p>
              </TabsContent>
              
              <TabsContent value="sources" className="mt-0">
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sourceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [formatCurrency(value), "Amount"]}
                      />
                      <Legend />
                      <Bar dataKey="value" fill="#82ca9d" name="Amount" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
