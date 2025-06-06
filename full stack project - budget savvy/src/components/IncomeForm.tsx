
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSupabase } from "@/components/SupabaseProvider";
import { useToast } from "@/components/ui/use-toast";
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

const incomeFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  source: z.string().min(1, "Please select an income source"),
  description: z.string().optional(),
  date: z.string().default(() => new Date().toISOString().split('T')[0]),
});

type IncomeFormValues = z.infer<typeof incomeFormSchema>;

const INCOME_SOURCES = [
  "Salary",
  "Freelance",
  "Investments",
  "Business",
  "Rental",
  "Dividends",
  "Interest",
  "Gift",
  "Other",
];

export function IncomeForm({ onSuccess }: { onSuccess?: () => void }) {
  const { supabase, user } = useSupabase();
  const { toast } = useToast();
  
  const form = useForm<IncomeFormValues>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      amount: 0,
      source: "",
      description: "",
      date: new Date().toISOString().split('T')[0],
    },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(values: IncomeFormValues) {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add income",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("incomes").insert({
        id: uuidv4(),
        user_id: user.id,
        amount: values.amount,
        source: values.source,
        description: values.description || null,
        date: values.date,
      });

      if (error) throw error;

      toast({
        title: "Income added",
        description: `Successfully added $${values.amount} income`,
      });

      form.reset({
        amount: 0,
        source: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
      });
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error adding income",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 cosmic-card p-6">
        <h2 className="text-2xl font-bold nebula-text mb-4">Add New Income</h2>
        
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
          name="source"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Source</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-background border-border">
                  {INCOME_SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
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
                <Textarea placeholder="Add details about this income..." {...field} />
              </FormControl>
              <FormDescription>
                Brief description of what this income was for.
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
          {isSubmitting ? "Adding..." : "Add Income"}
        </Button>
      </form>
    </Form>
  );
}
