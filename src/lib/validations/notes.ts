import { z } from "zod";

export const noteSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().optional().default(""),
});

export const dailyNoteSchema = z.object({
  noteDate: z.string().min(4),
  sections: z.array(noteSectionSchema).min(1),
  labels: z.array(z.string().min(1)).max(5).optional().default([]),
});

export type NoteSectionInput = z.infer<typeof noteSectionSchema>;
export type DailyNoteInput = z.infer<typeof dailyNoteSchema>;


