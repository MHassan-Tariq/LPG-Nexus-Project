# Payment Logs Page - Complete Functionality Documentation

## 📋 Table of Contents
1. [Overview](#overview)
2. [Page Structure](#page-structure)
3. [Payment Events](#payment-events)
4. [Data Sources](#data-sources)
5. [UI Features](#ui-features)

---

## Overview

The **Payment Logs** page (`/payment-logs`) provides a comprehensive audit trail of all payment-related activities in LPG Nexus. It tracks:
- Bill generation events
- Payment received events
- Bill updates and deletions
- Invoice generation
- All payment-related activities

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
src/app/payment-logs/
└── page.tsx                    # Main server component

src/components/payment-logs/
├── payment-logs-table.tsx      # Logs table display
└── event-type-badge.tsx        # Event type badges
```

---

## Payment Events

### Event Types

1. **BILL_GENERATED**
   - Triggered when bills are generated
   - Includes bill period and amount

2. **BILL_UPDATED**
   - Triggered when bills are modified
   - Includes update details

3. **BILL_DELETED**
   - Triggered when bills are deleted
   - Includes deletion details

4. **PAYMENT_RECEIVED**
   - Triggered when payments are received
   - Includes payment amount and method

5. **PARTIAL_PAYMENT**
   - Triggered when partial payments are made
   - Includes remaining amount

6. **INVOICE_GENERATED**
   - Triggered when invoices are created
   - Includes invoice number

7. **INVOICE_DOWNLOADED**
   - Triggered when invoices are downloaded
   - Includes download timestamp

8. **INVOICE_DELETED**
   - Triggered when invoices are deleted
   - Includes deletion details

---

## Data Sources

### PaymentLog Model

```prisma
model PaymentLog {
  id            String           @id @default(cuid())
  billId        String?
  paymentId     String?
  customerName  String
  customerCode  Int?
  eventType     PaymentEventType
  amount        Int?
  details       String?
  billStartDate DateTime?
  billEndDate   DateTime?
  performedAt   DateTime         @default(now())
  createdAt     DateTime         @default(now())
}
```

### Data Fetching

- Fetches from `PaymentLog` table
- Sorted by `performedAt` (descending)
- Includes customer information
- Includes bill information (if applicable)

---

## UI Features

### Logs Table

**Columns**:
- Date/Time (formatted)
- Customer Name
- Customer Code
- Event Type (badge)
- Amount (formatted with Rs and commas)
- Details
- Bill Period (if applicable)

### Event Type Badges

- **Color-coded**: Different colors for different event types
- **Icons**: Visual indicators
- **Tooltips**: Additional information

### Filtering

- Filter by event type
- Filter by customer
- Filter by date range
- Search functionality

### Number Formatting

- All amounts use `formatCurrency()` utility
- Displays as: Rs 10,000 (with commas)
- Prevents line breaks with `whitespace-nowrap`

---

## Permissions

### Access Control

- **Route**: `/payment-logs`
- **Permission Check**: `enforcePagePermission("/payment-logs")`
- **Required Permissions**:
  - View: Access to payment-logs module

---

## Related Pages

- **Payments** (`/payments`) - Source of payment events
- **Dashboard** (`/`) - Shows recent payment logs
- **Reports** (`/reports`) - Uses payment log data

---

## Future Enhancements

1. Export logs to Excel/PDF
2. Advanced filtering options
3. Log search functionality
4. Log analytics
5. Automated log cleanup
6. Real-time log updates

---

**Last Updated**: 2025-01-XX  
**Status**: Production Ready

