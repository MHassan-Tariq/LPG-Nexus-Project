"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { getBillTemplateDesign } from "@/app/(dashboard)/settings/bill-design-actions";
import { CylinderBillRenderer } from "@/components/bills/cylinder-bill-renderer";

const currencyFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

interface CylinderBillPreviewProps {
  entry: {
    id: string;
    billCreatedBy: string;
    cylinderType: "DELIVERED" | "RECEIVED";
    cylinderLabel?: string | null;
    deliveredBy?: string | null;
    quantity: number;
    unitPrice: number;
    amount: number;
    customerName: string;
    customerId?: string | null;
    verified: boolean;
    description?: string | null;
    deliveryDate: Date;
    createdAt: Date;
    // RECEIVED type fields
    paymentType?: string | null;
    paymentAmount?: number | null;
    paymentReceivedBy?: string | null;
    emptyCylinderReceived?: number | null;
    // Customer details for preview
    customerAddress?: string | null;
    customerPhone?: string | null;
  };
}

export function CylinderBillPreview({ entry }: CylinderBillPreviewProps) {
  const [design, setDesign] = useState<any>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [barcode, setBarcode] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDesign = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getBillTemplateDesign();
      
      if (result.success && result.data) {
        const designData = result.data as any;
        setDesign(designData);
        // Load logo, barcode, and QR code from design
        setLogo(designData.customLogo || null);
        setBarcode(designData.customBarcode || null);
        setQrCode(designData.customQRCode || null);
      } else {
        // If no design is saved, use default design
        const defaultDesign = {
          storeName: "LPG Management System",
          storeAddress: "",
          storePhone: "",
          storeEmail: "",
          storeWebsite: "",
          storeSlogan: "",
          showLogo: false,
          showBusinessInfo: true,
          showHeaderTitle: true,
          headerTitle: "Cylinder Delivery Bill",
          primaryColor: "#1c5bff",
          backgroundColor: "#ffffff",
          headerColor: "#1c5bff",
          showTable: true,
          showPrices: true,
          showNotesSection: false,
          showFooter: true,
          footerText: "Thank you for your business!",
          showSignatureArea: false,
          showBarcode: false,
          showQRCode: false,
          tableColumns: ["Item", "Quantity", "Unit Price", "Total"],
          orientation: "portrait",
        };
        setDesign(defaultDesign);
      }
    } catch (err) {
      console.error("Error loading bill design:", err);
      setError("Failed to load bill design. Using default template.");
      // Use default design on error
      const defaultDesign = {
        storeName: "LPG Management System",
        storeAddress: "",
        storePhone: "",
        storeEmail: "",
        storeWebsite: "",
        storeSlogan: "",
        showLogo: false,
        showBusinessInfo: true,
        showHeaderTitle: true,
        headerTitle: "Cylinder Delivery Bill",
        primaryColor: "#1c5bff",
        backgroundColor: "#ffffff",
        headerColor: "#1c5bff",
        showTable: true,
        showPrices: true,
        showNotesSection: false,
        showFooter: true,
        footerText: "Thank you for your business!",
        showSignatureArea: false,
        showBarcode: false,
        showQRCode: false,
        tableColumns: ["Item", "Quantity", "Unit Price", "Total"],
        orientation: "portrait",
      };
      setDesign(defaultDesign);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    loadDesign();
  }, [loadDesign]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-slate-500">Loading bill design...</p>
      </div>
    );
  }

  if (error && !design) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">{error}</p>
          <p className="text-slate-500 text-sm">Please configure your bill design in Settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center w-full overflow-x-auto">
      <CylinderBillRenderer 
        design={design}
        entry={entry}
        logo={logo}
        barcode={barcode}
        qrCode={qrCode}
      />
    </div>
  );
}

