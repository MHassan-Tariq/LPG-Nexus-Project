/**
 * Expense Validation Schemas
 * 
 * Centralized expense-related Zod schemas.
 */

import { z } from "zod";

const baseExpenseFormSchema = z.object({
  expenseType: z.string().min(2, "Select expense type").max(80),
  customExpenseType: z.string().max(80).optional().default(""),
  amount: z.coerce.number().int().min(1).max(50_000_000),
  expenseDate: z.coerce.date({ errorMap: () => ({ message: "Select expense date" }) }),
  description: z.string().max(240).optional().nullable(),
});

export const expenseFormSchema = baseExpenseFormSchema.refine((data) => {
  // If expenseType is CUSTOM, customExpenseType must be provided
  if (data.expenseType === "CUSTOM") {
    return data.customExpenseType && data.customExpenseType.trim().length >= 2;
  }
  return true;
}, {
  message: "Please enter a custom expense type (minimum 2 characters)",
  path: ["customExpenseType"],
});

export const updateExpenseSchema = baseExpenseFormSchema.extend({
  id: z.string().cuid(),
}).refine((data) => {
  // If expenseType is CUSTOM, customExpenseType must be provided
  if (data.expenseType === "CUSTOM") {
    return data.customExpenseType && data.customExpenseType.trim().length >= 2;
  }
  return true;
}, {
  message: "Please enter a custom expense type (minimum 2 characters)",
  path: ["customExpenseType"],
});

export const expenseFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  category: z.enum(["HOME", "OTHER"]).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  q: z.string().trim().min(1).max(120).optional(),
});

