import type { ExpenseCategoryValue } from "@/constants/expense-types";

export type ExpenseListItem = {
  id: string;
  expenseType: string;
  amount: number;
  category: ExpenseCategoryValue;
  expenseDate: string;
  description: string | null;
};

