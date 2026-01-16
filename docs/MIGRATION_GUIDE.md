# Migration Guide - Using New Utilities

This guide helps you migrate existing code to use the new utilities and improvements.

---

## 1. Migrating to Centralized Logger

### Before:
```ts
console.error("Error occurred", error);
console.warn("Warning message");
console.info("Info message");
```

### After:
```ts
import { log } from "@/lib/logger";

log.error("Error occurred", error, { context: "additional info" });
log.warn("Warning message", { context: "additional info" });
log.info("Info message", { context: "additional info" });
log.debug("Debug message", { context: "additional info" });
```

### Benefits:
- Structured logging with context
- Ready for external logging services
- Better debugging capabilities

---

## 2. Migrating to API Retry Logic

### Before:
```ts
const response = await fetch("/api/customers");
if (!response.ok) {
  throw new Error("Request failed");
}
const data = await response.json();
```

### After:
```ts
import { apiFetchJson } from "@/lib/api-retry";

// Automatically retries on failure
const data = await apiFetchJson<Customer[]>("/api/customers");

// With custom retry options
const data = await apiFetchJson<Customer[]>(
  "/api/customers",
  { method: "GET" },
  { maxRetries: 3, initialDelay: 1000 }
);
```

### Benefits:
- Automatic retry on transient failures
- Exponential backoff
- Better network resilience

---

## 3. Adding Loading Skeletons

### Before:
```tsx
{isLoading && <div>Loading...</div>}
{!isLoading && <Table data={data} />}
```

### After:
```tsx
import { TableSkeleton } from "@/components/ui/skeleton-loader";

{isLoading && data.length === 0 ? (
  <TableSkeleton rows={5} columns={5} />
) : (
  <Table data={data} />
)}
```

### Available Skeletons:
- `<Skeleton />` - Basic skeleton
- `<TableSkeleton rows={5} columns={5} />` - Table skeleton
- `<CardSkeleton />` - Card skeleton
- `<ListSkeleton items={5} />` - List skeleton

---

## 4. Using Enhanced Form Fields

### Before:
```tsx
<FormField
  control={control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

### After:
```tsx
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper";

<FormFieldWrapper
  control={control}
  name="email"
  label="Email"
  description="Enter your email address"
  required
>
  <Input {...field} />
</FormFieldWrapper>
```

### Benefits:
- Real-time validation feedback
- Visual indicators (green checkmark on valid)
- Consistent styling
- Less boilerplate

---

## 5. Adding Keyboard Shortcuts

### Usage:
```tsx
import { useKeyboardShortcuts, CommonShortcuts } from "@/hooks/use-keyboard-shortcuts";

function MyComponent() {
  useKeyboardShortcuts([
    {
      ...CommonShortcuts.SAVE,
      action: () => handleSave(),
    },
    {
      ...CommonShortcuts.ESCAPE,
      action: () => handleClose(),
    },
    {
      key: "s",
      ctrl: true,
      shift: true,
      action: () => handleSaveAs(),
      description: "Save As (Ctrl+Shift+S)",
    },
  ]);

  return <div>...</div>;
}
```

---

## 6. Adding Export Functionality

### Usage:
```tsx
import { ExportButton } from "@/components/ui/export-button";

<ExportButton
  data={customers}
  options={{
    filename: "customers-export",
    headers: ["Name", "Email", "Phone", "Status"],
    formatDates: true,
    dateFields: ["createdAt", "updatedAt"],
    formatCurrency: true,
    currencyFields: ["amount", "total"],
  }}
/>
```

---

## 7. Wrapping Components with Error Boundaries

### Root Level (Already Done):
The root layout already has an ErrorBoundary.

### Component Level:
```tsx
import { ErrorBoundary } from "@/components/error-boundary";

<ErrorBoundary
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    // Custom error handling
  }}
>
  <YourComponent />
</ErrorBoundary>
```

---

## 8. Applying Database Indexes

### Step 1: Review the migration
Check `prisma/migrations/add_performance_indexes/migration.sql`

### Step 2: Apply the migration
```bash
cd next-app

# Option 1: Push directly (development)
npx prisma db push

# Option 2: Create migration (production)
npx prisma migrate dev --name add_performance_indexes
```

### Step 3: Verify
```bash
npx prisma studio
# Check that indexes are created
```

---

## Migration Checklist

### Components to Migrate:
- [ ] Replace `console.error` with `log.error()`
- [ ] Replace `fetch()` with `apiFetch()` or `apiFetchJson()`
- [ ] Add loading skeletons to data-fetching components
- [ ] Add error boundaries to critical sections
- [ ] Use `FormFieldWrapper` in forms
- [ ] Add keyboard shortcuts where appropriate
- [ ] Add export buttons to tables

### Files Already Migrated:
- ✅ `src/components/dashboard/cylinder-table.tsx`
- ✅ `src/components/dashboard/forms/create-cylinder-form.tsx`
- ✅ `src/components/dashboard/forms/log-transaction-form.tsx`
- ✅ `src/components/dashboard/pdf-download.tsx`
- ✅ `src/components/dashboard/otp-card.tsx`
- ✅ `src/components/super-admin/user-management-panel.tsx`

### Files to Migrate Next:
- [ ] `src/components/add-customer/customer-table-client.tsx`
- [ ] `src/components/payments/payment-table.tsx`
- [ ] `src/components/expenses/expenses-table.tsx`
- [ ] `src/components/inventory/inventory-table-client.tsx`
- [ ] Other components with `fetch()` calls

---

## Quick Reference

### Import Statements:
```ts
// Logger
import { log } from "@/lib/logger";

// API Retry
import { apiFetch, apiFetchJson } from "@/lib/api-retry";

// Skeletons
import { Skeleton, TableSkeleton, CardSkeleton, ListSkeleton } from "@/components/ui/skeleton-loader";

// Form Fields
import { FormFieldWrapper } from "@/components/ui/form-field-wrapper";

// Keyboard Shortcuts
import { useKeyboardShortcuts, CommonShortcuts } from "@/hooks/use-keyboard-shortcuts";

// Export
import { ExportButton, exportTableData } from "@/components/ui/export-button";
import { downloadCSV, downloadExcelCSV } from "@/lib/export-utils";

// Error Boundary
import { ErrorBoundary } from "@/components/error-boundary";
```

---

## Benefits Summary

1. **Better Error Handling**: Error boundaries prevent crashes
2. **Network Resilience**: Retry logic handles transient failures
3. **Better Debugging**: Structured logging with context
4. **Faster Queries**: Database indexes improve performance
5. **Better UX**: Loading skeletons improve perceived performance
6. **User Productivity**: Keyboard shortcuts and export functionality
7. **Form Validation**: Real-time feedback improves user experience

---

**Status**: Migration in progress. See checklist above for remaining items.

