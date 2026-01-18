"use server";

import { revalidatePath } from "next/cache";
import { format, parseISO, startOfDay } from "date-fns";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { dailyNoteSchema } from "@/lib/validations/notes";
import { getTenantIdForCreate } from "@/lib/tenant-utils";
// Core utilities
import { requireEditPermissionForAction } from "@/core/permissions/permission-guards";

export async function saveDailyNote(values: unknown) {
  try {
    // Check edit permission using core utility
    const permissionError = await requireEditPermissionForAction("notes");
    if (permissionError) {
      return permissionError;
    }

    const parsed = dailyNoteSchema.parse(values);
  
  // Normalize the date consistently - handle both ISO strings and Date objects
  let noteDate: Date;
  if (typeof parsed.noteDate === "string") {
    noteDate = startOfDay(parseISO(parsed.noteDate));
  } else {
    noteDate = startOfDay(new Date(parsed.noteDate));
  }
  
  // Ensure we have a valid date
  if (Number.isNaN(noteDate.getTime())) {
    throw new Error("Invalid date provided");
  }

  const sections = parsed.sections.map((section) => ({
    ...section,
    content: section.content ?? "",
  }));

  const characterCount = sections.reduce((sum, section) => sum + section.content.length, 0);
  const noteText = sections.map((section) => section.content).join("\n\n");
  const labels = parsed.labels ?? [];
  const adminId = await getTenantIdForCreate();

  // Upsert only affects the specific date - other dates are safe (with tenant filter)
  const stored = await prisma.dailyNote.upsert({
    where: {
      adminId_noteDate: {
        adminId,
        noteDate,
      },
    },
    update: {
      sections,
      labels,
      noteText,
      characterCount,
    },
    create: {
      noteDate,
      sections,
      labels,
      noteText,
      characterCount,
      adminId,
    },
  });

    // Only revalidate the specific date's page
    revalidatePath(`/notes?date=${format(noteDate, "yyyy-MM-dd")}`);
    revalidatePath("/notes"); // Also revalidate the base path for summary counts
    
    return { success: true, updatedAt: stored.updatedAt };
  } catch (error: any) {
    console.error("Error saving daily note:", error);
    
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Invalid note data." };
    }
    
    if (error?.code === "P1001" || error?.code === "P1017") {
      return { success: false, error: "Database connection error. Please try again." };
    }
    
    return { success: false, error: error?.message || "Failed to save note." };
  }
}

