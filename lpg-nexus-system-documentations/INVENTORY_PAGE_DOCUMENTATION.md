# Inventory Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Server-Side Data Fetching](#server-side-data-fetching)
4. [Client-Side Components](#client-side-components)
5. [Data Validation](#data-validation)
6. [UI Features](#ui-features)

---

## Overview

The **Inventory** page (`/inventory`) manages inventory items (cylinders and related supplies) in the LPG Nexus system. It allows you to:
- Add new inventory items
- Edit existing inventory items
- Delete inventory items
- View inventory by date/month
- Search and filter inventory
- Track quantities and prices

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
src/app/inventory/
├── page.tsx                    # Main server component
└── actions.ts                  # Server actions (create, update, delete)

src/components/inventory/
├── inventory-form.tsx          # Form for create/edit
├── inventory-table.tsx         # Table display
├── inventory-filters.tsx      # Search and filter controls
├── inventory-date-picker.tsx  # Month/year picker
└── inventory-page-size-select.tsx # Pagination control
```

---

## Server-Side Data Fetching

### Data Sources

1. **Inventory Items**
   - Fetched from `InventoryItem` table
   - Filtered by month/year (entryDate)
   - Filtered by category (if provided)
   - Sorted by entryDate (descending)

2. **Pagination**
   - Server-side pagination
   - Configurable page sizes: 5, 10, 20, 50, 100, All
   - Default page size: 10

### Filters

- **Month/Year**: Filter by entry date month and year
- **Category**: Filter by inventory category
- **Search**: Search by cylinder type, vendor, or description

---

## Client-Side Components

### InventoryForm

**Purpose**: Form for creating/editing inventory items

**Fields**:
1. **Cylinder Type** (required)
   - Text input
   - Examples: "12kg (Domestic)", "35kg (Business)", etc.

2. **Category** (required)
   - Select dropdown
   - Default: "General"
   - Options: General, Commercial, Domestic, etc.

3. **Quantity** (required)
   - Number input with comma formatting
   - Minimum: 1
   - Displays as: 10,000 (with commas)

4. **Price per Cylinder** (optional)
   - Number input with comma formatting
   - Displays as: Rs 10,000 (with commas)
   - Used to calculate total price

5. **Vendor** (required)
   - Text input
   - Name of supplier/vendor

6. **Received By** (required)
   - Text input
   - Person who received the inventory

7. **Description** (optional)
   - Textarea
   - Additional notes

8. **Entry Date** (required)
   - Date picker
   - Default: Current date

9. **Verified** (optional)
   - Checkbox
   - Marks item as verified

**Validation**:
- Cylinder Type: Required, minimum 2 characters
- Category: Required selection
- Quantity: Required, minimum 1
- Price: Optional, but if provided must be >= 0
- Vendor: Required, minimum 2 characters
- Received By: Required, minimum 2 characters
- Entry Date: Required

### InventoryTable

**Purpose**: Displays inventory items in table format

**Columns**:
- Date (formatted)
- Cylinder Type
- Category
- Quantity
- Price per Cylinder (formatted with Rs and commas)
- Total Price (calculated: quantity × price, formatted)
- Vendor
- Received By
- Verified (badge)
- Actions (View, Edit, Delete)

**Features**:
- Server-side pagination
- Sortable columns
- Responsive design
- Action buttons

---

## Data Validation

### Inventory Schema

```typescript
{
  cylinderType: string (required, min 2 chars)
  category: string (required, default "General")
  quantity: number (required, min 1)
  unitPrice: number (optional, min 0)
  vendor: string (required, min 2 chars)
  receivedBy: string (required, min 2 chars)
  description: string (optional)
  entryDate: Date (required)
  verified: boolean (optional, default false)
}
```

---

## Database Schema

### InventoryItem Model

```prisma
model InventoryItem {
  id           String   @id @default(cuid())
  cylinderType String
  category     String   @default("General")
  quantity     Int
  unitPrice    Float?   // Price of one cylinder
  vendor       String
  receivedBy   String
  description  String?
  verified     Boolean  @default(false)
  entryDate    DateTime
  createdAt    DateTime @default(now())

  @@index([entryDate])
  @@index([category])
}
```

### Key Fields

- **cylinderType**: Type of cylinder (e.g., "12kg (Domestic)")
- **category**: Inventory category (indexed for fast filtering)
- **quantity**: Number of items
- **unitPrice**: Price per unit (optional)
- **entryDate**: Date when inventory was received (indexed)
- **verified**: Verification status

---

## UI Features

### Date Filtering

- **Month/Year Picker**: Select specific month and year
- **Default**: Current month
- Filters inventory by `entryDate`

### Search Functionality

- Search across:
  - Cylinder type
  - Vendor name
  - Description

### Pagination

- Configurable page sizes: 5, 10, 20, 50, 100, All
- Server-side pagination
- Page navigation controls

### Number Formatting

- **Quantity**: Displays with comma separators (10,000)
- **Price per Cylinder**: Displays as Rs 10,000 (with commas)
- **Total Price**: Calculated and formatted (Rs 100,000)
- Uses `formatCurrency()` and `formatNumber()` utilities
- Prevents line breaks with `whitespace-nowrap`

### Actions

- **View**: Opens detail drawer (read-only)
- **Edit**: Opens form drawer with pre-filled data
- **Delete**: Confirmation dialog before deletion

---

## Data Flow

### Create Inventory Item

```
User fills form → Submit
  ↓
Client validation (Zod)
  ↓
Server action: createInventoryItem
  ↓
Schema validation
  ↓
Database insert
  ↓
Revalidate page
  ↓
Show success toast
  ↓
Refresh table
```

### Update Inventory Item

```
User clicks Edit → Form opens with data
  ↓
User modifies fields → Submit
  ↓
Client validation
  ↓
Server action: updateInventoryItem
  ↓
Database update
  ↓
Revalidate page
  ↓
Show success toast
  ↓
Refresh table
```

### Delete Inventory Item

```
User clicks Delete → Confirmation dialog
  ↓
User confirms → Server action: deleteInventoryItem
  ↓
Database delete
  ↓
Revalidate page
  ↓
Show success toast
  ↓
Refresh table
```

---

## Permissions

### Access Control

- **Route**: `/inventory`
- **Permission Check**: `enforcePagePermission("/inventory")`
- **Required Permissions**:
  - View: Access to inventory module
  - Create: `canEdit("inventory")`
  - Update: `canEdit("inventory")`
  - Delete: `canEdit("inventory")`

---

## Related Pages

- **Dashboard** (`/`) - Shows inventory statistics
- **Add Cylinder** (`/add-cylinder`) - Uses inventory data
- **Reports** (`/reports`) - Inventory-based reports

---

## Future Enhancements

1. Inventory alerts (low stock notifications)
2. Inventory history/audit trail
3. Bulk inventory import from CSV
4. Inventory valuation reports
5. Supplier management
6. Inventory transfer between locations
7. Inventory export to Excel/PDF

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

