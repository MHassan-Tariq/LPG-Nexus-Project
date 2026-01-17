import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getBillTemplateDesign } from "@/lib/bill-design-utils";
import { canAccessTenantData } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { createErrorResponse, createNotFoundResponse, createForbiddenResponse } from "@/core/api/api-errors";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    fontFamily: "Helvetica",
    color: "#1f2933",
  },
  header: {
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "2 solid #1c5bff",
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1c5bff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    marginBottom: 12,
  },
  column: {
    width: "50%",
  },
  label: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "bold",
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    color: "#1f2933",
  },
  amountSection: {
    backgroundColor: "#f5f7fb",
    padding: 20,
    borderRadius: 8,
    marginTop: 30,
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1c5bff",
    textAlign: "center",
    marginTop: 10,
  },
  footer: {
    marginTop: 40,
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
  },
  table: {

    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableCell: {
    flexGrow: 1,
    padding: 8,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pageBreak: {
    marginTop: 40,
    borderTop: "1 dashed #e2e8f0",
    paddingTop: 20,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { billIds } = body;

    if (!Array.isArray(billIds) || billIds.length === 0) {
      return createErrorResponse("Invalid bill IDs provided", 400);
    }

    const tenantFilter = await getTenantFilter();
    
    // Fetch all bills (with tenant filter)
    const bills = await prisma.bill.findMany({
      where: {
        ...tenantFilter,
        id: { in: billIds },
      },
      include: {
        customer: true,
        payments: {
          orderBy: { paidOn: "desc" },
        },
      },
      orderBy: [
        { customer: { customerCode: "asc" } },
        { billStartDate: "desc" },
      ],
    });

    if (bills.length === 0) {
      return createNotFoundResponse("Bills");
    }

    // Verify access to all bills' tenant data
    for (const bill of bills) {
      if (!(await canAccessTenantData(bill.adminId))) {
        return createForbiddenResponse("You do not have permission to access some of these bills.");
      }
    }

    // Get saved bill design
    const design = await getBillTemplateDesign();
    const primaryColor = design?.primaryColor || "#1c5bff";
    const backgroundColor = design?.backgroundColor || "#ffffff";
    const headerColor = design?.headerColor || primaryColor;
    const storeName = design?.storeName || "LPG Management System";
    const headerTitle = design?.headerTitle === "CUSTOM" 
      ? (design?.customHeaderTitle || "INVOICE")
      : (design?.headerTitle || "Payment Bill");

    // Create dynamic styles based on design
    const dynamicStyles = StyleSheet.create({
      ...styles,
      page: {
        ...styles.page,
        backgroundColor: backgroundColor,
      },
      header: {
        ...styles.header,
        borderBottom: `2 solid ${headerColor}`,
      },
      title: {
        ...styles.title,
        color: headerColor,
      },
      totalAmount: {
        ...styles.totalAmount,
        color: primaryColor,
      },
    });

    // Calculate totals across all bills
    const grandTotal = bills.reduce((sum, bill) => {
      return sum + bill.lastMonthRemaining + bill.currentMonthBill;
    }, 0);
    const grandPaid = bills.reduce((sum, bill) => {
      return sum + bill.payments.reduce((pSum, payment) => pSum + payment.amount, 0);
    }, 0);
    const grandRemaining = Math.max(grandTotal - grandPaid, 0);

    // Create PDF document with multiple pages
    const document = (
      <Document>
        {bills.map((bill, index) => {
          const totalAmount = bill.lastMonthRemaining + bill.currentMonthBill;
          const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
          const remainingAmount = Math.max(totalAmount - paidAmount, 0);

          return (
            <Page key={bill.id} size="A4" style={dynamicStyles.page}>
              {index > 0 && <View style={styles.pageBreak} />}
              
              <View style={dynamicStyles.header}>
                <Text style={dynamicStyles.title}>{storeName}</Text>
                <Text style={dynamicStyles.subtitle}>{headerTitle} - Combined Bills</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Customer Name</Text>
                    <Text style={styles.value}>{bill.customer.name}</Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Customer Code</Text>
                    <Text style={styles.value}>{bill.customer.customerCode}</Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Billing Period</Text>
                    <Text style={styles.value}>
                      {format(bill.billStartDate, "MMMM d, yyyy")} - {format(bill.billEndDate, "MMMM d, yyyy")}
                    </Text>
                  </View>
                  <View style={styles.column}>
                    <Text style={styles.label}>Cylinders</Text>
                    <Text style={styles.value}>{bill.cylinders}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.table}>
                  <View style={[styles.tableRow, { backgroundColor: "#f3f4f6" }]}>
                    <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Description</Text>
                    <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Amount</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>Last Month Remaining</Text>
                    <Text style={styles.tableCell}>{bill.lastMonthRemaining.toLocaleString("en-US")}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>Current Month Bill</Text>
                    <Text style={styles.tableCell}>{bill.currentMonthBill.toLocaleString("en-US")}</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={styles.tableCell}>Paid Amount</Text>
                    <Text style={styles.tableCell}>{paidAmount.toLocaleString("en-US")}</Text>
                  </View>
                </View>
              </View>

              <View style={[dynamicStyles.amountSection, { backgroundColor: `${primaryColor}0d` }]}>
                <Text style={dynamicStyles.totalAmount}>
                  Total Amount: Rs {totalAmount.toLocaleString("en-US")}
                </Text>
                {remainingAmount > 0 && (
                  <Text style={[styles.value, { textAlign: "center", marginTop: 10, color: "#dc2626" }]}>
                    Remaining: Rs {remainingAmount.toLocaleString("en-US")}
                  </Text>
                )}
              </View>

              {bill.payments.length > 0 && (
                <View style={[styles.section, { marginTop: 20 }]}>
                  <Text style={styles.label}>Payment History</Text>
                  <View style={styles.table}>
                    <View style={[styles.tableRow, { backgroundColor: "#f3f4f6" }]}>
                      <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Date</Text>
                      <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Amount</Text>
                      <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Method</Text>
                    </View>
                    {bill.payments.map((payment) => (
                      <View key={payment.id} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{format(payment.paidOn, "MMM d, yyyy")}</Text>
                        <Text style={styles.tableCell}>{payment.amount.toLocaleString("en-US")}</Text>
                        <Text style={styles.tableCell}>{payment.method || "N/A"}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.footer}>
                <Text>
                  Bill {index + 1} of {bills.length} | Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                </Text>
              </View>
            </Page>
          );
        })}

        {/* Summary Page */}
        {bills.length > 1 && (
          <Page size="A4" style={dynamicStyles.page}>
            <View style={dynamicStyles.header}>
              <Text style={dynamicStyles.title}>{storeName}</Text>
              <Text style={dynamicStyles.subtitle}>Combined Bills Summary</Text>
            </View>

            <View style={styles.section}>
              <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: "#f3f4f6" }]}>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Customer</Text>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Period</Text>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Total Amount</Text>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Paid</Text>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Remaining</Text>
                </View>
                {bills.map((bill) => {
                  const totalAmount = bill.lastMonthRemaining + bill.currentMonthBill;
                  const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
                  const remainingAmount = Math.max(totalAmount - paidAmount, 0);

                  return (
                    <View key={bill.id} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{bill.customer.name}</Text>
                      <Text style={styles.tableCell}>
                        {format(bill.billStartDate, "MMM d")} - {format(bill.billEndDate, "MMM d, yyyy")}
                      </Text>
                      <Text style={styles.tableCell}>{totalAmount.toLocaleString("en-US")}</Text>
                      <Text style={styles.tableCell}>{paidAmount.toLocaleString("en-US")}</Text>
                      <Text style={styles.tableCell}>{remainingAmount.toLocaleString("en-US")}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            <View style={[dynamicStyles.amountSection, { backgroundColor: `${primaryColor}0d` }]}>
              <Text style={[styles.label, { fontSize: 16, textAlign: "center", marginBottom: 10 }]}>
                Grand Total Summary
              </Text>
              <Text style={dynamicStyles.totalAmount}>
                Grand Total: Rs {grandTotal.toLocaleString("en-US")}
              </Text>
              <Text style={[styles.value, { textAlign: "center", marginTop: 10 }]}>
                Total Paid: Rs {grandPaid.toLocaleString("en-US")}
              </Text>
              {grandRemaining > 0 && (
                <Text style={[styles.value, { textAlign: "center", marginTop: 10, color: "#dc2626" }]}>
                  Total Remaining: Rs {grandRemaining.toLocaleString("en-US")}
                </Text>
              )}
            </View>

            <View style={styles.footer}>
              <Text>
                Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
              </Text>
            </View>
          </Page>
        )}
      </Document>
    );

    const stream = await renderToStream(document);
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }

    const buffer = Buffer.concat(chunks);
    const fileName = `combined-bills-${format(new Date(), "yyyy-MM-dd")}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating combined PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate combined PDF bill" },
      { status: 500 },
    );
  }
}

