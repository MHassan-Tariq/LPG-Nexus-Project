/**
 * Core Table Pattern Utilities
 * 
 * Shared patterns and types for table components.
 * Provides consistent structure without changing UI.
 */

/**
 * Standard table column definition
 */
export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

/**
 * Standard table props
 */
export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

/**
 * Pagination state for tables
 */
export interface TablePaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Search state for tables
 */
export interface TableSearchState {
  query: string;
  resolvedQuery: string;
  debounceMs?: number;
}

/**
 * Standard table configuration
 */
export interface TableConfig {
  defaultPageSize: number;
  pageSizeOptions: number[];
  debounceMs: number;
  emptyMessage: string;
}

/**
 * Default table configuration
 */
export const DEFAULT_TABLE_CONFIG: TableConfig = {
  defaultPageSize: 10,
  pageSizeOptions: [10, 20, 50, 100],
  debounceMs: 400,
  emptyMessage: "No data available",
};

