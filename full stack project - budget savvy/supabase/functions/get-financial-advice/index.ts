
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Financial advice categories and responses - expanded and more detailed
const financialAdvice = {
  budgeting: [
    "Track your expenses for a month to understand your spending patterns. You can use expense tracking apps or a simple spreadsheet.",
    "Use the 50/30/20 rule - 50% for needs, 30% for wants, and 20% for savings and debt. This provides a simple framework to follow.",
    "Create a zero-based budget where every dollar has a purpose before the month begins. This helps prevent impulse spending.",
    "Try using cash envelopes for categories where you tend to overspend. The physical act of handing over cash makes spending more concrete.",
    "Review and adjust your budget monthly based on changing circumstances. A budget should be flexible, not restrictive.",
    "Consider using budgeting apps like YNAB, Mint, or Personal Capital to automate tracking.",
    "Prioritize your expenses from most important to least important to identify areas where you can cut back.",
    "Build a separate budget for irregular expenses like car maintenance, holidays, and annual subscriptions.",
  ],
  saving: [
    "Start an emergency fund aiming for 3-6 months of expenses. Begin with a smaller goal of $1,000 if the full amount seems overwhelming.",
    "Set up automatic transfers to savings on payday to ensure saving happens before spending.",
    "Use a high-yield savings account to earn more interest on your emergency fund and short-term savings.",
    "Challenge yourself to no-spend days or weeks to boost your savings rate and identify spending triggers.",
    "Save windfalls like tax refunds or bonuses instead of spending them. Consider the 90/10 rule - save 90% and spend 10% as a reward.",
    "Try the 30-day rule for non-essential purchases: wait 30 days before buying to avoid impulse spending.",
    "Consider using round-up apps that automatically save the spare change from your purchases.",
    "Set specific savings goals with deadlines to stay motivated. Having a clear purpose for your savings increases commitment.",
  ],
  investing: [
    "Start investing early to benefit from compound interest. Even small amounts can grow significantly over time.",
    "Consider low-cost index funds for beginners. They provide instant diversification and typically outperform actively managed funds.",
    "Diversify your investments across different asset classes like stocks, bonds, and real estate to manage risk.",
    "Max out retirement accounts like 401(k)s and IRAs for tax advantages before investing in taxable accounts.",
    "Avoid trying to time the market and focus on a consistent investing strategy like dollar-cost averaging.",
    "Rebalance your portfolio annually to maintain your desired asset allocation as markets change.",
    "Consider target-date funds for retirement if you prefer a hands-off approach to asset allocation.",
    "Understand your risk tolerance before investing and adjust your portfolio accordingly. Your age, financial situation, and personal comfort level should all factor in.",
  ],
  debt: [
    "Tackle high-interest debt first (debt avalanche) to save on interest costs over time.",
    "Or pay off small debts first (debt snowball) for psychological wins that keep you motivated.",
    "Consider consolidating high-interest debts into a single, lower-interest loan or 0% balance transfer credit card.",
    "Avoid taking on new debt while paying off existing obligations. Put credit cards on ice if necessary.",
    "Negotiate with creditors for lower interest rates, especially on credit cards. A simple phone call can save hundreds or thousands.",
    "For student loans, look into income-driven repayment plans or refinancing options if they make sense for your situation.",
    "Create a debt payoff plan with specific monthly payment amounts and target payoff dates.",
    "Consider seeking help from a non-profit credit counselor if you're struggling with overwhelming debt.",
  ],
  retirement: [
    "Start saving for retirement as early as possible to maximize compound growth.",
    "Aim to save at least 15% of your income for retirement, including any employer match.",
    "Take full advantage of employer matching contributions in retirement plans - it's free money.",
    "Consider a Roth IRA for tax-free growth if you expect to be in a higher tax bracket in retirement.",
    "As you approach retirement, gradually shift your portfolio to more conservative investments to protect your nest egg.",
    "Plan for healthcare costs in retirement, which can be substantial even with Medicare.",
    "Consider working with a financial advisor to create a withdrawal strategy that minimizes taxes in retirement.",
    "Don't forget to account for inflation when calculating how much you'll need in retirement.",
  ],
  credit: [
    "Check your credit report regularly from all three bureaus through AnnualCreditReport.com.",
    "Pay all bills on time - payment history is the most significant factor in your credit score.",
    "Keep credit card balances below 30% of your available credit limit to maintain a good credit utilization ratio.",
    "Avoid applying for multiple new credit accounts in a short period, as each application can temporarily lower your score.",
    "Keep old credit accounts open, even if unused, to maintain a longer credit history.",
    "Dispute any errors on your credit report promptly to prevent them from affecting your score.",
    "Consider using a secured credit card to build or rebuild credit if you have limited or poor credit history.",
    "Monitor your credit score through free services offered by many credit cards and banks.",
  ],
  taxes: [
    "Contribute to tax-advantaged accounts like 401(k)s, IRAs, and HSAs to reduce your taxable income.",
    "Keep thorough records of deductible expenses throughout the year for easier tax preparation.",
    "Consider bunching deductions in a single tax year if you're close to the standard deduction threshold.",
    "Review your tax withholding annually to avoid owing a large sum or getting a large refund.",
    "Harvest investment losses to offset capital gains and potentially reduce your tax burden.",
    "Look into available tax credits, which provide a dollar-for-dollar reduction in your tax liability.",
    "Consider consulting with a tax professional if your situation is complex or you've had major life changes.",
    "File your taxes electronically for faster processing and refunds.",
  ],
  homeownership: [
    "Save at least 20% for a down payment to avoid private mortgage insurance (PMI).",
    "Get pre-approved for a mortgage before house hunting to understand your budget and strengthen your offer.",
    "Budget for closing costs, which typically range from 2-5% of the loan amount.",
    "Set aside 1-3% of your home's value annually for maintenance and repairs.",
    "Consider the total cost of ownership, including property taxes, insurance, HOA fees, and utilities.",
    "Shop around for the best mortgage rates and terms from multiple lenders.",
    "Review your mortgage for refinancing opportunities when interest rates drop significantly.",
    "Don't stretch your budget too thin - aim to keep housing costs at or below 28% of your gross income.",
  ],
  general: [
    "Review your financial goals quarterly to stay on track and adjust as needed.",
    "Be mindful of lifestyle inflation when your income increases. Try to save a portion of any raise or bonus.",
    "Compare prices and research products before making significant purchases. The cheapest option isn't always the most cost-effective long-term.",
    "Prioritize value and longevity over initial cost for important items that you'll use frequently.",
    "Learn about personal finance through books, podcasts, and reputable websites. Financial literacy is an ongoing process.",
    "Schedule regular money check-ins with yourself or your partner to ensure you're aligned on financial goals.",
    "Automate your finances where possible - bill payments, savings contributions, and investments - to reduce decision fatigue.",
    "Create and maintain an updated inventory of your possessions for insurance purposes, especially valuable items.",
    "Regularly review and update your insurance coverage to ensure you're adequately protected without overpaying.",
    "Consider your values when making financial decisions. Money is a tool to support the life you want to live."
  ]
};

// Function to determine the best advice category for a query with more sophisticated pattern matching
function determineCategory(query: string): string {
  query = query.toLowerCase();
  
  // More comprehensive keyword matching
  const categoryKeywords = {
    budgeting: ['budget', 'spend', 'spending', 'expense', 'expenses', 'track', 'tracking', 'money management', 'cash flow', 'income', 'allocate', '50/30/20', 'zero-based'],
    saving: ['save', 'saving', 'savings', 'emergency fund', 'rainy day', 'future', 'goals', 'set aside', 'put away', 'stash'],
    investing: ['invest', 'investing', 'investment', 'stock', 'stocks', 'bond', 'bonds', 'market', 'returns', 'portfolio', '401k', 'ira', 'retirement', 'compound interest', 'dividend', 'etf', 'mutual fund'],
    debt: ['debt', 'loan', 'loans', 'credit card', 'mortgage', 'student loan', 'car loan', 'interest rate', 'pay off', 'consolidation', 'avalanche', 'snowball'],
    retirement: ['retire', 'retirement', 'pension', '401k', 'ira', 'roth', 'social security', 'future', 'old age', 'senior years', 'elderly', 'nest egg'],
    credit: ['credit score', 'credit report', 'fico', 'credit card', 'credit history', 'credit utilization', 'credit bureau', 'credit limit', 'credit check'],
    taxes: ['tax', 'taxes', 'irs', 'deduction', 'deductions', 'write-off', 'tax return', 'tax refund', 'tax credit', 'withholding', 'tax bracket'],
    homeownership: ['home', 'house', 'mortgage', 'property', 'down payment', 'closing costs', 'real estate', 'homeowner', 'pmi', 'equity', 'refinance']
  };
  
  // Score each category by counting keyword matches
  const scores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    scores[category] = keywords.reduce((score, keyword) => {
      return score + (query.includes(keyword) ? 1 : 0);
    }, 0);
  }
  
  // Find the category with the highest score
  let bestCategory = 'general';
  let highestScore = 0;
  
  for (const [category, score] of Object.entries(scores)) {
    if (score > highestScore) {
      highestScore = score;
      bestCategory = category;
    }
  }
  
  // If no category scored any points, return general advice
  return highestScore > 0 ? bestCategory : 'general';
}

// Function to get relevant advice based on the query
function getAdvice(query: string): string {
  const category = determineCategory(query);
  const adviceList = financialAdvice[category as keyof typeof financialAdvice] || financialAdvice.general;
  
  // Get the most relevant pieces of advice for the query
  // For a more sophisticated approach, we could use embeddings or semantic similarity
  // but for now, we'll just get a random piece of advice from the appropriate category
  return adviceList[Math.floor(Math.random() * adviceList.length)];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query parameter');
    }
    
    console.log(`Processing query: "${query}"`);
    
    const category = determineCategory(query);
    console.log(`Determined category: ${category}`);
    
    const advice = getAdvice(query);
    console.log(`Generated advice: "${advice.substring(0, 50)}..."`);

    return new Response(JSON.stringify({ 
      response: advice,
      category: category
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Error in get-financial-advice function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate financial advice',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
