# LPG Nexus - Professional Refactoring Plan

## 🎯 Objective

Transform LPG Nexus into a "One Used Many" architecture where common logic exists only once, improving maintainability and scalability **without changing any existing behavior, UI, or business logic**.

## ✅ Core Layer Created

The following core utilities have been created and are ready for use:

### 📁 Core Structure

```
src/core/
├── data/
│   ├── pagination.ts      ✅ Standard pagination utilities
│   ├── date-filters.ts   ✅ Month/year filtering logic
│   ├── search.ts         ✅ Text search utilities
│   └── sorting.ts       ✅ Sort order utilities
│
├── tenant/
│   ├── tenant-queries.ts ✅ Wraps existing tenant-utils
│   └── tenant-guards.ts   ✅ Tenant access guards
│
├── permissions/
│   └── permission-guards.ts ✅ Wraps existing permissions
│
├── api/
│   ├── api-handler.ts    ✅ Standardized API route handler
│   ├── api-errors.ts     ✅ Standard error responses
│   └── api-response.ts   ✅ Standard success responses
│
└── ui/
    ├── table-pattern.ts  ✅ Table component patterns
    └── filter-pattern.ts ✅ Filter component patterns

src/hooks/
├── use-pagination.ts     ✅ Reusable pagination hook
├── use-search.ts        ✅ Reusable search hook
└── use-page-filters.ts  ✅ Reusable month/year filter hook
```

## 📋 Migration Strategy

### Phase 1: Core Layer (✅ COMPLETED)

- [x] Create core data utilities
- [x] Create core tenant utilities
- [x] Create core permission utilities
- [x] Create core API handler
- [x] Create core UI patterns
- [x] Create reusable hooks

### Phase 2: Validation Schemas (Next)

Extract repeated Zod schemas into separate files:

```
src/lib/validators/
├── customer.schema.ts
├── payment.schema.ts
├── expense.schema.ts
├── inventory.schema.ts
└── cylinder.schema.ts
```

**Example Migration:**

**Before:**
```typescript
// In multiple files
const customerSchema = z.object({ ... });
```

**After:**
```typescript
// src/lib/validators/customer.schema.ts
export const customerSchema = z.object({ ... });

// In files that use it
import { customerSchema } from "@/lib/validators/customer.schema";
```

### Phase 3: API Routes Refactoring (Gradual)

Refactor API routes to use core utilities one at a time.

**Example: `/api/customers/route.ts`**

**Before:**
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parseResult = paginationParamsSchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    pageSize: searchParams.get("pageSize") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });
  
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }
  
  const { page, pageSize, q } = parseResult.data;
  const skip = (page - 1) * pageSize;
  const tenantFilter = await getTenantFilter();
  // ... rest of logic
}
```

**After:**
```typescript
import { parsePaginationParams, getPaginationSkipTake } from "@/core/data/pagination";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
import { buildTextSearchFilter } from "@/core/data/search";
import { createGetHandler } from "@/core/api/api-handler";

export const GET = createGetHandler(
  async ({ tenantFilter, pagination, searchParams }) => {
    if (!pagination) {
      return NextResponse.json({ error: "Pagination required" }, { status: 400 });
    }
    
    const { skip, take } = getPaginationSkipTake(pagination.page, pagination.pageSize);
    const searchFilter = buildTextSearchFilter(
      pagination.q,
      ["name", "contactNumber", "address"]
    );
    
    const where = {
      ...tenantFilter,
      ...searchFilter,
    };
    
    // ... rest of logic
  },
  {
    requirePermission: "addCustomer",
    requirePagination: true,
  }
);
```

### Phase 4: Server Actions Refactoring

Refactor server actions to use core utilities.

**Example: `add-customer/actions.ts`**

**Before:**
```typescript
export async function deleteCustomer(id: string) {
  try {
    const hasPermission = await canEdit("addCustomer");
    if (!hasPermission) {
      return { success: false, error: "You do not have permission..." };
    }
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { adminId: true },
    });
    
    if (!(await canAccessTenantData(customer.adminId))) {
      return { success: false, error: "You do not have permission..." };
    }
    // ... rest
  }
}
```

**After:**
```typescript
import { requireEditPermissionForAction } from "@/core/permissions/permission-guards";
import { requireTenantAccess } from "@/core/tenant/tenant-guards";

export async function deleteCustomer(id: string) {
  try {
    // Check permission
    const permissionError = await requireEditPermissionForAction("addCustomer");
    if (permissionError) return permissionError;
    
    const customer = await prisma.customer.findUnique({
      where: { id },
      select: { adminId: true },
    });
    
    if (!customer) {
      return { success: false, error: "Customer not found." };
    }
    
    // Check tenant access (for server actions, we check manually)
    const hasAccess = await canAccessTenantData(customer.adminId);
    if (!hasAccess) {
      return { success: false, error: "You do not have permission..." };
    }
    // ... rest
  }
}
```

### Phase 5: Client Components Refactoring

Refactor client components to use shared hooks.

**Example: Table Component**

**Before:**
```typescript
export function CylinderTable({ initialData }: CylinderTableProps) {
  const [page, setPage] = useState(initialData.page);
  const [query, setQuery] = useState("");
  const [resolvedQuery, setResolvedQuery] = useState("");
  
  useEffect(() => {
    const id = setTimeout(() => setResolvedQuery(query), 400);
    return () => clearTimeout(id);
  }, [query]);
  
  // ... pagination logic
}
```

**After:**
```typescript
import { usePagination } from "@/hooks/use-pagination";
import { useSearch } from "@/hooks/use-search";

export function CylinderTable({ initialData }: CylinderTableProps) {
  const pagination = usePagination(initialData.total, {
    initialPage: initialData.page,
    initialPageSize: initialData.pageSize,
  });
  
  const search = useSearch({
    debounceMs: 400,
  });
  
  // ... rest of component
}
```

## 🔄 Migration Order

1. **Validation Schemas** (Low risk, high value)
   - Extract schemas to separate files
   - Update imports across codebase

2. **API Routes** (One route at a time)
   - Start with simple GET routes (customers, cylinders)
   - Then POST/PATCH/DELETE routes
   - Test each route after migration

3. **Server Actions** (One action file at a time)
   - Start with simple CRUD actions
   - Test each action after migration

4. **Client Components** (One component at a time)
   - Start with table components
   - Then form components
   - Test each component after migration

## ✅ Testing Strategy

After each migration:

1. **Manual Testing**: Verify UI looks the same
2. **Functional Testing**: Verify behavior is unchanged
3. **API Testing**: Verify API responses are identical
4. **Permission Testing**: Verify permissions still work
5. **Multi-tenant Testing**: Verify tenant isolation still works

## 📝 Key Principles

1. **No Breaking Changes**: All existing code continues to work
2. **Gradual Migration**: Migrate one file/route at a time
3. **Test After Each Change**: Don't migrate multiple files without testing
4. **Preserve Behavior**: Logic must remain identical
5. **Preserve UI**: UI must look exactly the same

## 🎯 Success Criteria

After refactoring:

- ✅ All existing functionality works identically
- ✅ UI looks exactly the same
- ✅ API responses are identical
- ✅ Permissions work the same
- ✅ Multi-tenancy works the same
- ✅ Code is more maintainable
- ✅ Common logic exists in one place
- ✅ Future changes require editing one place

## 📚 Usage Examples

### Using Core Pagination

```typescript
import { parsePaginationParams, getPaginationSkipTake } from "@/core/data/pagination";

const pagination = parsePaginationParams(searchParams);
const { skip, take } = getPaginationSkipTake(pagination.page, pagination.pageSize);
```

### Using Core Date Filters

```typescript
import { getDateFilterType, buildDateFilter } from "@/core/data/date-filters";

const { shouldFilterByDate, shouldFilterByMonthOnly } = getDateFilterType(month, year);
const dateFilter = buildDateFilter(month, year, "deliveryDate");
```

### Using Core Search

```typescript
import { buildTextSearchFilter } from "@/core/data/search";

const searchFilter = buildTextSearchFilter(query, ["name", "contactNumber"]);
```

### Using Core Tenant

```typescript
import { getTenantFilter, applyTenantFilter } from "@/core/tenant/tenant-queries";

const tenantFilter = await getTenantFilter();
const where = applyTenantFilter({ status: "ACTIVE" }, tenantFilter);
```

### Using Core Permissions

```typescript
import { requireEditPermission } from "@/core/permissions/permission-guards";

const permissionError = await requireEditPermission("payments");
if (permissionError) return permissionError;
```

### Using Hooks

```typescript
import { usePagination } from "@/hooks/use-pagination";
import { useSearch } from "@/hooks/use-search";
import { usePageFilters } from "@/hooks/use-page-filters";

const pagination = usePagination(total);
const search = useSearch();
const filters = usePageFilters();
```

## 🚀 Next Steps

1. Review this plan
2. Start with validation schemas extraction
3. Migrate one API route as a proof of concept
4. Test thoroughly
5. Continue with gradual migration

---

**Note**: This refactoring is architectural only. No business logic, UI, or behavior changes are allowed.

