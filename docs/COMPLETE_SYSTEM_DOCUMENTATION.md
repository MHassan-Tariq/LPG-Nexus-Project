# LPG Nexus - Complete System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Authentication & Authorization](#authentication--authorization)
6. [Multi-Tenancy Implementation](#multi-tenancy-implementation)
7. [File Structure](#file-structure)
8. [Pages & Modules](#pages--modules)
9. [API Routes](#api-routes)
10. [Components](#components)
11. [Key Features](#key-features)
12. [Data Flow](#data-flow)
13. [Permissions System](#permissions-system)
14. [Date Filtering Logic](#date-filtering-logic)
15. [PDF Generation](#pdf-generation)
16. [Email System](#email-system)
17. [Deployment](#deployment)

---

## System Overview

**LPG Nexus** is a comprehensive LPG (Liquefied Petroleum Gas) cylinder management system built with Next.js 14, TypeScript, and PostgreSQL. It provides complete management of cylinders, customers, payments, expenses, inventory, and reporting with multi-tenant support.

### Core Functionality
- **Cylinder Management**: Track cylinder deliveries, receipts, and transactions
- **Customer Management**: Manage customer accounts, bills, and payments
- **Payment Processing**: Handle payments, invoices, and payment logs
- **Expense Tracking**: Record and categorize business expenses
- **Inventory Management**: Track cylinder inventory and stock levels
- **Reporting & Analytics**: Generate reports, charts, and analytics
- **Multi-Tenancy**: Complete data isolation between different admin accounts
- **User Management**: Role-based access control (SUPER_ADMIN, ADMIN, STAFF, VIEWER, BRANCH_MANAGER)
- **Super Admin Panel**: System-wide administration and monitoring

---

## Architecture

### Application Architecture
- **Framework**: Next.js 14 (App Router)
- **Rendering**: Server-Side Rendering (SSR) + Client-Side Rendering (CSR)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens stored in HTTP-only cookies
- **State Management**: React hooks (useState, useEffect, useMemo)
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS

### Architecture Pattern
- **Server Components**: Data fetching, authentication, permission checks
- **Client Components**: Interactive UI, forms, real-time updates
- **Server Actions**: Form submissions, data mutations
- **API Routes**: RESTful endpoints for data operations

---

## Technology Stack

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library (Radix UI)
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **date-fns**: Date manipulation
- **Chart.js**: Data visualization
- **React PDF**: PDF generation
- **lucide-react**: Icon library
- **sonner**: Toast notifications

### Backend
- **Next.js API Routes**: RESTful API endpoints
- **Prisma**: ORM for PostgreSQL
- **PostgreSQL**: Relational database
- **JWT (jose)**: Token-based authentication
- **bcryptjs**: Password hashing
- **Nodemailer**: Email sending

### Development Tools
- **TypeScript**: Type checking
- **ESLint**: Code linting
- **Prisma Studio**: Database GUI

---

## Database Schema

### Core Models

#### User Model
```prisma
model User {
  id                   String     @id @default(cuid())
  name                 String
  email                String     @unique
  phone                String?
  role                 UserRole   @default(ADMIN)
  status               UserStatus @default(PENDING)
  isVerified           Boolean    @default(false)
  username             String?    @unique
  passwordHash         String?
  profileImage         String?
  businessName         String?
  branch               String?
  department           String?
  streetAddress        String?
  city                 String?
  stateProvince        String?
  country              String?
  companyDescription   String?
  permissions          Json?
  lastLogin            DateTime?
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt

  // Multi-tenant relationship
  adminId     String?
  admin       User?   @relation("TenantOwner", fields: [adminId], references: [id], onDelete: Cascade)
  tenantUsers User[]  @relation("TenantOwner")

  // Relations
  customers       Customer[]
  cylinders       Cylinder[]
  bills           Bill[]
  payments        Payment[]
  cylinderEntries CylinderEntry[]
  expenses        Expense[]
  inventoryItems  InventoryItem[]
  paymentLogs     PaymentLog[]
  dailyNotes      DailyNote[]
  backups         Backup[]
  restores        Restore[]
  systemSettings  SystemSettings[]
  invoices        Invoice[]
  transactions    CylinderTransaction[]
  activityLogs    ActivityLog[]
}
```

**Key Fields:**
- `adminId`: Points to the Admin (tenant owner) this user belongs to
- For ADMIN users: `adminId = id` (self-reference)
- For STAFF/VIEWER/BRANCH_MANAGER: `adminId = their Admin's id`
- For SUPER_ADMIN: `adminId = null`

#### Customer Model
```prisma
model Customer {
  id                 String   @id @default(cuid())
  customerCode       Int      @default(autoincrement())
  name               String
  contactNumber      String
  email              String?
  customerType       String
  cylinderType       String
  billType           String
  securityDeposit    Int?
  area               String?
  city               String?
  country            String?
  notes              String?
  additionalContacts Json?
  status             String   @default("ACTIVE")
  address            String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  adminId String
  admin   User   @relation(fields: [adminId], references: [id], onDelete: Cascade)

  cylinders    Cylinder[]
  transactions CylinderTransaction[]
  bills        Bill[]
  invoices     Invoice[]

  @@unique([adminId, customerCode])
  @@unique([adminId, email])
}
```

#### Cylinder Model
```prisma
model Cylinder {
  id             String         @id @default(cuid())
  serialNumber   String
  gasType        String
  capacityLiters Int
  status         CylinderStatus @default(IN_STOCK)
  location       String
  pressurePsi    Float?
  lastInspection DateTime?
  nextInspection DateTime?
  notes          String?
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  adminId String
  admin   User   @relation(fields: [adminId], references: [id], onDelete: Cascade)

  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id])
  transactions CylinderTransaction[]

  @@unique([adminId, serialNumber])
}
```

#### CylinderEntry Model
```prisma
model CylinderEntry {
  id                String   @id @default(cuid())
  customerName      String
  cylinderLabel     String
  quantity          Int
  unitPrice         Float
  amount            Float
  deliveryDate      DateTime
  cylinderType      String   // "DELIVERED" or "RECEIVED"
  emptyCylinderReceived Int? // For RECEIVED entries
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  adminId String
  admin   User   @relation(fields: [adminId], references: [id], onDelete: Cascade)

  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id])
  billId     String?
  bill       Bill?     @relation(fields: [billId], references: [id])
}
```

#### Bill Model
```prisma
model Bill {
  id            String     @id @default(cuid())
  billNumber    String
  customerName  String
  billStartDate DateTime
  billEndDate   DateTime
  totalAmount   Float
  status        BillStatus @default(NOT_PAID)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  adminId String
  admin   User   @relation(fields: [adminId], references: [id], onDelete: Cascade)

  customerId String?
  customer   Customer? @relation(fields: [customerId], references: [id])
  entries    CylinderEntry[]
  payments   Payment[]
  invoices   Invoice[]
}
```

#### Payment Model
```prisma
model Payment {
  id          String   @id @default(cuid())
  customerName String
  amount      Float
  paymentDate DateTime
  paymentMethod String
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  adminId String
  admin   User   @relation(fields: [adminId], references: [id], onDelete: Cascade)

  billId String?
  bill   Bill?   @relation(fields: [billId], references: [id])
}
```

#### Expense Model
```prisma
model Expense {
  id          String         @id @default(cuid())
  category    ExpenseCategory
  amount      Float
  description String?
  expenseDate  DateTime
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  adminId String
  admin   User   @relation(fields: [adminId], references: [id], onDelete: Cascade)
}
```

#### InventoryItem Model
```prisma
model InventoryItem {
  id           String   @id @default(cuid())
  cylinderType String
  category     String   @default("General")
  quantity     Int
  unitPrice    Float?
  vendor       String
  receivedBy   String
  description  String?
  verified     Boolean  @default(false)
  entryDate    DateTime
  createdAt    DateTime @default(now())

  adminId String
  admin   User   @relation(fields: [adminId], references: [id], onDelete: Cascade)

  @@index([adminId])
  @@index([entryDate])
  @@index([category])
}
```

### Enums

```prisma
enum UserRole {
  SUPER_ADMIN
  ADMIN
  STAFF
  VIEWER
  BRANCH_MANAGER
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  PENDING
}

enum CylinderStatus {
  IN_STOCK
  ASSIGNED
  MAINTENANCE
  RETIRED
}

enum TransactionType {
  ISSUE
  RETURN
  MAINTENANCE
  INSPECTION
}

enum BillStatus {
  PAID
  PARTIALLY_PAID
  NOT_PAID
}

enum ExpenseCategory {
  HOME
  OTHER
}

enum PaymentEventType {
  BILL_GENERATED
  BILL_UPDATED
  BILL_DELETED
  PAYMENT_RECEIVED
  PARTIAL_PAYMENT
  INVOICE_GENERATED
  INVOICE_DOWNLOADED
  INVOICE_DELETED
}
```

### Multi-Tenancy Constraints
- All tenant-scoped models have `adminId` field
- Compound unique constraints: `@@unique([adminId, field])` ensures uniqueness per tenant
- Cascade delete: `onDelete: Cascade` ensures data cleanup when admin is deleted

---

## Authentication & Authorization

### Authentication Flow

#### Login Process
1. User submits username and password
2. Server validates credentials using `bcrypt.compare()`
3. Checks account status (ACTIVE, SUSPENDED, PENDING)
4. Verifies account is verified (`isVerified === true`)
5. Generates JWT token with user data:
   ```typescript
   {
     userId: string;
     email: string;
     name: string;
     username?: string;
     role?: string;
     adminId?: string | null;
   }
   ```
6. Sets HTTP-only cookie with JWT token
7. Redirects to dashboard

#### Registration Process
1. User submits registration form
2. Validates email uniqueness
3. Validates username uniqueness
4. Hashes password with `bcrypt`
5. Creates user with `status: PENDING`, `isVerified: false`
6. Sends OTP email for verification
7. User verifies OTP
8. Account status updated to `ACTIVE`, `isVerified: true`
9. For ADMIN users: Sets `adminId = user.id` (self-reference)

### JWT Token Structure

**Location**: `src/lib/jwt.ts`

```typescript
interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  username?: string | null;
  role?: string;
  adminId?: string | null; // For multi-tenant: Admin's ID (tenant owner)
}
```

**Token Storage**: HTTP-only cookie (secure, sameSite: "lax")
**Expiration**: 24 hours (default) or 30 days (if "Remember Me" checked)

### Authorization Functions

#### `getCurrentUser()`
- Reads JWT token from cookie
- Verifies and decodes token
- Returns `JWTPayload | null`

#### `enforcePagePermission(path: string)`
- Checks if user is authenticated
- Verifies user has permission to access the page
- Redirects to login if not authenticated
- Redirects to access-denied if no permission

#### `requireEditPermission(module: string)`
- Checks if user has edit permission for a module
- Returns `NextResponse` error if no permission
- Used in API routes

---

## Multi-Tenancy Implementation

### Tenant Isolation Strategy

**Location**: `src/lib/tenant-utils.ts`

#### Core Functions

##### `getCurrentAdminId()`
Returns the tenant ID (adminId) for the current user:
- **SUPER_ADMIN**: Returns `null` (system-level, no tenant)
- **ADMIN**: Returns their own `userId` (they own their tenant)
- **STAFF/VIEWER/BRANCH_MANAGER**: Returns their `adminId` (their Admin's userId)

##### `getTenantFilter()`
Builds Prisma `where` clause for tenant filtering:
- **SUPER_ADMIN**: Returns `{}` (no filter, can see all data)
- **Others**: Returns `{ adminId: currentAdminId }` (filtered to their tenant)

##### `getTenantIdForCreate()`
Returns `adminId` to assign to new records:
- **SUPER_ADMIN**: Uses first available ADMIN user's ID (default tenant)
- **ADMIN**: Uses their own ID
- **STAFF/VIEWER/BRANCH_MANAGER**: Uses their Admin's ID
- Throws error if user doesn't have a valid tenant

##### `canAccessTenantData(recordAdminId: string | null)`
Verifies user has access to a specific tenant's data:
- **SUPER_ADMIN**: Always returns `true`
- **Others**: Returns `true` if `currentAdminId === recordAdminId`

### Tenant Data Isolation

**All tenant-scoped models include:**
```prisma
adminId String
admin   User   @relation(fields: [adminId], references: [id], onDelete: Cascade)
```

**Query Pattern:**
```typescript
const tenantFilter = await getTenantFilter();
const data = await prisma.model.findMany({
  where: {
    ...tenantFilter, // Adds { adminId: currentAdminId } or {} for Super Admin
    // ... other filters
  },
});
```

**Create Pattern:**
```typescript
const adminId = await getTenantIdForCreate();
const record = await prisma.model.create({
  data: {
    adminId, // Assigns tenant ID
    // ... other fields
  },
});
```

### Cascade Delete
When an ADMIN user is deleted:
- All tenant users (users with `adminId === admin.id`) are deleted
- All tenant data (customers, cylinders, bills, payments, etc.) is deleted
- Ensures complete data cleanup

---

## File Structure

```
next-app/
├── prisma/
│   ├── schema.prisma              # Database schema
│   ├── seed.ts                    # Seed script
│   └── [migration scripts]        # Data migration scripts
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── page.tsx               # Dashboard (home page)
│   │   ├── layout.tsx             # Root layout
│   │   ├── login/
│   │   │   └── page.tsx           # Login page
│   │   ├── register/
│   │   │   └── page.tsx           # Registration page
│   │   ├── add-customer/
│   │   │   ├── page.tsx           # Customer management page
│   │   │   └── actions.ts         # Server actions
│   │   ├── add-cylinder/
│   │   │   ├── page.tsx           # Cylinder entry page
│   │   │   └── actions.ts         # Server actions
│   │   ├── payments/
│   │   │   ├── page.tsx           # Payments page
│   │   │   └── actions.ts         # Server actions
│   │   ├── expenses/
│   │   │   ├── page.tsx           # Expenses page
│   │   │   └── actions.ts         # Server actions
│   │   ├── inventory/
│   │   │   ├── page.tsx           # Inventory page
│   │   │   └── actions.ts         # Server actions
│   │   ├── reports/
│   │   │   └── page.tsx           # Reports page
│   │   ├── payment-logs/
│   │   │   └── page.tsx           # Payment logs page
│   │   ├── notes/
│   │   │   ├── page.tsx           # Daily notes page
│   │   │   └── actions.ts         # Server actions
│   │   ├── settings/
│   │   │   ├── page.tsx           # Settings page
│   │   │   └── actions.ts         # Server actions
│   │   ├── profile/
│   │   │   ├── page.tsx           # Profile page
│   │   │   └── actions.ts         # Server actions
│   │   ├── backup/
│   │   │   ├── page.tsx           # Backup page
│   │   │   └── actions.ts         # Server actions
│   │   ├── super-admin/
│   │   │   ├── page.tsx           # Super Admin dashboard
│   │   │   ├── users/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx   # User account view
│   │   │   └── [other super admin pages]
│   │   └── api/                   # API routes
│   │       ├── auth/
│   │       │   ├── logout/
│   │       │   └── me/
│   │       ├── customers/
│   │       │   └── route.ts
│   │       ├── cylinders/
│   │       │   └── route.ts
│   │       ├── payments/
│   │       │   └── route.ts
│   │       ├── expenses/
│   │       │   └── route.ts
│   │       ├── reports/
│   │       │   └── route.ts
│   │       └── super-admin/
│   │           └── users/
│   │               └── [id]/
│   │                   └── route.ts
│   ├── components/                # React components
│   │   ├── dashboard/             # Dashboard components
│   │   ├── add-customer/          # Customer components
│   │   ├── add-cylinder/          # Cylinder components
│   │   ├── payments/              # Payment components
│   │   ├── expenses/              # Expense components
│   │   ├── inventory/             # Inventory components
│   │   ├── reports/               # Report components
│   │   ├── settings/              # Settings components
│   │   ├── super-admin/            # Super Admin components
│   │   └── ui/                     # shadcn/ui components
│   ├── lib/                       # Utility libraries
│   │   ├── prisma.ts              # Prisma client
│   │   ├── jwt.ts                 # JWT authentication
│   │   ├── tenant-utils.ts         # Multi-tenancy utilities
│   │   ├── permission-check.ts     # Permission checking
│   │   ├── permissions.ts          # Permission definitions
│   │   ├── otp.ts                  # OTP generation/verification
│   │   ├── mail.ts                 # Email sending
│   │   └── validators.ts           # Zod schemas
│   └── types/                      # TypeScript types
└── docs/                           # Documentation
    └── COMPLETE_SYSTEM_DOCUMENTATION.md
```

---

## Pages & Modules

### 1. Dashboard (`/`)

**File**: `src/app/page.tsx`

**Purpose**: Main dashboard showing overview metrics and recent activity

**Features**:
- Overview cards (Total Customers, Total Cylinders, Total Expenses, etc.)
- Month/Year filters (dropdowns)
- Recent transactions table
- Recent payment logs
- Cylinder status chart
- Usage trends chart
- Maintenance watchlist

**Data Fetching**:
- Fetches data server-side with tenant filtering
- Applies date filters (month-only, year-only, month+year)
- Month-only filtering done client-side (JavaScript)
- Year-only and month+year filtering done server-side (Prisma)

**Components**:
- `DashboardClient`: Client component for filters and interactions
- `OverviewCards`: Metric cards
- `CylinderTable`: Recent cylinders table
- `PaymentLogs`: Recent payment logs
- `StatusChart`: Cylinder status distribution
- `UsageChart`: Usage trends over time

### 2. Add Customer (`/add-customer`)

**File**: `src/app/add-customer/page.tsx`

**Purpose**: Manage customer accounts

**Features**:
- Customer list with pagination
- Search functionality
- Add/Edit customer form (drawer)
- View customer details (drawer)
- Customer summary cards
- Status filter (Active/Inactive)
- Customer code auto-increment (per tenant)

**Components**:
- `CustomerTableClient`: Main table component
- `CustomerFormDrawer`: Add/Edit form
- `CustomerViewDrawer`: View details
- `CustomerSummary`: Summary cards

**Server Actions**: `src/app/add-customer/actions.ts`
- `createCustomer`: Create new customer
- `updateCustomer`: Update existing customer
- `deleteCustomer`: Delete customer

### 3. Add Cylinder (`/add-cylinder`)

**File**: `src/app/add-cylinder/page.tsx`

**Purpose**: Manage cylinder entries (deliveries and receipts)

**Features**:
- Cylinder entry form
- Customer cylinder summary
- Month/Year filters
- Cylinder entries table with pagination
- Bill generation
- PDF download
- Daily records view

**Entry Types**:
- **DELIVERED**: Cylinders delivered to customers
- **RECEIVED**: Empty cylinders received from customers

**Components**:
- `CylinderForm`: Entry form
- `CylinderTable`: Entries table
- `CustomerCylinderSummary`: Customer summaries
- `CylinderBillPreview`: Bill preview

**Server Actions**: `src/app/add-cylinder/actions.ts`
- `createCylinderEntry`: Create delivery/receipt entry
- `updateCylinderEntry`: Update entry
- `deleteCylinderEntry`: Delete entry (cascades RECEIVED entries)

**Validation**:
- RECEIVED entries cannot exceed DELIVERED quantity for same date, customer, cylinder label, and unit price

### 4. Payments (`/payments`)

**File**: `src/app/payments/page.tsx`

**Purpose**: Manage payments and bills

**Features**:
- Payment list with pagination
- Month/Year filters
- Bill view (drawer)
- Payment form (drawer)
- Invoice management
- Bill status badges
- Summary cards (Total Paid, Total Pending, etc.)
- PDF download

**Components**:
- `PaymentTable`: Payments table
- `BillViewDrawer`: Bill details
- `AddPaymentDrawer`: Payment form
- `InvoiceManagementDrawer`: Invoice management
- `SummaryCards`: Payment summaries

**Server Actions**: `src/app/payments/actions.ts`
- `createPayment`: Create payment
- `updatePayment`: Update payment
- `deletePayment`: Delete payment

### 5. Expenses (`/expenses`)

**File**: `src/app/expenses/page.tsx`

**Purpose**: Track business expenses

**Features**:
- Expense list with pagination
- Month/Year filters
- Add expense form
- Category filter (HOME, OTHER)
- Expense board (Kanban-style)
- Expense table

**Components**:
- `ExpensesTable`: Expenses table
- `AddExpenseForm`: Expense form
- `ExpensesBoard`: Kanban board view
- `HeroDatePicker`: Month/Year filter

**Server Actions**: `src/app/expenses/actions.ts`
- `createExpense`: Create expense
- `updateExpense`: Update expense
- `deleteExpense`: Delete expense

### 6. Inventory (`/inventory`)

**File**: `src/app/inventory/page.tsx`

**Purpose**: Manage cylinder inventory

**Features**:
- Inventory items list with pagination
- Month/Year filters
- Add/Edit inventory form
- Category filter
- Vendor filter (text-only, no numbers)
- Verification status

**Components**:
- `InventoryTable`: Inventory table
- `InventoryForm`: Add/Edit form
- `InventoryDatePicker`: Month/Year filter

**Server Actions**: `src/app/inventory/actions.ts`
- `createInventoryItem`: Create inventory item
- `updateInventoryItem`: Update inventory item
- `deleteInventoryItem`: Delete inventory item

**Validation**:
- Vendor field accepts only letters, spaces, hyphens, apostrophes, commas, periods, and ampersands

### 7. Reports (`/reports`)

**File**: `src/app/reports/page.tsx`

**Purpose**: Generate reports and analytics

**Features**:
- Month/Year filters
- Revenue vs Expenses chart
- Cylinder type distribution chart
- Usage trends chart
- Detailed reports table
- PDF export
- Report preview

**Components**:
- `ReportsClient`: Main client component
- `RevenueExpensesChart`: Revenue vs expenses
- `CylinderTypeDistributionChart`: Distribution chart
- `CylinderUsageTrendChart`: Usage trends
- `DetailedReportsTable`: Reports table
- `ReportPreview`: PDF preview

**API Route**: `src/app/api/reports/data/route.ts`
- Fetches reports data with date filtering
- Calculates comparison metrics (previous period)

### 8. Payment Logs (`/payment-logs`)

**File**: `src/app/payment-logs/page.tsx`

**Purpose**: View payment event logs

**Features**:
- Payment logs list with pagination
- Month/Year filters
- Search functionality
- Event type badges
- Customer log details (sheet)

**Components**:
- `PaymentLogsTable`: Logs table
- `PaymentLogsFilters`: Month/Year filters
- `PaymentLogsSearch`: Search bar
- `EventTypeBadge`: Event type display

### 9. Notes (`/notes`)

**File**: `src/app/notes/page.tsx`

**Purpose**: Daily notes/journal

**Features**:
- Daily notes editor
- Date picker
- Rich text editing
- Sections and labels
- Character count

**Components**:
- `DailyNotesClient`: Notes editor

**Server Actions**: `src/app/notes/actions.ts`
- `saveDailyNote`: Save/update daily note

### 10. Settings (`/settings`)

**File**: `src/app/settings/page.tsx`

**Purpose**: System settings and configuration

**Features**:
- Software profile (name, logo)
- Bill design customization
- Report design customization
- Chatbot settings
- Premium overview

**Components**:
- `SettingsTabs`: Tab navigation
- `SoftwareProfileTab`: Name and logo
- `BillDesigningTab`: Bill customization
- `ReportDesigningTab`: Report customization
- `ChatbotSettingsTab`: Chatbot configuration

**Server Actions**: `src/app/settings/actions.ts`
- `saveSettings`: Save software settings
- `saveBillDesign`: Save bill design
- `saveReportDesign`: Save report design

### 11. Profile (`/profile`)

**File**: `src/app/profile/page.tsx`

**Purpose**: User profile management

**Features**:
- Profile information form
- Profile image upload
- Role display (read-only for non-Super Admin)
- Save changes

**Components**:
- `ProfileForm`: Profile form

**Server Actions**: `src/app/profile/actions.ts`
- `updateProfile`: Update user profile

### 12. Backup (`/backup`)

**File**: `src/app/backup/page.tsx`

**Purpose**: Data backup and restore

**Features**:
- Generate backup (JSON export)
- Restore from backup
- Automatic backup settings
- Factory reset (Super Admin only)

**Components**:
- `BackupClient`: Backup interface
- `FactoryResetSection`: Factory reset

**Server Actions**: `src/app/backup/actions.ts`
- `generateBackup`: Generate backup file
- `restoreBackup`: Restore from backup

### 13. Super Admin (`/super-admin`)

**File**: `src/app/super-admin/page.tsx`

**Purpose**: System-wide administration

**Features**:
- User management
- Activity logs
- System overview
- Reports and analytics
- Factory reset
- Access code management

**Sub-pages**:
- `/super-admin/dashboard`: Super Admin dashboard
- `/super-admin/users/[id]`: User account view
- `/super-admin/activity-logs`: Activity logs

**Components**:
- `SuperAdminDashboard`: Main dashboard
- `UserManagementPanel`: User management table
- `UserAccountView`: User account details
- `ActivityLogsPage`: Activity logs
- `OverviewTab`: System overview
- `ReportsAnalysisTab`: Reports analysis

---

## API Routes

### Authentication

#### `POST /api/auth/logout`
- Clears JWT token cookie
- Returns success response

#### `GET /api/auth/me`
- Returns current user information from JWT token

### Customers

#### `GET /api/customers`
- Query params: `page`, `pageSize`, `q` (search)
- Returns paginated customer list (tenant-filtered)

#### `POST /api/customers`
- Creates new customer
- Body: Customer data
- Returns created customer

#### `GET /api/customers/[id]`
- Returns customer by ID (with tenant check)

#### `PATCH /api/customers/[id]`
- Updates customer (with tenant check)

#### `DELETE /api/customers/[id]`
- Deletes customer (with tenant check)

### Cylinders

#### `GET /api/cylinders`
- Query params: `page`, `pageSize`, `q` (search), `status`
- Returns paginated cylinder list (tenant-filtered)

#### `POST /api/cylinders`
- Creates new cylinder
- Body: Cylinder data
- Returns created cylinder

#### `GET /api/cylinders/[id]`
- Returns cylinder by ID (with tenant check)

#### `PATCH /api/cylinders/[id]`
- Updates cylinder (with tenant check)

#### `DELETE /api/cylinders/[id]`
- Deletes cylinder (with tenant check)

### Payments

#### `GET /api/payments`
- Query params: `page`, `pageSize`, `month`, `year`
- Returns paginated payment list (tenant-filtered, date-filtered)

#### `POST /api/payments`
- Creates new payment
- Body: Payment data
- Returns created payment

### Expenses

#### `GET /api/expenses`
- Query params: `page`, `pageSize`, `month`, `year`, `category`
- Returns paginated expense list (tenant-filtered, date-filtered)

### Reports

#### `GET /api/reports/overview`
- Returns overview metrics (tenant-filtered)

#### `GET /api/reports/data`
- Query params: `startDate`, `endDate`
- Returns reports data with date filtering

#### `GET /api/reports/download`
- Generates and downloads PDF report

### Super Admin

#### `GET /api/super-admin/users`
- Query params: `page`, `pageSize`, `q` (search), `role`, `status`
- Returns paginated user list (all tenants for Super Admin)

#### `POST /api/super-admin/users`
- Creates new user
- Body: User data, `adminId` (for non-Admin users)
- Returns created user

#### `GET /api/super-admin/users/[id]`
- Returns user details and tenant users (if ADMIN)

#### `PATCH /api/super-admin/users/[id]`
- Updates user
- Creates activity log entry

#### `DELETE /api/super-admin/users/[id]`
- Deletes user
- Creates activity log entry

#### `GET /api/super-admin/overview`
- Returns system-wide overview metrics

#### `GET /api/super-admin/activity-logs`
- Returns activity logs (paginated)

---

## Components

### Dashboard Components

#### `DashboardClient`
- Client component for dashboard interactions
- Month/Year filter dropdowns
- Updates URL parameters
- Syncs with server-side data

#### `OverviewCards`
- Displays metric cards (Total Customers, Total Cylinders, etc.)
- Color-coded cards
- Responsive grid layout

#### `CylinderTable`
- Recent cylinders table
- Pagination
- Status badges

#### `PaymentLogs`
- Recent payment logs
- Event type badges
- Customer log details (sheet)

#### `StatusChart`
- Cylinder status distribution (doughnut chart)
- Chart.js implementation

#### `UsageChart`
- Usage trends over time (line chart)
- Chart.js implementation

### Form Components

All forms use:
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **shadcn/ui**: Form components (Input, Select, Textarea, etc.)

### Table Components

All tables include:
- **Pagination**: Server-side or client-side
- **Search**: Filter by name, email, etc.
- **Sorting**: By date, name, etc.
- **Actions**: Edit, Delete, View buttons

### Filter Components

#### `MonthYearPicker`
- Reusable month/year filter
- Updates URL parameters
- Handles "ALL" selections

#### `HeroDatePicker`
- Month/Year filter for expenses and inventory
- Custom date range picker

---

## Key Features

### 1. Multi-Tenancy
- Complete data isolation between admin accounts
- Tenant-scoped queries using `adminId`
- Cascade delete when admin is deleted
- Super Admin can view all tenants

### 2. Role-Based Access Control
- **SUPER_ADMIN**: System-wide access
- **ADMIN**: Full access to their tenant
- **STAFF**: Limited access (permissions-based)
- **VIEWER**: Read-only access
- **BRANCH_MANAGER**: Branch-specific access

### 3. Date Filtering
- Month-only: Client-side JavaScript filtering
- Year-only: Server-side Prisma filtering
- Month+Year: Server-side Prisma filtering
- Applied consistently across all pages

### 4. Pagination
- Server-side pagination for large datasets
- Client-side pagination for filtered results
- Consistent styling across all pages
- Page size selection (10, 20, 50, 100)

### 5. PDF Generation
- Bill PDFs using React PDF
- Invoice PDFs
- Report PDFs
- Customizable templates

### 6. Email System
- OTP emails for account verification
- Password reset emails
- Nodemailer integration
- HTML email templates

### 7. Activity Logging
- Tracks all Super Admin actions
- User creation, updates, deletions
- System changes
- Audit trail

### 8. Bill Generation
- Automatic bill generation from cylinder entries
- Bill combining
- Bill resync
- Bill status tracking

### 9. Invoice Management
- Invoice generation from bills
- Invoice download (PDF)
- Invoice tracking

### 10. Backup & Restore
- JSON backup export
- Restore from backup
- Automatic backup scheduling
- Factory reset (Super Admin only)

---

## Data Flow

### Page Load Flow

1. **User navigates to page**
2. **Server component (`page.tsx`) executes:**
   - Checks authentication (`getCurrentUser()`)
   - Checks permissions (`enforcePagePermission()`)
   - Gets tenant filter (`getTenantFilter()`)
   - Fetches data from database (with tenant filter)
   - Passes data to client components
3. **Client component renders:**
   - Displays data
   - Handles user interactions
   - Updates URL parameters
   - Triggers data refresh

### Form Submission Flow

1. **User submits form**
2. **Client component:**
   - Validates with Zod schema
   - Calls server action
3. **Server action:**
   - Checks permissions
   - Gets tenant ID (`getTenantIdForCreate()`)
   - Validates data
   - Creates/updates record in database
   - Returns success/error
4. **Client component:**
   - Shows toast notification
   - Refreshes data
   - Closes form/drawer

### API Request Flow

1. **Client makes API request**
2. **API route handler:**
   - Checks authentication
   - Checks permissions
   - Gets tenant filter
   - Queries database
   - Returns JSON response
3. **Client receives response:**
   - Updates UI
   - Handles errors

---

## Permissions System

### Permission Structure

**Location**: `src/lib/permissions.ts`

```typescript
interface UserPermissions {
  [module: string]: "view" | "edit" | "none";
}
```

### Modules
- `dashboard`
- `addCylinder`
- `addCustomer`
- `payments`
- `paymentLogs`
- `expenses`
- `inventory`
- `reports`
- `notes`
- `settings`
- `backup`
- `superAdmin`

### Permission Levels
- **view**: Can view data but cannot edit
- **edit**: Can view and edit data
- **none**: No access

### Permission Checking

#### `canView(module: string)`
- Checks if user can view a module
- Returns `boolean`

#### `canEdit(module: string)`
- Checks if user can edit a module
- Returns `boolean`

#### `requireEditPermission(module: string)`
- Used in API routes
- Returns `NextResponse` error if no permission

### Default Permissions by Role

- **SUPER_ADMIN**: Full access to all modules
- **ADMIN**: Full access to all modules (within their tenant)
- **STAFF**: Configurable permissions
- **VIEWER**: View-only access
- **BRANCH_MANAGER**: Branch-specific permissions

---

## Date Filtering Logic

### Filter Types

#### 1. Month-Only Filter (All Years)
- **Selection**: Month = "05" (May), Year = "ALL"
- **Implementation**: 
  - Server: Fetches all data (with tenant filter)
  - Client: Filters by month number in JavaScript
- **Reason**: Need to check all years for the selected month

#### 2. Year-Only Filter (All Months)
- **Selection**: Month = "ALL", Year = "2017"
- **Implementation**:
  - Server: Uses Prisma date filter `{ gte: startOfYear, lte: endOfYear }`
- **Reason**: Can filter at database level for efficiency

#### 3. Month+Year Filter
- **Selection**: Month = "04" (April), Year = "2017"
- **Implementation**:
  - Server: Uses Prisma date filter `{ gte: startOfMonth, lte: endOfMonth }`
- **Reason**: Specific date range, efficient database query

### Implementation Pattern

```typescript
// Determine filter type
const shouldFilterByDate = month && month !== "ALL" && year && year !== "ALL";
const shouldFilterByMonthOnly = month && month !== "ALL" && (!year || year === "ALL");
const shouldFilterByYearOnly = (!month || month === "ALL") && year && year !== "ALL";

// Build date filter
let dateFilter: { gte?: Date; lte?: Date } | undefined = undefined;

if (shouldFilterByDate) {
  // Month + Year
  const startDate = startOfMonth(parseMonthYear(month, year)!);
  const endDate = endOfMonth(parseMonthYear(month, year)!);
  dateFilter = { gte: startDate, lte: endDate };
} else if (shouldFilterByYearOnly) {
  // Year only
  const startDate = startOfYear(new Date(parseInt(year!), 0, 1));
  const endDate = endOfYear(new Date(parseInt(year!), 11, 31));
  dateFilter = { gte: startDate, lte: endDate };
}

// For month-only, fetch all and filter in JavaScript
if (shouldFilterByMonthOnly && month) {
  const allData = await prisma.model.findMany({ where: tenantFilter });
  const selectedMonthNumber = parseInt(month) - 1;
  const filteredData = allData.filter((item) => {
    const itemMonth = getMonth(item.dateField);
    return itemMonth === selectedMonthNumber;
  });
}
```

---

## PDF Generation

### Technology
- **React PDF** (`@react-pdf/renderer`)
- Server-side PDF generation
- Customizable templates

### PDF Types

#### 1. Bill PDF
- Customer information
- Bill period (start date - end date)
- Cylinder entries table
- Total amount
- Payment status

#### 2. Invoice PDF
- Invoice number
- Customer information
- Bill details
- Payment information
- Due date

#### 3. Report PDF
- Report period
- Charts and graphs
- Detailed tables
- Summary metrics

### PDF Routes
- `/api/bills/[id]/download`
- `/api/invoices/[invoiceId]/download`
- `/api/reports/download`

---

## Email System

### Technology
- **Nodemailer**
- SMTP configuration
- HTML email templates

### Email Types

#### 1. OTP Email
- 6-digit OTP code
- Expiration time
- Account verification

#### 2. Password Reset Email
- Reset link
- Expiration time
- Security notice

### Email Configuration
```typescript
{
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
}
```

### Email Functions
- `sendOtpEmail(email: string, otp: string)`
- `sendPasswordResetEmail(email: string, resetLink: string)`

---

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/lpg_nexus

# JWT
JWT_SECRET=your-secret-key-at-least-256-bits

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lpgnexus.com

# Node Environment
NODE_ENV=production
```

### Build Process

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:push

# Build Next.js app
npm run build

# Start production server
npm start
```

### Database Setup

1. Create PostgreSQL database
2. Set `DATABASE_URL` in `.env`
3. Run `npm run db:push` to create tables
4. (Optional) Run `npm run db:seed` to load sample data

### Production Considerations

- Use HTTPS for secure cookies
- Set strong `JWT_SECRET`
- Use environment variables for sensitive data
- Enable database connection pooling
- Set up automatic backups
- Monitor error logs
- Use CDN for static assets

---

## Summary

**LPG Nexus** is a comprehensive, multi-tenant LPG cylinder management system with:

- **Complete Data Isolation**: Multi-tenant architecture ensures data security
- **Role-Based Access**: Five user roles with granular permissions
- **Comprehensive Features**: Cylinder management, payments, expenses, inventory, reports
- **Modern Tech Stack**: Next.js 14, TypeScript, PostgreSQL, Prisma
- **User-Friendly UI**: shadcn/ui components, responsive design
- **Robust Authentication**: JWT-based with HTTP-only cookies
- **Activity Logging**: Complete audit trail for Super Admin actions
- **PDF Generation**: Bills, invoices, and reports
- **Email Integration**: OTP verification and password reset
- **Backup & Restore**: Data export/import functionality

This documentation provides a complete understanding of the system architecture, implementation details, and usage patterns for developers and AI assistants.

