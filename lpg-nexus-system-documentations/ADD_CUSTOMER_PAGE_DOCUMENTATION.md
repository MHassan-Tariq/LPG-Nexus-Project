# Add Customer Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Server-Side Functions](#server-side-functions)
4. [Client-Side Components](#client-side-components)
5. [Data Validation](#data-validation)
6. [Database Schema](#database-schema)
7. [UI Features](#ui-features)

---

## Overview

The **Add Customer** page (`/add-customer`) is a comprehensive customer management system for LPG Nexus. It allows you to:
- Create new customers with complete information
- Edit existing customer details
- View customer information
- Delete customers
- Search and filter customers
- View customer statistics

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
src/app/add-customer/
├── page.tsx                    # Main server component
└── actions.ts                  # Server actions (update, delete)

src/components/add-customer/
├── customer-table.tsx          # Customer table display
├── customer-form-drawer.tsx    # Form for create/edit
├── customer-view-drawer.tsx    # Read-only view
├── customer-summary.tsx        # Statistics cards
└── customer-search-bar.tsx     # Search functionality
```

---

## Server-Side Functions

### 1. `createCustomer` (page.tsx)

**Purpose**: Creates a new customer record

**Process Flow**:
1. **Validation**: Uses `customerSchema` from validators
2. **Contact Number Processing**:
   - Extracts primary contact from `additionalContacts` array
   - Falls back to `contactNumber` field
   - Ensures at least one contact number exists
3. **Data Normalization**:
   - Trims whitespace from contact information
   - Filters out empty contacts
   - Sets default status to "ACTIVE"
4. **Database Insert**: Creates customer with all fields
5. **Revalidation**: Refreshes page data

**Fields Stored**:
- Basic Info: name, contactNumber, email
- Customer Type: customerType, cylinderType, billType
- Location: area, city, country, address
- Financial: securityDeposit
- Additional: notes, additionalContacts (JSON array)
- Status: status (ACTIVE/INACTIVE)

### 2. `updateCustomer` (actions.ts)

**Purpose**: Updates existing customer information

**Process Flow**:
1. **Permission Check**: Verifies edit permission
2. **Validation**: Validates input data
3. **Contact Processing**: Same as create
4. **Database Update**: Updates customer record
5. **Revalidation**: Refreshes page

### 3. `deleteCustomer` (actions.ts)

**Purpose**: Deletes a customer record

**Process Flow**:
1. **Permission Check**: Verifies delete permission
2. **Validation**: Checks if customer exists
3. **Database Delete**: Removes customer record
4. **Revalidation**: Refreshes page

---

## Client-Side Components

### CustomerTable

**Purpose**: Displays customer list with pagination and filtering

**Features**:
- Server-side pagination
- Search functionality
- Status filtering
- Sortable columns
- Action buttons (View, Edit, Delete)
- Responsive design

**Columns**:
- Customer Code
- Name
- Contact Number
- Email
- Customer Type
- Cylinder Type
- Bill Type
- Status
- Actions

### CustomerFormDrawer

**Purpose**: Form for creating/editing customers

**Sections**:
1. **Basic Information**
   - Name (required)
   - Contact Number (required)
   - Email (optional)

2. **Customer Details**
   - Customer Type (required)
   - Cylinder Type (required)
   - Bill Type (required)
   - Status (ACTIVE/INACTIVE)

3. **Location Information**
   - Area (optional)
   - City (optional)
   - Country (optional)
   - Address (optional)

4. **Financial Information**
   - Cylinder Security Deposit (optional, formatted with commas)

5. **Additional Contacts**
   - Dynamic list of contact persons
   - Add/Remove functionality
   - Each contact has: Name, Contact Number

6. **Notes**
   - Optional text area for additional notes

**Validation**:
- Name: Minimum 2 characters
- Contact Number: Required (from primary or additional contacts)
- Email: Valid email format (if provided)
- Customer Type: Required selection
- Cylinder Type: Required selection
- Bill Type: Required selection

### CustomerViewDrawer

**Purpose**: Read-only view of customer details

**Displays**:
- All customer information
- Formatted values
- Related data (if any)
- Action buttons (Edit, Delete)

### CustomerSummary

**Purpose**: Statistics cards showing customer metrics

**Cards**:
1. **Total Customers** - Total count
2. **Active Customers** - Count with status = ACTIVE
3. **Inactive Customers** - Count with status = INACTIVE

---

## Data Validation

### Customer Schema

```typescript
{
  name: string (min 2 chars)
  contactNumber: string (required)
  email: string (optional, valid email)
  customerType: string (required)
  cylinderType: string (required)
  billType: string (required)
  securityDeposit: number (optional, min 0)
  area: string (optional)
  city: string (optional)
  country: string (optional)
  address: string (optional)
  notes: string (optional)
  additionalContacts: array of {
    name: string
    contactNumber: string
  } (optional)
  status: "ACTIVE" | "INACTIVE" (default: ACTIVE)
}
```

### Validation Rules

1. **Name**: Required, minimum 2 characters
2. **Contact Number**: At least one required (primary or additional)
3. **Email**: If provided, must be valid email format
4. **Customer Type**: Required selection
5. **Cylinder Type**: Required selection
6. **Bill Type**: Required selection
7. **Security Deposit**: If provided, must be non-negative number

---

## Database Schema

### Customer Model

```prisma
model Customer {
  id                 String                @id @default(cuid())
  customerCode       Int                   @unique @default(autoincrement())
  name               String
  contactNumber      String
  email              String?               @unique
  customerType       String
  cylinderType       String
  billType           String
  securityDeposit    Int?
  area               String?
  city               String?
  country            String?
  notes              String?
  additionalContacts Json?
  status             String                @default("ACTIVE")
  address            String?
  createdAt          DateTime              @default(now())
  updatedAt          DateTime              @updatedAt
  
  // Relations
  cylinders          Cylinder[]
  transactions       CylinderTransaction[]
  bills              Bill[]
  invoices           Invoice[]
}
```

### Key Fields

- **customerCode**: Auto-incrementing unique identifier
- **additionalContacts**: JSON array of contact objects
- **status**: ACTIVE or INACTIVE
- **Relations**: Links to cylinders, transactions, bills, invoices

---

## UI Features

### Search Functionality

- Real-time search across:
  - Customer name
  - Contact number
  - Email
  - Customer code

### Filtering

- **Status Filter**: All, Active, Inactive
- **Type Filters**: Customer Type, Cylinder Type, Bill Type

### Pagination

- Configurable page sizes: 5, 10, 20, 50, 100, All
- Server-side pagination
- Page navigation controls

### Actions

- **View**: Opens read-only drawer
- **Edit**: Opens form drawer with pre-filled data
- **Delete**: Confirmation dialog before deletion

### Number Formatting

- **Security Deposit**: Displays with comma separators (10,000)
- Uses `formatNumber()` utility function

---

## Data Flow

### Create Customer

```
User fills form → Submit
  ↓
Client validation (Zod)
  ↓
Server action: createCustomer
  ↓
Schema validation
  ↓
Contact number processing
  ↓
Database insert
  ↓
Revalidate page
  ↓
Show success toast
  ↓
Refresh table
```

### Update Customer

```
User clicks Edit → Form opens with data
  ↓
User modifies fields → Submit
  ↓
Client validation
  ↓
Server action: updateCustomer
  ↓
Database update
  ↓
Revalidate page
  ↓
Show success toast
  ↓
Refresh table
```

### Delete Customer

```
User clicks Delete → Confirmation dialog
  ↓
User confirms → Server action: deleteCustomer
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

- **Route**: `/add-customer`
- **Permission Check**: `enforcePagePermission("/add-customer")`
- **Required Permissions**:
  - View: Access to customer module
  - Create: `canEdit("addCustomer")`
  - Update: `canEdit("addCustomer")`
  - Delete: `canEdit("addCustomer")`

---

## Related Pages

- **Dashboard** (`/`) - Shows customer statistics
- **Add Cylinder** (`/add-cylinder`) - Uses customer data
- **Payments** (`/payments`) - Links to customer bills
- **Reports** (`/reports`) - Customer-based reports

---

## Future Enhancements

1. Bulk customer import from CSV
2. Customer history/activity log
3. Customer credit limit management
4. Customer grouping/categories
5. Advanced search with multiple criteria
6. Customer export to PDF/Excel

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

