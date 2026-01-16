# User Account Page - Complete Documentation

## Overview
The User Account Page is a Super Admin feature that allows viewing detailed information about any user account in the system. When viewing an ADMIN user, it also displays all tenant users (users created by that admin) and allows the Super Admin to manage them.

**Route:** `/super-admin/users/[id]`  
**Access:** SUPER_ADMIN only  
**Purpose:** View user account details and manage tenant users for ADMIN accounts

---

## File Structure

```
next-app/
├── src/
│   ├── app/
│   │   └── super-admin/
│   │       └── users/
│   │           └── [id]/
│   │               └── page.tsx                    # Server component - Page wrapper
│   │   └── api/
│   │       └── super-admin/
│   │           └── users/
│   │               └── [id]/
│   │                   └── route.ts                # API endpoint - GET, PATCH, DELETE
│   └── components/
│       └── super-admin/
│           └── user-account-view.tsx                 # Client component - Main view
└── prisma/
    └── schema.prisma                                # Database schema
```

---

## 1. Page Component (`/app/super-admin/users/[id]/page.tsx`)

### Type: Server Component (Next.js App Router)

### Purpose
- Wraps the user account view with layout components (sidebar, topbar)
- Enforces SUPER_ADMIN permission
- Passes the user ID from URL params to the client component

### Code Structure

```typescript
interface UserAccountPageProps {
  params: {
    id: string;  // User ID from URL
  };
}

export default async function UserAccountPage({ params }: UserAccountPageProps)
```

### Components Used
- `DashboardSidebarWrapper` - Sidebar navigation
- `DashboardTopbarWrapper` - Top navigation bar
- `UserAccountView` - Main content component

### Permission Check
- Calls `enforcePagePermission("/super-admin")` to ensure only SUPER_ADMIN can access

### Layout Structure
```
<div className="flex min-h-screen bg-[#f5f7fb]">
  <DashboardSidebarWrapper />           # Left sidebar
  <div className="content-shell">
    <DashboardTopbarWrapper />          # Top bar
    <main>
      <UserAccountView userId={params.id} />  # Main content
    </main>
  </div>
</div>
```

---

## 2. API Route (`/api/super-admin/users/[id]/route.ts`)

### Endpoints

#### GET `/api/super-admin/users/[id]`

**Purpose:** Fetch user account details and tenant users

**Authentication:** Required (JWT token in cookie)

**Authorization:** Only SUPER_ADMIN can access

**Request:**
- URL Parameter: `id` (user ID)

**Response:**
```typescript
{
  user: {
    id: string;
    name: string;
    email: string;
    username: string | null;
    phone: string | null;
    role: UserRole;  // SUPER_ADMIN | ADMIN | STAFF | VIEWER | BRANCH_MANAGER
    status: UserStatus;  // ACTIVE | SUSPENDED | PENDING
    isVerified: boolean;
    businessName: string | null;
    branch: string | null;
    department: string | null;
    profileImage: string | null;
    streetAddress: string | null;
    city: string | null;
    stateProvince: string | null;
    country: string | null;
    companyDescription: string | null;
    permissions: Json | null;
    createdAt: string;
    lastLogin: string | null;
    totalDeliveries: number;  // Count of cylinder transactions
  },
  tenantUsers: TenantUser[]  // Only if user.role === ADMIN
}
```

**Tenant Users Logic:**
- If the viewed user is an ADMIN, the API fetches all users where `adminId === user.id`
- These are users created by that admin (tenant users)
- Returns empty array if user is not ADMIN

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not SUPER_ADMIN
- `404 Not Found` - User not found
- `500 Internal Server Error` - Server error

---

#### PATCH `/api/super-admin/users/[id]`

**Purpose:** Update user account information

**Request Body:**
```typescript
{
  name?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  branch?: string;
  role?: UserRole;
  status?: UserStatus;
  isVerified?: boolean;
  permissions?: Json;
}
```

**Activity Logging:**
- Creates an `ActivityLog` entry with:
  - `userId`: Current logged-in user (Super Admin)
  - `action`: "User Updated"
  - `module`: "Super Admin"
  - `details`: List of changed fields

---

#### DELETE `/api/super-admin/users/[id]`

**Purpose:** Delete a user account

**Authorization:**
- Only SUPER_ADMIN can delete users
- Cannot delete SUPER_ADMIN users (unless logged in as SUPER_ADMIN)

**Activity Logging:**
- Creates an `ActivityLog` entry with:
  - `userId`: Current logged-in user (Super Admin)
  - `action`: "User Deleted"
  - `module`: "Super Admin"
  - `details`: `Deleted user: {name} ({email})`

**Cascade Delete:**
- When an ADMIN user is deleted, all tenant users (users with `adminId === admin.id`) are automatically deleted due to `onDelete: Cascade` in Prisma schema

**Response:**
```typescript
{
  success: true
}
```

---

## 3. Client Component (`/components/super-admin/user-account-view.tsx`)

### Type: Client Component ("use client")

### Purpose
- Displays user account information
- Shows tenant users table (if user is ADMIN)
- Handles deletion of tenant users
- Manages loading and error states

---

### State Management

```typescript
const [user, setUser] = useState<UserAccountData | null>(null);
const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
const [userToDelete, setUserToDelete] = useState<TenantUser | null>(null);
const [isDeleting, setIsDeleting] = useState(false);
```

**State Variables:**
- `user`: Main user account data
- `tenantUsers`: Array of users created by this admin (only if user is ADMIN)
- `isLoading`: Loading state for initial data fetch
- `error`: Error message if fetch fails
- `deleteDialogOpen`: Controls delete confirmation dialog visibility
- `userToDelete`: Tenant user selected for deletion
- `isDeleting`: Loading state during deletion

---

### Data Interfaces

#### UserAccountData
```typescript
interface UserAccountData {
  id: string;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  businessName: string | null;
  branch: string | null;
  department: string | null;
  profileImage: string | null;
  streetAddress: string | null;
  city: string | null;
  stateProvince: string | null;
  country: string | null;
  companyDescription: string | null;
  adminId: string | null;
  createdAt: string;
  lastLogin: string | null;
}
```

#### TenantUser
```typescript
interface TenantUser {
  id: string;
  name: string;
  email: string;
  username: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  profileImage: string | null;
  createdAt: string;
  lastLogin: string | null;
}
```

---

### Functions

#### `fetchUserAccount()`
- **Purpose:** Fetches user account data and tenant users
- **API Call:** `GET /api/super-admin/users/${userId}`
- **Updates State:**
  - `setUser(data.user)`
  - `setTenantUsers(data.tenantUsers || [])`
- **Error Handling:** Sets error state and displays error message
- **Loading State:** Sets `isLoading` to false when complete

#### `handleDeleteTenantUser()`
- **Purpose:** Deletes a tenant user account
- **API Call:** `DELETE /api/super-admin/users/${userToDelete.id}`
- **Process:**
  1. Sets `isDeleting` to true
  2. Sends DELETE request
  3. Shows success toast on success
  4. Closes delete dialog
  5. Refreshes data by calling `fetchUserAccount()`
  6. Shows error toast on failure
  7. Sets `isDeleting` to false

#### `getRoleBadgeColor(role: UserRole)`
- **Purpose:** Returns Tailwind CSS classes for role badge colors
- **Role Colors:**
  - `SUPER_ADMIN`: Purple (`bg-purple-100 text-purple-700 border-purple-200`)
  - `ADMIN`: Blue (`bg-blue-100 text-blue-700 border-blue-200`)
  - `STAFF`: Green (`bg-green-100 text-green-700 border-green-200`)
  - `VIEWER`: Gray (`bg-gray-100 text-gray-700 border-gray-200`)
  - `BRANCH_MANAGER`: Orange (`bg-orange-100 text-orange-700 border-orange-200`)

---

### UI Components Structure

#### 1. Loading State
- Shows skeleton placeholders while data is loading
- Uses `Skeleton` component for loading animation

#### 2. Error State
- Displays error message in a card
- Shows "Back" button to navigate back

#### 3. Header Section
- Back button (ArrowLeft icon)
- Page title: "User Account"
- Subtitle: "View user account details"

#### 4. User Profile Card
Contains user information in a grid layout:

**Profile Header:**
- Avatar (profile image or initials)
- User name
- Role badge (color-coded)
- Verification badge (Verified/Unverified)
- Status badge (Active/Suspended/Pending)
- Username (if available)

**Information Sections (2-column grid):**

**a) Contact Information:**
- Email (with Mail icon)
- Phone (with Phone icon, if available)

**b) Business Information:**
- Business Name (if available)
- Branch (if available)
- Department (if available)

**c) Address Information:**
- Street Address (if available)
- City, State, Country (if available)

**d) Account Information:**
- Joined Date (with Calendar icon)
- Last Login (with Clock icon, if available)

**e) Company Description:**
- Full-width section (if available)
- Preserves whitespace and line breaks

#### 5. Tenant Users Section (Conditional)
**Only displays if `user.role === UserRole.ADMIN`**

**Header:**
- Users icon
- "Tenant Users" title
- Badge showing count of tenant users
- Description: "All users created by {name} ({email})"

**Content:**
- **Empty State:** Shows message if no tenant users
- **Table:** Displays tenant users with columns:
  - **User:** Avatar, name, username
  - **Email:** User email address
  - **Phone:** Phone number or "—"
  - **Role:** Color-coded badge
  - **Status:** Active/Suspended/Pending badge
  - **Joined:** Date formatted as "dd/MM/yyyy"
  - **Actions:** Delete button (Trash2 icon)

**Table Features:**
- Each row represents a tenant user
- Delete button opens confirmation dialog
- Hover effects on delete button (red background)

#### 6. Delete Confirmation Dialog
- **Trigger:** Clicking delete button on tenant user
- **Components:** `AlertDialog` from shadcn/ui
- **Content:**
  - Title: "Delete User Account"
  - Description: Confirmation message with user name and email
  - Actions:
    - Cancel button (disabled during deletion)
    - Delete button (red, shows "Deleting..." during process)

---

### Component Dependencies

#### UI Components (from `@/components/ui/`)
- `Button` - Interactive buttons
- `Card`, `CardContent`, `CardHeader`, `CardTitle` - Card container
- `Avatar`, `AvatarFallback`, `AvatarImage` - User avatar display
- `Badge` - Status and role badges
- `Skeleton` - Loading placeholders
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow` - Data table
- `AlertDialog`, `AlertDialogAction`, `AlertDialogCancel`, `AlertDialogContent`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogHeader`, `AlertDialogTitle` - Confirmation dialog

#### Icons (from `lucide-react`)
- `ArrowLeft` - Back navigation
- `User` - User icon
- `Mail` - Email icon
- `Phone` - Phone icon
- `Building` - Business icon
- `MapPin` - Address icon
- `Calendar` - Date icon
- `Shield` - Account security icon
- `CheckCircle` - Verified status
- `XCircle` - Unverified status
- `Clock` - Last login icon
- `Trash2` - Delete action
- `Users` - Tenant users icon

#### Utilities
- `toast` (from `sonner`) - Toast notifications
- `format` (from `date-fns`) - Date formatting
- `useRouter` (from `next/navigation`) - Navigation
- `useState`, `useEffect` (from `react`) - React hooks

---

## 4. Database Schema (Prisma)

### User Model
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
  department           String?
  branch               String?
  profileImage         String?
  companyDescription   String?
  streetAddress        String?
  city                 String?
  stateProvince        String?
  country              String?
  passwordHash         String?
  businessName         String?
  permissions          Json?
  lastLogin            DateTime?
  createdAt            DateTime   @default(now())
  updatedAt            DateTime   @updatedAt

  // Multi-tenant relationship
  adminId     String?
  admin       User?   @relation("TenantOwner", fields: [adminId], references: [id], onDelete: Cascade)
  tenantUsers User[]  @relation("TenantOwner")
}
```

### Key Relationships
- **Self-referencing:** `adminId` points to another `User` (the Admin/tenant owner)
- **Cascade Delete:** When an ADMIN is deleted, all tenant users are automatically deleted
- **Tenant Users:** `tenantUsers` relation returns all users where `adminId === this.id`

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
```

---

## 5. Data Flow

### Initial Page Load
1. User navigates to `/super-admin/users/[id]`
2. Server component (`page.tsx`) checks permissions
3. Renders layout with `UserAccountView` component
4. Client component mounts and calls `fetchUserAccount()`
5. API route (`GET /api/super-admin/users/[id]`) is called
6. API fetches user from database
7. If user is ADMIN, API fetches tenant users (`adminId === user.id`)
8. Response sent to client
9. Component updates state with user and tenantUsers
10. UI renders with data

### Deleting a Tenant User
1. User clicks delete button (Trash2 icon) on tenant user row
2. `setUserToDelete(tenantUser)` sets the user to delete
3. `setDeleteDialogOpen(true)` opens confirmation dialog
4. User confirms deletion
5. `handleDeleteTenantUser()` is called
6. `setIsDeleting(true)` shows loading state
7. `DELETE /api/super-admin/users/${userToDelete.id}` is called
8. API deletes user from database
9. API creates activity log entry
10. Success response received
11. Toast notification: "User deleted successfully"
12. Dialog closes
13. `fetchUserAccount()` refreshes data
14. Tenant users list updates (deleted user removed)

---

## 6. Multi-Tenancy Logic

### Admin-User Relationship
- **ADMIN users:** Have `adminId` set to their own `id` (self-reference)
- **Tenant users (STAFF/VIEWER/BRANCH_MANAGER):** Have `adminId` set to their Admin's `id`
- **SUPER_ADMIN:** Has `adminId = null` (no tenant)

### Tenant Users Query
```typescript
if (user.role === UserRole.ADMIN) {
  tenantUsers = await prisma.user.findMany({
    where: {
      adminId: user.id,  // Find all users belonging to this admin
    },
    // ... select fields
    orderBy: {
      createdAt: "desc",  // Newest first
    },
  });
}
```

### Example Scenario
- **burhan@gmail.com** (ADMIN, `id: "admin-123"`)
  - Creates **ali@gmail.com** (STAFF, `adminId: "admin-123"`)
  - Creates **hafiz@gmail.com** (BRANCH_MANAGER, `adminId: "admin-123"`)
  - Creates **mosin@gmail.com** (VIEWER, `adminId: "admin-123"`)

When Super Admin views burhan@gmail.com's account:
- Shows burhan@gmail.com's details
- Shows table with ali, hafiz, and mosin
- Super Admin can delete any of these tenant users

---

## 7. Activity Logging

### When User is Deleted
The API automatically creates an `ActivityLog` entry:

```typescript
await prisma.activityLog.create({
  data: {
    userId: currentLoggedInUser.userId,  // Super Admin's ID
    action: "User Deleted",
    module: "Super Admin",
    details: `Deleted user: ${user.name} (${user.email})`,
  },
});
```

### Activity Log Model
```prisma
model ActivityLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  module    String
  details   String?
  createdAt DateTime @default(now())
}
```

**Purpose:** Track all Super Admin actions for audit trail

---

## 8. Styling and Design

### Color Scheme
- **Background:** `bg-[#f5f7fb]` (light gray-blue)
- **Cards:** White background with rounded corners
- **Borders:** `border-[#e5eaf4]` (light gray)

### Role Badge Colors
- **SUPER_ADMIN:** Purple (`bg-purple-100 text-purple-700`)
- **ADMIN:** Blue (`bg-blue-100 text-blue-700`)
- **STAFF:** Green (`bg-green-100 text-green-700`)
- **VIEWER:** Gray (`bg-gray-100 text-gray-700`)
- **BRANCH_MANAGER:** Orange (`bg-orange-100 text-orange-700`)

### Status Badge Colors
- **ACTIVE:** Green (`bg-green-100 text-green-700`)
- **SUSPENDED:** Red (`bg-red-100 text-red-700`)
- **PENDING:** Yellow (`bg-yellow-100 text-yellow-700`)

### Verification Badge Colors
- **Verified:** Green (`bg-green-100 text-green-700`)
- **Unverified:** Orange (`bg-orange-100 text-orange-700`)

### Spacing
- Card padding: `px-4 py-4 lg:px-6`
- Section gaps: `gap-6`
- Grid columns: `md:grid-cols-2` (responsive)

---

## 9. Error Handling

### API Errors
- **401 Unauthorized:** User not logged in
- **403 Forbidden:** User is not SUPER_ADMIN
- **404 Not Found:** User ID doesn't exist
- **500 Internal Server Error:** Database or server error

### Client-Side Error Handling
- Displays error message in card
- Shows "Back" button to navigate away
- Console logs errors for debugging

### Network Errors
- Catches fetch errors
- Shows user-friendly error message
- Prevents app crash

---

## 10. Navigation Flow

### Entry Point
1. Super Admin navigates to `/super-admin` page
2. Views user management table with all users
3. Clicks on "Account User" icon (User icon from `lucide-react`) in Actions column of user table
4. Navigates to `/super-admin/users/[userId]` using `router.push()`

**Navigation Code (from user-management-panel.tsx):**
```typescript
<Button
  variant="ghost"
  size="icon"
  onClick={() => router.push(`/super-admin/users/${user.id}`)}
  className="h-8 w-8 hover:bg-blue-100 hover:text-blue-700"
  title="View User Account"
>
  <User className="h-4 w-4" />
</Button>
```

### Exit Points
- **Back Button:** Returns to previous page (`router.back()`)
- **Sidebar Navigation:** Can navigate to other pages
- **After Deletion:** Stays on same page, refreshes data

---

## 11. Permissions and Security

### Access Control
- **Page Level:** `enforcePagePermission("/super-admin")` ensures only SUPER_ADMIN can access
- **API Level:** Checks `loggedInUserData.role === UserRole.SUPER_ADMIN`
- **JWT Authentication:** All requests require valid JWT token in cookie

### Data Isolation
- Super Admin can view any user's account
- Super Admin can delete tenant users from any admin's account
- Activity logs track all actions for audit

---

## 12. Key Features

### 1. User Account Display
- Complete user profile information
- Profile image with fallback to initials
- Role, status, and verification badges
- Contact, business, and address information
- Account creation and last login dates

### 2. Tenant Users Management (Admin Only)
- Lists all users created by the viewed admin
- Table view with user details
- Delete functionality for tenant users
- Real-time count badge

### 3. Delete Functionality
- Confirmation dialog before deletion
- Loading state during deletion
- Success/error toast notifications
- Automatic data refresh after deletion
- Activity log creation

### 4. Responsive Design
- Mobile-friendly layout
- Grid adapts to screen size
- Table scrolls on small screens

### 5. Loading States
- Skeleton placeholders during initial load
- Disabled buttons during deletion
- Loading text in dialogs

---

## 13. Dependencies

### External Libraries
- **React:** UI framework
- **Next.js:** Server-side rendering, routing
- **date-fns:** Date formatting (`format`)
- **lucide-react:** Icons
- **sonner:** Toast notifications
- **@prisma/client:** Database client

### Internal Components
- `@/components/ui/*` - shadcn/ui components
- `@/components/dashboard/sidebar-wrapper` - Sidebar
- `@/components/dashboard/topbar-wrapper` - Topbar
- `@/lib/jwt` - JWT authentication
- `@/lib/permission-check` - Permission enforcement
- `@/lib/prisma` - Database client

---

## 14. Usage Example

### Scenario: Super Admin views Admin account

1. **Initial State:**
   - Super Admin is on `/super-admin` page
   - Sees user table with "burhan@gmail.com" (ADMIN)

2. **Action:**
   - Clicks "Account User" icon (User icon) in Actions column

3. **Navigation:**
   - URL changes to `/super-admin/users/admin-123`
   - Page loads with loading skeleton

4. **Data Fetch:**
   - API fetches burhan@gmail.com's account
   - API fetches tenant users (ali, hafiz, mosin)
   - Data displayed in UI

5. **Display:**
   - Shows burhan@gmail.com's profile card
   - Shows "Tenant Users" section with 3 users
   - Table displays: ali@gmail.com (STAFF), hafiz@gmail.com (BRANCH_MANAGER), mosin@gmail.com (VIEWER)

6. **Delete Action:**
   - Super Admin clicks delete on ali@gmail.com
   - Confirmation dialog appears
   - Super Admin confirms
   - API deletes ali@gmail.com
   - Activity log created: "Deleted user: Ali (ali@gmail.com)"
   - Table refreshes, now shows 2 users
   - Success toast: "User deleted successfully"

---

## 15. Code Snippets

### Fetching User Account
```typescript
async function fetchUserAccount() {
  setIsLoading(true);
  setError(null);
  try {
    const response = await fetch(`/api/super-admin/users/${userId}`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to fetch user account");
    }
    const data = await response.json();
    setUser(data.user);
    setTenantUsers(data.tenantUsers || []);
  } catch (err) {
    console.error("Error fetching user account:", err);
    setError(err instanceof Error ? err.message : "Failed to load user account");
  } finally {
    setIsLoading(false);
  }
}
```

### Deleting Tenant User
```typescript
async function handleDeleteTenantUser() {
  if (!userToDelete) return;
  
  setIsDeleting(true);
  try {
    const response = await fetch(`/api/super-admin/users/${userToDelete.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || "Failed to delete user");
    }

    toast.success("User deleted successfully.");
    setDeleteDialogOpen(false);
    setUserToDelete(null);
    await fetchUserAccount();  // Refresh data
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete user";
    toast.error(errorMsg);
  } finally {
    setIsDeleting(false);
  }
}
```

### API: Fetching Tenant Users
```typescript
// If this user is an ADMIN, get all tenant users
let tenantUsers = [];
if (user.role === UserRole.ADMIN) {
  tenantUsers = await prisma.user.findMany({
    where: {
      adminId: user.id,  // Users belonging to this admin
    },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      status: true,
      isVerified: true,
      profileImage: true,
      createdAt: true,
      lastLogin: true,
    },
    orderBy: {
      createdAt: "desc",  // Newest first
    },
  });
}
```

---

## 16. Testing Scenarios

### Test Case 1: View Admin Account
- **Input:** Navigate to `/super-admin/users/[admin-id]`
- **Expected:** Shows admin's profile and tenant users table

### Test Case 2: View Non-Admin Account
- **Input:** Navigate to `/super-admin/users/[staff-id]`
- **Expected:** Shows user's profile, no tenant users section

### Test Case 3: Delete Tenant User
- **Input:** Click delete on tenant user, confirm
- **Expected:** User deleted, table refreshes, activity log created

### Test Case 4: Unauthorized Access
- **Input:** Non-SUPER_ADMIN tries to access page
- **Expected:** Redirected or 403 error

### Test Case 5: Invalid User ID
- **Input:** Navigate to `/super-admin/users/invalid-id`
- **Expected:** Error message displayed

---

## 17. Future Enhancements (Potential)

1. **Edit User:** Add edit functionality directly on this page
2. **Activity Logs:** Show activity logs for this user
3. **Statistics:** Show user statistics (total transactions, etc.)
4. **Export:** Export user data to CSV/PDF
5. **Bulk Actions:** Delete multiple tenant users at once
6. **Search/Filter:** Filter tenant users by role or status
7. **Pagination:** Paginate tenant users if list is large

---

## 18. Summary

The User Account Page is a comprehensive Super Admin tool that:
- Displays complete user account information
- Shows tenant users for ADMIN accounts
- Allows deletion of tenant users
- Tracks all actions in activity logs
- Provides a clean, responsive UI
- Enforces proper security and permissions

**Key Files:**
1. `src/app/super-admin/users/[id]/page.tsx` - Page wrapper
2. `src/components/super-admin/user-account-view.tsx` - Main component
3. `src/app/api/super-admin/users/[id]/route.ts` - API endpoint

**Key Features:**
- Multi-tenant user management
- Activity logging
- Real-time data updates
- Error handling
- Loading states
- Responsive design

