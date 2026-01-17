export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";

import { Buffer } from "node:buffer";
import { Document, Page, Text, View, StyleSheet, renderToStream } from "@react-pdf/renderer";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 12,
    fontFamily: "Helvetica",
    color: "#111827",
  },
  header: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 10,
  },
  table: {

    width: "auto",
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    flexGrow: 1,
    padding: 6,
    borderStyle: "solid",
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
});

export async function GET() {
  const bills = await prisma.bill.findMany({
    include: { customer: { select: { name: true } }, payments: { select: { amount: true } } },
    orderBy: { billStartDate: "desc" },
    take: 15,
  });

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>Bulk Bill Summary</Text>
        <Text>Generated on {format(new Date(), "PPpp")}</Text>
        <View style={[styles.table, { marginTop: 12 }]}>
          <View style={[styles.row, { backgroundColor: "#f3f4f6" }]}>
            <Text style={[styles.cell, { flexBasis: "18%" }]}>Customer</Text>
            <Text style={styles.cell}>Period</Text>
            <Text style={styles.cell}>Total</Text>
            <Text style={styles.cell}>Paid</Text>
            <Text style={styles.cell}>Remaining</Text>
            <Text style={styles.cell}>Status</Text>
          </View>
          {bills.map((bill) => {
            const total = bill.lastMonthRemaining + bill.currentMonthBill;
            const paid = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
            const remaining = Math.max(total - paid, 0);
            return (
              <View key={bill.id} style={styles.row}>
                <Text style={[styles.cell, { flexBasis: "18%" }]}>{bill.customer.name}</Text>
                <Text style={styles.cell}>
                  {format(bill.billStartDate, "MMM d")} - {format(bill.billEndDate, "MMM d")}
                </Text>
                <Text style={styles.cell}>PKR {total.toLocaleString()}</Text>
                <Text style={styles.cell}>PKR {paid.toLocaleString()}</Text>
                <Text style={styles.cell}>PKR {remaining.toLocaleString()}</Text>
                <Text style={styles.cell}>{bill.status.replaceAll("_", " ")}</Text>
              </View>
            );
          })}
        </View>
      </Page>
    </Document>
  );

  const stream = await renderToStream(doc);
  const chunks: Uint8Array[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);

  return new NextResponse(buffer as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="bulk-bills-${format(new Date(), "yyyy-MM-dd")}.pdf"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}

