"use client";

import { useEffect, useState } from "react";
import { BillRenderer } from "@/components/bills/bill-renderer";
import { getBillTemplateDesign } from "@/app/settings/bill-design-actions";

interface BillPreviewProps {
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
}

// Default design values matching the schema defaults
const defaultDesign = {
  pageSize: "A4",
  orientation: "portrait",
  theme: "light",
  headerStyle: "modern",
  primaryColor: "#1c5bff",
  backgroundColor: "#ffffff",
  footerText: "Thank you for your business!",
  logoSize: 120,
  logoAlignment: "left",
  logoBorder: false,
  storeName: "LPG Nexus Distribution",
  storeAddress: "123 Business Street, City, State 12345",
  storePhone: "+91 9876543210",
  storeEmail: "info@lpgnexus.com",
  storeWebsite: "www.lpgnexus.com",
  storeSlogan: "",
  headerTitle: "INVOICE",
  customHeaderTitle: "",
  headerAlignment: "center",
  headerColor: "#1c5bff",
  headerBorder: false,
  showCustomerInfo: true,
  showAddress: true,
  showPhone: true,
  showProductCode: true,
  showPrices: true,
  showTaxSection: true,
  showSignatureArea: true,
  showNotesSection: true,
  showQRCode: false,
  showLogo: false,
  showBusinessInfo: true,
  showHeaderTitle: true,
  showTable: true,
  showFooter: true,
  showBarcode: false,
  tableColumns: ["Item", "Quantity", "Price", "Total"],
  tableBorderThickness: 1,
  tableHeaderBgColor: "#1c5bff",
  tableTextColor: "#000000",
  alternateRowShading: true,
  notesText: "Terms and conditions apply.",
  notesLabel: "Note:",
  customerSignatureLabel: "Customer Signature",
  authorizedSignatureLabel: "Authorized Signature",
  signatureLineStyle: "box",
  signatureLineLength: 200,
  signatureLineWidth: 1,
  signatureLineColor: "#94a3b8",
  signatureLineSpacing: 8,
  signatureHeight: 60,
  qrCodeType: "invoiceLink",
  qrCodeSize: 100,
  barcodePosition: "bottom-right",
  barcodeSize: 100,
  qrCodePosition: "bottom-right",
  pageMargins: { top: 20, bottom: 20, left: 20, right: 20 },
  headerMargin: 0,
  footerMargin: 0,
  businessInfoMargin: 0,
  businessInfoAlignment: "left",
  logoMargin: 0,
  logoHorizontalMargin: 0,
  headerTitleMargin: 0,
  tableMargin: 0,
  tableAlignment: "left",
  notesMargin: 0,
  notesAlignment: "left",
  signatureMargin: 0,
  signatureAlignment: "left",
  footerAlignment: "center",
  barcodeMargin: 0,
  fontWeight: "normal",
  headerFontSize: 36,
  headerFontWeight: "bold",
  tableFontSize: 14,
  tableFontWeight: "normal",
  fontFamily: "Inter",
  fontSize: 14,
};

export function BillPreview({ bill }: BillPreviewProps) {
  const [design, setDesign] = useState<any>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDesign() {
      setIsLoading(true);
      try {
        const result = await getBillTemplateDesign();
        if (result.success) {
          // Use saved design if available, otherwise use default
          const finalDesign = result.data || defaultDesign;
          setDesign(finalDesign);
          // Load logo, barcode, and QR code from design
          setLogo(finalDesign.customLogo || null);
          setBarcode(finalDesign.customBarcode || null);
          setQrCode(finalDesign.customQRCode || null);
        } else {
          // If there's an error, use default design
          setDesign(defaultDesign);
        }
      } catch (error) {
        console.error("Error loading design:", error);
        // On error, use default design
        setDesign(defaultDesign);
      } finally {
        setIsLoading(false);
      }
    }
    loadDesign();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-slate-500">Loading bill design...</p>
      </div>
    );
  }

  if (!design) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-slate-500">Unable to load bill design. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full overflow-x-auto">
      <BillRenderer 
        design={design}
        bill={bill}
        logo={logo}
        barcode={barcode}
        qrCode={qrCode}
      />
    </div>
  );
}

