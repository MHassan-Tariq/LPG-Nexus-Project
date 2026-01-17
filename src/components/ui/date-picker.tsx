"use client";

import { format } from "date-fns";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerWithInputProps {
  date?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
}

export function DatePickerWithInput({
  date,
  onChange,
  placeholder = "Select date",
  className,
  disabled,
  align = "start",
}: DatePickerWithInputProps) {
  const [open, setOpen] = useState(false);
  const label = useMemo(() => (date ? format(date, "MMMM d, yyyy") : placeholder), [date, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "flex h-12 w-full items-center justify-between rounded-[18px] border-[#dde3f0] bg-white px-4 text-left text-sm font-medium text-slate-700 hover:bg-white hover:text-slate-700",
            className,
          )}
        >
          <span className={cn(!date && "text-slate-400")}>{label}</span>
          <CalendarDays className="h-4 w-4 text-slate-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selected) => {
            onChange(selected);
            if (selected) {
              setOpen(false);
            }
          }}
          initialFocus
          captionLayout="dropdown"
          startMonth={new Date(2020, 0)}
          endMonth={new Date(2035, 11)}
        />
      </PopoverContent>
    </Popover>
  );
}

