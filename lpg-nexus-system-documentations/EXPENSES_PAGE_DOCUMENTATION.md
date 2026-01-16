# Expenses Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Server-Side Data Fetching](#server-side-data-fetching)
4. [Client-Side Components](#client-side-components)
5. [Expense Categories](#expense-categories)
6. [Data Validation](#data-validation)
7. [UI Features](#ui-features)

---

## Overview

The **Expenses** page (`/expenses`) manages all business expenses in the LPG Nexus system. It allows you to:
- Add new expenses
- Edit existing expenses
- Delete expenses
- View expenses by category
- Filter by month/year
- Track expense totals
- Categorize expenses (HOME, OTHER)

### Dynamic Welcome Text

The page header displays a dynamic welcome message based on the software name setting:
- **Format**: "Welcome to {softwareName}"
- **Source**: Fetched from `SystemSettings` table
- **Default**: "Welcome to LPG Nexus" (if no software name is set)
- **Updates**: Automatically when software name is changed in Settings

---

## Page Structure

### File Organization

```
src/app/expenses/
├── page.tsx                    # Main server component
└── actions.ts                  # Server actions (create, update, delete)

src/components/expenses/
├── expenses-board.tsx          # Main board component
├── add-expense-form.tsx        # Form for create/edit
├── expenses-table.tsx          # Table display
├── hero-date-picker.tsx        # Month/year picker
└── expense-type-badge.tsx     # Category badge
```

---

## Server-Side Data Fetching

### Data Sources

1. **Expenses Data**
   - Fetched from `Expense` table
   - Filtered by month/year (expenseDate)
   - Filtered by expense type/category (if provided)
   - Sorted by expenseDate (descending)

2. **Aggregations**
   - Total expenses for selected period
   - Expenses grouped by category
   - Expenses grouped by expense type

### Filters

- **Month/Year**: Filter by expense date month and year
- **Expense Type**: Filter by specific expense type
- **Category**: Filter by category (HOME, OTHER)

---

## Client-Side Components

### ExpensesBoard

**Purpose**: Main orchestrator component

**Features**:
- Displays expense table
- Shows total expense amount
- Handles date filtering
- Manages expense type filtering

### AddExpenseForm

**Purpose**: Form for creating/editing expenses

**Fields**:
1. **Expense Type** (required)
   - Select dropdown
   - Options from `EXPENSE_TYPE_OPTIONS` constant
   - Examples: Fuel, Maintenance, Utilities, etc.

2. **Expense Amount** (required)
   - Number input with comma formatting
   - Minimum: 0
   - Displays as: 10,000 (with commas)
   - Uses `formatNumber()` utility

3. **Category** (required)
   - Select dropdown
   - Options: HOME, OTHER
   - Default: HOME

4. **Expense Date** (required)
   - Date picker
   - Default: Current date

5. **Description** (optional)
   - Textarea
   - Additional notes about the expense

**Validation**:
- Expense Type: Required selection
- Amount: Required, minimum 0
- Category: Required selection
- Expense Date: Required

### ExpensesTable

**Purpose**: Displays expenses in table format

**Columns**:
- Date (formatted)
- Expense Type (with badge)
- Category (HOME/OTHER badge)
- Amount (formatted with Rs and commas)
- Description
- Actions (Edit, Delete)

**Features**:
- Server-side pagination
- Sortable columns
- Responsive design
- Category badges with colors
- Total expense display

---

## Expense Categories

### Category Types

1. **HOME**
   - Home/office related expenses
   - Examples: Utilities, Rent, Office Supplies

2. **OTHER**
   - Other business expenses
   - Examples: Marketing, Travel, Miscellaneous

### Expense Types

Defined in `constants/expense-types.ts`:
- Fuel
- Maintenance
- Utilities
- Rent
- Salaries
- Marketing
- Travel
- Office Supplies
- Insurance
- Legal Fees
- And more...

---

## Data Validation

### Expense Schema

```typescript
{
  expenseType: string (required, from EXPENSE_TYPE_OPTIONS)
  amount: number (required, min 0)
  category: "HOME" | "OTHER" (required)
  expenseDate: Date (required)
  description: string (optional)
}
```

---

## Database Schema

### Expense Model

```prisma
model Expense {
  id          String          @id @default(cuid())
  expenseType String
  amount      Int
  category    ExpenseCategory @default(HOME)
  expenseDate DateTime
  description String?
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([expenseDate])
  @@index([category])
}
```

### Key Fields

- **expenseType**: Type of expense (e.g., "Fuel", "Maintenance")
- **amount**: Expense amount in smallest currency unit
- **category**: HOME or OTHER (indexed)
- **expenseDate**: Date of expense (indexed)
- **description**: Optional notes

---

## UI Features

### Date Filtering

- **Month/Year Picker**: Select specific month and year
- **Default**: Current month
- Filters expenses by `expenseDate`

### Expense Type Filter

- Filter by specific expense type
- Dropdown with all available expense types
- "All Types" option to show all

### Search Functionality

- Search across:
  - Expense type
  - Description

### Pagination

- Configurable page sizes: 5, 10, 20, 50, 100, All
- Server-side pagination
- Default page size: 5

### Number Formatting

- **Amount**: Displays as Rs 10,000 (with commas)
- Uses `formatCurrency()` utility
- Prevents line breaks with `whitespace-nowrap`

### Category Badges

- **HOME**: Green badge
- **OTHER**: Blue badge
- Color-coded for quick identification

### Total Expense Display

- Shows total expense for filtered period
- Formatted with Rs and commas
- Updates based on filters

---

## Data Flow

### Create Expense

```
User fills form → Submit
  ↓
Client validation (Zod)
  ↓
Server action: createExpenseAction
  ↓
Schema validation
  ↓
Database insert
  ↓
Revalidate page
  ↓
Show success toast (green)
  ↓
Refresh table
```

### Update Expense

```
User clicks Edit → Form opens with data
  ↓
User modifies fields → Submit
  ↓
Client validation
  ↓
Server action: updateExpenseAction
  ↓
Database update
  ↓
Revalidate page
  ↓
Show warning toast (yellow)
  ↓
Refresh table
```

### Delete Expense

```
User clicks Delete → Confirmation dialog
  ↓
User confirms → Server action: deleteExpenseAction
  ↓
Database delete
  ↓
Revalidate page
  ↓
Show error toast (red)
  ↓
Refresh table
```

---

## Permissions

### Access Control

- **Route**: `/expenses`
- **Permission Check**: `enforcePagePermission("/expenses")`
- **Required Permissions**:
  - View: Access to expenses module
  - Create: `canEdit("expenses")`
  - Update: `canEdit("expenses")`
  - Delete: `canEdit("expenses")`

---

## Related Pages

- **Dashboard** (`/`) - Shows expense statistics (HOME vs OTHER)
- **Reports** (`/reports`) - Expense-based reports and analytics
- **Super Admin** (`/super-admin`) - Expense analysis

---

## Future Enhancements

1. Expense receipts/attachments
2. Expense approval workflow
3. Recurring expenses
4. Expense budgets and limits
5. Expense export to Excel/PDF
6. Expense analytics and trends
7. Expense categories management
8. Multi-currency support

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

