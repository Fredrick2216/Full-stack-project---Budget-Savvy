
import React from "react";
import { Button } from "@/components/ui/button";

interface FilterButtonsProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export const FilterButtons: React.FC<FilterButtonsProps> = ({
  activeFilter,
  setActiveFilter,
}) => {
  return (
    <div className="flex space-x-2">
      <Button
        size="sm"
        variant={activeFilter === "all" ? "default" : "outline"}
        onClick={() => setActiveFilter("all")}
      >
        All Time
      </Button>
      <Button
        size="sm"
        variant={activeFilter === "week" ? "default" : "outline"}
        onClick={() => setActiveFilter("week")}
      >
        Week
      </Button>
      <Button
        size="sm"
        variant={activeFilter === "month" ? "default" : "outline"}
        onClick={() => setActiveFilter("month")}
      >
        Month
      </Button>
      <Button
        size="sm"
        variant={activeFilter === "year" ? "default" : "outline"}
        onClick={() => setActiveFilter("year")}
      >
        Year
      </Button>
    </div>
  );
};
