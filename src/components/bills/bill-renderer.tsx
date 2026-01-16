"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { formatCurrency } from "@/lib/utils";

interface BillRendererProps {
  design: any;
  bill: {
    id: string;
    customer: {
      name: string;
      customerCode: number;
      address?: string | null;
      contactNumber?: string | null;
      email?: string | null;
    };
    billStartDate: Date;
    billEndDate: Date;
    lastMonthRemaining: number;
    currentMonthBill: number;
    cylinders: number;
    status: string;
    payments: Array<{
      id: string;
      amount: number;
      paidOn: Date;
      method: string | null;
      notes: string | null;
    }>;
  };
  logo?: string | null;
  barcode?: string | null;
  qrCode?: string | null;
}

export function BillRenderer({ design, bill, logo = null, barcode = null, qrCode = null }: BillRendererProps) {
  if (!design) {
    return null;
  }

  const primaryColor = design.primaryColor || "#1c5bff";
  const bgColor = design.backgroundColor || "#ffffff";
  const logoAlign = design.logoAlignment || "left";
  const businessInfoAlign = design.businessInfoAlignment || "left";
  
  // Font styles
  const fontFamily = design.fontFamily || "Inter";
  const fontSize = design.fontSize || 14;
  const headerFontSize = design.headerFontSize || 36;
  const headerFontWeight = design.headerFontWeight || "bold";
  const tableFontSize = design.tableFontSize || 14;
  const tableFontWeight = design.tableFontWeight || "normal";

  // Font weight mapping
  const getFontWeight = (weight: string) => {
    switch (weight) {
      case "normal": return "400";
      case "medium": return "500";
      case "semibold": return "600";
      case "bold": return "700";
      case "extrabold": return "800";
      default: return "400";
    }
  };
  
  // Determine text color based on theme
  const textColor = design.theme === "dark" ? "#ffffff" : (design.tableTextColor || "#000000");
  const headerTextColor = "#ffffff";
  const bodyTextColor = design.theme === "dark" ? "#ffffff" : "#000000";
  
  // Signature line color
  const defaultSignatureLineColor = "#94a3b8";
  const signatureLineColor = (design.signatureLineColor === defaultSignatureLineColor || !design.signatureLineColor) 
    ? primaryColor 
    : design.signatureLineColor;
  
  // Theme colors for table rows
  let alternateRowBg = "#ffffff";
  let rowBg = "#ffffff";
  
  if (design.theme === "classic") {
    alternateRowBg = "#fef3c7";
    rowBg = "#fef3c7";
  } else if (design.theme === "bold") {
    alternateRowBg = "#fef08a";
    rowBg = "#fef08a";
  } else if (!design.alternateRowShading) {
    alternateRowBg = "#ffffff";
    rowBg = "#ffffff";
  } else {
    if (design.theme === "dark") {
      alternateRowBg = "#334155";
      rowBg = "#1e293b";
    } else if (design.theme === "colored") {
      alternateRowBg = "#eff6ff";
      rowBg = "#ffffff";
    } else if (design.theme === "minimal") {
      alternateRowBg = "#f8fafc";
      rowBg = "#ffffff";
    } else if (design.theme === "modern") {
      alternateRowBg = "#f0fdfa";
      rowBg = "#ffffff";
    } else {
      alternateRowBg = "#f8fafc";
      rowBg = "#ffffff";
    }
  }

  const totalAmount = bill.lastMonthRemaining + bill.currentMonthBill;
  const paidAmount = bill.payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = totalAmount - paidAmount;

  // Helper function to render table cell
  const renderTableCell = (value: string | number | null | undefined, isPrice = false, key?: number) => (
    <td key={key} className={cn(
      "px-4 py-3 border",
      isPrice && "font-semibold",
      design.tableAlignment === "left" && "text-left",
      design.tableAlignment === "center" && "text-center",
      design.tableAlignment === "right" && "text-right"
    )} style={{ 
      borderWidth: `${design.tableBorderThickness || 1}px`, 
      color: isPrice ? textColor : textColor, 
      borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0",
      fontSize: `${tableFontSize}px`,
      fontFamily: fontFamily
    }}>
      {isPrice && typeof value === 'number' ? formatCurrency(value) : (value ?? "—")}
    </td>
  );

  // Helper to get column index
  const getColumnIndex = (colName: string) => {
    return design.tableColumns.findIndex((col: string) => col.toLowerCase() === colName.toLowerCase());
  };

  return (
    <div
      className="bg-white shadow-lg mx-auto rounded-xl overflow-hidden"
      style={{
        width: design.orientation === "landscape" ? "297mm" : "210mm",
        minHeight: design.orientation === "landscape" ? "210mm" : "297mm",
        padding: `${design.pageMargins?.top || 20}mm ${design.pageMargins?.right || 20}mm ${design.pageMargins?.bottom || 20}mm ${design.pageMargins?.left || 20}mm`,
        backgroundColor: bgColor,
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
        fontWeight: getFontWeight(design.fontWeight || "normal"),
      }}
    >
      {/* Header with Logo and Business Info */}
      <div className="mb-8 relative" style={{ marginTop: `${design.headerMargin || 0}px` }}>
        {/* Logo and Business Info */}
        {(design.showLogo && logo) || design.showBusinessInfo ? (
          <div 
            className={cn(
              "flex items-start gap-4 mb-6",
              logoAlign === "left" && "flex-row",
              logoAlign === "right" && "flex-row-reverse",
              logoAlign === "center" && "flex-col items-center"
            )} 
            style={{ marginTop: `${design.businessInfoMargin || 0}px` }}
          >
            {/* Logo Section */}
            {design.showLogo && logo && (
              <div 
                className={cn(
                  "flex-shrink-0",
                  design.logoBorder && "p-2 border-2 border-slate-300 rounded-lg",
                  logoAlign === "center" && "mx-auto"
                )}
                style={{ 
                  marginTop: `${design.logoMargin || 0}px`,
                  marginLeft: `${design.logoHorizontalMargin || 0}px`
                }}
              >
                <img
                  src={logo}
                  alt="Logo"
                  className="object-contain"
                  style={{ height: `${design.logoSize || 120}px`, maxWidth: "200px" }}
                />
              </div>
            )}
            {/* Business Info Section */}
            {design.showBusinessInfo && (
              <div className={cn(
                logoAlign === "center" ? "w-full" : "flex-1",
                businessInfoAlign === "center" && "text-center",
                businessInfoAlign === "right" && "text-right",
                businessInfoAlign === "left" && "text-left"
              )}>
                <p className="font-semibold" style={{ color: bodyTextColor, fontSize: `${fontSize * 1.286}px` }}>
                  {design.storeName}
                </p>
                <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>{design.storeAddress}</p>
                {design.showPhone && (
                  <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>{design.storePhone}</p>
                )}
                <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>{design.storeEmail}</p>
                {design.storeWebsite && (
                  <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>{design.storeWebsite}</p>
                )}
                {design.storeSlogan && (
                  <p className="italic mt-1" style={{ color: bodyTextColor, fontSize: `${fontSize}px`, opacity: 0.8 }}>
                    {design.storeSlogan}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : null}

        {/* Barcode at Top */}
        {design.showBarcode && barcode && (design.barcodePosition === "top-left" || design.barcodePosition === "top-right") && (
          <div
            className={cn(
              "absolute z-10",
              design.barcodePosition === "top-left" && "left-0 top-0",
              design.barcodePosition === "top-right" && "right-0 top-0"
            )}
          >
            <img
              src={barcode}
              alt="Barcode"
              className="object-contain"
              style={{ 
                maxHeight: `${design.barcodeSize || 100}px`, 
                maxWidth: `${design.barcodeSize || 100}px`,
                height: `${design.barcodeSize || 100}px`,
                width: "auto"
              }}
            />
          </div>
        )}

        {/* QR Code at Top */}
        {design.showQRCode && qrCode && (design.qrCodePosition === "top-left" || design.qrCodePosition === "top-right") && (
          <div
            className={cn(
              "absolute z-10",
              design.qrCodePosition === "top-left" && "left-0 top-0",
              design.qrCodePosition === "top-right" && "right-0 top-0"
            )}
          >
            <img
              src={qrCode}
              alt="QR Code"
              className="object-contain"
              style={{ 
                width: `${design.qrCodeSize || 100}px`, 
                height: `${design.qrCodeSize || 100}px`
              }}
            />
          </div>
        )}

        {/* Header Title */}
        {design.showHeaderTitle && (
          <div
            className={cn(
              "mb-6",
              design.headerAlignment === "center" && "text-center",
              design.headerAlignment === "right" && "text-right",
              design.headerAlignment === "left" && "text-left"
            )}
            style={{ marginTop: `${design.headerTitleMargin || 0}px` }}
          >
            <h1
              className={cn(
                "mb-2",
                design.headerStyle === "boxed" && "border-2 p-4 inline-block",
                design.headerStyle === "underline" && "border-b-4",
                design.headerStyle === "topBorder" && "border-t-4 pt-4"
              )}
              style={{ 
                color: design.headerColor || primaryColor,
                borderColor: design.headerColor || primaryColor,
                fontSize: `${headerFontSize}px`,
                fontWeight: getFontWeight(headerFontWeight),
                fontFamily: fontFamily
              }}
            >
              {design.headerTitle === "CUSTOM" 
                ? (design.customHeaderTitle || "CUSTOM") 
                : (design.headerTitle || "INVOICE")}
            </h1>
            {design.headerBorder && (
              <div
                className="h-1"
                style={{ backgroundColor: design.headerColor || primaryColor }}
              />
            )}
          </div>
        )}

        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <p className="mb-1" style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>
              <span className="font-semibold">Invoice #:</span> {bill.id.slice(0, 8).toUpperCase()}
            </p>
            <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>
              <span className="font-semibold">Date:</span> {format(new Date(), "MMMM d, yyyy")}
            </p>
          </div>
          {design.showCustomerInfo && (
            <div>
              <p className="mb-1" style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>
                <span className="font-semibold">Customer:</span> {bill.customer.name}
              </p>
              {design.showPhone && bill.customer.contactNumber && (
                <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>
                  <span className="font-semibold">Phone:</span> {bill.customer.contactNumber}
                </p>
              )}
              {design.showAddress && bill.customer.address && (
                <p className="mt-1" style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>
                  {bill.customer.address}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {design.showTable && (
        <div 
          className="mb-6"
          style={{ marginTop: `${design.tableMargin || 0}px` }}
        >
          <table className="w-full" style={{ borderWidth: `${design.tableBorderThickness || 1}px` }}>
            <thead>
              <tr style={{ backgroundColor: design.tableHeaderBgColor || primaryColor, color: headerTextColor }}>
                {design.tableColumns.map((col: string) => (
                  <th
                    key={col}
                    className={cn(
                      "px-4 py-3",
                      design.tableAlignment === "left" && "text-left",
                      design.tableAlignment === "center" && "text-center",
                      design.tableAlignment === "right" && "text-right"
                    )}
                    style={{ 
                      color: headerTextColor,
                      fontSize: `${tableFontSize}px`,
                      fontWeight: getFontWeight(tableFontWeight),
                      fontFamily: fontFamily
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Last Month Remaining Row */}
              <tr style={{ backgroundColor: rowBg }}>
                {design.tableColumns.map((col: string, idx: number) => {
                  const colLower = col.toLowerCase();
                  if (colLower === "item") {
                    return (
                      <td key={idx} className={cn(
                        "px-4 py-3 border",
                        design.tableAlignment === "left" && "text-left",
                        design.tableAlignment === "center" && "text-center",
                        design.tableAlignment === "right" && "text-right"
                      )} style={{ 
                        borderWidth: `${design.tableBorderThickness || 1}px`, 
                        color: textColor, 
                        borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0",
                        fontSize: `${tableFontSize}px`,
                        fontFamily: fontFamily
                      }}>
                        Last Month Remaining
                      </td>
                    );
                  } else if (colLower === "quantity") {
                    return renderTableCell(0, false, idx);
                  } else if (colLower === "price" || colLower === "unit price") {
                    return renderTableCell(design.showPrices ? bill.lastMonthRemaining : null, true, idx);
                  } else if (colLower === "total") {
                    return renderTableCell(design.showPrices ? bill.lastMonthRemaining : null, true, idx);
                  }
                  return renderTableCell("—", false, idx);
                })}
              </tr>
              {/* Current Month Bill Row */}
              <tr style={{ backgroundColor: design.alternateRowShading ? alternateRowBg : rowBg }}>
                {design.tableColumns.map((col: string, idx: number) => {
                  const colLower = col.toLowerCase();
                  if (colLower === "item") {
                    return (
                      <td key={idx} className={cn(
                        "px-4 py-3 border",
                        design.tableAlignment === "left" && "text-left",
                        design.tableAlignment === "center" && "text-center",
                        design.tableAlignment === "right" && "text-right"
                      )} style={{ 
                        borderWidth: `${design.tableBorderThickness || 1}px`, 
                        color: textColor, 
                        borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0",
                        fontSize: `${tableFontSize}px`,
                        fontFamily: fontFamily
                      }}>
                        Current Month Bill
                      </td>
                    );
                  } else if (colLower === "quantity") {
                    return renderTableCell(bill.cylinders, false, idx);
                  } else if (colLower === "price" || colLower === "unit price") {
                    return renderTableCell(design.showPrices ? bill.currentMonthBill : null, true, idx);
                  } else if (colLower === "total") {
                    return renderTableCell(design.showPrices ? bill.currentMonthBill : null, true, idx);
                  }
                  return renderTableCell("—", false, idx);
                })}
              </tr>
              {/* Paid Amount Row */}
              {bill.payments.length > 0 && (
                <tr style={{ backgroundColor: rowBg }}>
                  {design.tableColumns.map((col: string, idx: number) => {
                    const colLower = col.toLowerCase();
                    if (colLower === "item") {
                      return (
                        <td key={idx} className={cn(
                          "px-4 py-3 border",
                          design.tableAlignment === "left" && "text-left",
                          design.tableAlignment === "center" && "text-center",
                          design.tableAlignment === "right" && "text-right"
                        )} style={{ 
                          borderWidth: `${design.tableBorderThickness || 1}px`, 
                          color: textColor, 
                          borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0",
                          fontSize: `${tableFontSize}px`,
                          fontFamily: fontFamily
                        }}>
                          Paid Amount
                        </td>
                      );
                    } else if (colLower === "quantity") {
                      return renderTableCell("—", false, idx);
                    } else if (colLower === "price" || colLower === "unit price") {
                      return renderTableCell(design.showPrices ? paidAmount : null, true, idx);
                    } else if (colLower === "total") {
                      return (
                        <td key={idx} className={cn(
                          "px-4 py-3 border font-semibold",
                          design.tableAlignment === "left" && "text-left",
                          design.tableAlignment === "center" && "text-center",
                          design.tableAlignment === "right" && "text-right"
                        )} style={{ 
                          borderWidth: `${design.tableBorderThickness || 1}px`, 
                          color: "#10b981", 
                          borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0",
                          fontSize: `${tableFontSize}px`,
                          fontFamily: fontFamily
                        }}>
                          {design.showPrices ? formatCurrency(paidAmount) : "—"}
                        </td>
                      );
                    }
                    return renderTableCell("—", false);
                  })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {design.showPrices && (
        <div className="mb-6">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between" style={{ color: textColor, fontSize: `${fontSize}px` }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              {design.showTaxSection && (
                <div className="flex justify-between" style={{ color: textColor, fontSize: `${fontSize}px` }}>
                  <span>Tax:</span>
                  <span>{formatCurrency(0)}</span>
                </div>
              )}
              <div
                className="h-px my-2"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="flex justify-between font-bold text-lg" style={{ color: textColor }}>
                <span>Grand Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
              <div
                className="h-px my-2"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="flex justify-between font-semibold" style={{ color: "#dc2626", fontSize: `${fontSize}px` }}>
                <span>Remaining:</span>
                <span>{remainingAmount !== null && remainingAmount !== undefined ? formatCurrency(remainingAmount) : "null"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Table */}
      {bill.payments.length > 0 && design.showTable && (
        <div className="mb-6" style={{ marginTop: `${design.tableMargin || 0}px` }}>
          <h3 className="mb-3 font-semibold" style={{ color: textColor, fontSize: `${fontSize * 1.1}px` }}>
            Payment History
          </h3>
          <table className="w-full" style={{ borderWidth: `${design.tableBorderThickness || 1}px` }}>
            <thead>
              <tr style={{ backgroundColor: design.tableHeaderBgColor || primaryColor, color: headerTextColor }}>
                <th className={cn(
                  "px-4 py-3",
                  design.tableAlignment === "left" && "text-left",
                  design.tableAlignment === "center" && "text-center",
                  design.tableAlignment === "right" && "text-right"
                )} style={{ 
                  color: headerTextColor,
                  fontSize: `${tableFontSize}px`,
                  fontWeight: getFontWeight(tableFontWeight),
                  fontFamily: fontFamily
                }}>
                  Date
                </th>
                <th className={cn(
                  "px-4 py-3",
                  design.tableAlignment === "left" && "text-left",
                  design.tableAlignment === "center" && "text-center",
                  design.tableAlignment === "right" && "text-right"
                )} style={{ 
                  color: headerTextColor,
                  fontSize: `${tableFontSize}px`,
                  fontWeight: getFontWeight(tableFontWeight),
                  fontFamily: fontFamily
                }}>
                  Amount
                </th>
                <th className={cn(
                  "px-4 py-3",
                  design.tableAlignment === "left" && "text-left",
                  design.tableAlignment === "center" && "text-center",
                  design.tableAlignment === "right" && "text-right"
                )} style={{ 
                  color: headerTextColor,
                  fontSize: `${tableFontSize}px`,
                  fontWeight: getFontWeight(tableFontWeight),
                  fontFamily: fontFamily
                }}>
                  Method
                </th>
              </tr>
            </thead>
            <tbody>
              {bill.payments.map((payment, index) => (
                <tr key={payment.id} style={{ backgroundColor: index % 2 === 0 ? rowBg : (design.alternateRowShading ? alternateRowBg : rowBg) }}>
                  <td className={cn(
                    "px-4 py-3 border",
                    design.tableAlignment === "left" && "text-left",
                    design.tableAlignment === "center" && "text-center",
                    design.tableAlignment === "right" && "text-right"
                  )} style={{ 
                    borderWidth: `${design.tableBorderThickness || 1}px`, 
                    color: textColor, 
                    borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0",
                    fontSize: `${tableFontSize}px`,
                    fontFamily: fontFamily
                  }}>
                    {format(payment.paidOn, "MMM d, yyyy")}
                  </td>
                  <td className={cn(
                    "px-4 py-3 border",
                    design.tableAlignment === "left" && "text-left",
                    design.tableAlignment === "center" && "text-center",
                    design.tableAlignment === "right" && "text-right"
                  )} style={{ 
                    borderWidth: `${design.tableBorderThickness || 1}px`, 
                    color: textColor, 
                    borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0",
                    fontSize: `${tableFontSize}px`,
                    fontFamily: fontFamily
                  }}>
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className={cn(
                    "px-4 py-3 border",
                    design.tableAlignment === "left" && "text-left",
                    design.tableAlignment === "center" && "text-center",
                    design.tableAlignment === "right" && "text-right"
                  )} style={{ 
                    borderWidth: `${design.tableBorderThickness || 1}px`, 
                    color: textColor, 
                    borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0",
                    fontSize: `${tableFontSize}px`,
                    fontFamily: fontFamily
                  }}>
                    {payment.method || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Notes Section */}
      {design.showNotesSection && (
        <div 
          className={cn(
            "mb-6 p-4 rounded-lg",
            design.notesAlignment === "center" && "text-center",
            design.notesAlignment === "right" && "text-right",
            design.notesAlignment === "left" && "text-left"
          )}
          style={{ 
            backgroundColor: design.theme === "dark" ? "#334155" : "#f8fafc",
            marginTop: `${design.notesMargin || 0}px`
          }}
        >
          <p className="font-semibold mb-1" style={{ color: textColor, fontSize: `${fontSize}px` }}>
            {design.notesLabel || "Note:"}
          </p>
          <p style={{ color: textColor, fontSize: `${fontSize}px` }}>
            {design.notesText || "Terms and conditions apply."}
          </p>
        </div>
      )}

      {/* Footer */}
      {design.showFooter && (
        <div className="pt-6 border-t relative" style={{ borderColor: primaryColor, marginTop: `${design.footerMargin || 0}px` }}>
          {/* Barcode at Bottom */}
          {design.showBarcode && barcode && (design.barcodePosition === "bottom-left" || design.barcodePosition === "bottom-right") && (
            <div
              className={cn(
                "absolute z-10",
                design.barcodePosition === "bottom-left" && "left-0 bottom-0",
                design.barcodePosition === "bottom-right" && "right-0 bottom-0"
              )}
            >
              <img
                src={barcode}
                alt="Barcode"
                className="object-contain"
                style={{ 
                  maxHeight: `${design.barcodeSize || 100}px`, 
                  maxWidth: `${design.barcodeSize || 100}px`,
                  height: `${design.barcodeSize || 100}px`,
                  width: "auto"
                }}
              />
            </div>
          )}
          {/* QR Code at Bottom */}
          {design.showQRCode && qrCode && (design.qrCodePosition === "bottom-left" || design.qrCodePosition === "bottom-right") && (
            <div
              className={cn(
                "absolute z-10",
                design.qrCodePosition === "bottom-left" && "left-0 bottom-0",
                design.qrCodePosition === "bottom-right" && "right-0 bottom-0"
              )}
            >
              <img
                src={qrCode}
                alt="QR Code"
                className="object-contain"
                style={{ 
                  width: `${design.qrCodeSize || 100}px`, 
                  height: `${design.qrCodeSize || 100}px`
                }}
              />
            </div>
          )}
          
          <p 
            className={cn(
              "mb-6",
              design.footerAlignment === "center" && "text-center",
              design.footerAlignment === "right" && "text-right",
              design.footerAlignment === "left" && "text-left"
            )}
            style={{ color: textColor, fontSize: `${fontSize}px` }}
          >
            {design.footerText || "Thank you for your business!"}
          </p>

          {design.showSignatureArea && (
            <div 
              className={cn(
                design.signatureAlignment === "center" 
                  ? "grid grid-cols-2 gap-8 mt-8" 
                  : "flex mt-8",
                design.signatureAlignment === "left" && "justify-start",
                design.signatureAlignment === "right" && "justify-end",
                design.signatureAlignment === "center" && "justify-center"
              )}
              style={{ marginTop: `${design.signatureMargin || 0}px` }}
            >
              {design.signatureAlignment === "center" ? (
                <>
                  <div className={cn("text-center", design.signatureLineStyle === "box" && "p-2")}>
                    <div
                      className={cn(
                        design.signatureLineStyle === "line" && "border-b",
                        design.signatureLineStyle === "box" && "border",
                        design.signatureLineStyle === "solid" && "border-b",
                        design.signatureLineStyle === "dotted" && "border-b border-dotted",
                        design.signatureLineStyle === "none" && "border-none"
                      )}
                      style={{ 
                        borderColor: design.signatureLineStyle !== "none" ? signatureLineColor : "transparent",
                        borderWidth: design.signatureLineStyle !== "none" ? `${design.signatureLineWidth || 1}px` : "0px",
                        height: design.signatureLineStyle === "line" ? "0px" : (design.signatureLineStyle === "box" ? `${design.signatureHeight || 60}px` : `${design.signatureHeight || 60}px`),
                        width: design.signatureLineStyle === "line" || design.signatureLineStyle === "box" ? `${design.signatureLineLength || 200}px` : "100%",
                        marginBottom: `${design.signatureLineSpacing || 8}px`,
                        marginLeft: "auto",
                        marginRight: "auto"
                      }}
                    />
                    <p className="text-xs text-center" style={{ color: textColor }}>
                      {design.customerSignatureLabel || "Customer Signature"}
                    </p>
                  </div>
                  <div className={cn("text-center", design.signatureLineStyle === "box" && "p-2")}>
                    <div
                      className={cn(
                        design.signatureLineStyle === "line" && "border-b",
                        design.signatureLineStyle === "box" && "border",
                        design.signatureLineStyle === "solid" && "border-b",
                        design.signatureLineStyle === "dotted" && "border-b border-dotted",
                        design.signatureLineStyle === "none" && "border-none"
                      )}
                      style={{ 
                        borderColor: design.signatureLineStyle !== "none" ? signatureLineColor : "transparent",
                        borderWidth: design.signatureLineStyle !== "none" ? `${design.signatureLineWidth || 1}px` : "0px",
                        height: design.signatureLineStyle === "line" ? "0px" : (design.signatureLineStyle === "box" ? `${design.signatureHeight || 60}px` : `${design.signatureHeight || 60}px`),
                        width: design.signatureLineStyle === "line" || design.signatureLineStyle === "box" ? `${design.signatureLineLength || 200}px` : "100%",
                        marginBottom: `${design.signatureLineSpacing || 8}px`,
                        marginLeft: "auto",
                        marginRight: "auto"
                      }}
                    />
                    <p className="text-xs text-center" style={{ color: textColor }}>
                      {design.authorizedSignatureLabel || "Authorized Signature"}
                    </p>
                  </div>
                </>
              ) : (
                <div className={cn(
                  "w-full",
                  design.signatureLineStyle === "line" || design.signatureLineStyle === "box" ? "" : "max-w-xs"
                )}>
                  <div className={cn(design.signatureLineStyle === "box" && "p-2")}>
                    <div
                      className={cn(
                        design.signatureLineStyle === "line" && "border-b",
                        design.signatureLineStyle === "box" && "border",
                        design.signatureLineStyle === "solid" && "border-b",
                        design.signatureLineStyle === "dotted" && "border-b border-dotted",
                        design.signatureLineStyle === "none" && "border-none",
                        design.signatureAlignment === "left" && "text-left",
                        design.signatureAlignment === "right" && "text-right",
                        (design.signatureLineStyle === "line" || design.signatureLineStyle === "box") && "mx-auto"
                      )}
                      style={{ 
                        borderColor: design.signatureLineStyle !== "none" ? signatureLineColor : "transparent",
                        borderWidth: design.signatureLineStyle !== "none" ? `${design.signatureLineWidth || 1}px` : "0px",
                        height: design.signatureLineStyle === "line" ? "0px" : (design.signatureLineStyle === "box" ? `${design.signatureHeight || 60}px` : `${design.signatureHeight || 60}px`),
                        width: design.signatureLineStyle === "line" || design.signatureLineStyle === "box" ? `${design.signatureLineLength || 200}px` : "100%",
                        marginBottom: `${design.signatureLineSpacing || 8}px`
                      }}
                    />
                    <p className={cn(
                      "text-xs",
                      design.signatureAlignment === "left" && "text-left",
                      design.signatureAlignment === "right" && "text-right",
                      (design.signatureLineStyle === "line" || design.signatureLineStyle === "box") && "text-center"
                    )} style={{ color: textColor }}>
                      {design.signatureAlignment === "left" 
                        ? (design.customerSignatureLabel || "Customer Signature")
                        : (design.authorizedSignatureLabel || "Authorized Signature")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

