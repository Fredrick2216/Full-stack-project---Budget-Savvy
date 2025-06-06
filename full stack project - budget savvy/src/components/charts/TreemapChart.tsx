
import React from "react";
import {
  Treemap,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CHART_COLORS } from "./ChartColors";
import { formatCurrency } from "@/lib/utils";
import { ChartContainer } from "@/components/ui/chart";
import { TreemapExpense } from "@/types/expenses";

interface TreemapChartProps {
  data: TreemapExpense[];
}

export const TreemapChart: React.FC<TreemapChartProps> = ({ data }) => {
  return (
    <div className="h-[350px]">
      <ChartContainer 
        config={{
          size: { color: "#8884d8" },
        }}
        className="h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={data}
            dataKey="size"
            stroke="#fff"
            fill="#8884d8"
          >
            {
              data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={CHART_COLORS[index % CHART_COLORS.length]} 
                />
              ))
            }
            <Tooltip
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Treemap>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};
