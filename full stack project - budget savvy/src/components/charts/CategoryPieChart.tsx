
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CHART_COLORS } from "./ChartColors";
import { ExpenseSummary } from "@/types/expenses";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer } from "@/components/ui/chart";

interface CategoryPieChartProps {
  data: ExpenseSummary[];
}

export const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  return (
    <div className="h-[350px]">
      <ChartContainer 
        config={{
          category1: { color: "#8884d8" },
          category2: { color: "#83a6ed" },
          category3: { color: "#8dd1e1" },
          // Additional categories
        }} 
        className="h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => 
                active && payload && payload.length ? (
                  <div className="bg-background/95 border border-border p-2 rounded shadow">
                    <p>{payload[0].name}</p>
                    <p className="font-bold">{formatCurrency(Number(payload[0].value))}</p>
                  </div>
                ) : null
              }
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
