/**
 * Export Utilities
 * 
 * Provides functions to export data to CSV and Excel formats.
 */

/**
 * Convert array of objects to CSV string
 */
export function arrayToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: string[]
): string {
  if (data.length === 0) return "";

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = csvHeaders.map((header) => `"${String(header).replace(/"/g, '""')}"`).join(",");
  
  // Create CSV data rows
  const dataRows = data.map((row) =>
    csvHeaders
      .map((header) => {
        const value = row[header];
        // Handle null, undefined, and complex objects
        const stringValue = value == null ? "" : String(value);
        // Escape quotes and wrap in quotes
        return `"${stringValue.replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Download data as CSV file
 */
export function downloadCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  const csv = arrayToCSV(data, headers);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Convert array of objects to Excel-compatible CSV (with BOM for UTF-8)
 */
export function downloadExcelCSV<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  headers?: string[]
): void {
  const csv = arrayToCSV(data, headers);
  // Add BOM for UTF-8 to ensure Excel opens it correctly
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Format date for CSV export
 */
export function formatDateForCSV(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Format currency for CSV export
 */
export function formatCurrencyForCSV(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return "0";
  return amount.toFixed(2);
}

/**
 * Export table data with common formatting
 */
export interface ExportOptions {
  filename: string;
  headers?: string[];
  formatDates?: boolean;
  formatCurrency?: boolean;
  dateFields?: string[];
  currencyFields?: string[];
}

export function exportTableData<T extends Record<string, unknown>>(
  data: T[],
  options: ExportOptions
): void {
  const {
    filename,
    headers,
    formatDates = true,
    formatCurrency = true,
    dateFields = ["createdAt", "updatedAt", "date", "deliveryDate", "expenseDate"],
    currencyFields = ["amount", "price", "total", "unitPrice"],
  } = options;

  // Format data
  const formattedData = data.map((row) => {
    const formatted: Record<string, unknown> = { ...row };
    
    if (formatDates) {
      dateFields.forEach((field) => {
        if (field in formatted) {
          formatted[field] = formatDateForCSV(formatted[field] as Date | string);
        }
      });
    }
    
    if (formatCurrency) {
      currencyFields.forEach((field) => {
        if (field in formatted && typeof formatted[field] === "number") {
          formatted[field] = formatCurrencyForCSV(formatted[field] as number);
        }
      });
    }
    
    return formatted;
  });

  downloadExcelCSV(formattedData, filename, headers);
}

