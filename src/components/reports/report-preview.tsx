"use client";

import { cn } from "@/lib/utils";

interface HeaderConfig {
  showHeader?: boolean;
  showLogo: boolean;
  logo?: string | null;
  logoPosition: "left" | "center" | "right";
  logoSize: "small" | "medium" | "large";
  showBusinessName: boolean;
  showAddress: boolean;
  showContactInfo: boolean;
  showTaxInfo: boolean;
  businessName: string;
  address: string;
  phoneNumber: string;
  email: string;
  ntnGst?: string;
  fontSize: number;
  fontWeight: "regular" | "medium" | "bold";
  textColor: string;
  lineHeight: number;
  textAlignment: "left" | "center" | "right";
  headerLayout: "horizontal" | "vertical";
  showDivider: boolean;
  dividerStyle: "solid" | "dotted" | "dashed";
  dividerColor: string;
  dividerThickness: number;
  topMargin?: number;
  bottomMargin?: number;
}

interface FooterConfig {
  showFooter?: boolean;
  footerLeftText: string;
  footerCenterText?: string;
  footerRightText?: string;
  showPageNumber: boolean;
  showPrintedDate: boolean;
  showSignatureLine: boolean;
  fontSize: number;
  textColor: string;
  alignment: "left" | "center" | "right";
  signatureLabel: string;
  showSignature: boolean;
  showSignatureLine: boolean;
  signatureAlignment: "left" | "center" | "right";
  signatureLineSpacing: number;
  topMargin?: number;
  bottomMargin?: number;
}

interface ReportPreviewProps {
  headerConfig: HeaderConfig;
  footerConfig: FooterConfig;
}

const logoSizeMap = {
  small: 60,
  medium: 90,
  large: 120,
};

const fontWeightMap = {
  regular: "font-normal",
  medium: "font-medium",
  bold: "font-bold",
};

const textAlignMap = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const dividerStyleMap = {
  solid: "solid",
  dotted: "dotted",
  dashed: "dashed",
};

export function ReportPreview({ headerConfig, footerConfig }: ReportPreviewProps) {
  const logoSize = logoSizeMap[headerConfig.logoSize];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Preview Container */}
      <div className="border-2 border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        {/* HEADER */}
        {headerConfig.showHeader !== false && (
        <div 
          className="border-b border-slate-200 bg-slate-50 p-4"
          style={{
            marginTop: `${headerConfig.topMargin || 0}px`,
            marginBottom: `${headerConfig.bottomMargin ?? 20}px`,
          }}
        >
          <div
            className={cn(
              "w-full",
              headerConfig.headerLayout === "horizontal" ? "flex items-center gap-4" : "flex flex-col gap-3",
              textAlignMap[headerConfig.textAlignment]
            )}
          >
            {/* Logo */}
            {headerConfig.showLogo && headerConfig.logo && (
              <div
                className={cn(
                  "flex-shrink-0",
                  headerConfig.logoPosition === "left" && "order-first",
                  headerConfig.logoPosition === "center" && "mx-auto",
                  headerConfig.logoPosition === "right" && "order-last ml-auto"
                )}
              >
                <img
                  src={headerConfig.logo}
                  alt="Logo"
                  className="object-contain"
                  style={{ width: logoSize, height: logoSize }}
                />
              </div>
            )}

            {/* Business Info */}
            <div
              className={cn(
                "flex-1",
                textAlignMap[headerConfig.textAlignment]
              )}
              style={{
                fontSize: `${headerConfig.fontSize}px`,
                fontWeight: fontWeightMap[headerConfig.fontWeight],
                color: headerConfig.textColor,
                lineHeight: headerConfig.lineHeight,
              }}
            >
              {headerConfig.showBusinessName && (
                <div className="font-semibold mb-1">{headerConfig.businessName}</div>
              )}
              {headerConfig.showAddress && (
                <div className="text-sm mb-1">{headerConfig.address}</div>
              )}
              {headerConfig.showContactInfo && (
                <div className="text-sm">
                  {headerConfig.phoneNumber}
                  {headerConfig.email && ` • ${headerConfig.email}`}
                </div>
              )}
              {headerConfig.showTaxInfo && headerConfig.ntnGst && (
                <div className="text-sm mt-1">NTN/GST: {headerConfig.ntnGst}</div>
              )}
            </div>
          </div>

          {/* Divider */}
          {headerConfig.showDivider && (
            <div
              className="mt-4"
              style={{
                borderTopWidth: `${headerConfig.dividerThickness}px`,
                borderTopStyle: dividerStyleMap[headerConfig.dividerStyle],
                borderTopColor: headerConfig.dividerColor,
              }}
            />
          )}
        </div>
        )}

        {/* BODY (Locked - Sample Content) */}
        <div className="p-6 bg-white">
          <div className="text-center py-12 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <div className="text-slate-500 text-sm font-medium">
              REPORT BODY
            </div>
            <div className="text-slate-400 text-xs mt-2">
              (Locked - System Controlled)
            </div>
            <div className="mt-4 text-xs text-slate-400 space-y-1">
              <div>• Summary Cards</div>
              <div>• Charts & Graphs</div>
              <div>• Data Tables</div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        {footerConfig.showFooter !== false && (
        <div
          className="border-t border-slate-200 bg-slate-50 p-4"
          style={{
            fontSize: `${footerConfig.fontSize}px`,
            color: footerConfig.textColor,
            marginTop: `${footerConfig.topMargin ?? 20}px`,
            marginBottom: `${footerConfig.bottomMargin || 0}px`,
          }}
        >
          {footerConfig.alignment === "left" && (
            <div className="text-xs space-y-1">
              <div>{footerConfig.footerLeftText || ""}</div>
              {footerConfig.footerCenterText && <div>{footerConfig.footerCenterText}</div>}
              <div>
                {footerConfig.footerRightText || ""}
                {footerConfig.showPageNumber && " • Page 1"}
                {footerConfig.showPrintedDate && " • " + new Date().toLocaleDateString()}
              </div>
            </div>
          )}
          {footerConfig.alignment === "center" && (
            <div className="text-xs text-center space-y-1">
              <div>{footerConfig.footerLeftText || ""}</div>
              {footerConfig.footerCenterText && <div>{footerConfig.footerCenterText}</div>}
              <div>
                {footerConfig.footerRightText || ""}
                {footerConfig.showPageNumber && " • Page 1"}
                {footerConfig.showPrintedDate && " • " + new Date().toLocaleDateString()}
              </div>
            </div>
          )}
          {footerConfig.alignment === "right" && (
            <div className="text-xs text-right space-y-1">
              <div>{footerConfig.footerLeftText || ""}</div>
              {footerConfig.footerCenterText && <div>{footerConfig.footerCenterText}</div>}
              <div>
                {footerConfig.footerRightText || ""}
                {footerConfig.showPageNumber && " • Page 1"}
                {footerConfig.showPrintedDate && " • " + new Date().toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Signature */}
          {(footerConfig.showSignature || footerConfig.showSignatureLine) && (
            <div className={cn("mt-6 pt-4 border-t border-slate-200", textAlignMap[footerConfig.signatureAlignment])}>
              <div className="text-xs" style={{ marginBottom: `${footerConfig.signatureLineSpacing}px` }}>
                {footerConfig.signatureLabel}
              </div>
              <div className={cn("border-b-2 border-slate-400 w-48", textAlignMap[footerConfig.signatureAlignment] === "text-center" ? "mx-auto" : textAlignMap[footerConfig.signatureAlignment] === "text-right" ? "ml-auto" : "")} />
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}

