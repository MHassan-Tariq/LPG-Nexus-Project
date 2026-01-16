# Dashboard Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Server-Side Data Fetching](#server-side-data-fetching)
4. [Client-Side Components](#client-side-components)
5. [Key Features](#key-features)
6. [Data Flow](#data-flow)
7. [Permissions](#permissions)

---

## Overview

The **Dashboard** page (`/`) is the main landing page and operational control center for LPG Nexus. It provides a comprehensive overview of:
- System statistics (cylinders, customers, transactions)
- Financial metrics (expenses, pending bills, profit)
- Recent activity (transactions, payment logs)
- Inventory status
- Quick access to key operations

### Dynamic Welcome Text

The navbar (topbar) displays a dynamic welcome message based on the software name setting:
- **Format**: "Welcome to {softwareName}"
- **Source**: Fetched from `SystemSettings` table in `DashboardTopbarWrapper`
- **Default**: "Welcome to LPG Nexus" (if no software name is set)
- **Updates**: Automatically when software name is changed in Settings
- **Location**: Topbar component, visible on all pages

---

## Page Structure

### File Organization

```
src/app/
├── page.tsx                    # Main server component (data fetching)

src/components/dashboard/
├── dashboard-client.tsx        # Main client component
├── overview-cards.tsx           # Statistics cards
├── cylinder-table.tsx         # Cylinder inventory table
├── payment-logs.tsx            # Recent payment logs
├── transaction-timeline.tsx    # Recent transactions
└── sidebar.tsx                 # Navigation sidebar
```

---

## Server-Side Data Fetching

### Data Sources

The dashboard fetches data from multiple sources:

1. **Cylinder Statistics**
   - Total cylinder count
   - Status breakdown (IN_STOCK, ASSIGNED, MAINTENANCE, RETIRED)

2. **Customer Statistics**
   - Total customer count

3. **Recent Transactions**
   - Last 5 cylinder transactions
   - Includes customer information

4. **Payment Logs**
   - Last 5 payment events
   - Includes bill information

5. **Expenses**
   - All expenses grouped by category (HOME, OTHER)

6. **Inventory Items**
   - Total inventory quantity

7. **Pending Bills**
   - Bills with status NOT_PAID or PARTIALLY_PAID
   - Includes payment information for remaining calculation

### Calculations

**Pending Bills Amount:**
```typescript
pendingBillsAmount = sum of (bill.currentMonthBill - totalPaid)
where totalPaid = sum of all payments for that bill
```

**Expense Categories:**
- Home expenses: Sum of all expenses with category = "HOME"
- Other expenses: Sum of all expenses with category = "OTHER"

---

## Client-Side Components

### DashboardClient

**Purpose**: Main orchestrator component that renders all dashboard sections

**Features**:
- Displays overview cards with statistics
- Shows recent transactions timeline
- Displays payment logs
- Renders cylinder inventory table
- Handles client-side interactions

### OverviewCards

**Purpose**: Displays key metrics in card format

**Cards Displayed**:
1. **Home Expenses** - Total home category expenses
2. **Other Expenses** - Total other category expenses
3. **Counter Sale** - Revenue from counter sales
4. **Bill Receivables** - Total pending bill amounts
5. **Profit** - Calculated profit (revenue - expenses)
6. **Total Cylinders** - Total cylinder count with in/out breakdown
7. **Empty Cylinders** - Cylinders in maintenance/awaiting collection
8. **Pending Bills** - Number of unpaid/partially paid bills

**Format**:
- Currency values formatted with commas (Rs 10,000)
- Numbers formatted with commas (10,000)
- Uses `formatCurrency()` and `formatNumber()` utilities

---

## Key Features

### 1. Real-Time Statistics

- All statistics are calculated from live database data
- Updates automatically when data changes
- No caching - always shows current state

### 2. Recent Activity

- **Recent Transactions**: Last 5 cylinder transactions
- **Payment Logs**: Last 5 payment events
- Both sorted by most recent first

### 3. Financial Overview

- **Expenses**: Categorized by HOME and OTHER
- **Pending Bills**: Shows total amount owed
- **Profit**: Calculated from revenue and expenses

### 4. Inventory Status

- **Total Cylinders**: Shows total count
- **In/Out Breakdown**: Shows cylinders in stock vs assigned
- **Empty Cylinders**: Shows cylinders awaiting collection

---

## Data Flow

```
User visits / 
  ↓
Server fetches all data in parallel (Promise.all)
  ↓
Data passed to DashboardClient component
  ↓
DashboardClient renders:
  - OverviewCards (statistics)
  - TransactionTimeline (recent transactions)
  - PaymentLogs (recent payments)
  - CylinderTable (inventory)
```

---

## Permissions

### Access Control

- **Route**: `/`
- **Permission Check**: `enforcePagePermission("/")`
- **Wrapper**: `PagePermissionWrapper`

**Required Permissions**:
- User must be authenticated
- User must have access to dashboard module

---

## UI Components

### Overview Cards Layout

- **First Row**: 5 cards (Home Expenses, Other Expenses, Counter Sale, Bill Receivables, Profit)
- **Second Row**: 3 cards (Total Cylinders, Empty Cylinders, Pending Bills)

### Card Design

- Rounded corners (rounded-3xl)
- Border and shadow
- Hover effects
- Icon with colored background
- Value display with formatting
- Description text

### Color Scheme

- **Home Expenses**: Blue theme
- **Other Expenses**: Green theme
- **Counter Sale**: Purple theme
- **Bill Receivables**: Orange theme
- **Profit**: Teal theme
- **Cylinders**: Blue theme
- **Empty Cylinders**: Green theme
- **Pending Bills**: Orange theme

---

## Database Queries

### Optimized Queries

All queries use:
- `select` to fetch only needed fields
- `take` to limit results
- `orderBy` for sorting
- `include` for related data
- `groupBy` for aggregations

### Performance Considerations

- Parallel data fetching with `Promise.all`
- Limited result sets (take: 5 for recent items)
- Efficient aggregations
- Indexed fields for fast queries

---

## Related Pages

- **Add Cylinder** (`/add-cylinder`) - Manage cylinder deliveries
- **Payments** (`/payments`) - Manage bill payments
- **Expenses** (`/expenses`) - Manage expenses
- **Inventory** (`/inventory`) - Manage inventory
- **Reports** (`/reports`) - View detailed reports

---

## Future Enhancements

1. Real-time updates with WebSocket
2. Customizable dashboard widgets
3. Date range filters for statistics
4. Export dashboard data to PDF
5. Dashboard presets for different user roles

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

