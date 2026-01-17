export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { Document, Page, Text, View, StyleSheet, Image, renderToStream } from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getBillTemplateDesign } from "@/lib/bill-design-utils";
// Core utilities
import { createErrorResponse, createNotFoundResponse } from "@/core/api/api-errors";

interface Params {
  params: {
    date: string; // Format: yyyy-MM-dd
  };
}

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

// Helper functions (same as single bill route)
function getFontWeight(weight: string): string {
  switch (weight) {
    case "normal": return "400";
    case "medium": return "500";
    case "semibold": return "600";
    case "bold": return "700";
    case "extrabold": return "800";
    default: return "400";
  }
}

function mapFontFamily(fontFamily: string): string {
  const fontMap: Record<string, string> = {
    "Inter": "Helvetica",
    "Roboto": "Helvetica",
    "Arial": "Helvetica",
    "Verdana": "Helvetica",
    "Georgia": "Times-Roman",
    "Times": "Times-Roman",
    "Courier New": "Courier",
    "Monaco": "Courier",
    "Consolas": "Courier",
  };
  const supportedFonts = ["Helvetica", "Times-Roman", "Courier", "Symbol", "ZapfDingbats"];
  if (supportedFonts.includes(fontFamily)) {
    return fontFamily;
  }
  return fontMap[fontFamily] || "Helvetica";
}

export async function GET(request: Request, { params }: Params) {
  try {
    // Parse date from URL
    let deliveryDate: Date;
    try {
      deliveryDate = parseISO(params.date);
      if (isNaN(deliveryDate.getTime())) {
        return createErrorResponse("Invalid date format", 400);
      }
    } catch {
      return createErrorResponse("Invalid date format", 400);
    }

    // Get customer filter from query parameters
    const { searchParams } = new URL(request.url);
    const customerFilter = searchParams.get("customer");

    // Get start and end of the day
    const startOfDay = new Date(deliveryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(deliveryDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Build where clause
    const where: any = {
      deliveryDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      cylinderType: "DELIVERED", // Only DELIVERED entries for billing
    };

    // Filter by customer if provided
    if (customerFilter) {
      const customerName = decodeURIComponent(customerFilter);
      if (customerName.includes(" · ")) {
        const customerNameOnly = customerName.split(" · ")[1];
        where.customerName = {
          contains: customerNameOnly,
          mode: "insensitive",
        };
      } else {
        where.customerName = {
          contains: customerName,
          mode: "insensitive",
        };
      }
    }

    // Fetch DELIVERED entries for this date (and customer if specified)
    const entries = await prisma.cylinderEntry.findMany({
      where,
      orderBy: [
        { customerName: "asc" },
        { deliveryDate: "asc" },
        { createdAt: "asc" },
      ],
    });

    if (entries.length === 0) {
      return createNotFoundResponse("Cylinder entries");
    }

    // Group entries by customer
    const entriesByCustomer = entries.reduce((acc, entry) => {
      const key = entry.customerName;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    }, {} as Record<string, typeof entries>);

    // Fetch customer data for each unique customer
    const customerDataMap = new Map();
    for (const customerName of Object.keys(entriesByCustomer)) {
      let customer = null;
      const firstEntry = entriesByCustomer[customerName][0];
      
      if (firstEntry.customerId) {
        customer = await prisma.customer.findUnique({
          where: { id: firstEntry.customerId },
          select: {
            customerCode: true,
            name: true,
            address: true,
            contactNumber: true,
          },
        });
      } else if (firstEntry.customerName.includes(" · ")) {
        const customerCode = parseInt(firstEntry.customerName.split(" · ")[0]);
        const customerNameOnly = firstEntry.customerName.split(" · ")[1];
        if (!isNaN(customerCode) && customerNameOnly) {
          customer = await prisma.customer.findFirst({
            where: {
              customerCode: customerCode,
              name: customerNameOnly,
            },
            select: {
              customerCode: true,
              name: true,
              address: true,
              contactNumber: true,
            },
          });
        }
      }
      
      if (customer) {
        customerDataMap.set(customerName, customer);
      }
    }

    // Calculate totals
    const totalQuantity = entries.reduce((sum, e) => sum + (e.quantity || 0), 0);
    const totalAmount = entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const uniqueUnitPrices = [...new Set(entries.map(e => Number(e.unitPrice) || 0).filter(p => p > 0))];

    // Calculate remaining payment (outstanding balance from bills)
    let remainingPayment = 0;
    if (customerFilter && entries.length > 0) {
      // Get customer ID from first entry
      const firstEntry = entries[0];
      let customerId = firstEntry.customerId;
      
      // If no customerId, try to find customer by name
      if (!customerId) {
        let customer = null;
        if (firstEntry.customerName.includes(" · ")) {
          const customerCode = parseInt(firstEntry.customerName.split(" · ")[0]);
          const customerNameOnly = firstEntry.customerName.split(" · ")[1];
          if (!isNaN(customerCode) && customerNameOnly) {
            customer = await prisma.customer.findFirst({
              where: {
                customerCode: customerCode,
                name: customerNameOnly,
              },
              select: { id: true },
            });
          }
        } else {
          customer = await prisma.customer.findFirst({
            where: { name: firstEntry.customerName },
            select: { id: true },
          });
        }
        customerId = customer?.id || null;
      }

      // Calculate outstanding balance from bills
      if (customerId) {
        const unpaidBills = await prisma.bill.findMany({
          where: {
            customerId: customerId,
            status: {
              in: ["NOT_PAID", "PARTIALLY_PAID"],
            },
          },
          include: {
            payments: {
              select: {
                amount: true,
              },
            },
          },
        });

        remainingPayment = unpaidBills.reduce((sum, bill) => {
          const totalPaid = bill.payments.reduce((paidSum, payment) => paidSum + payment.amount, 0);
          const totalBillAmount = bill.lastMonthRemaining + bill.currentMonthBill;
          const remaining = totalBillAmount - totalPaid;
          return sum + Math.max(0, remaining); // Ensure no negative values
        }, 0);
      }
    }

    // Get saved bill design
    const design = await getBillTemplateDesign();
    
    // Use same design logic as single bill route
    const primaryColor = design?.primaryColor || "#1c5bff";
    const backgroundColor = design?.backgroundColor || "#ffffff";
    const headerColor = design?.headerColor || primaryColor;
    const storeName = design?.storeName || "LPG Management System";
    const storeAddress = design?.storeAddress || "";
    const storePhone = design?.storePhone || "";
    const storeEmail = design?.storeEmail || "";
    const storeWebsite = design?.storeWebsite || "";
    const storeSlogan = design?.storeSlogan || "";
    const headerTitle = design?.headerTitle === "CUSTOM" 
      ? (design?.customHeaderTitle || "INVOICE")
      : (design?.headerTitle || "Daily Cylinder Bill");
    const footerText = design?.footerText || "Thank you for your business!";
    
    const fontFamily = mapFontFamily(design?.fontFamily || "Helvetica");
    const fontSize = design?.fontSize || 12;
    const headerFontSize = design?.headerFontSize || 36;
    const headerFontWeight = getFontWeight(design?.headerFontWeight || "bold");
    const tableFontSize = design?.tableFontSize || 14;
    const tableFontWeight = getFontWeight(design?.tableFontWeight || "normal");
    
    const pageSize = design?.pageSize === "A5" ? "A5" : design?.pageSize === "Letter" ? "LETTER" : "A4";
    const orientation = design?.orientation === "landscape" ? "landscape" : "portrait";
    const pageMargins = design?.pageMargins || { top: 20, bottom: 20, left: 20, right: 20 };
    
    const textColor = design?.theme === "dark" ? "#ffffff" : (design?.tableTextColor || "#000000");
    const bodyTextColor = design?.theme === "dark" ? "#ffffff" : "#000000";
    const headerTextColor = "#ffffff";
    
    const logo = design?.customLogo || null;
    const logoSize = design?.logoSize || 120;
    const logoAlignment = design?.logoAlignment || "left";
    const showLogo = design?.showLogo && logo;
    
    const showBusinessInfo = design?.showBusinessInfo !== false;
    const businessInfoAlignment = design?.businessInfoAlignment || "left";
    const showPhone = design?.showPhone !== false;
    const showHeaderTitle = design?.showHeaderTitle !== false;
    const headerAlignment = design?.headerAlignment || "center";
    const showFooter = design?.showFooter !== false;
    const footerAlignment = design?.footerAlignment || "center";
    const showPrices = design?.showPrices !== false;

    // Create dynamic styles (simplified version, similar to single bill)
    const dynamicStyles = StyleSheet.create({
      page: {
        paddingTop: pageMargins.top,
        paddingBottom: pageMargins.bottom,
        paddingLeft: pageMargins.left,
        paddingRight: pageMargins.right,
        fontSize: fontSize,
        fontFamily: fontFamily,
        backgroundColor: backgroundColor,
        color: bodyTextColor,
      },
      headerSection: {
        marginBottom: 30,
        marginTop: design?.headerMargin || 0,
      },
      logoAndBusinessRow: {
        flexDirection: logoAlignment === "center" ? "column" : (logoAlignment === "right" ? "row-reverse" : "row"),
        alignItems: logoAlignment === "center" ? "center" : "flex-start",
        marginBottom: 20,
        marginTop: design?.businessInfoMargin || 0,
      },
      logo: {
        width: logoSize,
        height: logoSize,
        marginBottom: logoAlignment === "center" ? 10 : 0,
        marginRight: logoAlignment === "left" ? 20 : 0,
        marginLeft: logoAlignment === "right" ? 20 : 0,
      },
      businessInfo: {
        flex: logoAlignment === "center" ? 0 : 1,
        textAlign: businessInfoAlignment === "center" ? "center" : businessInfoAlignment === "right" ? "right" : "left",
      },
      businessName: {
        fontSize: fontSize * 1.286,
        fontWeight: "600",
        color: bodyTextColor,
        marginBottom: 4,
      },
      businessText: {
        fontSize: fontSize,
        color: bodyTextColor,
        marginBottom: 2,
      },
      headerTitleContainer: {
        marginBottom: 10,
        textAlign: headerAlignment === "center" ? "center" : headerAlignment === "right" ? "right" : "left",
      },
      headerTitle: {
        fontSize: headerFontSize,
        fontWeight: headerFontWeight,
        color: headerColor,
        marginBottom: 8,
      },
      dateInfo: {
        marginBottom: 20,
        textAlign: "left",
      },
      dateLabel: {
        fontSize: fontSize,
        fontWeight: "600",
        color: bodyTextColor,
        marginBottom: 4,
      },
      dateValue: {
        fontSize: fontSize,
        color: bodyTextColor,
      },
      tableContainer: {
        marginBottom: 10,
        borderWidth: design?.tableBorderThickness || 1,
        borderColor: design?.theme === "dark" ? "#475569" : "#e2e8f0",
      },
      tableHeader: {
        flexDirection: "row",
        backgroundColor: design?.tableHeaderBgColor || primaryColor,
      },
      tableHeaderCell: {
        flex: 1,
        padding: 8,
        textAlign: "left",
        color: headerTextColor,
        fontSize: tableFontSize,
        fontWeight: tableFontWeight,
        borderRightWidth: design?.tableBorderThickness || 1,
        borderRightColor: headerTextColor,
      },
      tableRow: {
        flexDirection: "row",
        borderTopWidth: design?.tableBorderThickness || 1,
        borderTopColor: design?.theme === "dark" ? "#475569" : "#e2e8f0",
        backgroundColor: backgroundColor,
      },
      tableCell: {
        flex: 1,
        padding: 8,
        textAlign: "left",
        color: textColor,
        fontSize: tableFontSize,
        borderRightWidth: design?.tableBorderThickness || 1,
        borderRightColor: design?.theme === "dark" ? "#475569" : "#e2e8f0",
      },
      customerSection: {
        marginBottom: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: design?.theme === "dark" ? "#475569" : "#e2e8f0",
      },
      customerHeader: {
        fontSize: fontSize * 1.143,
        fontWeight: "600",
        color: bodyTextColor,
        marginBottom: 8,
      },
      summarySection: {
        marginTop: 20,
        marginBottom: 10,
        alignItems: "flex-end",
      },
      summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "40%",
        marginBottom: 4,
      },
      summaryLabel: {
        fontSize: fontSize,
        color: textColor,
      },
      summaryValue: {
        fontSize: fontSize,
        color: textColor,
        fontWeight: "600",
      },
      totalRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        width: "100%",
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: primaryColor,
        gap: 10,
      },
      totalLabel: {
        fontSize: fontSize * 1.2,
        fontWeight: "700",
        color: textColor,
      },
      totalValue: {
        fontSize: fontSize * 1.2,
        fontWeight: "700",
        color: primaryColor,
      },
      unitPriceRow: {
        flexDirection: "row",
        justifyContent: "flex-end",
        width: "100%",
        marginBottom: 4,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: design?.theme === "dark" ? "#475569" : "#e2e8f0",
      },
      unitPriceText: {
        fontSize: fontSize,
        color: textColor,
        fontWeight: "600",
        flexWrap: "nowrap",
        textAlign: "right",
      },
      remainingPaymentRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        marginTop: 8,
        marginBottom: 4,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: design?.theme === "dark" ? "#475569" : "#e2e8f0",
      },
      footer: {
        marginTop: design?.footerMargin || 15,
        paddingTop: 24,
        borderTopWidth: 1,
        borderTopColor: primaryColor,
      },
      footerText: {
        fontSize: fontSize,
        color: textColor,
        textAlign: footerAlignment === "center" ? "center" : footerAlignment === "right" ? "right" : "left",
      },
    });

    const document = (
      <Document>
        <Page 
          size={pageSize} 
          orientation={orientation} 
          style={dynamicStyles.page}
          wrap={true}
        >
          {/* Header Section */}
          <View style={dynamicStyles.headerSection}>
            {(showLogo || showBusinessInfo) && (
              <View style={dynamicStyles.logoAndBusinessRow}>
                {showLogo && logo && typeof logo === 'string' && logo.trim() !== '' && (
                  <Image src={logo} style={dynamicStyles.logo} />
                )}
                {showBusinessInfo && (
                  <View style={dynamicStyles.businessInfo}>
                    <Text style={dynamicStyles.businessName}>{storeName}</Text>
                    {storeAddress && <Text style={dynamicStyles.businessText}>{storeAddress}</Text>}
                    {showPhone && storePhone && <Text style={dynamicStyles.businessText}>{storePhone}</Text>}
                    {storeEmail && <Text style={dynamicStyles.businessText}>{storeEmail}</Text>}
                    {storeWebsite && <Text style={dynamicStyles.businessText}>{storeWebsite}</Text>}
                    {storeSlogan && <Text style={[dynamicStyles.businessText, { fontStyle: "italic", opacity: 0.8 }]}>{storeSlogan}</Text>}
                  </View>
                )}
              </View>
            )}

            {showHeaderTitle && (
              <View style={dynamicStyles.headerTitleContainer}>
                <Text style={dynamicStyles.headerTitle}>{headerTitle}</Text>
              </View>
            )}

            <View style={dynamicStyles.dateInfo}>
              <Text style={dynamicStyles.dateLabel}>Date: </Text>
              <Text style={dynamicStyles.dateValue}>{format(deliveryDate, "d MMMM yyyy")}</Text>
            </View>
          </View>

          {/* Table */}
          {design?.showTable !== false && (
            <View style={dynamicStyles.tableContainer}>
              <View style={dynamicStyles.tableHeader}>
                <View style={[dynamicStyles.tableHeaderCell, { flex: 0.5 }]}>
                  <Text>#</Text>
                </View>
                <View style={dynamicStyles.tableHeaderCell}>
                  <Text>Customer</Text>
                </View>
                <View style={dynamicStyles.tableHeaderCell}>
                  <Text>Cylinder Type</Text>
                </View>
                <View style={dynamicStyles.tableHeaderCell}>
                  <Text>Quantity</Text>
                </View>
                {showPrices && (
                  <>
                    <View style={dynamicStyles.tableHeaderCell}>
                      <Text>Unit Price</Text>
                    </View>
                    <View style={[dynamicStyles.tableHeaderCell, { borderRightWidth: 0 }]}>
                      <Text>Total</Text>
                    </View>
                  </>
                )}
              </View>

              {Object.entries(entriesByCustomer).map(([customerName, customerEntries], customerIdx) => {
                const customer = customerDataMap.get(customerName);
                return customerEntries.map((entry, entryIdx) => {
                  const rowNumber = customerIdx === 0 
                    ? entryIdx + 1 
                    : Object.values(entriesByCustomer).slice(0, customerIdx).reduce((sum, arr) => sum + arr.length, 0) + entryIdx + 1;
                  
                  return (
                    <View key={entry.id} style={dynamicStyles.tableRow}>
                      <View style={[dynamicStyles.tableCell, { flex: 0.5 }]}>
                        <Text>{rowNumber}</Text>
                      </View>
                      <View style={dynamicStyles.tableCell}>
                        <Text>
                          {customer?.name || (customerName.includes(' · ') ? customerName.split(' · ')[1] : customerName)}
                        </Text>
                      </View>
                      <View style={dynamicStyles.tableCell}>
                        <Text>{entry.cylinderLabel || "—"}</Text>
                      </View>
                      <View style={dynamicStyles.tableCell}>
                        <Text>{String(entry.quantity || 0)}</Text>
                      </View>
                      {showPrices && (
                        <>
                          <View style={dynamicStyles.tableCell}>
                            <Text>{currencyFormatter.format(Number(entry.unitPrice) || 0)}</Text>
                          </View>
                          <View style={[dynamicStyles.tableCell, { borderRightWidth: 0 }]}>
                            <Text style={{ fontWeight: "600" }}>
                              {currencyFormatter.format(Number(entry.amount) || 0)}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  );
                });
              })}
            </View>
          )}

          {/* Summary Section */}
          {showPrices && (
            <View style={dynamicStyles.summarySection}>
              {/* Show unique unit prices in separate rows */}
              {uniqueUnitPrices.map((unitPrice, idx) => {
                const entriesForPrice = entries.filter(e => Number(e.unitPrice) === unitPrice);
                const quantityForPrice = entriesForPrice.reduce((sum, e) => sum + (e.quantity || 0), 0);
                const totalForPrice = entriesForPrice.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
                
                return (
                  <View key={idx} style={dynamicStyles.unitPriceRow}>
                    <Text style={dynamicStyles.unitPriceText} wrap={false}>
                      Unit Price Rs {unitPrice.toLocaleString('en-US')} * {quantityForPrice} cylinder{quantityForPrice !== 1 ? 's' : ''} = {currencyFormatter.format(totalForPrice)}
                    </Text>
                  </View>
                );
              })}

              {/* Remaining Payment */}
              {remainingPayment > 0 && (
                <View style={dynamicStyles.remainingPaymentRow}>
                  <Text style={dynamicStyles.summaryLabel}>Remaining Payment:</Text>
                  <Text style={dynamicStyles.summaryValue}>
                    {currencyFormatter.format(remainingPayment)}
                  </Text>
                </View>
              )}

              {/* Grand Total with Remaining Payment */}
              <View style={dynamicStyles.totalRow}>
                <Text style={dynamicStyles.totalLabel}>
                  Grand Total{remainingPayment > 0 ? " (with Remaining Payment)" : ""}:
                </Text>
                <Text style={dynamicStyles.totalValue}>
                  {currencyFormatter.format(totalAmount + remainingPayment)}
                </Text>
              </View>
            </View>
          )}

          {/* Footer */}
          {showFooter && (
            <View style={dynamicStyles.footer}>
              <Text style={dynamicStyles.footerText}>{footerText}</Text>
            </View>
          )}
        </Page>
      </Document>
    );

    const stream = await renderToStream(document);
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const buffer = Buffer.concat(chunks);
    const fileName = `daily-bill-${format(deliveryDate, "yyyy-MM-dd")}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating daily PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate daily PDF bill", details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
