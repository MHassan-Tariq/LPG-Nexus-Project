# Payments Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Server-Side Data Fetching](#server-side-data-fetching)
4. [Payment Design Principle](#payment-design-principle)
5. [Key Features](#key-features)
6. [Data Flow](#data-flow)
7. [Permissions](#permissions)

---

## Overview

The **Payments** page (`/payments`) is the **SINGLE SOURCE OF TRUTH** for all payment operations in LPG Nexus. This is the **ONLY** place where payments should be created, updated, or deleted.

**Critical Principle**: 
- ✅ Payment entry: ONLY from `/payments` page
- ✅ Payment visibility: Everywhere (read-only on other pages)
- ❌ Do NOT create payments from Add Cylinder page
- ❌ Do NOT edit payments from other pages

See: `PAYMENT_DESIGN_PRINCIPLES.md` for complete design documentation.

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
src/app/payments/
├── page.tsx                    # Main server component
├── actions.ts                  # Server actions (bill generation, etc.)
└── [id]/
    └── download/
        └── page.tsx            # Bill PDF download

src/components/payments/
├── payment-table.tsx           # Payment records table
├── payment-actions.tsx         # Action buttons (add payment, generate bills)
├── add-payment-drawer.tsx      # Form to add new payment
├── bill-view-drawer.tsx        # View bill details
├── summary-cards.tsx           # Financial summary cards
└── payments-filters.tsx        # Search and filter controls
```

---

## Server-Side Data Fetching

### Data Sources

1. **Bills Data**
   - Fetches bills with customer information
   - Includes payment information
   - Includes invoice information (if generated)
   - Filtered by date range, status, and search query

2. **Aggregations**
   - Bill aggregates: total lastMonthRemaining, currentMonthBill, cylinders
   - Payment aggregates: total paid amount

### Calculations

**For Each Bill:**
```typescript
totalAmount = lastMonthRemaining + currentMonthBill
paidAmount = sum of all payments for that bill
remainingAmount = max(0, totalAmount - paidAmount)
status = computed from remainingAmount:
  - PAID: remainingAmount <= 0
  - PARTIALLY_PAID: paidAmount > 0 but remainingAmount > 0
  - NOT_PAID: paidAmount === 0
```

**Summary Totals:**
```typescript
totalAmount = sum of all bill totals
receivedAmount = sum of all payments
remainingAmount = max(0, totalAmount - receivedAmount)
totalCylinders = sum of all cylinders
```

---

## Payment Design Principle

### Single Source of Truth

**Payment Entry**: ONLY from `/payments` page
- All payment records stored in `Payment` table
- Linked to `Bill` table via `billId`
- Creates audit logs automatically

**Payment Visibility**: Everywhere (read-only)
- Add Cylinder page shows payment info (computed from Bill + Payment)
- Dashboard shows payment logs
- Reports show payment data
- All read-only, no editing allowed

### Why This Design?

1. **No Duplicate Payments**: Single entry point prevents duplicates
2. **Accurate Remaining**: Always computed from Bill + Payment tables
3. **Audit Integrity**: All changes logged in one place
4. **Data Consistency**: Same numbers everywhere automatically

---

## Key Features

### 1. Bill Management

- **View Bills**: See all bills with payment status
- **Filter Bills**: By date range, status, customer
- **Search Bills**: By customer name or code
- **Bill Status**: Auto-computed (PAID, PARTIALLY_PAID, NOT_PAID)

### 2. Payment Operations

- **Add Payment**: Create new payment record
- **View Payment History**: See all payments for a bill
- **Payment Methods**: Bank transfer, cash, etc.
- **Payment Notes**: Optional notes for each payment

### 3. Bill Generation

- **Bulk Generate**: Generate bills for all customers
- **Date Range**: Select bill period (start date to end date)
- **Auto Calculation**: 
  - Last month remaining from previous bills
  - Current month bill from cylinder deliveries
  - Total cylinders delivered

### 4. Financial Summary

- **Total Amount**: Sum of all bill amounts
- **Received Amount**: Sum of all payments
- **Remaining Amount**: Outstanding balance
- **Total Cylinders**: Total cylinders in bills

### 5. Invoice Management

- **Generate Invoice**: Create invoice for paid bills
- **Download Invoice**: PDF download
- **Invoice Tracking**: See which bills have invoices

---

## Data Flow

### Add Payment

```
User clicks "Add Payment" → Drawer opens
  ↓
User selects bill and enters amount
  ↓
Client validation
  ↓
Server action: createPayment
  ↓
Validation (amount <= remaining)
  ↓
Create Payment record in database
  ↓
Update Bill status (if fully paid)
  ↓
Create PaymentLog entry
  ↓
Revalidate page
  ↓
Show success toast
  ↓
Refresh table
```

### Generate Bills

```
User clicks "Generate Bills" → Date picker opens
  ↓
User selects date range
  ↓
Server action: bulkGenerateBillsAction
  ↓
For each customer:
  - Get cylinder entries in date range
  - Calculate current month bill
  - Get previous bill remaining
  - Create new Bill record
  ↓
Create PaymentLog entries
  ↓
Revalidate page
  ↓
Show success message
  ↓
Refresh table
```

---

## Database Schema

### Bill Model

```prisma
model Bill {
  id                 String     @id @default(cuid())
  customerId         String
  customer           Customer   @relation(...)
  billStartDate      DateTime
  billEndDate        DateTime
  lastMonthRemaining Int        @default(0)
  currentMonthBill   Int        @default(0)
  cylinders          Int        @default(0)
  status             BillStatus @default(NOT_PAID)
  payments           Payment[]
  invoice            Invoice?
}
```

### Payment Model

```prisma
model Payment {
  id        String   @id @default(cuid())
  billId    String
  bill      Bill     @relation(...)
  amount    Int
  paidOn    DateTime @default(now())
  method    String?  @default("bank_transfer")
  notes     String?
  createdAt DateTime @default(now())
}
```

---

## Permissions

### Access Control

- **Route**: `/payments`
- **Permission Check**: `enforcePagePermission("/payments")`
- **Required Permissions**:
  - View: Access to payments module
  - Add Payment: `canEdit("payments")`
  - Generate Bills: `canEdit("payments")`
  - Delete Payment: `canEdit("payments")`

---

## UI Features

### Filters

- **Date Range**: Filter bills by start/end date
- **Status**: All, PAID, PARTIALLY_PAID, NOT_PAID
- **Search**: By customer name or code (CUS-123 format)

### Table Columns

- Customer Code
- Customer Name
- Last Month Remaining
- Current Month Bill
- Total Amount
- Paid Amount
- Remaining Amount
- Status Badge
- Cylinders
- Actions

### Summary Cards

- Total Amount (formatted with commas)
- Received Amount (formatted with commas)
- Remaining Amount (formatted with commas)
- Total Cylinders

### Number Formatting

- All currency values use `formatCurrency()` utility
- Displays as: Rs 10,000 (with commas)
- Prevents line breaks with `whitespace-nowrap`

---

## Related Pages

- **Add Cylinder** (`/add-cylinder`) - Shows payment info (read-only)
- **Payment Logs** (`/payment-logs`) - Payment history
- **Invoices** (`/payments/invoices`) - Invoice management
- **Dashboard** (`/`) - Payment statistics

---

## Future Enhancements

1. Payment reminders/notifications
2. Payment schedules/recurring payments
3. Payment reconciliation
4. Payment export to Excel/PDF
5. Payment analytics and trends
6. Overpayment handling (credit carry forward)

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready  
**Design Principle**: Single Source of Truth - See PAYMENT_DESIGN_PRINCIPLES.md

