"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { formatNumber, parseFormattedNumber } from "@/lib/utils";

import { createExpenseAction, updateExpenseAction, type ExpenseFormValues } from "@/app/(dashboard)/expenses/actions";
import { EXPENSE_TYPE_OPTIONS } from "@/constants/expense-types";
import { getTodayDate } from "@/lib/utils";
import { DatePickerWithInput } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { expenseFormSchema } from "@/lib/validators";
import type { ExpenseListItem } from "@/types/expenses";

interface AddExpenseFormProps {
  selectedExpense?: ExpenseListItem;
  onClearSelection?: () => void;
}

const getDefaultValues = (expenseTypeValue = ""): Partial<ExpenseFormValues> => ({
  expenseType: expenseTypeValue,
  customExpenseType: "",
  amount: undefined,
  expenseDate: getTodayDate(),
  description: "",
});

export function AddExpenseForm({ selectedExpense, onClearSelection }: AddExpenseFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isPending, startTransition] = useTransition();
  const [lastExpenseType, setLastExpenseType] = useState("");

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: getDefaultValues(),
  });

  const isEditing = Boolean(selectedExpense);

  const expenseType = form.watch("expenseType");
  const isCustomExpenseType = expenseType === "CUSTOM";

  useEffect(() => {
    if (selectedExpense) {
      // Check if the expense type is in the predefined list
      const isPredefinedType = EXPENSE_TYPE_OPTIONS.some(opt => opt.value === selectedExpense.expenseType);
      form.reset({
        expenseType: isPredefinedType ? selectedExpense.expenseType : "CUSTOM",
        customExpenseType: isPredefinedType ? "" : selectedExpense.expenseType,
        amount: selectedExpense.amount,
        expenseDate: new Date(selectedExpense.expenseDate),
        description: selectedExpense.description ?? "",
      });
    } else {
      form.reset(getDefaultValues(lastExpenseType));
    }
  }, [selectedExpense, form, lastExpenseType]);

  function handleSubmit(values: ExpenseFormValues) {
    setStatus("idle");
    startTransition(async () => {
      try {
        if (selectedExpense) {
          const result = await updateExpenseAction({
            ...values,
            id: selectedExpense.id,
          });
          if (result.success) {
            toast.warning("Expense updated successfully.");
            setStatus("success");
            onClearSelection?.();
            // Preserve current URL params when refreshing
            router.refresh();
          } else {
            setStatus("error");
            const errorMsg = result.error || "Failed to update expense";
            toast.error(errorMsg);
          }
        } else {
          const result = await createExpenseAction(values);
          if (result.success) {
            // Use custom expense type if CUSTOM is selected, otherwise use the selected type
            const finalExpenseType = values.expenseType === "CUSTOM" 
              ? (values.customExpenseType || values.expenseType)
              : values.expenseType;
            setLastExpenseType(finalExpenseType);
            toast.success("Expense created successfully.");
            setStatus("success");
            form.reset(getDefaultValues(""));
            // Preserve current URL params when refreshing
            router.refresh();
          } else {
            setStatus("error");
            const errorMsg = result.error || "Failed to create expense";
            toast.error(errorMsg);
          }
        }
      } catch (error) {
        console.error(error);
        setStatus("error");
        const errorMsg = `Failed to ${isEditing ? "update" : "create"} expense: ${error instanceof Error ? error.message : "Unknown error"}`;
        toast.error(errorMsg);
      }
    });
  }

  function handleClear() {
    form.reset(getDefaultValues(lastExpenseType));
    onClearSelection?.();
    setStatus("idle");
  }

  return (
    <div className="flex h-full flex-col rounded-[28px] border border-[#e1e6f2] bg-white p-6 shadow-sm lg:p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Add Expense</h2>
        <p className="text-sm text-slate-500">
          {isEditing ? "Update the selected entry in one click." : "Track every rupee with structured inputs."}
        </p>
        {isEditing && selectedExpense ? (
          <div className="mt-3 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
            Editing: {selectedExpense.expenseType}
          </div>
        ) : null}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="expenseType"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-600">Expense Type</FormLabel>
                <FormControl>
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger className="h-12 rounded-[18px] border-[#dde3f0] bg-[#f6f8fd] px-4 text-sm font-medium text-slate-700">
                      <SelectValue placeholder="Select expense type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-slate-200">
                      {EXPENSE_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-sm">
                          {option.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="CUSTOM" className="text-sm">
                        Custom
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {isCustomExpenseType && (
            <FormField
              control={form.control}
              name="customExpenseType"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-medium text-slate-600">Custom Expense Type</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter custom expense type"
                      className="h-12 rounded-[18px] border-[#dde3f0] bg-[#f6f8fd] px-4 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-600">Expense Amount</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter amount"
                    value={field.value ? formatNumber(field.value) : ""}
                    onChange={(event) => {
                      const numValue = parseFormattedNumber(event.target.value);
                      field.onChange(numValue > 0 ? numValue : undefined);
                    }}
                    onBlur={(e) => {
                      const numValue = parseFormattedNumber(e.target.value);
                      if (numValue > 0) {
                        field.onChange(numValue);
                        e.target.value = formatNumber(numValue);
                      } else {
                        field.onChange(undefined);
                        e.target.value = "";
                      }
                      field.onBlur();
                    }}
                    name={field.name}
                    ref={field.ref}
                    className="h-12 rounded-[18px] border-[#dde3f0] bg-[#f6f8fd] px-4 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-600">Expense Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter description"
                    className="min-h-[96px] rounded-[18px] border-[#dde3f0] bg-[#f6f8fd] px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expenseDate"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-600">Date</FormLabel>
                <FormControl>
                  <DatePickerWithInput
                    date={field.value}
                    onChange={field.onChange}
                    placeholder="Select date"
                    className="rounded-[18px] border-[#dde3f0] bg-[#f6f8fd]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleClear}
              disabled={isPending}
              className="h-12 flex-1 rounded-[18px] border-[#dde3f0] bg-white text-sm font-semibold text-slate-600 shadow-none hover:bg-slate-50"
            >
              {isEditing ? "Cancel" : "Clear"}
            </Button>
            <Button
              type="submit"
              loading={isPending}
              className="h-12 flex-1 rounded-[18px] bg-[#1f64ff] text-sm font-semibold text-white shadow-lg hover:bg-[#194fcb]"
            >
              {isPending ? (isEditing ? "Updating..." : "Adding...") : isEditing ? "Update Expense" : "Add Expense"}
            </Button>
          </div>

          {status === "success" && (
            <p className="text-sm font-medium text-emerald-600">
              Expense {isEditing ? "updated" : "added"} successfully.
            </p>
          )}
          {status === "error" && (
            <p className="text-sm font-medium text-rose-600">
              Unable to {isEditing ? "update" : "add"} expense. Please try again.
            </p>
          )}
        </form>
      </Form>
    </div>
  );
}

