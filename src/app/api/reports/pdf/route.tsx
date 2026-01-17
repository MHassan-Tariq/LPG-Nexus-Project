export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

import { Buffer } from "node:buffer";
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
// Helper functions for formatting (PDF doesn't support React components)
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return `Rs ${new Intl.NumberFormat('en-US').format(value)}`;
}

function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return new Intl.NumberFormat('en-US').format(value);
}

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1f2933",
  },
  header: {
    fontSize: 24,
    marginBottom: 8,
    fontWeight: 700,
    color: "#1c5bff",
  },
  subtitle: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontWeight: 600,
    fontSize: 12,
    marginBottom: 8,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableHeader: {
    backgroundColor: "#f3f4f6",
    fontWeight: 600,
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 9,
  },
  tableCellId: {
    width: "8%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 9,
  },
  tableCellName: {
    width: "18%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 9,
  },
  tableCellAmount: {
    width: "14%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 9,
    textAlign: "right",
  },
  tableCellCylinders: {
    width: "10%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 9,
    textAlign: "right",
  },
  tableCellStatus: {
    width: "12%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 9,
    textAlign: "center",
  },
  summaryBox: {
    backgroundColor: "#f5f7fb",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: 600,
    fontSize: 10,
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: 700,
  },
});

export async function GET() {
  // Fetch all bills with customer and payment information
  const bills = await prisma.bill.findMany({
    include: {
      customer: { select: { customerCode: true, name: true } },
      payments: { select: { amount: true } },
    },
    orderBy: [
      { customer: { customerCode: "asc" } },
      { billStartDate: "desc" },
    ],
  });

  // Calculate summary statistics
  const totalBills = bills.length;
  const totalAmount = bills.reduce((sum, bill) => {
    return sum + bill.lastMonthRemaining + bill.currentMonthBill;
  }, 0);
  const totalPaid = bills.reduce((sum, bill) => {
    const paid = bill.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
    return sum + paid;
  }, 0);
  const totalRemaining = totalAmount - totalPaid;
  const totalCylinders = bills.reduce((sum, bill) => sum + (bill.cylinders || 0), 0);
  const totalCustomers = new Set(bills.map((bill) => bill.customerId)).size;

  // Calculate period range from bills
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;
  if (bills.length > 0) {
    const allStartDates = bills.map((bill) => bill.billStartDate);
    const allEndDates = bills.map((bill) => bill.billEndDate);
    periodStart = new Date(Math.min(...allStartDates.map((d) => d.getTime())));
    periodEnd = new Date(Math.max(...allEndDates.map((d) => d.getTime())));
  }

  const now = new Date();

  const document = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Payment Management Report</Text>
        <Text style={styles.subtitle}>Generated on {format(now, "MMMM d, yyyy 'at' h:mm a")}</Text>
        
        <View style={styles.summaryBox}>
          <Text style={styles.label}>Summary Statistics</Text>
          {periodStart && periodEnd && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Period:</Text>
              <Text style={styles.summaryValue}>
                {format(periodStart, "MMM d, yyyy")} - {format(periodEnd, "MMM d, yyyy")}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Bills:</Text>
            <Text style={styles.summaryValue}>{totalBills}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Customers:</Text>
            <Text style={styles.summaryValue}>{totalCustomers}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Amount:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Paid:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPaid)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Remaining:</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalRemaining)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Cylinders:</Text>
            <Text style={styles.summaryValue}>{formatNumber(totalCylinders)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Payment Records</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={styles.tableCellId}>ID</Text>
              <Text style={styles.tableCellName}>Customer</Text>
              <Text style={styles.tableCellAmount}>Last Month</Text>
              <Text style={styles.tableCellAmount}>Current Bill</Text>
              <Text style={styles.tableCellAmount}>Total</Text>
              <Text style={styles.tableCellAmount}>Paid</Text>
              <Text style={styles.tableCellAmount}>Remaining</Text>
              <Text style={styles.tableCellCylinders}>Cylinders</Text>
              <Text style={styles.tableCellStatus}>Status</Text>
            </View>
            {/* Table Rows */}
            {bills.map((bill) => {
              const totalBillAmount = bill.lastMonthRemaining + bill.currentMonthBill;
              const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
              const remainingAmount = Math.max(totalBillAmount - paidAmount, 0);
              const status = remainingAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIALLY_PAID" : "NOT_PAID";
              
              return (
                <View key={bill.id} style={styles.tableRow}>
                  <Text style={styles.tableCellId}>{bill.customer.customerCode}</Text>
                  <Text style={styles.tableCellName}>{bill.customer.name}</Text>
                  <Text style={styles.tableCellAmount}>{formatCurrency(bill.lastMonthRemaining)}</Text>
                  <Text style={styles.tableCellAmount}>{formatCurrency(bill.currentMonthBill)}</Text>
                  <Text style={styles.tableCellAmount}>{formatCurrency(totalBillAmount)}</Text>
                  <Text style={styles.tableCellAmount}>{formatCurrency(paidAmount)}</Text>
                  <Text style={styles.tableCellAmount}>{formatCurrency(remainingAmount)}</Text>
                  <Text style={styles.tableCellCylinders}>{formatNumber(bill.cylinders || 0)}</Text>
                  <Text style={styles.tableCellStatus}>{status}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Page>
    </Document>
  );

  const stream = await renderToStream(document);
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="payments-report-${format(now, "yyyy-MM-dd")}.pdf"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}

