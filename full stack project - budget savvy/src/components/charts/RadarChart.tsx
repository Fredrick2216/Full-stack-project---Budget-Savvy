
import React from "react";
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer } from "@/components/ui/chart";
import { RadarExpense } from "@/types/expenses";

interface RadarChartProps {
  data: RadarExpense[];
}

export const RadarChartComponent: React.FC<RadarChartProps> = ({ data }) => {
  return (
    <div className="h-[350px]">
      <ChartContainer 
        config={{
          amount: { color: "#8884d8" },
        }}
        className="h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart outerRadius={120} data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="category" />
            <PolarRadiusAxis />
            <Radar
              name="Expenses"
              dataKey="amount"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.6}
            />
            <Tooltip 
              formatter={(value) => formatCurrency(Number(value))}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
