"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { addDays, format } from "date-fns";
import { BookOpenCheck, Check, Plus, Trash2 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { saveDailyNote } from "@/app/notes/actions";
import { Button } from "@/components/ui/button";
import { DatePickerWithInput } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NoteSectionInput } from "@/lib/validations/notes";

const LABEL_OPTIONS = [
  { value: "Important", classes: "bg-[#fee4e2] text-[#b42318]" },
  { value: "Reminder", classes: "bg-[#fff4d6] text-[#b35700]" },
  { value: "Follow-up", classes: "bg-[#e1efff] text-[#1d4ed8]" },
];

interface DailyNotesClientProps {
  selectedDateISO: string;
  initialNote: {
    id: string | null;
    date: string;
    sections: NoteSectionInput[];
    labels: string[];
    characterCount: number;
    lastModified: string | null;
    status: "Saved" | "Not saved";
  };
  summary: {
    totalNotes: number;
    currentStatus: string;
    lastModified: string | null;
  };
  availableSections: { id: string; title: string }[];
}

export function DailyNotesClient({ selectedDateISO, initialNote, summary, availableSections }: DailyNotesClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedDate = new Date(selectedDateISO);
  const [sections, setSections] = useState<NoteSectionInput[]>(ensureSections(initialNote.sections));
  const [labels, setLabels] = useState<string[]>(initialNote.labels ?? []);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(initialNote.status === "Saved" ? "saved" : "idle");
  const [summaryState, setSummaryState] = useState(summary);
  const [hasExistingRecord, setHasExistingRecord] = useState(initialNote.status === "Saved");
  const [message, setMessage] = useState<string | null>(null);
  const [transitionClass, setTransitionClass] = useState<string>("");
  const [showCustomSectionInput, setShowCustomSectionInput] = useState(false);
  const [customSectionName, setCustomSectionName] = useState("");
  const [calculatorDisplay, setCalculatorDisplay] = useState("0");
  const [calculatorHistory, setCalculatorHistory] = useState<string[]>([]);
  const previousDateRef = useRef(selectedDateISO);
  const previousNoteDateRef = useRef(initialNote.date);
  const [isSaving, startSaving] = useTransition();
  const [isNavigating, startNavigating] = useTransition();

  useEffect(() => {
    const prevISO = previousDateRef.current;
    if (prevISO !== selectedDateISO) {
      const prev = new Date(prevISO);
      const next = new Date(selectedDateISO);
      setTransitionClass(next > prev ? "animate-note-slide-left" : "animate-note-slide-right");
      previousDateRef.current = selectedDateISO;
      const timer = setTimeout(() => setTransitionClass(""), 450);
    }
  }, [selectedDateISO]);

  useEffect(() => {
    // Only reset sections/labels when the note date actually changes
    if (initialNote.date !== previousNoteDateRef.current) {
      setSections(ensureSections(initialNote.sections));
      setLabels(initialNote.labels ?? []);
      setSaveState(initialNote.status === "Saved" ? "saved" : "idle");
      setHasExistingRecord(initialNote.status === "Saved");
      previousNoteDateRef.current = initialNote.date;
    }
    setSummaryState((prev) => ({
      ...prev,
      currentStatus: initialNote.status,
      lastModified: initialNote.lastModified,
    }));
  }, [initialNote]);

  const characterCount = useMemo(
    () => sections.reduce((total, section) => total + (section.content?.length ?? 0), 0),
    [sections],
  );

  async function handleSave() {
    // Always use the currently selected date, not the initial note date
    const payload = {
      noteDate: selectedDateISO,
      sections,
      labels,
    };

    setMessage(null);
    setSaveState("saving");
    startSaving(async () => {
      try {
        const result = await saveDailyNote(payload);
        setSaveState("saved");
        setMessage("Note saved");
        setSummaryState((prev) => ({
          ...prev,
          currentStatus: "Saved",
          totalNotes: hasExistingRecord ? prev.totalNotes : prev.totalNotes + 1,
          lastModified: result.updatedAt ?? prev.lastModified,
        }));
        setHasExistingRecord(true);
        setTimeout(() => setMessage(null), 2500);
      } catch (error) {
        console.error("Error saving note:", error);
        setSaveState("idle");
        setMessage("Error saving note. Please try again.");
        setTimeout(() => setMessage(null), 3000);
      }
    });
  }

  function handleDiscard() {
    setSections(ensureSections(initialNote.sections));
    setLabels(initialNote.labels ?? []);
    setSaveState(initialNote.status === "Saved" ? "saved" : "idle");
    setMessage("Changes discarded");
    setTimeout(() => setMessage(null), 2500);
  }

  function toggleLabel(label: string) {
    setLabels((current) => {
      if (current.includes(label)) {
        return current.filter((item) => item !== label);
      }
      return [...current, label];
    });
    setSaveState("idle");
  }

  function updateSectionContent(id: string, content: string) {
    setSections((current) => current.map((section) => (section.id === id ? { ...section, content } : section)));
    setSaveState("idle");
  }

  function addSection(templateId: string) {
    const template = availableSections.find((section) => section.id === templateId);
    if (!template) return;
    
    setSections((current) => {
      // Check if this section type already exists (exact match or starts with template ID)
      const exists = current.some((section) => {
        return section.id === templateId || section.id.startsWith(`${templateId}-`);
      });
      
      if (exists) {
        return current;
      }
      
      // Add the new section
      const newSection = { id: templateId, title: template.title, content: "" };
      return [...current, newSection];
    });
    setSaveState("idle");
  }

  function handleAddCustomSection() {
    const trimmedName = customSectionName.trim();
    if (!trimmedName) {
      setMessage("Please enter a section name");
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    const customId = `custom-${Date.now()}-${trimmedName.toLowerCase().replace(/\s+/g, "-")}`;
    
    setSections((current) => {
      // Check if a section with this name already exists
      const exists = current.some((section) => section.title.toLowerCase() === trimmedName.toLowerCase());
      if (exists) {
        setMessage("A section with this name already exists");
        setTimeout(() => setMessage(null), 2000);
        return current;
      }
      
      // Add the custom section
      const newSection = { id: customId, title: trimmedName, content: "" };
      return [...current, newSection];
    });
    
    setCustomSectionName("");
    setShowCustomSectionInput(false);
    setSaveState("idle");
  }

  function handleCancelCustomSection() {
    setCustomSectionName("");
    setShowCustomSectionInput(false);
  }

  function handleCalculatorInput(value: string) {
    setCalculatorDisplay((prev) => {
      if (prev === "0" && value !== ".") {
        return value;
      }
      if (prev === "Error") {
        return value;
      }
      // Prevent multiple decimal points in a number
      if (value === "." && prev.includes(".") && !prev.match(/[+\-×÷]/)) {
        return prev;
      }
      return prev + value;
    });
  }

  function handleCalculatorOperation(operation: string) {
    if (operation === "C") {
      setCalculatorDisplay("0");
      setCalculatorHistory([]);
      return;
    }

    if (operation === "=") {
      try {
        // Replace display symbols with JavaScript operators
        let expression = calculatorDisplay.replace(/×/g, "*").replace(/÷/g, "/");
        // Remove trailing operators
        expression = expression.replace(/[+\-*/]$/, "");
        if (!expression) {
          setCalculatorDisplay("0");
          return;
        }
        const result = Function(`"use strict"; return (${expression})`)();
        const formattedResult = Number.isInteger(result) ? String(result) : result.toFixed(2);
        setCalculatorHistory((prev) => [...prev.slice(-2), `${calculatorDisplay} = ${formattedResult}`]);
        setCalculatorDisplay(formattedResult);
      } catch (error) {
        setCalculatorDisplay("Error");
        setTimeout(() => setCalculatorDisplay("0"), 2000);
      }
      return;
    }

    if (operation === "⌫") {
      setCalculatorDisplay((prev) => {
        if (prev === "Error" || prev.length === 1) return "0";
        return prev.slice(0, -1);
      });
      return;
    }

    // Handle operations
    setCalculatorDisplay((prev) => {
      if (prev === "Error") return "0" + operation;
      const lastChar = prev[prev.length - 1];
      if (["+", "-", "×", "÷"].includes(lastChar)) {
        return prev.slice(0, -1) + operation;
      }
      return prev + operation;
    });
  }

  function removeSection(id: string) {
    if (sections.length === 1) {
      setSections([{ id: "daily-note", title: "Daily Note", content: "" }]);
      setSaveState("idle");
      return;
    }
    setSections((current) => current.filter((section) => section.id !== id));
    setSaveState("idle");
  }

  function navigateTo(date: Date) {
    const nextDate = format(date, "yyyy-MM-dd");
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("date", nextDate);
    startNavigating(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  function handleDateChange(date?: Date) {
    if (!date) return;
    navigateTo(date);
  }

  const formattedDate = format(selectedDate, "EEEE, MMMM d, yyyy");
  const formattedSummaryDate = summaryState.lastModified
    ? format(new Date(summaryState.lastModified), "MMM d, yyyy 'at' p")
    : "Never";

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[32px] border border-[#edf0f7] bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#f1f4fb] pb-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#eef2ff] p-3 text-[#3955ff]">
              <BookOpenCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">Daily Notes</h2>
              <p className="text-sm text-slate-500">Your digital notebook for {formattedDate}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-[#e0e6f4] px-5 text-sm font-semibold text-slate-600"
              disabled={isNavigating}
              onClick={() => navigateTo(addDays(selectedDate, -1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-[#e0e6f4] px-5 text-sm font-semibold text-slate-600"
              disabled={isNavigating}
              onClick={() => navigateTo(new Date())}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-[#e0e6f4] px-5 text-sm font-semibold text-slate-600"
              disabled={isNavigating}
              onClick={() => navigateTo(addDays(selectedDate, 1))}
            >
              Next
            </Button>
            <DatePickerWithInput
              date={selectedDate}
              onChange={handleDateChange}
              className="h-11 rounded-full border-[#e0e6f4] bg-white px-5 text-sm font-semibold"
              disabled={isNavigating}
              align="end"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {LABEL_OPTIONS.map((label) => (
              <button
                key={label.value}
                type="button"
                onClick={() => toggleLabel(label.value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-semibold transition",
                  label.classes,
                  labels.includes(label.value) ? "ring-2 ring-offset-2 ring-offset-white ring-[#1c5bff]" : "opacity-80 hover:opacity-100",
                )}
              >
                {labels.includes(label.value) && <Check className="h-3 w-3" />}
                {label.value}
              </button>
            ))}
          </div>

          <div
            className={cn(
              "rounded-[32px] border border-[#e1e6f5] bg-[#f8f9ff] p-6 shadow-inner transition",
              transitionClass,
            )}
          >
            <div className="space-y-8">
              {sections.map((section) => (
                <div key={section.id} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">Section</p>
                      <h3 className="text-lg font-semibold text-slate-800">{section.title}</h3>
                    </div>
                    {section.id !== "daily-note" && (
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-2 rounded-full border border-[#f1cfd2] bg-white px-3 text-xs font-semibold text-[#c2414c]"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                  <Textarea
                    value={section.content ?? ""}
                    onChange={(event) => updateSectionContent(section.id, event.target.value)}
                    placeholder="Write your note..."
                    className="min-h-[220px] rounded-[28px] border border-[#e4e7f3] bg-white px-5 py-4 text-base text-slate-700 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-[#b2c5ff]"
                  />
                </div>
              ))}
            </div>
          </div>

          {message && <p className="text-sm font-medium text-emerald-600">{message}</p>}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-slate-500">{characterCount} characters</p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-[18px] border border-slate-200 text-sm font-semibold text-slate-600"
                onClick={handleDiscard}
              >
                Discard Changes
              </Button>
              <Button
                type="button"
                disabled={isSaving || saveState === "saved"}
                onClick={handleSave}
                className="h-11 rounded-[18px] bg-[#6b7dff] px-8 text-sm font-semibold text-white hover:bg-[#5867ff] disabled:opacity-60"
              >
                {saveState === "saved" ? "Saved" : saveState === "saving" ? "Saving..." : "Save Note"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="rounded-[28px] border border-[#edf0f7] bg-white p-5 shadow-sm lg:col-span-1">
          <p className="text-xs uppercase tracking-wide text-slate-400">Summary</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-xs text-slate-500">Total Notes</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{summaryState.totalNotes}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Current Note</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{summaryState.currentStatus}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Last Modified</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{formattedSummaryDate}</p>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-[#edf0f7] bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Calculator</p>
            <p className="text-base font-semibold text-slate-800">Quick calculations</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-[20px] border border-[#e1e6f5] bg-[#f8f9ff] p-4">
              <div className="mb-2 min-h-[60px] rounded-[16px] bg-white px-4 py-3 text-right">
                <p className="text-2xl font-semibold text-slate-900 break-all">{calculatorDisplay}</p>
              </div>
              {calculatorHistory.length > 0 && (
                <div className="mt-2 max-h-24 overflow-y-auto space-y-1">
                  {calculatorHistory.slice(-3).map((entry, idx) => (
                    <p key={idx} className="text-xs text-slate-500 text-right">{entry}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleCalculatorOperation("C")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-[#fee4e2] text-lg font-semibold text-[#b42318] transition hover:bg-[#fdd4d0]"
              >
                C
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorOperation("⌫")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-[#fff4d6] text-lg font-semibold text-[#b35700] transition hover:bg-[#ffeed0]"
              >
                ⌫
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorOperation("÷")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-[#e1efff] text-lg font-semibold text-[#1d4ed8] transition hover:bg-[#d0e5ff]"
              >
                ÷
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorOperation("×")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-[#e1efff] text-lg font-semibold text-[#1d4ed8] transition hover:bg-[#d0e5ff]"
              >
                ×
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("7")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                7
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("8")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                8
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("9")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                9
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorOperation("-")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-[#e1efff] text-lg font-semibold text-[#1d4ed8] transition hover:bg-[#d0e5ff]"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("4")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                4
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("5")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                5
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("6")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                6
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorOperation("+")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-[#e1efff] text-lg font-semibold text-[#1d4ed8] transition hover:bg-[#d0e5ff]"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("1")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                1
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("2")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                2
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("3")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                3
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorOperation("=")}
                className="h-[104px] rounded-[16px] border border-[#1c5bff] bg-[#1c5bff] text-lg font-semibold text-white transition hover:bg-[#1647c4] row-span-2"
                style={{ gridRow: "span 2" }}
              >
                =
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput("0")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50 col-span-2"
                style={{ gridColumn: "span 2" }}
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleCalculatorInput(".")}
                className="h-12 rounded-[16px] border border-[#e1e6f5] bg-white text-lg font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                .
              </button>
            </div>
          </div>
        </div>
        <div className="rounded-[28px] border border-[#edf0f7] bg-white p-5 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Sections Panel</p>
              <p className="text-base font-semibold text-slate-800">Insert dividers</p>
            </div>
            {!showCustomSectionInput && (
              <button
                type="button"
                onClick={() => setShowCustomSectionInput(true)}
                className="rounded-full bg-[#eef2ff] p-2 text-[#1c5bff] transition hover:bg-[#e0e7ff] focus:outline-none focus:ring-2 focus:ring-[#1c5bff] focus:ring-offset-2"
                aria-label="Add custom section"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-3 text-sm text-slate-500">Create custom sections to organize your notes.</p>
          {!showCustomSectionInput && (
            <div className="mt-4 flex flex-col gap-2">
              {availableSections.map((template) => {
                const isAdded = sections.some(
                  (section) => section.id === template.id || section.id.startsWith(`${template.id}-`),
                );
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => addSection(template.id)}
                    disabled={isAdded}
                    className={cn(
                      "rounded-[12px] border px-3 py-2 text-left text-sm font-medium transition",
                      isAdded
                        ? "cursor-not-allowed border-[#e1e6f5] bg-slate-50 text-slate-400"
                        : "border-[#e1e6f5] bg-white text-slate-700 hover:border-[#1c5bff] hover:bg-[#f0f4ff] hover:text-[#1c5bff]",
                    )}
                  >
                    {template.title}
                  </button>
                );
              })}
            </div>
          )}
          {showCustomSectionInput && (
            <div className="mt-4 flex flex-col gap-3">
              <Input
                type="text"
                placeholder="Enter section name"
                value={customSectionName}
                onChange={(e) => setCustomSectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddCustomSection();
                  } else if (e.key === "Escape") {
                    handleCancelCustomSection();
                  }
                }}
                className="h-11 rounded-[16px] border-[#dde3f0] bg-white px-4 text-sm font-medium text-slate-700 focus-visible:ring-2 focus-visible:ring-[#1c5bff]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleAddCustomSection}
                  className="h-10 flex-1 rounded-[16px] bg-[#1c5bff] text-sm font-semibold text-white hover:bg-[#1647c4]"
                >
                  Add Section
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelCustomSection}
                  className="h-10 rounded-[16px] border border-[#dde3f0] bg-white text-sm font-semibold text-slate-600"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function ensureSections(sections: NoteSectionInput[]) {
  if (!sections || sections.length === 0) {
    return [{ id: "daily-note", title: "Daily Note", content: "" }];
  }
  return sections.map((section) => ({
    ...section,
    content: section.content ?? "",
  }));
}

