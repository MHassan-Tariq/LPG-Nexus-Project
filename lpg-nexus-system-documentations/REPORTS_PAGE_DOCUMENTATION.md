# Reports Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Report Types](#report-types)
4. [Data Sources](#data-sources)
5. [Export Features](#export-features)
6. [UI Features](#ui-features)

---

## Overview

The **Reports** page (`/reports`) provides comprehensive analytics and reporting capabilities for LPG Nexus. It allows you to:
- View financial reports (revenue, expenses, profit)
- Analyze cylinder delivery trends
- Generate PDF reports
- Export data to Excel
- Filter reports by date range
- View detailed breakdowns

### Dynamic Welcome Text

The page header displays a dynamic welcome message based on the software name setting:
- **Format**: "Welcome to {softwareName}"
- **Source**: Fetched from `SystemSettings` table and passed to client component
- **Default**: "Welcome to LPG Nexus" (if no software name is set)
- **Updates**: Automatically when software name is changed in Settings

---

## Page Structure

### File Organization

```
src/app/reports/
└── page.tsx                    # Main server component

src/components/reports/
├── reports-client.tsx          # Main client component
├── summary-cards.tsx           # Financial summary cards
├── revenue-expenses-chart.tsx  # Chart component
├── cylinder-type-distribution-chart.tsx # Distribution chart
└── reports-date-picker.tsx     # Date range picker
```

---

## Report Types

### 1. Financial Reports

- **Total Revenue**: Sum of all payments received
- **Total Expenses**: Sum of all expenses
- **Net Profit**: Revenue - Expenses
- **Cylinders Delivered**: Total cylinders delivered

### 2. Cylinder Reports

- **Delivery Trends**: Cylinder deliveries over time
- **Type Distribution**: Breakdown by cylinder type
- **Customer Analysis**: Deliveries by customer

### 3. Payment Reports

- **Payment History**: All payments received
- **Outstanding Amounts**: Unpaid bills
- **Payment Methods**: Breakdown by payment method

---

## Data Sources

### API Endpoints

1. **`/api/reports/data`**
   - Returns report data for selected date range
   - Includes revenue, expenses, profit
   - Includes cylinder delivery data

2. **`/api/reports/overview`**
   - Returns overview statistics
   - Quick summary of key metrics

3. **`/api/reports/download`**
   - Generates PDF report
   - Includes all report data
   - Formatted for printing

---

## Export Features

### PDF Export

- **Route**: `/api/reports/download`
- **Format**: PDF document
- **Content**:
  - Financial summary
  - Revenue breakdown
  - Expense breakdown
  - Cylinder statistics
  - Charts and graphs

### Excel Export

- Export data to Excel format
- Includes all report data
- Formatted tables
- Charts as images

---

## UI Features

### Date Range Selection

- **Start Date**: Beginning of report period
- **End Date**: End of report period
- **Default**: Current month
- Filters all report data

### Summary Cards

- **Total Revenue**: Formatted with Rs and commas
- **Total Expenses**: Formatted with Rs and commas
- **Net Profit**: Calculated and formatted
- **Cylinders Delivered**: Total count

### Charts

- **Revenue vs Expenses**: Line/bar chart
- **Cylinder Type Distribution**: Pie/doughnut chart
- **Trend Analysis**: Time series charts

### Number Formatting

- All currency values use `formatCurrency()` utility
- All numbers use `formatNumber()` utility
- Displays as: Rs 10,000 (with commas)
- Prevents line breaks with `whitespace-nowrap`

---

## Permissions

### Access Control

- **Route**: `/reports`
- **Permission Check**: `enforcePagePermission("/reports")`
- **Required Permissions**:
  - View: Access to reports module
  - Export: `canEdit("reports")` (for PDF/Excel export)

---

## Related Pages

- **Dashboard** (`/`) - Quick statistics
- **Payments** (`/payments`) - Payment data source
- **Expenses** (`/expenses`) - Expense data source
- **Add Cylinder** (`/add-cylinder`) - Cylinder data source

---

## Future Enhancements

1. Custom report builder
2. Scheduled report generation
3. Email report delivery
4. Report templates
5. Advanced filtering options
6. Comparative reports (year-over-year)
7. Forecast reports

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

