"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { resolveExpenseCategory } from "@/constants/expense-types";
import { prisma } from "@/lib/prisma";
import { expenseFormSchema, updateExpenseSchema } from "@/lib/validators";
import { getTenantIdForCreate, canAccessTenantData } from "@/lib/tenant-utils";
// Core utilities
import { requireEditPermissionForAction } from "@/core/permissions/permission-guards";

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

export async function createExpenseAction(values: ExpenseFormValues) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("expenses");
    if (permissionError) {
      return permissionError;
    }

    const parsed = expenseFormSchema.parse(values);

    // Use custom expense type if CUSTOM is selected, otherwise use the selected type
    const finalExpenseType = parsed.expenseType === "CUSTOM" 
      ? (parsed.customExpenseType || parsed.expenseType)
      : parsed.expenseType;

    const adminId = await getTenantIdForCreate();
    await prisma.expense.create({
      data: {
        expenseType: finalExpenseType,
        amount: parsed.amount,
        category: resolveExpenseCategory(finalExpenseType),
        expenseDate: parsed.expenseDate,
        description: parsed.description ?? null,
        adminId,
      },
    });

    revalidatePath("/expenses");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating expense:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid expense data." };
    }
    
    // Handle Prisma errors
    if (error?.code === "P2002") {
      return { success: false, error: "An expense with this data already exists." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to create expense." };
  }
}

const deleteExpenseSchema = z.object({
  id: z.string().min(1, "Expense ID is required"),
});

export async function deleteExpenseAction(input: z.infer<typeof deleteExpenseSchema>) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("expenses");
    if (permissionError) {
      return permissionError;
    }

    const parsed = deleteExpenseSchema.parse(input);

    // Check if expense exists first
    const expense = await prisma.expense.findUnique({
      where: { id: parsed.id },
      select: { adminId: true },
    });

    if (!expense) {
      return { success: false, error: "Expense not found." };
    }

    // Verify access to this expense's tenant data
    if (!(await canAccessTenantData(expense.adminId))) {
      return { success: false, error: "You do not have permission to delete this expense." };
    }

    await prisma.expense.delete({
      where: { id: parsed.id },
    });

    revalidatePath("/expenses");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid expense ID." };
    }
    
    // Handle Prisma errors
    if (error?.code === "P2025") {
      return { success: false, error: "Expense not found." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to delete expense." };
  }
}


export async function updateExpenseAction(data: z.infer<typeof updateExpenseSchema>) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("expenses");
    if (permissionError) {
      return permissionError;
    }

    const parsed = updateExpenseSchema.parse(data);

    // Check if expense exists first
    const expense = await prisma.expense.findUnique({
      where: { id: parsed.id },
      select: { adminId: true },
    });

    if (!expense) {
      return { success: false, error: "Expense not found." };
    }

    // Verify access to this expense's tenant data
    if (!(await canAccessTenantData(expense.adminId))) {
      return { success: false, error: "You do not have permission to update this expense." };
    }

    // Use custom expense type if CUSTOM is selected, otherwise use the selected type
    const finalExpenseType = parsed.expenseType === "CUSTOM" 
      ? (parsed.customExpenseType || parsed.expenseType)
      : parsed.expenseType;

    await prisma.expense.update({
      where: { id: parsed.id },
      data: {
        expenseType: finalExpenseType,
        amount: parsed.amount,
        category: resolveExpenseCategory(finalExpenseType),
        expenseDate: parsed.expenseDate,
        description: parsed.description ?? null,
      },
    });

    revalidatePath("/expenses");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating expense:", error);
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid expense data." };
    }
    
    // Handle Prisma errors
    if (error?.code === "P2025") {
      return { success: false, error: "Expense not found." };
    }
    
    if (error?.code === "P2002") {
      return { success: false, error: "An expense with this data already exists." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to update expense." };
  }
}

