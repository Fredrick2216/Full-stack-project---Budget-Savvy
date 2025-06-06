
import { formatCurrency } from "@/lib/utils";

interface HealthScoreResult {
  score: number; // 0-100 score
  status: "excellent" | "good" | "fair" | "needs-attention" | "critical";
  color: string;
  message: string;
}

interface MilestoneResult {
  achieved: boolean;
  message: string;
  type: "income" | "saving" | "ratio";
  amount?: number;
}

// Calculate financial health score based on income/expense ratio
export const calculateHealthScore = (
  totalIncome: number,
  totalExpenses: number
): HealthScoreResult => {
  // If no income or expenses, return default state
  if (totalIncome === 0 || totalExpenses === 0) {
    return {
      score: 50,
      status: "fair",
      color: "bg-yellow-500",
      message: "Start tracking your finances to get an accurate health score."
    };
  }

  // Calculate income-to-expense ratio
  const ratio = totalIncome / Math.abs(totalExpenses);
  let score = 0;
  let status: HealthScoreResult["status"];
  let color: string;
  let message: string;

  // Determine score based on ratio
  // Ideal range is typically 1.5-2.5x income to expenses
  if (ratio >= 2.5) {
    score = 95;
    status = "excellent";
    color = "bg-green-500";
    message = "Excellent! You're saving a significant portion of your income.";
  } else if (ratio >= 1.5) {
    score = 85;
    status = "good";
    color = "bg-green-400";
    message = "Good job! You're maintaining a healthy financial balance.";
  } else if (ratio >= 1.2) {
    score = 70;
    status = "good";
    color = "bg-blue-500";
    message = "You're on the right track, but could save a bit more.";
  } else if (ratio >= 1) {
    score = 50;
    status = "fair";
    color = "bg-yellow-500";
    message = "You're breaking even. Try to increase your savings rate.";
  } else if (ratio >= 0.8) {
    score = 30;
    status = "needs-attention";
    color = "bg-orange-500";
    message = "Caution: You're spending more than you earn.";
  } else {
    score = 10;
    status = "critical";
    color = "bg-red-500";
    message = "Warning: Your expenses significantly exceed your income.";
  }

  return { score, status, color, message };
};

// Generate budget recommendations based on income and expenses
export const generateBudgetRecommendations = (
  totalIncome: number,
  expensesByCategory: Record<string, number>,
  healthScore: HealthScoreResult
): string[] => {
  const recommendations: string[] = [];
  
  if (totalIncome === 0) {
    return ["Start by tracking your income to get personalized recommendations."];
  }
  
  // Calculate total expenses
  const totalExpenses = Object.values(expensesByCategory).reduce(
    (sum, amount) => sum + Math.abs(amount),
    0
  );
  
  // Find the highest expense categories
  const sortedCategories = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a));
  
  // Get top 3 expense categories
  const topCategories = sortedCategories.slice(0, 3);
  
  // Basic recommendations based on health score
  if (healthScore.status === "excellent") {
    recommendations.push(
      "Consider investing more of your surplus income for long-term growth."
    );
    recommendations.push(
      "You could allocate more to retirement accounts or emergency savings."
    );
  } else if (healthScore.status === "good") {
    recommendations.push(
      "You're on the right track. Try to maintain or slightly increase your savings rate."
    );
    
    if (topCategories.length > 0) {
      const [topCategory] = topCategories[0];
      recommendations.push(
        `Keep an eye on your ${topCategory} expenses which are your largest category.`
      );
    }
  } else if (healthScore.status === "fair") {
    recommendations.push(
      "Try to increase your income-to-expense ratio to at least 1.2."
    );
    
    if (topCategories.length > 0) {
      const [topCategory] = topCategories[0];
      const percent = (Math.abs(expensesByCategory[topCategory]) / totalIncome) * 100;
      recommendations.push(
        `Consider reducing ${topCategory} expenses which currently account for ${percent.toFixed(1)}% of your income.`
      );
    }
  } else {
    recommendations.push(
      "Focus on reducing expenses or increasing income to improve your financial health."
    );
    
    if (topCategories.length > 0) {
      topCategories.slice(0, 2).forEach(([category, amount]) => {
        recommendations.push(
          `Look for ways to reduce ${category} expenses (currently ${formatCurrency(Math.abs(amount))}).`
        );
      });
    }
  }
  
  // Additional recommendations
  if (totalIncome > 0 && totalExpenses > 0) {
    const savingsRate = (totalIncome - totalExpenses) / totalIncome;
    
    if (savingsRate < 0.1 && healthScore.status !== "critical") {
      recommendations.push(
        "Aim to save at least 10-20% of your income for financial security."
      );
    }
    
    if (savingsRate > 0.5) {
      recommendations.push(
        "You're saving a large portion of your income. Consider if you're meeting your lifestyle needs."
      );
    }
  }
  
  return recommendations;
};

// Check if user has achieved any income milestones
export const checkIncomeMilestones = (
  currentMonthIncome: number,
  previousMonthsIncome: number[],
  totalLifetimeIncome: number
): MilestoneResult[] => {
  const milestones: MilestoneResult[] = [];
  
  // No previous data to compare
  if (previousMonthsIncome.length === 0) {
    return milestones;
  }
  
  // Calculate average monthly income (excluding current month)
  const avgMonthlyIncome = previousMonthsIncome.length > 0
    ? previousMonthsIncome.reduce((sum, income) => sum + income, 0) / previousMonthsIncome.length
    : 0;
  
  // Monthly income milestone (25% increase)
  if (currentMonthIncome >= avgMonthlyIncome * 1.25 && avgMonthlyIncome > 0) {
    milestones.push({
      achieved: true,
      message: `Congratulations! Your income this month is ${((currentMonthIncome / avgMonthlyIncome - 1) * 100).toFixed(0)}% higher than your average.`,
      type: "income",
      amount: currentMonthIncome
    });
  }
  
  // All-time high monthly income
  if (currentMonthIncome > Math.max(...previousMonthsIncome)) {
    milestones.push({
      achieved: true,
      message: "New record! This is your highest monthly income so far.",
      type: "income",
      amount: currentMonthIncome
    });
  }
  
  // Lifetime income milestones
  const lifetimeMilestones = [10000, 50000, 100000, 250000, 500000, 1000000];
  for (const milestone of lifetimeMilestones) {
    // Check if we just crossed a milestone
    const previousTotal = totalLifetimeIncome - currentMonthIncome;
    if (previousTotal < milestone && totalLifetimeIncome >= milestone) {
      milestones.push({
        achieved: true,
        message: `You've reached a lifetime income milestone of ${formatCurrency(milestone)}!`,
        type: "income",
        amount: milestone
      });
      break; // Only show the highest milestone reached
    }
  }
  
  return milestones;
};
