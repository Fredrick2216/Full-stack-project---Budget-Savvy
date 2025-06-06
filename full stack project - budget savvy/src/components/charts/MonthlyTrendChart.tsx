
import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer } from "@/components/ui/chart";
import { MonthlyExpense } from "@/types/expenses";
import { formatChartDate } from "@/utils/expenseUtils";

interface MonthlyTrendChartProps {
  data: MonthlyExpense[];
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({ data }) => {
  return (
    <div className="h-[350px]">
      <ChartContainer 
        config={{
          expenses: { color: "#8884d8" },
        }}
        className="h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <defs>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              tick={{ fontSize: 12 }}
              height={60}
              tickFormatter={formatChartDate}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
              labelFormatter={formatChartDate}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#8884d8" 
              fillOpacity={1} 
              fill="url(#colorExpense)" 
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
