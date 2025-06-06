
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSupabase } from "@/components/SupabaseProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

const budgetSchema = z.object({
  amount: z.number().min(0.01, "Budget amount must be greater than 0"),
  period: z.enum(["weekly", "monthly", "yearly"], {
    required_error: "Please select a budget period",
  }),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface BudgetFormProps {
  onSuccess?: () => void;
  existingBudget?: {
    id: string;
    amount: number;
    period: string;
  } | null;
}

export function BudgetForm({ onSuccess, existingBudget }: BudgetFormProps) {
  const { supabase, user } = useSupabase();
  
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      amount: existingBudget?.amount || 0,
      period: (existingBudget?.period as "weekly" | "monthly" | "yearly") || "monthly",
    },
  });

  const onSubmit = async (data: BudgetFormData) => {
    if (!user) {
      toast.error("Please sign in to manage budgets");
      return;
    }

    try {
      if (existingBudget) {
        // Update existing budget
        const { error } = await supabase
          .from("budgets")
          .update({
            amount: data.amount,
            period: data.period,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingBudget.id)
          .eq("user_id", user.id);

        if (error) throw error;
        toast.success("Budget updated successfully!");
      } else {
        // Create new budget
        const { error } = await supabase
          .from("budgets")
          .insert({
            user_id: user.id,
            amount: data.amount,
            period: data.period,
          });

        if (error) throw error;
        toast.success("Budget created successfully!");
      }

      onSuccess?.();
      if (!existingBudget) {
        form.reset();
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      toast.error("Failed to save budget");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Enter budget amount"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Period</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select budget period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {existingBudget ? "Update Budget" : "Create Budget"}
        </Button>
      </form>
    </Form>
  );
}
