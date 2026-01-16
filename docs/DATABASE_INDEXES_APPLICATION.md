# Database Indexes Application Guide

## ✅ Indexes Created

The following database indexes have been added to improve query performance:

### Cylinder Model:
- `status` - For filtering by cylinder status
- `customerId` - For joining with customers
- `createdAt` - For sorting by creation date

### CylinderTransaction Model:
- `recordedAt` - For filtering and sorting by transaction date
- `type` - For filtering by transaction type
- `customerId` - For joining with customers
- `cylinderId` - For joining with cylinders

### Customer Model:
- `customerCode` - For searching by customer code
- `status` - For filtering by customer status
- `name` - For searching by customer name

---

## 🚀 How to Apply Indexes

### Option 1: Using Prisma CLI (Recommended)

```bash
cd next-app
npx prisma db push
```

This will:
- Apply all schema changes including indexes
- Update your database schema
- **Note**: This is safe and won't delete data

### Option 2: Using Prisma Migrate (Production)

```bash
cd next-app
npx prisma migrate dev --name add_performance_indexes
```

This will:
- Create a migration file
- Apply the migration
- Track migration history

### Option 3: Manual SQL (If CLI doesn't work)

If you need to apply indexes manually, use the SQL file:

```bash
cd next-app
# Connect to your database and run:
psql -U your_user -d your_database -f prisma/migrations/add_performance_indexes/migration.sql
```

Or for MySQL:
```bash
mysql -u your_user -p your_database < prisma/migrations/add_performance_indexes/migration.sql
```

---

## 📊 Expected Performance Improvements

After applying indexes, you should see:

- **50-90% faster queries** on filtered/searched data
- **Faster joins** between Cylinder, Customer, and Transaction tables
- **Faster sorting** by date fields
- **Better performance** on large datasets

---

## ✅ Verification

After applying indexes, verify they were created:

### Using Prisma Studio:
```bash
cd next-app
npx prisma studio
```

### Using SQL:
```sql
-- PostgreSQL
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('Cylinder', 'CylinderTransaction', 'Customer');

-- MySQL
SHOW INDEXES FROM Cylinder;
SHOW INDEXES FROM CylinderTransaction;
SHOW INDEXES FROM Customer;
```

---

## ⚠️ Important Notes

1. **No Data Loss**: Applying indexes is safe and won't delete any data
2. **Downtime**: For large tables, index creation may take a few seconds
3. **Production**: Always backup your database before applying migrations in production
4. **Rollback**: If needed, indexes can be dropped using:
   ```sql
   DROP INDEX IF EXISTS "Cylinder_status_idx";
   -- (repeat for all indexes)
   ```

---

## 🎯 Status

- ✅ **Schema Updated**: Indexes added to `prisma/schema.prisma`
- ✅ **Migration File Created**: `prisma/migrations/add_performance_indexes/migration.sql`
- ⏳ **Pending**: Database indexes need to be applied

**Next Step**: Run `npx prisma db push` to apply indexes to your database.

---

## 📝 Troubleshooting

### If `npx prisma db push` fails:

1. **Check Prisma is installed**:
   ```bash
   npm list @prisma/client prisma
   ```

2. **Check database connection**:
   - Verify `.env` file has correct `DATABASE_URL`
   - Test connection: `npx prisma db pull` (should work)

3. **Check permissions**:
   - Ensure database user has CREATE INDEX permission
   - For production, may need DBA permissions

4. **Use manual SQL**:
   - If CLI fails, use the SQL file directly (Option 3 above)

---

**Status**: Ready to apply. Run `npx prisma db push` when ready.

