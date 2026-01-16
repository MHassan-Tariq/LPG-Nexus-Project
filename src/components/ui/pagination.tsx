"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number | string;
  onPageChange?: (page: number) => void;
  previousHref?: string;
  nextHref?: string;
  disabled?: boolean;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  previousHref,
  nextHref,
  disabled = false,
  className,
}: PaginationProps) {
  // Don't show pagination if showing all items or only one page
  if (pageSize === "all" || totalPages <= 1) {
    return null;
  }

  const isPreviousDisabled = currentPage === 1 || disabled;
  const isNextDisabled = currentPage === totalPages || disabled;

  const handlePrevious = () => {
    if (!isPreviousDisabled && onPageChange) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isNextDisabled && onPageChange) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {/* Previous Button */}
      {onPageChange ? (
        <Button
          type="button"
          variant="outline"
          disabled={isPreviousDisabled}
          onClick={handlePrevious}
          className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd] disabled:opacity-50"
        >
          Previous
        </Button>
      ) : previousHref && !isPreviousDisabled ? (
        <Button
          asChild
          variant="outline"
          className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
        >
          <Link href={previousHref}>Previous</Link>
        </Button>
      ) : (
        <span className="inline-flex h-9 items-center justify-center rounded-full border border-[#e4e8f3] px-4 text-sm font-medium text-slate-400">
          Previous
        </span>
      )}

      {/* Current Page Indicator */}
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1f64ff] text-sm font-semibold text-white">
        {currentPage}
      </div>

      {/* Next Button */}
      {onPageChange ? (
        <Button
          type="button"
          variant="outline"
          disabled={isNextDisabled}
          onClick={handleNext}
          className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd] disabled:opacity-50"
        >
          Next
        </Button>
      ) : nextHref && !isNextDisabled ? (
        <Button
          asChild
          variant="outline"
          className="h-9 rounded-full border border-[#dfe4f4] bg-white px-4 text-sm font-medium text-slate-500 hover:bg-[#f7f8fd]"
        >
          <Link href={nextHref}>Next</Link>
        </Button>
      ) : (
        <span className="inline-flex h-9 items-center justify-center rounded-full border border-[#e4e8f3] px-4 text-sm font-medium text-slate-400">
          Next
        </span>
      )}
    </div>
  );
}

interface PaginationInfoProps {
  currentPage: number;
  totalPages: number;
  pageSize: number | string;
  className?: string;
}

export function PaginationInfo({ currentPage, totalPages, pageSize, className }: PaginationInfoProps) {
  if (pageSize === "all") {
    return null;
  }

  return (
    <span className={className}>
      {currentPage} of {totalPages}
    </span>
  );
}
