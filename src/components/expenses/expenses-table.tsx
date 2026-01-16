"use client";

import { useState, useTransition } from "react";
import { format, parseISO } from "date-fns";
import { Eye, Pencil, Trash2, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { deleteExpenseAction } from "@/app/expenses/actions";
import { EXPENSE_TYPE_OPTIONS } from "@/constants/expense-types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { PageSizeSelect } from "@/components/payments/page-size-select";
import { cn } from "@/lib/utils";
import type { ExpenseListItem } from "@/types/expenses";

interface ExpensesTableProps {
  expenses: ExpenseListItem[];
  page: number;
  totalPages: number;
  pageSize: number | string;
  pageSizeOptions: (number | string)[];
  totalExpense: number;
  expenseTypeFilter?: string;
  onEditExpense?: (expense: ExpenseListItem) => void;
}

import { formatNumber, formatCurrency } from "@/lib/utils";

export function ExpensesTable({
  expenses,
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalExpense,
  expenseTypeFilter,
  onEditExpense,
}: ExpensesTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [viewedExpense, setViewedExpense] = useState<ExpenseListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  function buildQuery(nextParams: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(nextParams).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    const queryString = params.toString();
    return queryString ? `/expenses?${queryString}` : "/expenses";
  }

  function handleExpenseTypeChange(value?: string) {
    router.push(buildQuery({ expenseType: value, page: "1" }));
  }

  function handlePageChange(nextPage: number) {
    router.push(buildQuery({ page: String(nextPage) }));
  }


  function handleDelete(id: string) {
    if (!id) {
      alert("Invalid expense ID. Please try again.");
      return;
    }
    setDeletingId(id);
    startTransition(async () => {
      try {
        const result = await deleteExpenseAction({ id });
        if (result.success) {
          // Check if we need to adjust page number after delete
          // If current page becomes empty, go to previous page
          const currentPage = Number(searchParams.get("page")) || 1;
          const params = new URLSearchParams(searchParams.toString());
          
          // If we're on a page > 1 and just deleted the last item, go to previous page
          if (currentPage > 1 && expenses.length === 1) {
            params.set("page", String(currentPage - 1));
            router.push(`/expenses?${params.toString()}`);
          } else {
            // Preserve current URL params when refreshing
            router.refresh();
          }
        } else {
          alert(result.error || "Failed to delete expense. Please try again.");
        }
      } catch (error) {
        console.error("Error deleting expense:", error);
        alert(`Failed to delete expense: ${error instanceof Error ? error.message : "Unknown error"}`);
      } finally {
        setDeletingId(null);
      }
    });
  }

  function handleEdit(expense: ExpenseListItem) {
    setEditingId(expense.id);
    onEditExpense?.(expense);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => setEditingId(null), 500);
  }

  function handleView(expense: ExpenseListItem) {
    setViewingId(expense.id);
    setViewedExpense(expense);
    setTimeout(() => setViewingId(null), 500);
  }

  return (
    <div className="flex min-w-0 flex-col rounded-[28px] border border-[#e1e6f2] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#eef1f8] px-4 py-5 md:px-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-slate-900">Expenses List</h2>
          <p className="text-sm text-slate-500">Stay on top of spending in real time.</p>
        </div>
        <div className="flex w-full flex-col gap-3 text-sm text-slate-600 md:flex-row md:items-center md:gap-4 md:text-sm">
          <div className="inline-flex min-h-[48px] flex-1 items-center rounded-full border border-[#dfe4f4] bg-[#f7f9ff] px-4 py-1.5 text-sm font-medium text-slate-600">
            <span>Total Expense:&nbsp;</span>
            <span className="text-base font-semibold text-slate-900 whitespace-nowrap">{formatCurrency(totalExpense)}</span>
          </div>
          <Select
            value={expenseTypeFilter ?? "ALL"}
            onValueChange={(value) => handleExpenseTypeChange(value === "ALL" ? undefined : value)}
          >
            <SelectTrigger className="h-12 flex-1 rounded-full border border-[#dfe4f4] bg-[#f7f9ff] px-5 text-sm font-semibold text-slate-700 shadow-sm">
              <SelectValue placeholder="Expense Types" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-slate-200">
              <SelectItem value="ALL" className="text-sm">
                All Expense Types
              </SelectItem>
              {EXPENSE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-sm">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-4 py-4 md:px-6">
        <div className="overflow-hidden rounded-2xl border border-[#eef1f8]">
          <div className="overflow-x-auto">
            <div className="max-h-[520px] overflow-y-auto">
              <Table className="min-w-[840px]">
              <TableHeader className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(226,230,240,0.8)]">
                <TableRow className="text-xs uppercase tracking-wide text-slate-400">
                  <TableHead className="font-semibold text-slate-500">Expense Type</TableHead>
                  <TableHead className="font-semibold text-slate-500">Amount</TableHead>
                  <TableHead className="font-semibold text-slate-500">Date</TableHead>
                  <TableHead className="font-semibold text-slate-500">Description</TableHead>
                  <TableHead className="text-right font-semibold text-slate-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                      No expenses found for the selected filters.
                    </TableCell>
                  </TableRow>
                )}

                {(() => {
                  // Group expenses by date for highlighting (same date = same color)
                  function getDateKey(expense: ExpenseListItem): string {
                    return format(parseISO(expense.expenseDate), "yyyy-MM-dd");
                  }

                  // Create a map to assign colors to dates
                  const dateColors = new Map<string, string>();
                  const colors = ["bg-blue-50/50", "bg-green-50/50", "bg-orange-50/50"]; // Three colors: blue, green, orange
                  
                  // Get unique dates and sort them
                  const uniqueDates = Array.from(new Set(expenses.map(getDateKey))).sort();
                  
                  // Assign colors to dates
                  uniqueDates.forEach((dateKey, index) => {
                    dateColors.set(dateKey, colors[index % colors.length]);
                  });

                  return expenses.map((expense) => {
                    const dateLabel = format(parseISO(expense.expenseDate), "dd-MM-yyyy");
                    const dateKey = getDateKey(expense);
                    const rowColor = dateColors.get(dateKey) || "";

                    return (
                      <TableRow key={expense.id} className={cn("text-sm", rowColor)}>
                      <TableCell className="font-semibold text-slate-800">{expense.expenseType}</TableCell>
                      <TableCell className="text-slate-700 whitespace-nowrap">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell className="text-slate-600">{dateLabel}</TableCell>
                      <TableCell className="text-slate-500">
                        {expense.description
                          ? expense.description.length > 15
                            ? `${expense.description.slice(0, 15)}…`
                            : expense.description
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleView(expense)}
                            disabled={viewingId === expense.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dfe4f4] bg-white text-slate-600 transition hover:bg-[#f0f4ff] disabled:opacity-50"
                            aria-label="View expense"
                          >
                            {viewingId === expense.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(expense)}
                            disabled={editingId === expense.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#dfe4f4] bg-white text-[#1f64ff] transition hover:bg-[#eef3ff] disabled:opacity-50"
                            aria-label="Edit expense"
                          >
                            {editingId === expense.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Pencil className="h-4 w-4" />
                            )}
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button
                                type="button"
                                disabled={deletingId === expense.id}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ffecee] text-[#e54848] transition hover:bg-[#ffd4d8] disabled:opacity-50"
                                aria-label="Delete expense"
                              >
                                {deletingId === expense.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this expense for {expense.expenseType} ({formatCurrency(expense.amount)})? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(expense.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  });
                })()}
              </TableBody>
            </Table>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef1f8] px-4 pt-4 pb-[15px] text-sm text-slate-500 md:px-6">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <PaginationInfo currentPage={page} totalPages={totalPages} pageSize={pageSize} className="whitespace-nowrap" />
          <PageSizeSelect 
            value={pageSize} 
            options={pageSizeOptions} 
            searchParams={Object.fromEntries(searchParams.entries())}
          />
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          disabled={isPending}
        />
      </div>

      <Sheet
        open={Boolean(viewedExpense)}
        onOpenChange={(open) => {
          if (!open) {
            setViewedExpense(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-md">
          {viewedExpense && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>Expense Details</SheetTitle>
                <SheetDescription>{viewedExpense.expenseType}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Expense Type</span>
                  <span className="font-semibold text-slate-900">{viewedExpense.expenseType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Amount</span>
                  <span className="font-semibold text-slate-900 whitespace-nowrap">
                    {formatCurrency(viewedExpense.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Category</span>
                  <span className="font-semibold text-slate-900">
                    {viewedExpense.category === "HOME" ? "Home Expenses" : "Other Expenses"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-500">Date</span>
                  <span className="font-semibold text-slate-900">
                    {format(parseISO(viewedExpense.expenseDate), "MMMM d, yyyy")}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-slate-500">Description</span>
                  <p className="mt-2 rounded-2xl bg-[#f7f9ff] px-4 py-3 text-sm font-medium text-slate-700">
                    {viewedExpense.description ?? "No description added."}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (viewedExpense) {
                      handleEdit(viewedExpense);
                      setViewedExpense(null);
                    }
                  }}
                  className="h-12 flex-1 rounded-[18px] border-[#dde3f0] bg-white text-sm font-semibold text-slate-600 shadow-none hover:bg-slate-50"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Expense
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

