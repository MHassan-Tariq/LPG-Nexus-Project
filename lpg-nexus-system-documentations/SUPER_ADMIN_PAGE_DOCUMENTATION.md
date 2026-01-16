# Super Admin Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Access Control](#access-control)
4. [Key Features](#key-features)
5. [User Management](#user-management)
6. [System Operations](#system-operations)

---

## Overview

The **Super Admin** page (`/super-admin`) is the administrative control center for LPG Nexus. It provides:
- User management (create, edit, delete, permissions)
- System overview and analytics
- Activity logs
- Data management (backup, restore, delete)
- Access code management
- System configuration

**Access**: Restricted to SUPER_ADMIN role only

---

## Page Structure

### File Organization

```
src/app/super-admin/
├── page.tsx                    # Main page
├── dashboard/
│   └── page.tsx                # Admin dashboard
├── activity-logs/
│   └── page.tsx                # Activity logs
└── reset-access-code/
    └── page.tsx                # Access code reset

src/components/super-admin/
├── user-management-panel.tsx   # User management
├── create-user-modal.tsx       # Create user form
├── edit-user-sheet.tsx         # Edit user form
├── manage-permissions-modal.tsx # Permission management
├── overview-tab.tsx            # System overview
├── reports-analysis-tab.tsx   # Reports analysis
└── delete-all-data-section.tsx # Data deletion
```

---

## Access Control

### Super Admin Access

**Requirements**:
- User role must be `SUPER_ADMIN`
- Access code verification (if enabled)
- Special authentication flow

**Protection**:
- Route-level protection
- Component-level checks
- API endpoint protection

### Access Code System

- **Purpose**: Additional security layer
- **Storage**: `SuperAdminAccessCode` table
- **Verification**: Required for sensitive operations
- **Reset**: Can be reset by existing super admin

---

## Key Features

### 1. User Management

**Operations**:
- **Create User**: Add new system users
- **Edit User**: Update user information
- **Delete User**: Remove users from system
- **Manage Permissions**: Set module-level permissions
- **Change Role**: Assign user roles
- **Activate/Suspend**: Control user access
- **Verify Users**: Mark users as verified

**User Roles**:
- SUPER_ADMIN: Full system access
- ADMIN: Administrative access
- BRANCH_MANAGER: Branch-level access
- STAFF: Limited access
- VIEWER: Read-only access

**User Status**:
- ACTIVE: User can log in
- SUSPENDED: User access blocked
- PENDING: Awaiting verification

### 2. System Overview

**Metrics**:
- Total users
- Active users
- Total customers
- Total cylinders
- System activity
- Recent changes

### 3. Activity Logs

**Features**:
- View all system activity
- Filter by user, module, action
- Search functionality
- Export logs
- Audit trail

### 4. Data Management

**Operations**:
- **Backup**: Create system backup
- **Restore**: Restore from backup
- **Delete All Data**: Factory reset (with OTP verification)
- **Export Data**: Export to various formats

### 5. Reports & Analytics

**Features**:
- System-wide reports
- User activity reports
- Financial reports
- Performance metrics
- Export capabilities

---

## User Management

### Create User

**Fields**:
- Name (required)
- Email (required, unique)
- Phone (optional)
- Username (optional, unique)
- Role (required)
- Status (ACTIVE/PENDING/SUSPENDED)
- Business Name (optional)
- Branch (optional)
- Permissions (JSON object)

**Process**:
1. Fill user form
2. Validation
3. Check email/username uniqueness
4. Create user record
5. Set default permissions
6. Send notification (if configured)

### Edit User

**Fields**: Same as create, plus:
- Current password (for verification)
- New password (optional)

**Process**:
1. Load user data
2. Pre-fill form
3. User modifies fields
4. Validation
5. Update user record
6. Update permissions if changed

### Delete User

**Process**:
1. Confirmation dialog
2. Check for dependencies
3. Delete user record
4. Log deletion activity
5. Show success notification

### Manage Permissions

**Permission Structure**:
```typescript
{
  addCylinder: { view: boolean, edit: boolean },
  addCustomer: { view: boolean, edit: boolean },
  payments: { view: boolean, edit: boolean },
  inventory: { view: boolean, edit: boolean },
  expenses: { view: boolean, edit: boolean },
  reports: { view: boolean, edit: boolean },
  settings: { view: boolean, edit: boolean },
  // ... other modules
}
```

---

## System Operations

### Factory Reset (Delete All Data)

**Security**:
- Requires OTP verification
- Email confirmation
- Multiple confirmation steps
- Irreversible operation

**Process**:
1. Request OTP via email
2. Enter OTP
3. Final confirmation
4. Delete all data (except super admin users)
5. Log operation
6. System restart

### Backup & Restore

**Backup**:
- Creates database backup
- Includes all tables
- Timestamped filename
- Stored securely

**Restore**:
- Select backup file
- Verification
- Restore database
- System restart

---

## Database Schema

### User Model (Admin Fields)

```prisma
model User {
  id                   String   @id @default(cuid())
  name                 String
  email                String   @unique
  role                 UserRole @default(ADMIN)
  status               UserStatus @default(PENDING)
  isVerified           Boolean  @default(false)
  permissions          Json?
  lastLogin            DateTime?
  // ... other fields
}
```

### SuperAdminAccessCode Model

```prisma
model SuperAdminAccessCode {
  id        String   @id @default(cuid())
  code      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### ActivityLog Model

```prisma
model ActivityLog {
  id        String   @id @default(cuid())
  userId    String?
  user      User?    @relation(...)
  action    String
  module    String?
  details   String?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

---

## Permissions

### Access Control

- **Route**: `/super-admin`
- **Permission Check**: SUPER_ADMIN role required
- **Access Code**: Additional verification for sensitive operations
- **Operations**: All operations logged in ActivityLog

---

## UI Features

### Tab Navigation

- **Overview**: System statistics
- **User Management**: User CRUD operations
- **Activity Logs**: System activity
- **Reports**: Analytics and reports
- **Data Management**: Backup/restore/delete
- **My Account**: Super admin profile

### User Table

- **Columns**: Name, Email, Role, Status, Last Login, Actions
- **Filters**: Role, Status, Search
- **Actions**: View, Edit, Delete, Permissions, Verify

### Permission Matrix

- **Grid View**: Modules vs Permissions
- **Checkboxes**: View/Edit for each module
- **Bulk Actions**: Select all, Clear all
- **Save**: Updates user permissions

---

## Related Pages

- **Dashboard** (`/`) - Regular user dashboard
- **Settings** (`/settings`) - System settings
- **Profile** (`/profile`) - User profile
- **All Pages** - Controlled by permissions set here

---

## Future Enhancements

1. Role templates
2. Permission groups
3. Advanced audit logging
4. System health monitoring
5. Automated backups
6. Multi-tenant support
7. Advanced analytics dashboard

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready  
**Access Level**: SUPER_ADMIN Only

