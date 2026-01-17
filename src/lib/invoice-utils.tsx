import { Buffer } from "node:buffer";
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getBillTemplateDesign } from "@/lib/bill-design-utils";
import { writeFile, mkdir, access } from "fs/promises";
import { join } from "path";

// Directory to store invoice PDFs
const INVOICE_STORAGE_DIR = join(process.cwd(), "public", "invoices");

/**
 * Ensure invoice storage directory exists
 */
async function ensureInvoiceStorage() {
  try {
    await access(INVOICE_STORAGE_DIR);
  } catch {
    await mkdir(INVOICE_STORAGE_DIR, { recursive: true });
  }
}

/**
 * Generate a unique invoice number
 * Format: INV-YYYYMMDD-XXXXX (e.g., INV-20250118-00001)
 */
export async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const datePrefix = format(today, "yyyyMMdd");
  
  // Find the highest invoice number for today
  const todayInvoices = await prisma.invoice.findMany({
    where: {
      invoiceNumber: {
        startsWith: `INV-${datePrefix}-`,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
    take: 1,
  });

  let sequence = 1;
  if (todayInvoices.length > 0) {
    const lastNumber = todayInvoices[0].invoiceNumber;
    const lastSequence = parseInt(lastNumber.split("-").pop() || "0", 10);
    sequence = lastSequence + 1;
  }

  return `INV-${datePrefix}-${String(sequence).padStart(5, "0")}`;
}

/**
 * Generate PDF buffer for a bill (reuses bill PDF generation logic)
 */
export async function generateBillPDF(bill: {
  id: string;
  customerId: string;
  billStartDate: Date;
  billEndDate: Date;
  lastMonthRemaining: number;
  currentMonthBill: number;
  cylinders: number;
  customer: {
    customerCode: number;
    name: string;
    address?: string | null;
    contactNumber: string;
    email?: string | null;
  };
  payments: Array<{
    id: string;
    amount: number;
    paidOn: Date;
    method: string | null;
  }>;
}): Promise<Buffer> {
  // Get saved bill design
  const design = await getBillTemplateDesign();
  const primaryColor = design?.primaryColor || "#1c5bff";
  const backgroundColor = design?.backgroundColor || "#ffffff";
  const headerColor = design?.headerColor || primaryColor;
  const storeName = design?.storeName || "LPG Management System";
  const headerTitle = design?.headerTitle === "CUSTOM" 
    ? (design?.customHeaderTitle || "INVOICE")
    : (design?.headerTitle || "INVOICE");

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontSize: 12,
      fontFamily: "Helvetica",
      color: "#1f2933",
      backgroundColor: backgroundColor,
    },
    header: {
      marginBottom: 30,
      paddingBottom: 20,
      borderBottom: `2 solid ${headerColor}`,
      textAlign: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: headerColor,
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
      backgroundColor: `${primaryColor}0d`,
      padding: 20,
      borderRadius: 8,
      marginTop: 30,
    },
    totalAmount: {
      fontSize: 28,
      fontWeight: "bold",
      color: primaryColor,
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
  });

  const totalAmount = bill.lastMonthRemaining + bill.currentMonthBill;
  const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = Math.max(totalAmount - paidAmount, 0);

  const document = (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{storeName}</Text>
          <Text style={styles.subtitle}>{headerTitle}</Text>
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
              <Text style={[styles.tableCell, { fontWeight: "bold" }]}>Amount (PKR)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Last Month Remaining</Text>
              <Text style={styles.tableCell}>{bill.lastMonthRemaining.toLocaleString("en-PK")}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Current Month Bill</Text>
              <Text style={styles.tableCell}>{bill.currentMonthBill.toLocaleString("en-PK")}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>Paid Amount</Text>
              <Text style={styles.tableCell}>{paidAmount.toLocaleString("en-PK")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.totalAmount}>
            Total Amount: PKR {totalAmount.toLocaleString("en-PK")}
          </Text>
          {remainingAmount > 0 && (
            <Text style={[styles.value, { textAlign: "center", marginTop: 10, color: "#dc2626" }]}>
              Remaining: PKR {remainingAmount.toLocaleString("en-PK")}
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
                  <Text style={styles.tableCell}>{payment.amount.toLocaleString("en-PK")}</Text>
                  <Text style={styles.tableCell}>{payment.method || "N/A"}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            Generated on {format(new Date(), "MMMM d, yyyy 'at' h:mm a")}
          </Text>
        </View>
      </Page>
    </Document>
  );

  const stream = await renderToStream(document);
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Save invoice PDF to disk and return the file path
 */
export async function saveInvoicePDF(invoiceNumber: string, pdfBuffer: Buffer): Promise<string> {
  await ensureInvoiceStorage();
  const fileName = `${invoiceNumber}.pdf`;
  const filePath = join(INVOICE_STORAGE_DIR, fileName);
  await writeFile(filePath, pdfBuffer);
  return `/invoices/${fileName}`; // Public URL path
}
