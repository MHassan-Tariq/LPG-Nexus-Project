export const dynamic = "force-dynamic";
export const revalidate = 0;

import { addDays, format, parseISO, startOfDay } from "date-fns";

import { DailyNotesClient } from "@/components/notes/daily-notes-client";
import { prisma } from "@/lib/prisma";
import { enforcePagePermission } from "@/lib/permission-check";
import type { NoteSectionInput } from "@/lib/validations/notes";
import { getTenantFilter } from "@/core/tenant/tenant-queries";

interface NotesPageProps {
  searchParams: Record<string, string | undefined>;
}

const SECTION_TEMPLATES = [
  { id: "deliveries", title: "Deliveries" },
  { id: "expenses", title: "Expenses" },
  { id: "customers", title: "Customers" },
  { id: "cylinder-summary", title: "Cylinder Summary" },
  { id: "personal-tasks", title: "Personal Tasks" },
];

function getSelectedDate(dateParam?: string) {
  if (dateParam) {
    const parsed = parseISO(dateParam);
    if (!Number.isNaN(parsed.getTime())) {
      return startOfDay(parsed);
    }
  }
  return startOfDay(new Date());
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  // Check permissions before rendering
  await enforcePagePermission("/notes");
  const selectedDate = getSelectedDate(searchParams.date);
  const tenantFilter = await getTenantFilter();
  
  const [noteRecord, totalNotes] = await Promise.all([
    prisma.dailyNote.findFirst({
      where: {
        ...tenantFilter,
        noteDate: selectedDate,
      },
    }),
    prisma.dailyNote.count({ where: tenantFilter }),
  ]);

  const sections = (noteRecord?.sections as NoteSectionInput[] | null) ?? [
    { id: "daily-note", title: "Daily Note", content: "" },
  ];

  const initialNote = {
    id: noteRecord?.id ?? null,
    date: selectedDate.toISOString(),
    sections,
    labels: noteRecord?.labels ?? [],
    characterCount: noteRecord?.characterCount ?? 0,
    lastModified: noteRecord?.updatedAt?.toISOString() ?? null,
    status: (noteRecord ? "Saved" : "Not saved") as "Saved" | "Not saved",
  };

  const summary = {
    totalNotes,
    currentStatus: (noteRecord ? "Saved" : "Not saved") as "Saved" | "Not saved",
    lastModified: noteRecord?.updatedAt?.toISOString() ?? null,
  };

  return (
    <DailyNotesClient
      selectedDateISO={selectedDate.toISOString()}
      initialNote={initialNote}
      summary={summary}
      availableSections={SECTION_TEMPLATES}
    />
  );
}

