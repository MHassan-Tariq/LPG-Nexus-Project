import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getBillTemplateDesign } from "@/lib/bill-design-utils";
import { canAccessTenantData } from "@/lib/tenant-utils";
import { getTenantFilter } from "@/core/tenant/tenant-queries";
// Core utilities
import { createErrorResponse, createNotFoundResponse } from "@/core/api/api-errors";

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
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  tableCell: {
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 11,
  },
  tableCellDate: {
    width: "18%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 11,
  },
  tableCellType: {
    width: "35%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 11,
  },
  tableCellQuantity: {
    width: "15%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 11,
    textAlign: "right",
  },
  tableCellPrice: {
    width: "16%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    fontSize: 11,
    textAlign: "right",
  },
  tableCellAmount: {
    width: "16%",
    padding: 8,
    fontSize: 11,
    textAlign: "right",
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
    const { entryIds } = body;

    if (!Array.isArray(entryIds) || entryIds.length === 0) {
      return createErrorResponse("Invalid entry IDs provided", 400);
    }

    const tenantFilter = await getTenantFilter();
    
    // Fetch all cylinder entries (with tenant filter)
    const entries = await prisma.cylinderEntry.findMany({
      where: {
        ...tenantFilter,
        id: { in: entryIds },
        cylinderType: "DELIVERED",
      },
      orderBy: {
        deliveryDate: "asc",
      },
    });

    if (entries.length === 0) {
      return createNotFoundResponse("Cylinder entries");
    }

    // Verify access to all entries' tenant data
    for (const entry of entries) {
      if (!(await canAccessTenantData(entry.adminId))) {
        return NextResponse.json(
          { error: "You do not have permission to access some of these entries." },
          { status: 403 },
        );
      }
    }

    // Validate entries have required fields
    const invalidEntries = entries.filter(entry => !entry.customerName || !entry.deliveryDate);
    if (invalidEntries.length > 0) {
      return NextResponse.json({ 
        error: `Some entries are missing required fields (customerName or deliveryDate)` 
      }, { status: 400 });
    }

    // Fetch customer data for entries that have customerId
    const customerIds = entries
      .map(entry => entry.customerId)
      .filter((id): id is string => id !== null && id !== undefined);
    
    const customers = customerIds.length > 0
      ? await prisma.customer.findMany({
          where: {
            ...tenantFilter,
            id: { in: customerIds },
          },
          select: { id: true, customerCode: true, name: true },
        })
      : [];
    
    const customerMap = new Map(customers.map(c => [c.id, c]));

    // Group entries by customer
    const entriesByCustomer = entries.reduce((acc, entry) => {
      const customerId = entry.customerId || entry.customerName || "Unknown";
      if (!acc[customerId]) {
        const customer = entry.customerId ? customerMap.get(entry.customerId) : null;
        acc[customerId] = {
          customer: customer || null,
          customerName: entry.customerName || "Unknown Customer",
          entries: [],
        };
      }
      acc[customerId].entries.push(entry);
      return acc;
    }, {} as Record<string, { customer: { id: string; customerCode: number; name: string } | null; customerName: string; entries: typeof entries }>);

    if (Object.keys(entriesByCustomer).length === 0) {
      return createErrorResponse("Failed to group entries by customer", 500);
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

    // Create dynamic styles
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

    // Calculate totals
    const grandTotal = entries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    const grandQuantity = entries.reduce((sum, entry) => sum + (entry.quantity || 0), 0);
    const validDates = entries
      .map(entry => entry.deliveryDate)
      .filter(date => date instanceof Date);
    const dateRange = validDates.length > 0
      ? {
          min: validDates[0],
          max: validDates[validDates.length - 1],
        }
      : null;

    // Create PDF document
    const document = (
      <Document>
        {Object.values(entriesByCustomer).map((customerGroup, customerIndex) => {
          const customerTotal = customerGroup.entries.reduce((sum, e) => sum + (e.amount || 0), 0);
          const customerQuantity = customerGroup.entries.reduce((sum, e) => sum + (e.quantity || 0), 0);

          return (
            <Page key={customerIndex} size="A4" style={dynamicStyles.page}>
              {customerIndex > 0 && <View style={styles.pageBreak} />}
              
              <View style={dynamicStyles.header}>
                <Text style={dynamicStyles.title}>{storeName}</Text>
                <Text style={dynamicStyles.subtitle}>{headerTitle} - Selected Entries</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.row}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Customer Name</Text>
                    <Text style={styles.value}>{customerGroup.customerName}</Text>
                  </View>
                  {customerGroup.customer && (
                    <View style={styles.column}>
                      <Text style={styles.label}>Customer Code</Text>
                      <Text style={styles.value}>{customerGroup.customer.customerCode}</Text>
                    </View>
                  )}
                </View>

                {dateRange && (
                  <View style={styles.row}>
                    <View style={styles.column}>
                      <Text style={styles.label}>Date Range</Text>
                      <Text style={styles.value}>
                        {dateRange ? `${format(new Date(dateRange.min), "MMMM d, yyyy")} - ${format(new Date(dateRange.max), "MMMM d, yyyy")}` : "—"}
                      </Text>
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>Total Entries</Text>
                      <Text style={styles.value}>{customerGroup.entries.length}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Cylinder Entries</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, { backgroundColor: "#f3f4f6" }]}>
                    <Text style={[styles.tableCellDate, { fontWeight: "bold" }]}>Date</Text>
                    <Text style={[styles.tableCellType, { fontWeight: "bold" }]}>Cylinder Type</Text>
                    <Text style={[styles.tableCellQuantity, { fontWeight: "bold" }]}>Quantity</Text>
                    <Text style={[styles.tableCellPrice, { fontWeight: "bold" }]}>Unit Price</Text>
                    <Text style={[styles.tableCellAmount, { fontWeight: "bold" }]}>Amount</Text>
                  </View>
                  {customerGroup.entries.map((entry) => (
                    <View key={entry.id} style={styles.tableRow}>
                      <Text style={styles.tableCellDate}>
                        {entry.deliveryDate ? format(new Date(entry.deliveryDate), "MMM d, yyyy") : "—"}
                      </Text>
                      <Text style={styles.tableCellType}>{entry.cylinderLabel || "—"}</Text>
                      <Text style={styles.tableCellQuantity}>{(entry.quantity || 0).toLocaleString("en-US")}</Text>
                      <Text style={styles.tableCellPrice}>{(entry.unitPrice || 0).toLocaleString("en-US")}</Text>
                      <Text style={styles.tableCellAmount}>{(entry.amount || 0).toLocaleString("en-US")}</Text>
                    </View>
                  ))}
                  <View style={[styles.tableRow, { backgroundColor: "#f3f4f6", fontWeight: "bold" }]}>
                    <Text style={[styles.tableCellDate, { fontWeight: "bold" }]}>Total</Text>
                    <Text style={styles.tableCellType}></Text>
                    <Text style={[styles.tableCellQuantity, { fontWeight: "bold" }]}>{customerQuantity.toLocaleString("en-US")}</Text>
                    <Text style={styles.tableCellPrice}></Text>
                    <Text style={[styles.tableCellAmount, { fontWeight: "bold" }]}>{customerTotal.toLocaleString("en-US")}</Text>
                  </View>
                </View>
              </View>

              <View style={[dynamicStyles.amountSection, { backgroundColor: `${primaryColor}0d` }]}>
                <Text style={dynamicStyles.totalAmount}>
                  Total: Rs {customerTotal.toLocaleString("en-US")}
                </Text>
              </View>

              <View style={styles.footer}>
                <Text>
                  Entry {customerIndex + 1} of {Object.keys(entriesByCustomer).length} | Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
                </Text>
              </View>
            </Page>
          );
        })}

        {/* Grand Total Summary Page */}
        {Object.keys(entriesByCustomer).length > 1 && (
          <Page size="A4" style={dynamicStyles.page}>
            <View style={dynamicStyles.header}>
              <Text style={dynamicStyles.title}>{storeName}</Text>
              <Text style={dynamicStyles.subtitle}>Combined Entries Summary</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Summary by Customer</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, { backgroundColor: "#f3f4f6" }]}>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Customer</Text>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Entries</Text>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Quantity</Text>
                  <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Total Amount</Text>
                </View>
                {Object.values(entriesByCustomer).map((customerGroup) => {
                  const customerTotal = customerGroup.entries.reduce((sum, e) => sum + (e.amount || 0), 0);
                  const customerQuantity = customerGroup.entries.reduce((sum, e) => sum + (e.quantity || 0), 0);

                  return (
                    <View key={customerGroup.customerName} style={styles.tableRow}>
                      <Text style={styles.tableCell}>{customerGroup.customerName}</Text>
                      <Text style={styles.tableCell}>{customerGroup.entries.length}</Text>
                      <Text style={styles.tableCell}>{customerQuantity.toLocaleString("en-US")}</Text>
                      <Text style={styles.tableCell}>{customerTotal.toLocaleString("en-US")}</Text>
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
                Total Quantity: {grandQuantity.toLocaleString("en-US")}
              </Text>
              <Text style={[styles.value, { textAlign: "center", marginTop: 5 }]}>
                Total Entries: {entries.length}
              </Text>
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

    try {
      const stream = await renderToStream(document);
      const chunks: Uint8Array[] = [];

      for await (const chunk of stream) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }

      const buffer = Buffer.concat(chunks);
      
      if (buffer.length === 0) {
        throw new Error("Generated PDF buffer is empty");
      }

      const fileName = `combined-entries-${format(new Date(), "yyyy-MM-dd")}.pdf`;

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Length": buffer.length.toString(),
        },
      });
    } catch (pdfError) {
      console.error("Error rendering PDF:", pdfError);
      throw new Error(`PDF rendering failed: ${pdfError instanceof Error ? pdfError.message : "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error generating combined bill from entries:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to generate combined bill: ${errorMessage}` },
      { status: 500 },
    );
  }
}

