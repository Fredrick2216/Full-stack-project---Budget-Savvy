import React, { useState, useEffect } from "react";
import { useSupabase } from "@/components/SupabaseProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

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

interface CalendarEntry {
  date: Date;
  type: "income" | "expense";
  amount: number;
  source: string;
  description?: string;
}

export function FinancialCalendar() {
  const { supabase, user } = useSupabase();
  const [loading, setLoading] = useState(true);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [selectedDateEntries, setSelectedDateEntries] = useState<CalendarEntry[]>([]);
  
  useEffect(() => {
    fetchData();
    
    // Set up real-time listeners for both incomes and expenses
    if (user) {
      const channel = supabase
        .channel("financial-calendar-changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "incomes",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Calendar income change:", payload);
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
            console.log("Calendar expense change:", payload);
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
        .eq("user_id", user.id);
        
      if (incomeError) throw incomeError;
      
      // Fetch expenses
      const { data: expenseData, error: expenseError } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id);
        
      if (expenseError) throw expenseError;
      
      // Process income data for calendar
      const incomeEntries: CalendarEntry[] = (incomeData || []).map(income => ({
        date: new Date(income.date),
        type: "income",
        amount: income.amount,
        source: income.source,
        description: income.description || undefined
      }));
      
      // Process expense data for calendar
      const expenseEntries: CalendarEntry[] = (expenseData || []).map(expense => ({
        date: new Date(expense.date),
        type: "expense",
        amount: Math.abs(expense.amount),
        source: expense.category,
        description: expense.description || undefined
      }));
      
      const allEntries = [...incomeEntries, ...expenseEntries];
      setCalendarEntries(allEntries);
      updateSelectedDateEntries(selected, allEntries);
      
      console.log("Calendar data fetched - Total entries:", allEntries.length);
      
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to update selected date entries
  const updateSelectedDateEntries = (date: Date | undefined, entries: CalendarEntry[]) => {
    if (!date) {
      setSelectedDateEntries([]);
      return;
    }
    
    // Filter entries for the selected date
    const formattedDate = format(date, "yyyy-MM-dd");
    const matchingEntries = entries.filter(entry => 
      format(entry.date, "yyyy-MM-dd") === formattedDate
    );
    
    setSelectedDateEntries(matchingEntries);
  };
  
  // Handle date selection
  const handleSelect = (date: Date | undefined) => {
    setSelected(date);
    updateSelectedDateEntries(date, calendarEntries);
  };
  
  // Helper function to format a date to display in the component
  const formatDisplayDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "MMMM d, yyyy");
  };
  
  // Function to get dates that have entries for calendar highlighting
  const getDaysWithEntries = () => {
    const days = new Map<string, Date>();
    
    calendarEntries.forEach(entry => {
      const dateKey = format(entry.date, "yyyy-MM-dd");
      days.set(dateKey, entry.date);
    });
    
    return Array.from(days.values());
  };
  
  // Function to render badges on calendar
  const renderCalendarDay = (day: Date): React.ReactNode => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayEntries = calendarEntries.filter(entry => 
      format(entry.date, "yyyy-MM-dd") === dateKey
    );
    
    if (dayEntries.length > 0) {
      const totalIncome = dayEntries
        .filter(entry => entry.type === "income")
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      const totalExpenses = dayEntries
        .filter(entry => entry.type === "expense")
        .reduce((sum, entry) => sum + entry.amount, 0);
      
      const netAmount = totalIncome - totalExpenses;
      
      return (
        <div className="flex flex-col items-center w-full">
          <div>{day.getDate()}</div>
          <Badge 
            variant="outline" 
            className={`mt-0.5 text-[10px] truncate max-w-full ${
              netAmount >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}
          >
            {netAmount >= 0 ? '+' : ''}{formatCurrency(netAmount)}
          </Badge>
        </div>
      );
    }
    
    return day.getDate();
  };

  return (
    <Card className="cosmic-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          <span>Financial Calendar</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-4">
            <div className="md:col-span-3 space-y-4">
              <Calendar
                mode="single"
                selected={selected}
                onSelect={handleSelect}
                className="rounded-md border"
                highlightedDays={getDaysWithEntries()}
                renderDay={renderCalendarDay}
              />
              
              <p className="text-sm text-center text-muted-foreground">
                Dates with financial activity show net amounts (income - expenses)
              </p>
            </div>
            
            <div className="md:col-span-2">
              <div className="border rounded-md p-4 h-full">
                <h3 className="font-medium mb-2">
                  {selected ? formatDisplayDate(selected) : "Select a date"}
                </h3>
                
                {selectedDateEntries.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEntries.map((entry, index) => (
                      <div key={index} className="bg-card/50 p-2 rounded-md border border-border">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">{entry.source}</span>
                          <Badge 
                            variant="outline" 
                            className={`${
                              entry.type === 'income' 
                                ? 'bg-green-500/20 text-green-500' 
                                : 'bg-red-500/20 text-red-500'
                            }`}
                          >
                            {entry.type === 'income' ? '+' : '-'}{formatCurrency(entry.amount)}
                          </Badge>
                        </div>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground mt-1">{entry.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground capitalize">{entry.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {selected 
                      ? "No financial entries for this date." 
                      : "Select a date to view financial details."}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
