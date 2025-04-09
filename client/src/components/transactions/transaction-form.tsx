import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { transactionsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Transaction } from "@/types";
import { toMinorUnits } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const formSchema = z.object({
  amount: z.preprocess(
    (val) => parseFloat(val as string),
    z.number({ invalid_type_error: "Amount must be a number" })
      .refine(val => val !== 0, "Amount cannot be zero")
  ),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  transactionToEdit?: Transaction;
}

export default function TransactionForm({
  isOpen,
  onClose,
  accountId,
  transactionToEdit,
}: TransactionFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditing = !!transactionToEdit;

  // Setup current date and time for form default
  const today = new Date();
  const formattedToday = format(today, "yyyy-MM-dd");
  const formattedTime = format(today, "HH:mm");

  // Initialize the default date and time values for editing
  let defaultDate = formattedToday;
  let defaultTime = formattedTime;
  if (transactionToEdit?.date) {
    try {
      const transactionDate = new Date(transactionToEdit.date);
      defaultDate = format(transactionDate, "yyyy-MM-dd");
      defaultTime = format(transactionDate, "HH:mm");
    } catch (e) {
      defaultDate = formattedToday;
      defaultTime = formattedTime;
    }
  }

  // Setup default amount value for editing
  let defaultAmount = "";
  if (transactionToEdit?.amount) {
    // Convert from minor units to actual amount
    const actualAmount = transactionToEdit.amount / 100;
    defaultAmount = actualAmount.toString();
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: defaultAmount ? parseFloat(defaultAmount) : undefined,
      description: transactionToEdit?.description || undefined,
      date: defaultDate,
      time: defaultTime,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!user) throw new Error("User not authenticated");

      // Convert amount to minor units
      const amountInMinorUnits = toMinorUnits(data.amount);

      // Create ISO timestamp from date and time
      const [year, month, day] = data.date.split('-').map(Number);
      const [hours, minutes] = data.time.split(':').map(Number);
      const dateTime = new Date(year, month - 1, day, hours, minutes, new Date().getSeconds());
      const isoDate = dateTime.toISOString();

      return transactionsApi.createTransaction(
        accountId,
        {
          amount: amountInMinorUnits,
          description: data.description || null,
          date: isoDate,
        },
        user.id,
        user.token
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/accounts/${accountId}/transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/accounts/${accountId}/transactions-count`] });
      queryClient.invalidateQueries({ queryKey: [`/accounts/${accountId}/balance`] });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (!user || !transactionToEdit) throw new Error("User not authenticated");
      
      // Convert amount to minor units
      const amountInMinorUnits = toMinorUnits(data.amount);

      // Create ISO timestamp from date and time
      const [year, month, day] = data.date.split('-').map(Number);
      const [hours, minutes] = data.time.split(':').map(Number);
      const dateTime = new Date(year, month - 1, day, hours, minutes);
      const isoDate = dateTime.toISOString();

      return transactionsApi.updateTransaction(
        accountId,
        transactionToEdit.id,
        {
          amount: amountInMinorUnits,
          description: data.description || null,
          date: isoDate,
        },
        user.id,
        user.token
      );
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/accounts/${accountId}/transactions`] });
      queryClient.invalidateQueries({ queryKey: [`/accounts/${accountId}/transactions-count`] });
      queryClient.invalidateQueries({ queryKey: [`/accounts/${accountId}/balance`] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    // When using the current time, include seconds in the date string sent to the API
    // But keep the UI limited to minute precision for user input
    const formData = { ...data };
    
    if (data.date === formattedToday && data.time === formattedTime) {
      // If current date and time are used, include seconds in ISO string
      const now = new Date();
      const isoDate = now.toISOString().split('T')[0];
      const fullTime = format(now, "HH:mm:ss");
      formData.date = isoDate;
      formData.time = fullTime;
    }
    
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[475px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Transaction" : "Add New Transaction"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update transaction details below"
              : "Enter transaction details below"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        className="pl-7"
                        type="number"
                        step="0.01"
                      />
                    </FormControl>
                  </div>
                  <FormDescription>
                    Enter positive value for income, negative for expense
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Groceries"
                      {...field}
                      autoComplete="off"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Transaction"
                  : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
