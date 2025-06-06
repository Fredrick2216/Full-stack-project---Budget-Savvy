
// Define type for expense data
export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
  created_at: string;
  currency: string;
}

// Define type for expense summary
export interface ExpenseSummary {
  name: string;
  value: number;
  currency: string;
}

// Define types for chart data
export interface DailyExpense {
  date: string;
  total: number;
  currency: string;
}

export interface MonthlyExpense {
  date: string;
  total: number;
  currency: string;
}

export interface RadarExpense {
  category: string;
  amount: number;
}

export interface TreemapExpense {
  name: string;
  size: number;
}
