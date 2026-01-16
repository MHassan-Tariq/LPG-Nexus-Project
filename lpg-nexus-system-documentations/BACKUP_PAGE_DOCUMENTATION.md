# Backup Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Backup Operations](#backup-operations)
4. [Restore Operations](#restore-operations)
5. [Data Management](#data-management)

---

## Overview

The **Backup** page (`/backup`) provides data backup and restore functionality for LPG Nexus. It allows you to:
- Create system backups
- Restore from backups
- View backup history
- Manage backup files
- Automatic backup scheduling (if configured)

---

## Page Structure

### File Organization

```
src/app/backup/
├── page.tsx                    # Main server component
└── actions.ts                  # Backup/restore actions

src/components/backup/
└── factory-reset-section.tsx   # Factory reset functionality
```

---

## Backup Operations

### Create Backup

**Process**:
1. User clicks "Create Backup"
2. Server action: `createBackup`
3. Database export
4. File generation
5. Storage (local or cloud)
6. Backup record creation
7. Success notification

**Backup Content**:
- All database tables
- System settings
- User data
- Customer data
- Cylinder entries
- Bills and payments
- Expenses
- Inventory
- All related data

**Backup Format**:
- SQL dump file
- JSON export
- Compressed archive

### Automatic Backups

**Configuration**:
- Scheduled backups (daily, weekly, monthly)
- Retention policy
- Storage location
- Notification settings

---

## Restore Operations

### Restore from Backup

**Process**:
1. User selects backup file
2. Confirmation dialog
3. Server action: `restoreBackup`
4. Database restore
5. Data validation
6. System restart
7. Success notification

**Safety Checks**:
- Backup file validation
- Data integrity checks
- Rollback capability
- User confirmation required

---

## Data Management

### Backup History

**Information Displayed**:
- Backup date/time
- File name
- File size
- Backup type (manual/automatic)
- Status

### Backup Storage

**Locations**:
- Local file system
- Cloud storage (if configured)
- Database table (metadata)

### Backup Model

```prisma
model Backup {
  id          String   @id @default(cuid())
  fileName    String
  fileSize    Int?
  backupDate  DateTime @default(now())
  isAutomatic Boolean  @default(false)
  createdAt   DateTime @default(now())
}
```

---

## Factory Reset

### Delete All Data

**Security**:
- Requires OTP verification
- Email confirmation
- Multiple confirmation steps
- Irreversible operation

**Process**:
1. Request OTP via email
2. Enter OTP
3. Final confirmation
4. Delete all data (except system settings)
5. Log operation
6. System restart

---

## Permissions

### Access Control

- **Route**: `/backup`
- **Permission Check**: `enforcePagePermission("/backup")`
- **Required Permissions**:
  - View: Access to backup module
  - Create Backup: `canEdit("backup")` or ADMIN/SUPER_ADMIN
  - Restore: `canEdit("backup")` or ADMIN/SUPER_ADMIN
  - Delete All Data: SUPER_ADMIN only

---

## Related Pages

- **Super Admin** (`/super-admin`) - Data management
- **Settings** (`/settings`) - Backup configuration

---

## Future Enhancements

1. Cloud backup integration
2. Incremental backups
3. Backup encryption
4. Backup scheduling UI
5. Backup verification
6. Multi-version restore
7. Backup compression optimization

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

