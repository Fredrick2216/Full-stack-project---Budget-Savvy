
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer } from "@/components/ui/chart";
import { DailyExpense } from "@/types/expenses";

interface DailyLineChartProps {
  data: DailyExpense[];
}

export const DailyLineChart: React.FC<DailyLineChartProps> = ({ data }) => {
  return (
    <div className="h-[350px]">
      <ChartContainer 
        config={{
          total: { color: "#8884d8" },
        }}
        className="h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis 
              dataKey="date" 
              angle={-45} 
              textAnchor="end" 
              tick={{ fontSize: 12 }}
              height={60}
            />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ stroke: '#8884d8', strokeWidth: 2, r: 4 }}
              activeDot={{ stroke: '#8884d8', strokeWidth: 2, r: 6 }}
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
