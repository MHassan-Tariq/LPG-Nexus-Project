# Multi-Tenant Migration Guide

This guide walks you through migrating your database to support multi-tenancy.

## Step 1: Add adminId as Nullable

The schema has been updated to make `adminId` nullable temporarily. Create the migration:

```bash
npx prisma migrate dev --name add_multi_tenant_admin_id_nullable
```

When prompted about data loss warnings, type `y` to proceed (we'll populate the data next).

## Step 2: Populate adminId for Existing Records

Run the data migration script to assign all existing records to the first ADMIN user:

```bash
npx tsx prisma/populate-admin-id.ts
```

This script will:
- Find or create the first ADMIN user
- Assign all existing tenant-scoped records to that admin
- Update all ADMIN users to have `adminId = id` (self-reference)

## Step 3: Make adminId Required

After populating the data, update the schema to make `adminId` required again:

1. In `prisma/schema.prisma`, change all `adminId String?` to `adminId String`
2. Change all `admin User?` to `admin User` (for non-nullable relations)

Then create the final migration:

```bash
npx prisma migrate dev --name make_admin_id_required
```

## Step 4: Verify Migration

Check that all records have adminId populated:

```sql
-- Run these queries to verify
SELECT COUNT(*) FROM "Customer" WHERE "adminId" IS NULL; -- Should be 0
SELECT COUNT(*) FROM "Bill" WHERE "adminId" IS NULL; -- Should be 0
SELECT COUNT(*) FROM "CylinderEntry" WHERE "adminId" IS NULL; -- Should be 0
-- ... etc for all tenant-scoped tables
```

## Important Notes

- **Backup your database** before running migrations
- The migration will assign all existing data to the first ADMIN user
- After migration, new records will automatically get `adminId` from the current user's JWT
- Super Admin users will have `adminId = null` and can access all tenant data

