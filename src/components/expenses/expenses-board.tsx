"use client";

import { useEffect, useState } from "react";

import type { ExpenseListItem } from "@/types/expenses";
import { AddExpenseForm } from "./add-expense-form";
import { ExpensesTable } from "./expenses-table";

interface ExpensesBoardProps {
  expenses: ExpenseListItem[];
  page: number;
  totalPages: number;
  pageSize: number | string;
  pageSizeOptions: (number | string)[];
  totalExpense: number;
  expenseTypeFilter?: string;
  monthFilter?: string;
  yearFilter?: string;
}

export function ExpensesBoard({
  expenses,
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  totalExpense,
  expenseTypeFilter,
  monthFilter,
  yearFilter,
}: ExpensesBoardProps) {
  const [selectedExpense, setSelectedExpense] = useState<ExpenseListItem | undefined>();

  useEffect(() => {
    if (!selectedExpense) return;
    const match = expenses.find((expense) => expense.id === selectedExpense.id);
    setSelectedExpense(match);
  }, [expenses, selectedExpense]);

  return (
    <section className="grid min-w-0 gap-6 lg:grid-cols-[380px_1fr] xl:grid-cols-[420px_1fr]">
      <AddExpenseForm selectedExpense={selectedExpense} onClearSelection={() => setSelectedExpense(undefined)} />
      <div className="min-w-0">
        <ExpensesTable
          expenses={expenses}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={pageSizeOptions}
          totalExpense={totalExpense}
          expenseTypeFilter={expenseTypeFilter}
          onEditExpense={setSelectedExpense}
        />
      </div>
    </section>
  );
}

