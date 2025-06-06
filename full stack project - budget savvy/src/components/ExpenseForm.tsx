
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ui/use-toast";
import { generateId } from "@/lib/utils"; // Keep the utility function import
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { v4 as uuidv4 } from "uuid";

const expenseFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Please select a category"),
  description: z.string().optional(),
  currency: z.string().min(1, "Please select a currency"),
  date: z.string().default(() => new Date().toISOString().split('T')[0]),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

const CATEGORIES = [
  "Food & Dining",
  "Housing",
  "Transportation",
  "Entertainment",
  "Healthcare",
  "Education",
  "Shopping",
  "Utilities",
  "Travel",
  "Other",
];

const CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
];

export function ExpenseForm({ onSuccess }: { onSuccess?: () => void }) {
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      amount: 0,
      category: "",
      description: "",
      currency: "USD",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: ExpenseFormValues) {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add expenses",
        variant: "destructive",
      });
      return;
    }

    try {
      // Always store a negative amount for expenses
      const expenseAmount = -Math.abs(values.amount);

      const { error } = await supabase.from("expenses").insert({
        id: uuidv4(), // Using uuidv4 from the uuid package
        user_id: user.id,
        amount: expenseAmount,
        category: values.category,
        description: values.description || null,
        currency: values.currency,
        date: values.date,
      });

      if (error) throw error;

      toast({
        title: "Expense added",
        description: `Successfully added ${values.currency} ${Math.abs(expenseAmount)} expense`,
      });

      form.reset({
        amount: 0,
        category: "",
        description: "",
        currency: "USD",
        date: new Date().toISOString().split('T')[0],
      });
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error adding expense",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 cosmic-card p-6">
        <h2 className="text-2xl font-bold nebula-text mb-4">Add New Expense</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-background border-border">
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.code} value={currency.code}>
                        {currency.symbol} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background border-border">
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add details about this expense..." {...field} />
              </FormControl>
              <FormDescription>
                Brief description of what this expense was for.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="cosmos-button w-full"
        >
          {isSubmitting ? "Adding..." : "Add Expense"}
        </Button>
      </form>
    </Form>
  );
}
