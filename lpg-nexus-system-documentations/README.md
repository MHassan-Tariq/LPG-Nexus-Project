# LPG Nexus System Documentation

## 📚 Complete System Documentation

This folder contains comprehensive documentation for all pages and modules in the LPG Nexus system.

---

## 📋 Documentation Index

### Core Pages

1. **[Dashboard Page](DASHBOARD_PAGE_DOCUMENTATION.md)**
   - Main landing page and operational control center
   - System statistics, financial metrics, recent activity
   - Route: `/`

2. **[Add Cylinder Page](ADD_CYLINDER_PAGE_DOCUMENTATION.md)**
   - Comprehensive cylinder delivery and return management
   - DELIVERED and RECEIVED entry types
   - Route: `/add-cylinder`

3. **[Add Customer Page](ADD_CUSTOMER_PAGE_DOCUMENTATION.md)**
   - Complete customer management system
   - Create, edit, view, delete customers
   - Route: `/add-customer`

4. **[Payments Page](PAYMENTS_PAGE_DOCUMENTATION.md)**
   - **SINGLE SOURCE OF TRUTH** for all payments
   - Bill management and payment operations
   - Route: `/payments`

5. **[Inventory Page](INVENTORY_PAGE_DOCUMENTATION.md)**
   - Inventory items management
   - Track quantities, prices, vendors
   - Route: `/inventory`

6. **[Expenses Page](EXPENSES_PAGE_DOCUMENTATION.md)**
   - Business expenses management
   - Categorized expenses (HOME, OTHER)
   - Route: `/expenses`

7. **[Reports Page](REPORTS_PAGE_DOCUMENTATION.md)**
   - Comprehensive analytics and reporting
   - Financial reports, cylinder trends
   - Route: `/reports`

8. **[Settings Page](SETTINGS_PAGE_DOCUMENTATION.md)**
   - System configuration and customization
   - Software name, logo, bill/report design
   - Route: `/settings`

9. **[Profile Page](PROFILE_PAGE_DOCUMENTATION.md)**
   - User profile management
   - Personal information, profile picture
   - Route: `/profile`

10. **[Super Admin Page](SUPER_ADMIN_PAGE_DOCUMENTATION.md)**
    - Administrative control center
    - User management, system operations
    - Route: `/super-admin` (SUPER_ADMIN only)

11. **[Payment Logs Page](PAYMENT_LOGS_PAGE_DOCUMENTATION.md)**
    - Payment activity audit trail
    - All payment-related events
    - Route: `/payment-logs`

12. **[Backup Page](BACKUP_PAGE_DOCUMENTATION.md)**
    - Data backup and restore
    - Factory reset functionality
    - Route: `/backup`

13. **[Notes Page](NOTES_PAGE_DOCUMENTATION.md)**
    - Daily notes/journal system
    - Organized sections and labels
    - Route: `/notes`

14. **[Authentication Pages](AUTH_PAGES_DOCUMENTATION.md)**
    - Login, register, password recovery
    - User authentication flow
    - Routes: `/login`, `/register`, `/forgot-password`

---

## 🎯 Design Principles

### [Payment Design Principles](PAYMENT_DESIGN_PRINCIPLES.md)

**Critical Principle**: 
- ✅ Payment entry: ONLY from `/payments` page
- ✅ Payment visibility: Everywhere (read-only)
- ❌ Do NOT create payments from other pages

This ensures:
- No duplicate payments
- Accurate remaining amounts
- Audit integrity
- Data consistency

---

## 📖 Documentation Structure

Each documentation file includes:

1. **Overview** - What the page does
2. **Page Structure** - File organization
3. **Server-Side Functions** - Data fetching and actions
4. **Client-Side Components** - UI components
5. **Data Validation** - Schema and validation rules
6. **Database Schema** - Data models
7. **UI Features** - User interface details
8. **Data Flow** - How data moves through the system
9. **Permissions** - Access control
10. **Related Pages** - Links to related functionality
11. **Future Enhancements** - Planned improvements

---

## 🔍 Quick Reference

### Routes

- `/` - Dashboard
- `/add-cylinder` - Cylinder Management
- `/add-customer` - Customer Management
- `/payments` - Payment Management (Single Source of Truth)
- `/payment-logs` - Payment Activity Logs
- `/inventory` - Inventory Management
- `/expenses` - Expense Management
- `/reports` - Reports and Analytics
- `/settings` - System Settings
- `/profile` - User Profile
- `/super-admin` - Super Admin Panel
- `/backup` - Backup and Restore
- `/notes` - Daily Notes
- `/login` - User Login
- `/register` - User Registration
- `/forgot-password` - Password Recovery

### Key Concepts

- **Single Source of Truth**: Payments only from `/payments` page
- **Dynamic Software Name**: Welcome text and branding change based on Settings
  - Navbar shows "Welcome to {softwareName}"
  - All page headers show "Welcome to {softwareName}"
  - Default: "Welcome to LPG Nexus" if no software name is set
- **Number Formatting**: All numbers use comma separators (10,000)
- **Currency Formatting**: All currency uses Rs prefix with commas (Rs 10,000)
- **Permissions**: Role-based access control throughout
- **Server Actions**: All mutations use server actions
- **Toast Notifications**: Sonner toasts for user feedback

---

## 🛠️ Technical Details

### Number Formatting

All numbers throughout the system use:
- `formatNumber(value)` - For plain numbers (10,000)
- `formatCurrency(value)` - For currency (Rs 10,000)
- `whitespace-nowrap` - Prevents line breaks in currency displays

### Database Models

- **CylinderEntry** - Cylinder deliveries and returns
- **Customer** - Customer information
- **Bill** - Customer bills
- **Payment** - Payment records (linked to Bill)
- **Expense** - Business expenses
- **InventoryItem** - Inventory items
- **User** - System users
- **ActivityLog** - System activity logs

### Permissions

All pages use:
- `enforcePagePermission(route)` - Server-side permission check
- `PagePermissionWrapper` - Client-side permission wrapper
- `canEdit(module)` - Edit permission check
- `canView(module)` - View permission check

---

## 📝 Documentation Standards

### Writing Guidelines

1. **Be Comprehensive**: Cover all important aspects
2. **Be Clear**: Use simple, clear language
3. **Be Structured**: Use consistent headings and sections
4. **Be Accurate**: Keep documentation up-to-date with code
5. **Be Practical**: Include examples and use cases

### Update Process

1. When adding new features, update relevant documentation
2. When changing functionality, update documentation
3. When fixing bugs, update documentation if behavior changes
4. Review documentation during code reviews

---

## 🔄 Maintenance

### Regular Updates

- Review documentation quarterly
- Update when major features are added
- Update when breaking changes occur
- Keep examples current

### Version Control

- Documentation is version controlled with code
- Changes should be committed with code changes
- Use clear commit messages for documentation updates

---

## 📞 Support

For questions about documentation:
1. Check the relevant page documentation
2. Review design principles documents
3. Check code comments in source files
4. Contact development team

---

**Last Updated**: 2025-01-XX  
**Status**: Active Documentation  
**Version**: 1.0

