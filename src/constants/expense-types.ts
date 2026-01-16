export type ExpenseCategoryValue = "HOME" | "OTHER";

export interface ExpenseTypeOption {
  label: string;
  value: string;
  category: ExpenseCategoryValue;
}

export const EXPENSE_TYPE_OPTIONS: ExpenseTypeOption[] = [
  { label: "Transportation", value: "Transportation", category: "HOME" },
  { label: "Maintenance", value: "Maintenance", category: "OTHER" },
  { label: "Utilities", value: "Utilities", category: "HOME" },
  { label: "Insurance", value: "Insurance", category: "OTHER" },
  { label: "Logistics", value: "Logistics", category: "HOME" },
  { label: "Office Supplies", value: "Office Supplies", category: "OTHER" },
  { label: "Equipment", value: "Equipment", category: "HOME" },
  { label: "Miscellaneous", value: "Miscellaneous", category: "OTHER" },
];

const CATEGORY_BY_TYPE = new Map(EXPENSE_TYPE_OPTIONS.map((option) => [option.value, option.category]));
export const EXPENSE_TYPE_VALUES = EXPENSE_TYPE_OPTIONS.map((option) => option.value);

export function resolveExpenseCategory(expenseType: string): ExpenseCategoryValue {
  return CATEGORY_BY_TYPE.get(expenseType) ?? "HOME";
}

export const CATEGORY_LABELS: Record<ExpenseCategoryValue, string> = {
  HOME: "Home Expenses",
  OTHER: "Other Expenses",
};

