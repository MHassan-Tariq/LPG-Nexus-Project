# Add Cylinder Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Server-Side Functions](#server-side-functions)
4. [Client-Side Components](#client-side-components)
5. [Data Flow](#data-flow)
6. [Validation Logic](#validation-logic)
7. [UI Features](#ui-features)
8. [Database Operations](#database-operations)

---

## Overview

The **Add Cylinder** page (`/add-cylinder`) is a comprehensive system for managing cylinder deliveries and returns. It supports two main types of entries:
- **DELIVERED**: When cylinders are delivered to customers
- **RECEIVED**: When empty cylinders are received back from customers

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
src/app/add-cylinder/
├── page.tsx                    # Main server component (data fetching)
└── actions.ts                  # Server actions (update, delete)

src/components/add-cylinder/
├── add-cylinder-wrapper.tsx    # Main client wrapper component
├── cylinder-form.tsx           # Form component (create/edit)
├── cylinder-table.tsx          # Table display component
└── cylinder-view-drawer.tsx    # Detail view drawer
```

---

## Server-Side Functions

### 1. `createCylinderEntry` (page.tsx)

**Purpose**: Creates a new cylinder entry (DELIVERED or RECEIVED)

**Process Flow**:
1. **Permission Check**: Verifies user has `canEdit("addCylinder")` permission
2. **Quantity Calculation**:
   - RECEIVED: Uses `emptyCylinderReceived` as quantity
   - DELIVERED: Uses `quantity` field
3. **Amount Calculation**:
   - DELIVERED: `unitPrice × quantity`
   - RECEIVED: Uses provided `amount` (or 0)
4. **Customer ID Resolution**:
   - Parses customer name format: "1 · Arham" or "Arham"
   - Looks up customer by code + name or name only
   - Stores `customerId` in entry
5. **Business Rule Validation** (RECEIVED only):
   - Calculates total delivered for customer
   - Calculates total received for customer
   - Validates: `(existing received + new received) ≤ total delivered`
   - Returns error if validation fails
6. **Database Creation**:
   - Creates `CylinderEntry` record
   - Handles null/empty string conversions
   - Sets `quantity` based on entry type
7. **Cache Revalidation**: Refreshes `/add-cylinder` page

**Return Value**:
- Success: `{ success: true, id: string }`
- Error: `{ success: false, error: string }`

---

### 2. `updateCylinderEntry` (actions.ts)

**Purpose**: Updates an existing cylinder entry

**Process Flow**:
1. **Permission Check**: Verifies edit permission
2. **ID Validation**: Ensures valid entry ID
3. **Quantity & Amount Calculation**: Same as create function
4. **Customer ID Resolution**: Same as create function
5. **Business Rule Validation** (RECEIVED only):
   - Excludes current entry from received total
   - Validates: `(other received + new value) ≤ total delivered`
6. **Database Update**: Updates entry with new values
7. **Cache Revalidation**: Refreshes page data

---

### 3. `deleteCylinderEntry` (actions.ts)

**Purpose**: Deletes a cylinder entry

**Process Flow**:
1. Permission check
2. Deletes entry by ID
3. Revalidates cache
4. Returns success/error

---

### 4. Main Page Component (`page.tsx`)

**Purpose**: Server component that fetches and prepares data

**Data Fetching**:

#### a. **Period Filter Calculation**
```typescript
- "current": Current month (from start of month)
- "last": Previous month
- "quarter": Last 3 months
- "all": No date filter
```

#### b. **Query Building** (`where` clause)
- **Customer Filter**: If `query` exists, filters by customer name (flexible matching)
- **Period Filter**: Applies date range filter
- **No Customer Selected**: Uses impossible ID to return empty results (shows only summary)

#### c. **Pagination**
- Handles "all" option (shows up to 10,000 records)
- Standard pagination: `skip = (page - 1) × pageSize`, `take = pageSize`

#### d. **Data Queries** (Parallel Execution)
1. **Main Entries**: Filtered, paginated, sorted by `deliveryDate DESC, id DESC`
2. **Total Count**: For pagination calculation
3. **Latest Entry**: Most recent entry (for reference)
4. **Customers List**: All customers for dropdown
5. **All Entries for Summary**: Filtered entries for customer summary calculation

#### e. **Customer Summary Calculation**
- Groups entries by customer name
- Calculates per customer:
  - `totalDelivered`: Sum of DELIVERED quantities
  - `totalReceived`: Sum of RECEIVED quantities (using `emptyCylinderReceived` or `quantity`)
  - `remaining`: `totalDelivered - totalReceived`
  - `totalAmount`: Sum of DELIVERED amounts
  - `totalCylinders`: `totalDelivered + totalReceived`
- Filters summary by selected customer if query exists

---

## Client-Side Components

### 1. `AddCylinderWrapper` Component

**State Management**:
- `selectedEntry`: Currently viewed entry
- `groupEntriesForView`: All entries in the same date/customer group
- `viewDrawerOpen`: Controls view drawer visibility
- `editingEntry`: Entry being edited (null when creating new)
- `isPending`: Loading state for async operations

**Key Functions**:

#### `handleCustomerSelect(customerNameOrLabel: string)`
- Formats customer name to "ID · Name" format
- Updates URL query parameters
- Filters table to show only selected customer
- Resets page to 1
- Preserves period and pageSize

#### `handleView(entry: CylinderEntryRow)`
- Finds all entries with same date + customer (grouping)
- Opens view drawer with grouped entries
- Separates DELIVERED and RECEIVED entries

#### `handleEdit(entry: CylinderEntryRow)`
- Sets `editingEntry` state
- Closes view drawer
- Form populates with entry data

#### `handleCancelEdit()`
- Clears `editingEntry` state
- Form resets to create mode

#### `handleUpdate(values: CylinderFormValues)`
- Calls `updateCylinderEntry` server action
- On success: Clears editing state, refreshes page with preserved filters
- Uses `router.push` with query params for proper refresh
- Handles errors and displays messages

#### `handleFormSubmit(values: CylinderFormValues)`
- Calls `onCreateSubmit` (createCylinderEntry)
- On success: Resets form, shows success message
- On error: Displays error message

---

### 2. `CylinderForm` Component

**Form Schema Validation** (Zod):

#### Base Schema:
- `billCreatedBy`: Required string
- `cylinderType`: "DELIVERED" | "RECEIVED"
- `cylinderLabel`: Required string (cylinder type selection)
- `deliveredBy`: Optional string
- `quantity`: Optional number (min 1)
- `unitPrice`: Optional number (min 0)
- `amount`: Optional number (min 0)
- `customerName`: Required string (min 2 chars)
- `verified`: Boolean
- `description`: Optional string (max 200)
- `deliveryDate`: Required date
- `paymentType`: Optional "CASH" | "CREDIT"
- `paymentAmount`: Optional number (min 0)
- `paymentReceivedBy`: Optional string
- `emptyCylinderReceived`: Optional number (min 0)

#### Custom Validations:
1. **DELIVERED Type**:
   - Requires: `quantity > 0`, `unitPrice > 0`, `deliveredBy` not empty
2. **RECEIVED Type**:
   - Requires: `emptyCylinderReceived > 0`

**Form Features**:

#### Dynamic Field Display:
- **DELIVERED Tab Shows**:
  - Cylinder quantity (with comma formatting)
  - One cylinder price (with comma formatting)
  - Cylinder total (auto-calculated, read-only, removes "0" on focus)
  - Delivery Description (conditionally shown)
  - Delivered by
- **RECEIVED Tab Shows**:
  - Empty cylinder received
  - Show Payment Type checkbox
  - Payment Type (if checkbox checked)
  - Payment received (if CASH selected)
  - Payment received by (if CASH selected)
  - Get By (label changes from "Delivered by")

#### Number Formatting:
- Quantity and unit price display with commas (e.g., "10,000")
- Parses commas on input for numeric storage
- Handles empty strings and undefined values

#### Auto-Calculation:
- `amount = quantity × unitPrice` (for DELIVERED only)
- Updates automatically when quantity or unitPrice changes
- Only calculates for DELIVERED type

#### Form Reset Logic:
- Tracks editing entry ID to detect when switching entries
- Resets form when `initialValues` change (new entry being edited)
- Preserves form values when updating same entry
- Handles default values for DELIVERED vs RECEIVED types

#### Customer Selection:
- Autocomplete dropdown with customer list
- Format: "CustomerCode · CustomerName"
- Calls `onCustomerSelect` callback to filter table
- Supports typing to search

#### Date Picker:
- Defaults to today's date
- Uses date-fns for formatting
- Required field validation

---

### 3. `CylinderTable` Component

**Display Logic**:

#### Entry Filtering:
- **Only shows DELIVERED entries as rows**
- RECEIVED entries are filtered out but their data is merged into DELIVERED rows

#### Grouping Logic:
- Groups entries by: `deliveryDate + customerName`
- Entries with same date + customer appear in same row
- RECEIVED data is displayed in same row as matching DELIVERED entry

#### RECEIVED Data Mapping:
- Creates `receivedDataByGroup` Map
- Stores for each group:
  - `emptyCylinderReceived`: Number of empty cylinders
  - `quantity`: Total received quantity
  - `cylinderWeight`: Parsed from cylinderLabel
  - `cylinderType`: Parsed from cylinderLabel
  - `verified`: Verification status
  - `description`: Received description
  - `deliveredBy`: Get By person

#### Table Columns (in order):
1. Delivered Cylinder (quantity)
2. Received Cylinder (from receivedData.quantity)
3. Remaining cylinder (calculated: Delivered - Received)
4. Unit Price
5. Total Price
6. Remaining Amount
7. Cylinder Weight
8. Cylinder Type
9. Delivered By
10. Received Cylinder Type
11. Delivered Type (badge)
12. Verified (DELIVERED) (badge)
13. Delivery Description
14. Payment Received
15. Received Cylinder Weight
16. Get By
17. Received Type (badge)
18. Verified (RECEIVED) (badge)
19. Date
20. Actions (View, Edit, Delete)

#### Sorting:
- Server-side sorting: `deliveryDate DESC, id DESC`
- Ensures newest entries first, consistent ordering for same dates

#### Pagination:
- Client controls page size (5, 10, 20, 50, 100, all)
- Shows page info: "X of Y pages"
- Preserves filters when changing pages

#### Actions:
- **View**: Opens drawer with full entry details
- **Edit**: Sets entry for editing, closes drawer, opens form
- **Delete**: Confirmation dialog, then deletes entry

---

### 4. `CylinderViewDrawer` Component

**Purpose**: Displays detailed view of cylinder entry/entries

**Features**:
- Shows grouped DELIVERED and RECEIVED entries separately
- Color-coded sections (blue for DELIVERED, orange for RECEIVED)
- Displays all fields for each entry type
- Shows separate "Edit Delivered Entry" and "Edit Received Entry" buttons
- Download Bill button (for DELIVERED entries)
- Closes when clicking outside or pressing ESC

---

## Data Flow

### Create Flow:
1. User fills form → Submit
2. `CylinderForm.handleSubmit` → `AddCylinderWrapper.handleFormSubmit`
3. `handleFormSubmit` → `createCylinderEntry` (server action)
4. Server validates, creates entry
5. `revalidatePath("/add-cylinder")`
6. Page refreshes with new data
7. Form resets to defaults

### Edit Flow:
1. User clicks Edit → `handleEdit(entry)`
2. Sets `editingEntry` state
3. Form receives `initialValues` prop
4. Form resets with entry data
5. User modifies fields → Submit
6. `handleUpdate` → `updateCylinderEntry` (server action)
7. Server validates, updates entry
8. `router.push` with preserved query params
9. Page refreshes, form clears

### View Flow:
1. User clicks View → `handleView(entry)`
2. Finds all entries in same group (date + customer)
3. Opens drawer with grouped entries
4. User can edit from drawer buttons

### Filter Flow:
1. User selects customer → `handleCustomerSelect`
2. Updates URL: `?q=1 · Arham&period=all&page=1`
3. Server component receives new searchParams
4. Queries database with customer filter
5. Table shows only filtered entries
6. Summary shows only filtered customer

---

## Validation Logic

### Client-Side Validation (React Hook Form + Zod):
- Real-time field validation
- Type coercion (strings to numbers)
- Conditional validation based on `cylinderType`
- Error messages displayed under fields

### Server-Side Validation:
- Permission checks
- Business rule: Received ≤ Delivered
- Database constraints
- Error handling and user-friendly messages

---

## UI Features

### 1. Customer Cylinder Summary
- Shows aggregated data per customer
- Columns: ID, Customer, Total Delivered, Total Received, Total Remaining, Total Cylinders, Total Amount
- Color-coded badges
- Filters to selected customer when query exists

### 2. Form Features
- Tab switching (DELIVERED / RECEIVED)
- Conditional field display
- Number formatting with commas
- Auto-calculated totals
- Date picker
- Customer autocomplete
- Success/error messages

### 3. Table Features
- Grouped row display
- Merged DELIVERED + RECEIVED data
- Pagination
- Sorting
- Filtering
- Action buttons
- Badge indicators (Verified/Pending)

### 4. View Drawer
- Detailed entry view
- Separate DELIVERED/RECEIVED sections
- Edit buttons for each type
- Download bill functionality

---

## Database Operations

### CylinderEntry Model Fields:
- `id`: Unique identifier
- `billCreatedBy`: Person who created bill/received cylinders
- `cylinderType`: "DELIVERED" | "RECEIVED"
- `cylinderLabel`: Full label (e.g., "12kg (Domestic cylinder)")
- `deliveredBy`: Person who delivered/collected
- `unitPrice`: Price per cylinder (DELIVERED)
- `quantity`: Number of cylinders (DELIVERED) or received (RECEIVED)
- `amount`: Total amount (DELIVERED)
- `customerName`: Customer name (formatted: "ID · Name")
- `customerId`: Reference to Customer table
- `verified`: Boolean verification status
- `description`: Optional description (DELIVERED only)
- `deliveryDate`: Date of delivery/receiving
- `paymentType`: "CASH" | "CREDIT" | null (RECEIVED)
- `paymentAmount`: Payment amount (RECEIVED, if CASH)
- `paymentReceivedBy`: Person who received payment (RECEIVED)
- `emptyCylinderReceived`: Number of empty cylinders (RECEIVED)

### Key Database Queries:
1. **Create**: `prisma.cylinderEntry.create()`
2. **Update**: `prisma.cylinderEntry.update()`
3. **Delete**: `prisma.cylinderEntry.delete()`
4. **List**: `prisma.cylinderEntry.findMany()` with filters
5. **Aggregate**: `prisma.cylinderEntry.aggregate()` for summaries
6. **Count**: `prisma.cylinderEntry.count()` for pagination

---

## Business Rules

1. **Received Cannot Exceed Delivered**:
   - Total received ≤ Total delivered for each customer
   - Validated on create and update
   - Error message shows current totals

2. **Quantity Handling**:
   - DELIVERED: Uses `quantity` field
   - RECEIVED: Uses `emptyCylinderReceived` as `quantity`

3. **Amount Calculation**:
   - DELIVERED: Auto-calculated (unitPrice × quantity)
   - RECEIVED: Can be manually set (for payments)

4. **Description Field**:
   - DELIVERED: Shows "Delivery Description"
   - RECEIVED: Hidden (removed per requirements)

5. **Payment Type**:
   - Only shown for RECEIVED when checkbox is checked
   - If CASH: Shows payment amount and received by fields

---

## Error Handling

- Permission errors: User-friendly messages
- Validation errors: Field-specific messages
- Database errors: Graceful error handling
- Network errors: Retry guidance
- All errors displayed in UI (form or toast)

---

## Performance Optimizations

1. **Parallel Queries**: Uses `Promise.all` for concurrent data fetching
2. **Pagination**: Limits data fetched per page
3. **Client-Side Filtering**: Some filtering done in-memory for speed
4. **Cache Revalidation**: Strategic use of `revalidatePath`
5. **Transition States**: Uses React `useTransition` for non-blocking updates

---

This documentation covers all major functionality of the Add Cylinder page. The system is designed to handle both delivery and return tracking with proper validation, grouping, and user experience optimizations.
