"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportTableData, ExportOptions } from "@/lib/export-utils";
import { useState } from "react";

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  options: ExportOptions;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  disabled?: boolean;
}

/**
 * Export Button Component
 * 
 * Provides a button to export table data to CSV/Excel format.
 */
export function ExportButton<T extends Record<string, unknown>>({
  data,
  options,
  variant = "outline",
  size = "default",
  className,
  disabled = false,
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    if (data.length === 0) {
      return;
    }

    setIsExporting(true);
    try {
      exportTableData(data, options);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isExporting || data.length === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
}

