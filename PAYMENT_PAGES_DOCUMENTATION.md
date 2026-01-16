# Payment Pages - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Payment Management Page (`/payments`)](#payment-management-page-payments)
3. [Payment Logs Page (`/payment-logs`)](#payment-logs-page-payment-logs)
4. [Database Models](#database-models)
5. [Server Actions](#server-actions)
6. [API Endpoints](#api-endpoints)
7. [Business Logic](#business-logic)

---

## Overview

The Payment Management system consists of two main pages:
1. **Payment Management (`/payments`)**: Manages bills, payments, and invoices
2. **Payment Logs (`/payment-logs`)**: Displays audit trail of all payment-related activities

---

## Payment Management Page (`/payments`)

### Purpose
The Payment Management page allows users to:
- View and manage customer bills
- Generate bills from cylinder deliveries
- Track payment status (Paid, Partially Paid, Not Paid)
- Generate invoices
- Download/print bills and invoices
- View payment summaries

### File Structure

```
src/app/payments/
├── page.tsx                    # Main server component
├── actions.ts                  # Server actions (bulk generate, delete, get)
└── [id]/
    └── download/
        └── page.tsx            # Bill download/preview page

src/components/payments/
├── payment-table.tsx           # Payment records table
├── payments-filters.tsx        # Filter controls (search, status, date)
├── summary-cards.tsx           # Summary metrics cards
├── payment-actions.tsx         # Action buttons (generate PDF, bulk bills)
├── invoice-management-drawer.tsx  # Invoice management UI
├── invoice-management-page.tsx    # Invoice management page
├── bill-download-page-client.tsx  # Bill download client component
├── bill-preview.tsx            # Bill preview component
└── bill-status-badge.tsx       # Status badge component
```

---

### Server Component (`page.tsx`)

#### Data Fetching Process

**1. Query Parameter Parsing:**
```typescript
- pageSize: "all" or numeric (5, 10, 20, 50, 100)
- page: Page number (default: 1)
- from: Start date (default: start of current month)
- to: End date (default: end of current month)
- status: Bill status filter ("ALL", "PAID", "PARTIALLY_PAID", "NOT_PAID")
- q: Search query (customer name or ID like "CUS-123")
```

**2. Date Range Filtering:**
- Defaults to current month if not specified
- Uses `startOfMonth` and `endOfMonth` from date-fns
- Applied to `billStartDate` and `billEndDate`

**3. Status Filter:**
- Filters bills by computed status
- Status is calculated from: `(lastMonthRemaining + currentMonthBill) - paidAmount`

**4. Search Filter:**
- Searches by customer name (case-insensitive)
- Also searches by customer code (if query starts with "CUS-" or is numeric)

**5. Database Queries (Parallel Execution):**
```typescript
Promise.all([
  // 1. Fetch bills with related data
  prisma.bill.findMany({
    where: {
      status,              // Filter by status
      customer: {          // Filter by customer name/code
        name: { contains: query },
        OR: { customerCode: codeFilter }
      },
      billStartDate: { gte: from },
      billEndDate: { lte: to }
    },
    include: {
      customer: { select: { customerCode, name } },
      payments: { select: { amount } },        // For calculating paid amount
      invoice: { select: { id, invoiceNumber, generatedAt } }
    },
    orderBy: { customer: { customerCode: "asc" } },
    skip, take
  }),
  
  // 2. Count total bills (for pagination)
  prisma.bill.count({ where }),
  
  // 3. Aggregate bill totals
  prisma.bill.aggregate({
    where,
    _sum: { 
      lastMonthRemaining: true,
      currentMonthBill: true,
      cylinders: true
    }
  }),
  
  // 4. Aggregate payment totals
  prisma.payment.aggregate({
    where: { bill: where },
    _sum: { amount: true }
  })
])
```

**6. Record Processing:**
Each bill is transformed into a `PaymentRecordRow`:
```typescript
{
  id: bill.id,
  code: customer.customerCode,
  name: customer.name,
  lastMonthRemaining: bill.lastMonthRemaining,
  currentMonthBill: bill.currentMonthBill,
  totalAmount: lastMonthRemaining + currentMonthBill,
  paidAmount: sum(payments.amount),
  remainingAmount: max(0, totalAmount - paidAmount),
  status: computedStatus,  // PAID | PARTIALLY_PAID | NOT_PAID
  billStartDate,
  billEndDate,
  cylinders: bill.cylinders,
  invoice: { id, invoiceNumber, generatedAt } | null
}
```

**7. Summary Calculations:**
```typescript
totalAmount = sum(all bills: lastMonthRemaining + currentMonthBill)
receivedAmount = sum(all payments: amount)
remainingAmount = max(0, totalAmount - receivedAmount)
totalCylinders = sum(all bills: cylinders)
```

---

### Client Components

#### 1. `PaymentsFilters` Component

**Purpose**: Filter bills by search query, status, and date range

**Features**:
- **Search Input**: Debounced search (300ms delay)
- **Month/Year Picker**: Select date range
- **Status Dropdown**: Filter by bill status (All, Paid, Partially Paid, Not Paid)
- **Auto-Update URL**: Updates query params as user types/selects
- **No Submit Button**: Filters apply automatically

**State Management**:
- Uses React Hook Form for form state
- Debounces input to prevent excessive URL updates
- Uses `useTransition` for smooth navigation

---

#### 2. `PaymentSummaryCards` Component

**Purpose**: Display aggregated metrics

**Cards Displayed**:
1. **Total Amount**: Sum of all bill amounts (blue border)
2. **Received Amount**: Sum of all payments (green text, green border)
3. **Remaining Amount**: Unpaid amount (red text, red border)
4. **Total Cylinders**: Sum of cylinders in bills (blue border)

**Styling**:
- Currency formatting for amounts (PKR)
- Color-coded borders and text
- Responsive grid layout

---

#### 3. `PaymentActionsBar` Component

**Purpose**: Action buttons for bulk operations

**Actions**:
1. **Generate PDF Report**: Downloads payment report PDF
   - Calls `/api/reports/pdf`
   - Downloads as "payments-report.pdf"

2. **Generate Bulk Bills PDF**: Generates bills then downloads PDF
   - Calls `bulkGenerateBillsAction` first
   - Then calls `/api/payments/bulk-pdf`
   - Downloads as "bulk-bills.pdf"

**State**:
- Loading states for each action
- Uses `useTransition` for async operations

---

#### 4. `PaymentRecordsTable` Component

**Purpose**: Display bills in a table format

**Table Columns**:
1. ID (Customer Code)
2. Name (Customer Name)
3. Last Month Remaining
4. Current Month Bill
5. Total Amount
6. Paid Amount (green)
7. Remaining Amount (red)
8. Cylinders
9. Bill Status (badge: Paid/Partially Paid/Not Paid)
10. Actions (Print, Download, View, Delete, Invoice Management)

**Actions Available**:
- **Print Bill**: Directly downloads PDF via API
- **Download Bill**: Navigates to `/payments/[id]/download`
- **View**: Opens bill details (if implemented)
- **Delete**: Confirmation dialog, then deletes bill and all payments
- **Invoice Management**: Opens invoice management drawer

**Status Badge Colors**:
- **PAID**: Green badge
- **PARTIALLY_PAID**: Yellow/Orange badge
- **NOT_PAID**: Red badge

**Delete Flow**:
1. Shows confirmation dialog
2. Calls `deleteBillAction(id)`
3. Deletes all related payments first (foreign key constraint)
4. Deletes the bill
5. Logs deletion in PaymentLog
6. Refreshes page data

---

#### 5. `InvoiceManagementDrawer` Component

**Purpose**: Manage invoices for bills

**Features**:
- Multi-select bills using checkboxes
- "Select All" functionality
- Separate bills with invoices vs without invoices

**Actions**:
1. **Generate Invoices**: Creates invoices for selected bills without invoices
   - Calls `/api/invoices/generate`
   - Generates unique invoice numbers
   - Creates PDF and saves to disk
   - Creates Invoice record linked to Bill
   - Logs invoice generation

2. **Download Invoice**: Downloads invoice PDF
   - Calls `/api/invoices/[invoiceNumber]/download`
   - Downloads as "[invoiceNumber].pdf"

3. **Delete Invoice**: Removes invoice (but keeps bill)
   - Calls `DELETE /api/invoices/[invoiceId]`
   - Deletes invoice record and PDF file
   - Logs invoice deletion

4. **Delete All Invoices**: Bulk delete for selected invoices
   - Confirmation required
   - Deletes multiple invoices

**Validation**:
- Cannot generate invoices for bills that already have invoices
- Cannot delete invoices that don't exist
- Shows success/error messages

---

### Server Actions (`actions.ts`)

#### 1. `bulkGenerateBillsAction(input: { from: Date, to: Date })`

**Purpose**: Generates bills for all customers in a date range

**Process Flow**:
1. **Permission Check**: Verifies `canEdit("payments")` permission
2. **Date Validation**: Ensures `from < to`
3. **Fetch Customers**: Gets all customers from database
4. **For Each Customer** (parallel execution):
   - Check if bill already exists for this date range (skip if exists)
   - Get DELIVERED cylinder entries for customer in date range
   - Calculate:
     - `totalQuantity`: Sum of quantities
     - `currentMonthBill`: Sum of amounts
   - Get previous bill (most recent before start date)
   - Calculate `lastMonthRemaining`:
     - Previous total = previousBill.lastMonthRemaining + previousBill.currentMonthBill
     - Previous paid = sum of previousBill.payments
     - lastMonthRemaining = max(0, previous total - previous paid)
   - Skip if no deliveries in period (totalQuantity === 0 && currentMonthBill === 0)
   - Create bill record in transaction:
     - Creates Bill with calculated values
     - Logs bill generation in PaymentLog
5. **Cache Revalidation**: Refreshes `/payments` page

**Business Rules**:
- Only creates bills for customers with DELIVERED entries in the period
- Prevents duplicate bills (same customer + date range)
- Carries forward unpaid amounts from previous bills
- Uses database transactions for atomicity

**Return Value**:
- Success: `{ success: true }`
- Error: `{ success: false, error: string }`

---

#### 2. `deleteBillAction(id: string)`

**Purpose**: Deletes a bill and all related payments

**Process Flow**:
1. **Permission Check**: Verifies edit permission
2. **ID Validation**: Ensures valid bill ID
3. **Fetch Bill**: Gets bill with payments and customer info
4. **Transaction**:
   - Delete all payments (foreign key constraint)
   - Delete the bill
   - Log bill deletion in PaymentLog
5. **Cache Revalidation**: Refreshes `/payments` page

**Return Value**:
- Success: `{ success: true }`
- Error: `{ success: false, error: string }`

---

#### 3. `getBillAction(id: string)`

**Purpose**: Fetches a single bill with all related data

**Returns**:
- Success: `{ success: true, data: Bill }`
- Error: `{ success: false, error: string }`

**Bill Data Includes**:
- Customer information
- Bill dates and amounts
- All payments (sorted by paidOn DESC)
- Invoice information (if exists)

---

### Bill Download Page (`/payments/[id]/download`)

**Purpose**: Preview and download bills as PDF

**Components**:
- `BillDownloadPageClient`: Client wrapper
- `BillPreview`: Renders bill preview using `BillRenderer`

**Features**:
- Loads bill design settings (logo, colors, layout)
- Displays bill preview (matches PDF output)
- Download button generates and downloads PDF
- "Save Design" button links to settings page

**PDF Generation**:
- Calls `/api/payments/[id]/bill` endpoint
- Generates PDF using React PDF
- Includes company logo, customer info, bill details, payments
- Customizable design (loaded from settings)

---

## Payment Logs Page (`/payment-logs`)

### Purpose
Displays an audit trail of all payment-related activities, including:
- Bill generation
- Bill updates
- Bill deletions
- Payment receipts
- Invoice generation/download/deletion

### File Structure

```
src/app/payment-logs/
└── page.tsx                    # Main server component

src/components/payment-logs/
├── payment-logs-table.tsx      # Logs table component
├── payment-logs-search.tsx     # Search component
└── event-type-badge.tsx        # Event type badge component
```

---

### Server Component (`page.tsx`)

#### Data Fetching

**Query Parameters**:
- `q`: Search query (customer name, case-insensitive)
- `page`: Page number
- `pageSize`: Records per page (5, 10, 20, 50, 100, "all")

**Database Query**:
```typescript
prisma.paymentLog.findMany({
  where: query ? { customerName: { contains: query, mode: "insensitive" } } : {},
  orderBy: { performedAt: "desc" },  // Newest first
  skip, take
})
```

**Data Transformation**:
Each log is formatted as `PaymentLogItem`:
```typescript
{
  id: log.id,
  billId: log.billId,
  customerName: log.customerName,
  customerCode: log.customerCode,
  billStartDate: log.billStartDate,
  billEndDate: log.billEndDate,
  amount: log.amount,
  performedAt: log.performedAt,
  eventType: log.eventType,
  details: log.details
}
```

---

### Client Components

#### 1. `PaymentLogsTable` Component

**Purpose**: Display payment logs in a table

**Table Columns**:
1. ID (Customer Code)
2. Name (Customer Name)
3. Bill Start Date
4. Bill End Date
5. Amount
6. Performed At (date + time)
7. Event Type (badge)
8. Details (truncated if > 15 chars)
9. Actions (View button)

**Features**:
- **View Action**: Opens drawer with all logs for that customer
- **Event Type Badges**: Color-coded by event type
- **Amount Formatting**: Currency formatted (PKR)
- **Date Formatting**: "dd-MM-yy hh:mm a" format

**View Drawer**:
- Shows all payment logs for selected customer
- Fetches from `/api/payment-logs/customer?customerName=...`
- Displays logs in cards with full details
- "View Bill" button (if billId exists) opens bill download page

---

#### 2. `PaymentLogsSearch` Component

**Purpose**: Search payment logs by customer name

**Features**:
- Debounced input (prevents excessive queries)
- Updates URL query parameter
- Auto-filters table as user types

---

#### 3. `PaymentEventBadge` Component

**Purpose**: Display event type with color coding

**Event Types & Colors**:
- **BILL_GENERATED**: Blue
- **BILL_UPDATED**: Yellow/Orange
- **BILL_DELETED**: Red
- **PAYMENT_RECEIVED**: Green
- **PARTIAL_PAYMENT**: Yellow
- **INVOICE_GENERATED**: Purple
- **INVOICE_DOWNLOADED**: Blue
- **INVOICE_DELETED**: Red

---

## Database Models

### Bill Model

```prisma
model Bill {
  id                 String     @id @default(cuid())
  customerId         String
  customer           Customer   @relation(...)
  billStartDate      DateTime
  billEndDate        DateTime
  lastMonthRemaining Int        @default(0)  // Unpaid from previous period
  currentMonthBill   Int        @default(0)  // Current period bill amount
  cylinders          Int        @default(0)  // Number of cylinders
  status             BillStatus @default(NOT_PAID)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
  payments           Payment[]  // Related payments
  invoice            Invoice?   // Related invoice (optional)

  @@unique([customerId, billStartDate, billEndDate])  // One bill per customer per period
  @@index([billStartDate, billEndDate])
  @@index([status])
}
```

**Key Fields**:
- `lastMonthRemaining`: Carried forward from previous unpaid bills
- `currentMonthBill`: Calculated from DELIVERED cylinder entries in period
- `status`: Computed from payments (NOT_PAID, PARTIALLY_PAID, PAID)

---

### Payment Model

```prisma
model Payment {
  id        String   @id @default(cuid())
  billId    String
  bill      Bill     @relation(...)
  amount    Int      // Payment amount
  paidOn    DateTime @default(now())
  method    String?  @default("bank_transfer")
  notes     String?
  createdAt DateTime @default(now())

  @@index([paidOn])
}
```

**Purpose**: Records individual payments made against a bill
- One bill can have multiple payments (partial payments)
- Payments are summed to calculate paid amount
- `paidOn` is indexed for date-based queries

---

### PaymentLog Model

```prisma
model PaymentLog {
  id            String           @id @default(cuid())
  billId        String?
  paymentId     String?
  customerName  String
  customerCode  Int?
  eventType     PaymentEventType
  amount        Int?
  details       String?
  billStartDate DateTime?
  billEndDate   DateTime?
  performedAt   DateTime         @default(now())
  createdAt     DateTime         @default(now())

  @@index([performedAt])
  @@index([eventType])
  @@index([customerCode])
}
```

**Purpose**: Audit trail of all payment-related activities

**Event Types**:
- `BILL_GENERATED`: When bills are created
- `BILL_UPDATED`: When bills are modified
- `BILL_DELETED`: When bills are deleted
- `PAYMENT_RECEIVED`: When payments are recorded
- `PARTIAL_PAYMENT`: When partial payments are made
- `INVOICE_GENERATED`: When invoices are created
- `INVOICE_DOWNLOADED`: When invoices are downloaded
- `INVOICE_DELETED`: When invoices are deleted

---

## Server Actions

### Payment Logging Functions (`lib/payment-logs.ts`)

All payment-related activities are logged using these functions:

1. **`logBillGenerated(payload)`**: Logs bill creation
2. **`logBillUpdated(payload)`**: Logs bill updates
3. **`logBillDeleted(payload)`**: Logs bill deletion
4. **`logPaymentReceived(payload)`**: Logs payment recording
5. **`logPartialPayment(payload)`**: Logs partial payments
6. **`logInvoiceGenerated(payload)`**: Logs invoice creation
7. **`logInvoiceDownloaded(payload)`**: Logs invoice downloads
8. **`logInvoiceDeleted(payload)`**: Logs invoice deletion

**Common Payload Structure**:
```typescript
{
  billId?: string;
  paymentId?: string;
  customerName: string;
  customerCode?: number;
  billStartDate?: Date;
  billEndDate?: Date;
  amount?: number;
  details?: string;
}
```

**All logging functions**:
- Create PaymentLog record
- Revalidate `/payment-logs` and `/` (dashboard) pages

---

## API Endpoints

### 1. `/api/payments/[id]/bill` (GET)

**Purpose**: Generate and download bill PDF

**Process**:
1. Fetches bill with customer and payments
2. Loads bill design settings
3. Generates PDF using React PDF
4. Returns PDF blob with proper headers

**Headers**:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="bill-..."`

---

### 2. `/api/payments/bulk-pdf` (GET)

**Purpose**: Generate PDF with all bills in current filter

**Process**:
1. Uses query parameters to filter bills
2. Generates PDF with multiple bills
3. Returns PDF blob

---

### 3. `/api/invoices/generate` (POST)

**Purpose**: Generate invoices for selected bills

**Request Body**:
```json
{
  "billIds": ["id1", "id2", ...]
}
```

**Process**:
1. Validates permission
2. Fetches bills with customers and payments
3. Checks for existing invoices (prevents duplicates)
4. For each bill:
   - Generates unique invoice number
   - Creates PDF using bill data
   - Saves PDF to disk
   - Creates Invoice record
   - Links Invoice to Bill
   - Logs invoice generation
5. Returns results array with success/error for each

**Response**:
```json
{
  "success": true,
  "results": [
    { "billId": "id1", "success": true, "invoiceNumber": "INV-001" },
    { "billId": "id2", "success": false, "error": "..." }
  ]
}
```

---

### 4. `/api/invoices/[invoiceNumber]/download` (GET)

**Purpose**: Download invoice PDF

**Process**:
1. Finds invoice by invoiceNumber
2. Reads PDF file from disk
3. Logs invoice download
4. Returns PDF blob

---

### 5. `/api/invoices/[invoiceId]` (DELETE)

**Purpose**: Delete an invoice

**Process**:
1. Validates permission
2. Fetches invoice record
3. Deletes PDF file from disk
4. Deletes invoice record from database
5. Logs invoice deletion
6. Returns success

---

### 6. `/api/payment-logs/customer` (GET)

**Purpose**: Get all payment logs for a specific customer

**Query Parameter**: `customerName`

**Process**:
1. Queries PaymentLog by customerName
2. Orders by performedAt DESC
3. Returns formatted logs

---

## Business Logic

### Bill Status Calculation

Status is computed based on payments:

```typescript
totalAmount = lastMonthRemaining + currentMonthBill
paidAmount = sum(payments.amount)
remainingAmount = max(0, totalAmount - paidAmount)

if (remainingAmount <= 0) {
  status = "PAID"
} else if (paidAmount > 0) {
  status = "PARTIALLY_PAID"
} else {
  status = "NOT_PAID"
}
```

**Important**: Status is computed dynamically, not stored in database

---

### Bill Generation Logic

**When**: User clicks "Bulk Generate Bills"

**For Each Customer**:
1. Find DELIVERED cylinder entries in date range
2. Calculate current period totals:
   - `cylinders`: Sum of quantities
   - `currentMonthBill`: Sum of amounts
3. Find previous bill (most recent before start date)
4. Calculate carry-forward:
   - Previous total = previousBill.lastMonthRemaining + previousBill.currentMonthBill
   - Previous paid = sum(previousBill.payments)
   - `lastMonthRemaining` = max(0, previous total - previous paid)
5. Create bill if there are deliveries (quantity > 0 or amount > 0)

**Skip Conditions**:
- Bill already exists for this customer + date range
- No cylinder deliveries in period

---

### Payment Calculation

**Paid Amount**: Sum of all Payment records for a bill
```typescript
paidAmount = bill.payments.reduce((sum, p) => sum + p.amount, 0)
```

**Remaining Amount**: 
```typescript
remainingAmount = max(0, (lastMonthRemaining + currentMonthBill) - paidAmount)
```

---

### Invoice Generation

**Process**:
1. Generate unique invoice number (e.g., "INV-001", "INV-002")
2. Create PDF from bill data
3. Save PDF to disk (public/invoices/[invoiceNumber].pdf)
4. Create Invoice record:
   - Links to Bill
   - Stores invoiceNumber
   - Stores PDF URL/path
   - Records generatedBy (user ID)
   - Records generatedAt timestamp

**Validation**:
- Cannot generate invoice if bill already has one
- Requires edit permission

---

## UI Features

### Payment Management Page

1. **Filters**:
   - Search by customer name or code
   - Filter by status (All, Paid, Partially Paid, Not Paid)
   - Date range picker (month/year)

2. **Summary Cards**:
   - Total Amount
   - Received Amount (green)
   - Remaining Amount (red)
   - Total Cylinders

3. **Action Buttons**:
   - Generate PDF Report
   - Generate Bulk Bills PDF
   - Bulk Generate Bills (for date range)

4. **Table Features**:
   - Sortable by customer code
   - Pagination
   - Page size selector
   - Status badges
   - Action buttons per row

5. **Invoice Management**:
   - Multi-select bills
   - Generate invoices in bulk
   - Download/delete invoices

---

### Payment Logs Page

1. **Search**: Filter by customer name
2. **Table**: Shows all payment activities
3. **View Drawer**: Shows all logs for a customer
4. **Event Badges**: Color-coded by event type
5. **Pagination**: Navigate through logs

---

## Data Flow

### Bill Generation Flow:

1. User selects date range and clicks "Bulk Generate Bills"
2. Server action fetches all customers
3. For each customer:
   - Queries DELIVERED cylinder entries in range
   - Calculates totals
   - Checks for previous bill
   - Creates new bill if needed
   - Logs bill generation
4. Page refreshes with new bills

### Payment Recording Flow:

(Note: Payment recording functionality appears to be handled elsewhere in the system, possibly through the invoice management or external payment entry)

### Invoice Generation Flow:

1. User selects bills without invoices
2. Clicks "Generate Invoices"
3. For each bill:
   - Generates invoice number
   - Creates PDF
   - Saves to disk
   - Creates Invoice record
   - Logs generation
4. Table refreshes with invoice information

### Bill Deletion Flow:

1. User clicks delete on a bill
2. Confirmation dialog appears
3. On confirm:
   - Deletes all payments (foreign key constraint)
   - Deletes bill record
   - Logs deletion
4. Page refreshes

---

## Key Features Summary

### Payment Management Page:
✅ View bills with computed status  
✅ Filter by customer, status, date range  
✅ Generate bills from cylinder deliveries  
✅ Bulk generate bills for date range  
✅ Delete bills (with confirmation)  
✅ Download/print individual bills  
✅ Generate invoices  
✅ Manage invoices (download, delete)  
✅ View payment summaries  
✅ Export reports as PDF  

### Payment Logs Page:
✅ View all payment activities  
✅ Search by customer name  
✅ Filter by event type (via badges)  
✅ View customer payment history  
✅ Access bills from logs  
✅ Chronological ordering  

---

## Error Handling

- **Permission Errors**: User-friendly messages
- **Validation Errors**: Field-specific messages
- **Database Errors**: Graceful error handling with user feedback
- **File Errors**: Handled when generating/deleting PDFs
- **Network Errors**: Retry guidance

---

## Performance Optimizations

1. **Parallel Queries**: Uses `Promise.all` for concurrent data fetching
2. **Pagination**: Limits data fetched per page
3. **Debounced Search**: Reduces API calls
4. **Indexed Queries**: Database indexes on frequently queried fields
5. **Cache Revalidation**: Strategic use of `revalidatePath`

---

This documentation covers all major functionality of the Payment Management and Payment Logs pages. The system provides comprehensive bill management, payment tracking, and invoice generation capabilities with proper audit logging.
