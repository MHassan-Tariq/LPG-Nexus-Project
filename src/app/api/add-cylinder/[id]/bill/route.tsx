import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { Buffer } from "node:buffer";
import { Document, Page, Text, View, StyleSheet, Image, renderToStream } from "@react-pdf/renderer";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getBillTemplateDesign } from "@/lib/bill-design-utils";
// Core utilities
import { createNotFoundResponse } from "@/core/api/api-errors";

interface Params {
  params: {
    id: string;
  };
}

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

// Helper to get font weight
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

// Helper to map custom font names to React-PDF supported fonts
// React-PDF supports: Helvetica, Times-Roman, Courier, Symbol, ZapfDingbats
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
  
  // If it's already a supported font, return it
  const supportedFonts = ["Helvetica", "Times-Roman", "Courier", "Symbol", "ZapfDingbats"];
  if (supportedFonts.includes(fontFamily)) {
    return fontFamily;
  }
  
  // Map to supported font or default to Helvetica
  return fontMap[fontFamily] || "Helvetica";
}

export async function GET(_: Request, { params }: Params) {
  try {
    const entry = await prisma.cylinderEntry.findUnique({
      where: { id: params.id },
    });

    if (!entry) {
      return createNotFoundResponse("Cylinder entry");
    }

    // Fetch customer data - first try by customerId, then try by parsing customerName
    let customer = null;
    if (entry.customerId) {
      customer = await prisma.customer.findUnique({
        where: { id: entry.customerId },
        select: {
          address: true,
          contactNumber: true,
        },
      });
    }
    
    // If customer not found by ID, try` to find by parsing customerName (for older entries)
    if (!customer && entry.customerName) {
      if (entry.customerName.includes(" · ")) {
        // Format: "4 · Arham"
        const customerCode = parseInt(entry.customerName.split(" · ")[0]);
        const customerNameOnly = entry.customerName.split(" · ")[1];
        if (!isNaN(customerCode) && customerNameOnly) {
          customer = await prisma.customer.findFirst({
            where: {
              customerCode: customerCode,
              name: customerNameOnly,
            },
            select: {
              address: true,
              contactNumber: true,
            },
          });
        }
      } else {
        // Try to find by name only
        customer = await prisma.customer.findFirst({
          where: {
            name: entry.customerName,
          },
          select: {
            address: true,
            contactNumber: true,
          },
        });
      }
    }

    // Get saved bill design
    const design = await getBillTemplateDesign();
    
    // Default design values
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
      : (design?.headerTitle || "Cylinder Delivery Bill");
    const footerText = design?.footerText || "Thank you for your business!";
    
    // Font settings - map to React-PDF supported fonts
    const fontFamily = mapFontFamily(design?.fontFamily || "Helvetica");
    const fontSize = design?.fontSize || 12;
    const headerFontSize = design?.headerFontSize || 36;
    const headerFontWeight = getFontWeight(design?.headerFontWeight || "bold");
    const tableFontSize = design?.tableFontSize || 14;
    const tableFontWeight = getFontWeight(design?.tableFontWeight || "normal");
    
    // Page settings
    const pageSize = design?.pageSize === "A5" ? "A5" : design?.pageSize === "Letter" ? "LETTER" : "A4";
    const orientation = design?.orientation === "landscape" ? "landscape" : "portrait";
    const pageMargins = design?.pageMargins || { top: 20, bottom: 20, left: 20, right: 20 };
    
    // Colors
    const textColor = design?.theme === "dark" ? "#ffffff" : (design?.tableTextColor || "#000000");
    const bodyTextColor = design?.theme === "dark" ? "#ffffff" : "#000000";
    const headerTextColor = "#ffffff";
    
    // Signature line color
    const defaultSignatureLineColor = "#94a3b8";
    const signatureLineColor = (design?.signatureLineColor === defaultSignatureLineColor || !design?.signatureLineColor) 
      ? primaryColor 
      : design.signatureLineColor;
    
    // Table settings
    const showProductCode = design?.showProductCode !== false;
    const showPrices = design?.showPrices !== false;
    
    // Dynamically determine table columns based on entry type
    let tableColumns: string[] = [];
    if (entry.cylinderType === "RECEIVED") {
      tableColumns = ["Item", "Empty Cylinders", "Payment Type", "Payment Amount"];
    } else {
      if (showPrices) {
        tableColumns = design?.tableColumns || ["Item", "Quantity", "Unit Price", "Total"];
      } else {
        tableColumns = ["Item", "Quantity"];
      }
    }
    
    // Logo
    const logo = design?.customLogo || null;
    const logoSize = design?.logoSize || 120;
    const logoAlignment = design?.logoAlignment || "left";
    const showLogo = design?.showLogo && logo;
    
    // Business info
    const showBusinessInfo = design?.showBusinessInfo !== false;
    const businessInfoAlignment = design?.businessInfoAlignment || "left";
    const showPhone = design?.showPhone !== false;
    
    // Header
    const showHeaderTitle = design?.showHeaderTitle !== false;
    const headerAlignment = design?.headerAlignment || "center";
    
    // Footer
    const showFooter = design?.showFooter !== false;
    const footerAlignment = design?.footerAlignment || "center";

    // Create dynamic styles
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
        marginTop: design?.logoMargin || 0,
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
        marginTop: design?.headerTitleMargin || 0,
        textAlign: headerAlignment === "center" ? "center" : headerAlignment === "right" ? "right" : "left",
      },
      headerTitle: {
        fontSize: headerFontSize,
        fontWeight: headerFontWeight,
        color: headerColor,
        marginBottom: 8,
      },
      invoiceInfo: {
        flexDirection: "row",
        marginBottom: 10,
        justifyContent: "space-between",
      },
      invoiceInfoColumn: {
        width: "48%",
      },
      invoiceInfoLabel: {
        fontSize: fontSize,
        fontWeight: "600",
        color: bodyTextColor,
        marginBottom: 2,
      },
      invoiceInfoValue: {
        fontSize: fontSize,
        color: bodyTextColor,
        marginBottom: 4,
      },
      tableContainer: {
        marginBottom: 10,
        marginTop: design?.tableMargin || 0,
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
        textAlign: design?.tableAlignment === "center" ? "center" : design?.tableAlignment === "right" ? "right" : "left",
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
        textAlign: design?.tableAlignment === "center" ? "center" : design?.tableAlignment === "right" ? "right" : "left",
        color: textColor,
        fontSize: tableFontSize,
        borderRightWidth: design?.tableBorderThickness || 1,
        borderRightColor: design?.theme === "dark" ? "#475569" : "#e2e8f0",
        minWidth: 0,
      },
      description: {
        marginBottom: 10,
      },
      descriptionLabel: {
        fontSize: fontSize,
        fontWeight: "600",
        color: textColor,
        marginBottom: 4,
      },
      descriptionValue: {
        fontSize: fontSize,
        color: textColor,
      },
      summarySection: {
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
        justifyContent: "space-between",
        width: "40%",
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: primaryColor,
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
        marginBottom: 24,
      },
    });

    const document = (
      <Document>
        <Page 
          size={pageSize} 
          orientation={orientation} 
          style={dynamicStyles.page}
          wrap={false}
        >
          {/* Header Section */}
          <View style={dynamicStyles.headerSection}>
            {/* Logo and Business Info */}
            {(showLogo || showBusinessInfo) && (
              <View style={dynamicStyles.logoAndBusinessRow}>
                {showLogo && logo && typeof logo === 'string' && logo.trim() !== '' && (
                  <Image 
                    src={logo}
                    style={dynamicStyles.logo}
                  />
                )}
                {showBusinessInfo && (
                  <View style={dynamicStyles.businessInfo}>
                    <Text style={dynamicStyles.businessName}>{storeName}</Text>
                    {storeAddress && storeAddress.trim() && <Text style={dynamicStyles.businessText}>{storeAddress}</Text>}
                    {showPhone && storePhone && storePhone.trim() && <Text style={dynamicStyles.businessText}>{storePhone}</Text>}
                    {storeEmail && storeEmail.trim() && <Text style={dynamicStyles.businessText}>{storeEmail}</Text>}
                    {storeWebsite && storeWebsite.trim() && <Text style={dynamicStyles.businessText}>{storeWebsite}</Text>}
                    {storeSlogan && storeSlogan.trim() && <Text style={[dynamicStyles.businessText, { fontStyle: "italic", opacity: 0.8 }]}>{storeSlogan}</Text>}
                  </View>
                )}
              </View>
            )}

            {/* Header Title */}
            {showHeaderTitle && (
              <View style={[dynamicStyles.headerTitleContainer, {
                alignItems: headerAlignment === "center" ? "center" : headerAlignment === "right" ? "flex-end" : "flex-start",
              }]}>
                <Text style={[
                  dynamicStyles.headerTitle,
                  design?.headerStyle === "boxed" ? {
                    borderWidth: 2,
                    borderColor: headerColor,
                    padding: 16,
                  } : {},
                  design?.headerStyle === "underline" ? {
                    borderBottomWidth: 4,
                    borderBottomColor: headerColor,
                  } : {},
                  design?.headerStyle === "topBorder" ? {
                    borderTopWidth: 4,
                    borderTopColor: headerColor,
                    paddingTop: 16,
                  } : {},
                ]}>
                  {headerTitle}
                </Text>
                {design?.headerBorder && (
                  <View style={{
                    height: 1,
                    width: "100%",
                    backgroundColor: headerColor,
                    marginTop: 8,
                  }} />
                )}
          </View>
            )}

            {/* Invoice Info */}
            <View style={dynamicStyles.invoiceInfo}>
              <View style={dynamicStyles.invoiceInfoColumn}>
                <Text style={dynamicStyles.invoiceInfoValue}>
                  <Text style={dynamicStyles.invoiceInfoLabel}>ID: </Text>
                  {entry.customerId || (entry.customerName.includes(' · ') ? entry.customerName.split(' · ')[0] : "—")}
                </Text>
                <Text style={dynamicStyles.invoiceInfoValue}>
                  <Text style={dynamicStyles.invoiceInfoLabel}>Customer Name: </Text>
                  {entry.customerName.includes(' · ') ? entry.customerName.split(' · ')[1] : entry.customerName}
                </Text>
                {customer?.address && customer.address.trim() && (
                  <Text style={dynamicStyles.invoiceInfoValue}>
                    <Text style={dynamicStyles.invoiceInfoLabel}>Address: </Text>
                    {customer.address}
                  </Text>
                )}
                {customer?.contactNumber && customer.contactNumber.trim() && (
                  <Text style={dynamicStyles.invoiceInfoValue}>
                    <Text style={dynamicStyles.invoiceInfoLabel}>Phone: </Text>
                    {customer.contactNumber}
                  </Text>
                )}
              </View>
              <View style={dynamicStyles.invoiceInfoColumn}>
                {entry.cylinderType === "DELIVERED" && entry.deliveredBy && entry.deliveredBy.trim() && (
                  <Text style={dynamicStyles.invoiceInfoValue}>
                    <Text style={dynamicStyles.invoiceInfoLabel}>Delivered By: </Text>
                    {entry.deliveredBy}
                  </Text>
                )}
                <Text style={dynamicStyles.invoiceInfoValue}>
                  <Text style={dynamicStyles.invoiceInfoLabel}>Date: </Text>
                  {format(entry.deliveryDate, "d MMMM yyyy")}
                </Text>
              </View>
              </View>
            </View>

          {/* Table */}
          {design?.showTable !== false && (
            <View style={dynamicStyles.tableContainer}>
              <View style={dynamicStyles.tableHeader}>
                {tableColumns.map((col: string, idx: number) => (
                  <View key={idx} style={[dynamicStyles.tableHeaderCell, idx === tableColumns.length - 1 ? { borderRightWidth: 0 } : {}]}>
                    <Text>{col}</Text>
                  </View>
                ))}
              </View>
              <View style={dynamicStyles.tableRow}>
                {/* Item column - always present */}
                <View style={[dynamicStyles.tableCell, { borderRightWidth: (design?.tableBorderThickness || 1) }]}>
                  <Text wrap={false}>
                    {entry.cylinderLabel || "Cylinder"}
                  </Text>
                </View>
                
                {/* Quantity/Empty Cylinders column - always present */}
                <View style={[dynamicStyles.tableCell, { borderRightWidth: tableColumns.length > 2 ? (design?.tableBorderThickness || 1) : 0 }]}>
                  <Text>
                    {entry.cylinderType === "RECEIVED" 
                      ? String(entry.emptyCylinderReceived ?? entry.quantity ?? 0)
                      : String(entry.quantity ?? 0)}
                  </Text>
                </View>
                
                {/* DELIVERED: Unit Price and Total columns (only if showPrices) */}
                {entry.cylinderType === "DELIVERED" && showPrices && tableColumns.length >= 4 && (
                  <>
                    <View style={[dynamicStyles.tableCell, { borderRightWidth: (design?.tableBorderThickness || 1) }]}>
                      <Text>{currencyFormatter.format(Number(entry.unitPrice) || 0)}</Text>
                    </View>
                    <View style={[dynamicStyles.tableCell, { borderRightWidth: 0 }]}>
                      <Text style={{ fontWeight: "600" }}>{currencyFormatter.format(Number(entry.amount) || 0)}</Text>
                    </View>
                  </>
                )}
                
                {/* RECEIVED: Payment Type and Payment Amount columns */}
                {entry.cylinderType === "RECEIVED" && tableColumns.length >= 4 && (
                  <>
                    <View style={[dynamicStyles.tableCell, { borderRightWidth: (design?.tableBorderThickness || 1) }]}>
                      <Text>
                        {entry.paymentType && entry.paymentType !== "NONE" 
                          ? entry.paymentType.charAt(0) + entry.paymentType.slice(1).toLowerCase()
                          : "None"}
                      </Text>
                    </View>
                    <View style={[dynamicStyles.tableCell, { borderRightWidth: 0 }]}>
                      <Text>
                        {entry.paymentAmount && Number(entry.paymentAmount) > 0
                          ? currencyFormatter.format(Number(entry.paymentAmount))
                          : "—"}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Summary */}
          {showPrices && entry.cylinderType === "DELIVERED" && (
            <View style={dynamicStyles.summarySection}>
              <View style={dynamicStyles.summaryRow}>
                <Text style={dynamicStyles.summaryLabel}>Unit Price:</Text>
                <Text style={dynamicStyles.summaryValue}>{currencyFormatter.format(Number(entry.unitPrice) || 0)}</Text>
              </View>
              <View style={dynamicStyles.summaryRow}>
                <Text style={dynamicStyles.summaryLabel}>Quantity:</Text>
                <Text style={dynamicStyles.summaryValue}>{String(entry.quantity || 0)}</Text>
              </View>
              <View style={dynamicStyles.summaryRow}>
                <Text style={dynamicStyles.summaryLabel}>Total:</Text>
                <Text style={dynamicStyles.summaryValue}>
                  {String(entry.quantity || 0)} × {Number(entry.unitPrice || 0).toLocaleString('en-US')}
                </Text>
              </View>
              <View style={dynamicStyles.totalRow}>
                <Text style={dynamicStyles.totalLabel}>Grand Total:</Text>
                <Text style={dynamicStyles.totalValue}>{currencyFormatter.format(Number(entry.amount) || 0)}</Text>
              </View>
            </View>
          )}

          {/* RECEIVED Summary */}
          {entry.cylinderType === "RECEIVED" && (
            <View style={dynamicStyles.summarySection}>
              <View style={dynamicStyles.summaryRow}>
                <Text style={dynamicStyles.summaryLabel}>Empty Cylinders Received:</Text>
                <Text style={dynamicStyles.summaryValue}>{String(entry.emptyCylinderReceived ?? entry.quantity ?? 0)}</Text>
              </View>
              {entry.paymentType && entry.paymentType !== "NONE" && (
                <>
                  <View style={dynamicStyles.summaryRow}>
                    <Text style={dynamicStyles.summaryLabel}>Payment Type:</Text>
                    <Text style={dynamicStyles.summaryValue}>
                      {entry.paymentType.charAt(0) + entry.paymentType.slice(1).toLowerCase()}
                    </Text>
                  </View>
                  {entry.paymentAmount && Number(entry.paymentAmount) > 0 && (
                    <>
                      <View style={dynamicStyles.summaryRow}>
                        <Text style={dynamicStyles.summaryLabel}>Payment Amount:</Text>
                        <Text style={dynamicStyles.summaryValue}>{currencyFormatter.format(Number(entry.paymentAmount))}</Text>
                      </View>
                      {entry.paymentReceivedBy && (
                        <View style={dynamicStyles.summaryRow}>
                          <Text style={dynamicStyles.summaryLabel}>Received By:</Text>
                          <Text style={dynamicStyles.summaryValue}>{String(entry.paymentReceivedBy)}</Text>
                        </View>
                      )}
                    </>
                  )}
                </>
            )}
          </View>
          )}

          {/* Notes Section */}
          {design?.showNotesSection && (
            <View style={{
              marginBottom: 20,
              padding: 16,
              backgroundColor: design?.theme === "dark" ? "#334155" : "#f8fafc",
              borderRadius: 8,
              marginTop: design?.notesMargin || 0,
            }}>
              <Text style={{
                fontSize: fontSize,
                fontWeight: "600",
                color: textColor,
                marginBottom: 4,
                textAlign: design?.notesAlignment === "center" ? "center" : design?.notesAlignment === "right" ? "right" : "left",
              }}>
                {design?.notesLabel || "Note:"}
              </Text>
              <Text style={{
                fontSize: fontSize,
                color: textColor,
                textAlign: design?.notesAlignment === "center" ? "center" : design?.notesAlignment === "right" ? "right" : "left",
              }}>
                {design?.notesText || "Terms and conditions apply."}
                </Text>
            </View>
          )}

          {/* Footer */}
          {showFooter && (
            <View style={dynamicStyles.footer}>
              <Text style={dynamicStyles.footerText}>{footerText}</Text>
              
              {/* Signature Area */}
              {design?.showSignatureArea && (
                <View style={{
                  marginTop: design?.signatureMargin || 0,
                  flexDirection: design?.signatureAlignment === "center" ? "row" : "row",
                  justifyContent: design?.signatureAlignment === "center" ? "center" : design?.signatureAlignment === "right" ? "flex-end" : "flex-start",
                  gap: design?.signatureAlignment === "center" ? 32 : 0,
                }}>
                  {design?.signatureAlignment === "center" ? (
                    <>
                      {/* Customer Signature */}
                      <View style={{
                        width: design?.signatureLineLength || 200,
                        alignItems: "center",
                      }}>
                        {(design?.signatureLineStyle === "line" || design?.signatureLineStyle === "solid") && (
                          <View style={{
                            borderBottomWidth: design?.signatureLineWidth || 1,
                            borderBottomColor: signatureLineColor,
                            width: "100%",
                            marginBottom: design?.signatureLineSpacing || 8,
                          }} />
                        )}
                        {(design?.signatureLineStyle === "box") && (
                          <View style={{
                            borderWidth: design?.signatureLineWidth || 1,
                            borderColor: signatureLineColor,
                            width: "100%",
                            height: design?.signatureHeight || 60,
                            marginBottom: design?.signatureLineSpacing || 8,
                          }} />
                        )}
                        {(design?.signatureLineStyle === "dotted") && (
                          <View style={{
                            borderBottomWidth: design?.signatureLineWidth || 1,
                            borderBottomColor: signatureLineColor,
                            width: "100%",
                            marginBottom: design?.signatureLineSpacing || 8,
                            height: design?.signatureHeight || 60,
                          }} />
                        )}
                        <Text style={{
                          fontSize: fontSize * 0.857,
                          color: textColor,
                          textAlign: "center",
                        }}>
                          {design?.customerSignatureLabel || "Customer Signature"}
                        </Text>
                      </View>
                      {/* Authorized Signature */}
                      <View style={{
                        width: design?.signatureLineLength || 200,
                        alignItems: "center",
                      }}>
                        {(design?.signatureLineStyle === "line" || design?.signatureLineStyle === "solid") && (
                          <View style={{
                            borderBottomWidth: design?.signatureLineWidth || 1,
                            borderBottomColor: signatureLineColor,
                            width: "100%",
                            marginBottom: design?.signatureLineSpacing || 8,
                          }} />
                        )}
                        {(design?.signatureLineStyle === "box") && (
                          <View style={{
                            borderWidth: design?.signatureLineWidth || 1,
                            borderColor: signatureLineColor,
                            width: "100%",
                            height: design?.signatureHeight || 60,
                            marginBottom: design?.signatureLineSpacing || 8,
                          }} />
                        )}
                        {(design?.signatureLineStyle === "dotted") && (
                          <View style={{
                            borderBottomWidth: design?.signatureLineWidth || 1,
                            borderBottomColor: signatureLineColor,
                            width: "100%",
                            marginBottom: design?.signatureLineSpacing || 8,
                            height: design?.signatureHeight || 60,
                          }} />
                        )}
                        <Text style={{
                          fontSize: fontSize * 0.857,
                          color: textColor,
                          textAlign: "center",
                        }}>
                          {design?.authorizedSignatureLabel || "Authorized Signature"}
            </Text>
          </View>
                    </>
                  ) : (
                    <View style={{
                      width: design?.signatureLineLength || 200,
                      alignItems: design?.signatureAlignment === "center" ? "center" : design?.signatureAlignment === "right" ? "flex-end" : "flex-start",
                    }}>
                      {(design?.signatureLineStyle === "line" || design?.signatureLineStyle === "solid") && (
                        <View style={{
                          borderBottomWidth: design?.signatureLineWidth || 1,
                          borderBottomColor: signatureLineColor,
                          width: (design?.signatureLineStyle === "line" || design?.signatureLineStyle === "box") ? (design?.signatureLineLength || 200) : "100%",
                          marginBottom: design?.signatureLineSpacing || 8,
                        }} />
                      )}
                      {(design?.signatureLineStyle === "box") && (
                        <View style={{
                          borderWidth: design?.signatureLineWidth || 1,
                          borderColor: signatureLineColor,
                          width: design?.signatureLineLength || 200,
                          height: design?.signatureHeight || 60,
                          marginBottom: design?.signatureLineSpacing || 8,
                        }} />
                      )}
                      {(design?.signatureLineStyle === "dotted") && (
                        <View style={{
                          borderBottomWidth: design?.signatureLineWidth || 1,
                          borderBottomColor: signatureLineColor,
                          width: "100%",
                          marginBottom: design?.signatureLineSpacing || 8,
                          height: design?.signatureHeight || 60,
                        }} />
                      )}
                      <Text style={{
                        fontSize: fontSize * 0.857,
                        color: textColor,
                        textAlign: design?.signatureAlignment === "left" ? "left" : design?.signatureAlignment === "right" ? "right" : "center",
                      }}>
                        {design?.signatureAlignment === "left" 
                          ? (design?.customerSignatureLabel || "Customer Signature")
                          : (design?.authorizedSignatureLabel || "Authorized Signature")}
            </Text>
          </View>
                  )}
                </View>
              )}
            </View>
          )}
        </Page>
      </Document>
    );

    let stream;
    try {
      stream = await renderToStream(document);
    } catch (renderError) {
      console.error("Error in renderToStream:", renderError);
      throw new Error(`PDF rendering failed: ${renderError instanceof Error ? renderError.message : String(renderError)}`);
    }

    const chunks: Uint8Array[] = [];

    try {
    for await (const chunk of stream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
    } catch (streamError) {
      console.error("Error processing stream:", streamError);
      throw new Error(`Stream processing failed: ${streamError instanceof Error ? streamError.message : String(streamError)}`);
    }

    const buffer = Buffer.concat(chunks);
    const fileName = `cylinder-bill-${entry.customerName.replace(/\s+/g, "-")}-${format(entry.deliveryDate, "yyyy-MM-dd")}.pdf`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : String(error);
    console.error("Error details:", { errorMessage, errorStack, error });
    
    // Log full error object for debugging
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    
    return NextResponse.json(
      { error: "Failed to generate PDF bill", details: errorMessage },
      { status: 500 },
    );
  }
}
