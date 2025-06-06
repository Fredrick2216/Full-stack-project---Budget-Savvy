
import { Expense, ExpenseSummary } from "@/types/expenses";

// Filter expenses based on time range
export const getFilteredExpenses = (
  expenses: Expense[], 
  activeFilter: string
): Expense[] => {
  if (activeFilter === "all") return expenses;

  const now = new Date();
  let filterDate = new Date();

  if (activeFilter === "week") {
    filterDate.setDate(now.getDate() - 7);
  } else if (activeFilter === "month") {
    filterDate.setMonth(now.getMonth() - 1);
  } else if (activeFilter === "year") {
    filterDate.setFullYear(now.getFullYear() - 1);
  }

  return expenses.filter(
    (expense) => new Date(expense.date) >= filterDate
  );
};

// Process data for category chart
export const getCategoryData = (
  expenses: Expense[], 
  activeFilter: string,
  activeCurrency: string
): ExpenseSummary[] => {
  const filteredExpenses = getFilteredExpenses(expenses, activeFilter);
  const categoryMap = new Map<string, number>();

  filteredExpenses.forEach((expense) => {
    // Expenses are stored as negative numbers
    const absAmount = Math.abs(expense.amount);
    const currentAmount = categoryMap.get(expense.category) || 0;
    categoryMap.set(expense.category, currentAmount + absAmount);
  });

  return Array.from(categoryMap).map(([name, value]) => ({
    name,
    value,
    currency: activeCurrency,
  }));
};

// Process data for daily expenses
export const getDailyData = (
  expenses: Expense[], 
  activeFilter: string,
  activeCurrency: string
) => {
  const filteredExpenses = getFilteredExpenses(expenses, activeFilter);
  const dailyMap = new Map<string, number>();

  filteredExpenses.forEach((expense) => {
    // Extract day
    const date = new Date(expense.date);
    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Expenses are stored as negative numbers
    const absAmount = Math.abs(expense.amount);
    const currentAmount = dailyMap.get(dayKey) || 0;
    dailyMap.set(dayKey, currentAmount + absAmount);
  });

  return Array.from(dailyMap)
    .map(([date, total]) => ({
      date,
      total,
      currency: activeCurrency,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14); // Last 14 days
};

// Process data for monthly chart
export const getMonthlyData = (
  expenses: Expense[], 
  activeFilter: string,
  activeCurrency: string
) => {
  const filteredExpenses = getFilteredExpenses(expenses, activeFilter);
  const monthlyMap = new Map<string, number>();

  filteredExpenses.forEach((expense) => {
    // Extract month and year
    const date = new Date(expense.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    
    // Expenses are stored as negative numbers
    const absAmount = Math.abs(expense.amount);
    const currentAmount = monthlyMap.get(monthYear) || 0;
    monthlyMap.set(monthYear, currentAmount + absAmount);
  });

  return Array.from(monthlyMap)
    .map(([date, total]) => ({
      date,
      total,
      currency: activeCurrency,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Get radar data for categories
export const getRadarData = (
  expenses: Expense[], 
  activeFilter: string,
  activeCurrency: string
) => {
  const categoryData = getCategoryData(expenses, activeFilter, activeCurrency);
  return categoryData.map(item => ({
    category: item.name,
    amount: item.value,
  }));
};

// Get treemap data
export const getTreemapData = (
  expenses: Expense[], 
  activeFilter: string,
  activeCurrency: string
) => {
  const categoryData = getCategoryData(expenses, activeFilter, activeCurrency);
  return categoryData.map(item => ({
    name: item.name,
    size: item.value,
  }));
};

// Format date for chart display
export const formatChartDate = (dateString: string) => {
  if (dateString.includes('-')) {
    const [year, month] = dateString.split('-');
    return `${new Date(Number(year), Number(month)-1).toLocaleString('default', {month: 'short'})} ${year}`;
  }
  return dateString;
};
