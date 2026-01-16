"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  FileText,
  Building2,
  Grid3x3,
  AlignLeft,
  FileSignature,
  QrCode,
  Eye,
  RotateCcw,
  Save,
  Check,
  X,
  Upload,
  Download,
  ZoomIn,
  ZoomOut,
  Sparkles,
  AlignCenter,
  AlignJustify,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { saveReportTemplateDesign, getReportTemplateDesign } from "@/app/settings/report-design-actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

const reportDesignSchema = z.object({
  pageSize: z.enum(["A4", "A5", "Letter", "POS", "Custom"]).default("A4"),
  orientation: z.enum(["portrait", "landscape"]).default("portrait"),
  theme: z.enum(["light", "dark", "colored", "minimal", "classic", "bold", "modern"]).default("light"),
  headerStyle: z.enum(["classic", "modern", "minimal", "bold", "boxed", "underline", "topBorder"]).default("modern"),
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").default("#1c5bff"),
  backgroundColor: z.string().default("#ffffff"),
  footerText: z.string().default("Thank you for your business!"),
  logoSize: z.number().min(50).max(300).default(120),
  logoAlignment: z.enum(["left", "center", "right"]).default("left"),
  logoBorder: z.boolean().default(false),
  storeName: z.string().default("LPG Nexus Distribution"),
  storeAddress: z.string().default("123 Business Street, City, State 12345"),
  storePhone: z.string().default("+91 9876543210"),
  storeEmail: z.string().default("info@lpgnexus.com"),
  storeWebsite: z.string().default("www.lpgnexus.com"),
  storeSlogan: z.string().optional(),
  headerTitle: z.string().default("REPORT"),
  customHeaderTitle: z.string().optional(),
  headerAlignment: z.enum(["left", "center", "right"]).default("center"),
  headerColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").default("#1c5bff"),
  headerBorder: z.boolean().default(false),
  showCustomerInfo: z.boolean().default(true),
  showAddress: z.boolean().default(true),
  showPhone: z.boolean().default(true),
  showProductCode: z.boolean().default(true),
  showPrices: z.boolean().default(true),
  showTaxSection: z.boolean().default(true),
  showSignatureArea: z.boolean().default(true),
  showNotesSection: z.boolean().default(true),
  showQRCode: z.boolean().default(false),
  tableColumns: z.array(z.string()).default(["Item", "Quantity", "Price", "Total"]),
  tableBorderThickness: z.number().min(0).max(5).default(1),
  tableHeaderBgColor: z.string().default("#1c5bff"),
  tableTextColor: z.string().default("#000000"),
  alternateRowShading: z.boolean().default(true),
  notesText: z.string().default("Terms and conditions apply."),
  customerSignatureLabel: z.string().default("Customer Signature"),
  authorizedSignatureLabel: z.string().default("Authorized Signature"),
  signatureLineStyle: z.enum(["line", "box", "solid", "dotted", "none"]).default("box"),
  signatureLineLength: z.number().min(50).max(500).default(200),
  signatureLineWidth: z.number().min(1).max(10).default(1),
  signatureLineColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid color format").default("#94a3b8"),
  signatureLineSpacing: z.number().min(0).max(30).default(8),
  qrCodeType: z.enum(["invoiceLink", "paymentLink", "businessCard"]).default("invoiceLink"),
  qrCodeSize: z.number().min(50).max(200).default(100),
  customLogo: z.string().nullable().optional(),
  customBarcode: z.string().nullable().optional(),
  customQRCode: z.string().nullable().optional(),
  barcodePosition: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]).default("bottom-right"),
  barcodeSize: z.number().min(50).max(200).default(100),
  qrCodePosition: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]).default("bottom-right"),
  notesLabel: z.string().default("Note:"),
  signatureHeight: z.number().min(30).max(150).default(60),
  pageMargins: z.object({
    top: z.number().default(20),
    bottom: z.number().default(20),
    left: z.number().default(20),
    right: z.number().default(20),
  }).default({ top: 20, bottom: 20, left: 20, right: 20 }),
  headerMargin: z.number().min(-50).max(50).default(0),
  footerMargin: z.number().min(-50).max(50).default(0),
  businessInfoMargin: z.number().min(-50).max(50).default(0),
  businessInfoAlignment: z.enum(["left", "center", "right"]).default("left"),
  logoMargin: z.number().min(-50).max(50).default(0),
  logoHorizontalMargin: z.number().min(-100).max(100).default(0),
  headerTitleMargin: z.number().min(-50).max(50).default(0),
  tableMargin: z.number().min(-50).max(50).default(0),
  tableAlignment: z.enum(["left", "center", "right"]).default("left"),
  notesMargin: z.number().min(-50).max(50).default(0),
  notesAlignment: z.enum(["left", "center", "right"]).default("left"),
  signatureMargin: z.number().min(-50).max(50).default(0),
  signatureAlignment: z.enum(["left", "center", "right"]).default("left"),
  footerAlignment: z.enum(["left", "center", "right"]).default("center"),
  barcodeMargin: z.number().min(-50).max(50).default(0),
  qrCodeMargin: z.number().min(-50).max(50).default(0),
  showLogo: z.boolean().default(true),
  showBusinessInfo: z.boolean().default(true),
  showHeaderTitle: z.boolean().default(true),
  showTable: z.boolean().default(true),
  showFooter: z.boolean().default(true),
  showBarcode: z.boolean().default(false),
  fontFamily: z.string().default("Inter"),
  fontSize: z.number().min(8).max(24).default(14),
  fontWeight: z.enum(["normal", "medium", "semibold", "bold"]).default("normal"),
  headerFontSize: z.number().min(16).max(72).default(36),
  headerFontWeight: z.enum(["normal", "medium", "semibold", "bold", "extrabold"]).default("bold"),
  tableFontSize: z.number().min(8).max(20).default(14),
  tableFontWeight: z.enum(["normal", "medium", "semibold", "bold"]).default("normal"),
});

type ReportDesignFormValues = z.infer<typeof reportDesignSchema>;

const themes = [
  { id: "light", name: "Light", colors: ["#ffffff", "#000000", "#1c5bff"] },
  { id: "dark", name: "Dark", colors: ["#1e293b", "#f1f5f9", "#60a5fa"] },
  { id: "colored", name: "Colored", colors: ["#ffffff", "#1e3a8a", "#3b82f6"] },
  { id: "minimal", name: "Minimal", colors: ["#ffffff", "#475569", "#000000"] },
  { id: "classic", name: "Classic", colors: ["#fef3c7", "#1e3a8a", "#92400e"] },
  { id: "bold", name: "Bold", colors: ["#fef08a", "#92400e", "#ea580c"] },
  { id: "modern", name: "Modern", colors: ["#ffffff", "#0f766e", "#14b8a6"] },
  { id: "rose", name: "Rose", colors: ["#ffffff", "#881337", "#e11d48"] },
];

const availableColumns = ["Item", "Quantity", "Unit Price", "Total", "Product Code", "Notes", "Tax %"];

export function ReportDesigningTab() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [barcodeFile, setBarcodeFile] = useState<File | null>(null);
  const [barcodePreview, setBarcodePreview] = useState<string | null>(null);
  const [qrCodeFile, setQrCodeFile] = useState<File | null>(null);
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [customColumnName, setCustomColumnName] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const qrCodeInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<ReportDesignFormValues>({
    resolver: zodResolver(reportDesignSchema),
    defaultValues: {
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
      headerTitle: "REPORT",
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
      tableColumns: ["Item", "Quantity", "Price", "Total"],
      tableBorderThickness: 1,
      tableHeaderBgColor: "#1c5bff",
      tableTextColor: "#000000",
      alternateRowShading: true,
      notesText: "Terms and conditions apply.",
      customerSignatureLabel: "Customer Signature",
      authorizedSignatureLabel: "Authorized Signature",
      signatureLineStyle: "box",
      signatureLineLength: 200,
      signatureLineWidth: 1,
      signatureLineColor: "#94a3b8",
      signatureLineSpacing: 8,
      qrCodeType: "invoiceLink",
      qrCodeSize: 100,
      qrCodePosition: "bottom-right",
      barcodePosition: "bottom-right",
      barcodeSize: 100,
      notesLabel: "Note:",
      signatureHeight: 60,
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
      qrCodeMargin: 0,
      showLogo: true,
      showBusinessInfo: true,
      showHeaderTitle: true,
      showTable: true,
      showFooter: true,
      showBarcode: false,
      fontFamily: "Inter",
      fontSize: 14,
      fontWeight: "normal",
      headerFontSize: 36,
      headerFontWeight: "bold",
      tableFontSize: 14,
      tableFontWeight: "normal",
    },
  });

  useEffect(() => {
    async function loadSavedDesign() {
      setIsLoading(true);
      try {
        const result = await getReportTemplateDesign();
        if (result.success && result.data) {
          const saved = result.data as any;
          form.reset(saved);
          if (saved.customLogo) {
            setLogoPreview(saved.customLogo);
          }
          if (saved.customBarcode) {
            setBarcodePreview(saved.customBarcode);
          }
          if (saved.customQRCode) {
            setQrCodePreview(saved.customQRCode);
          }
        }
      } catch (error) {
        console.error("Error loading saved design:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadSavedDesign();
  }, [form]);

  useEffect(() => {
    if (!isLoading) {
      const subscription = form.watch(() => {
        setHasUnsavedChanges(true);
      });
      return () => subscription.unsubscribe();
    }
  }, [form, isLoading]);

  // Handle browser navigation (refresh, close tab, etc.)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Handle Next.js router navigation
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (hasUnsavedChanges && !url.includes("/settings")) {
        setPendingNavigation(url);
        setShowUnsavedDialog(true);
        return false;
      }
      return true;
    };

    // Intercept link clicks
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href && hasUnsavedChanges) {
        const url = new URL(link.href);
        if (url.pathname !== window.location.pathname && !url.pathname.includes("/settings")) {
          e.preventDefault();
          setPendingNavigation(url.pathname);
          setShowUnsavedDialog(true);
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, [hasUnsavedChanges]);

  function handleDiscardChanges() {
    setHasUnsavedChanges(false);
    setShowUnsavedDialog(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
      setPendingNavigation(null);
    }
  }

  async function handleSaveAndContinue() {
    setShowUnsavedDialog(false);
    try {
      await onSubmit(form.getValues());
      if (pendingNavigation) {
        router.push(pendingNavigation);
        setPendingNavigation(null);
      }
    } catch (error) {
      // Error is already handled in onSubmit
      setShowUnsavedDialog(true); // Reopen dialog if save failed
    }
  }

  function handleCancelNavigation() {
    setShowUnsavedDialog(false);
    setPendingNavigation(null);
  }

  function handleLogoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setToast({ message: "Please select a JPG or PNG file", type: "error" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: "File size must be less than 5MB", type: "error" });
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
        form.setValue("customLogo", reader.result as string);
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemoveLogo() {
    setLogoPreview(null);
    setLogoFile(null);
    form.setValue("customLogo", null);
    if (logoInputRef.current) {
      logoInputRef.current.value = "";
    }
    setHasUnsavedChanges(true);
  }

  function handleBarcodeSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        setToast({ message: "Please select a JPG, PNG, or SVG file", type: "error" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: "File size must be less than 5MB", type: "error" });
        return;
      }

      setBarcodeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBarcodePreview(reader.result as string);
        form.setValue("customBarcode", reader.result as string);
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemoveBarcode() {
    setBarcodePreview(null);
    setBarcodeFile(null);
    form.setValue("customBarcode", null);
    if (barcodeInputRef.current) {
      barcodeInputRef.current.value = "";
    }
    setHasUnsavedChanges(true);
  }

  function handleQRCodeSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/svg+xml"];
      if (!validTypes.includes(file.type)) {
        setToast({ message: "Please select a JPG, PNG, or SVG file", type: "error" });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: "File size must be less than 5MB", type: "error" });
        return;
      }

      setQrCodeFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrCodePreview(reader.result as string);
        form.setValue("customQRCode", reader.result as string);
        setHasUnsavedChanges(true);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemoveQRCode() {
    setQrCodePreview(null);
    setQrCodeFile(null);
    form.setValue("customQRCode", null);
    if (qrCodeInputRef.current) {
      qrCodeInputRef.current.value = "";
    }
    setHasUnsavedChanges(true);
  }

  async function onSubmit(data: ReportDesignFormValues) {
    setIsSubmitting(true);
    try {
      const templateData = {
        ...data,
        customLogo: logoPreview || data.customLogo,
        customBarcode: barcodePreview || data.customBarcode,
        customQRCode: qrCodePreview || data.customQRCode,
      };

      const result = await saveReportTemplateDesign(templateData);

      if (result.success) {
        setToast({ message: "Your custom bill design has been saved successfully!", type: "success" });
        setHasUnsavedChanges(false);
        setTimeout(() => setToast(null), 5000);
      } else {
        setToast({ message: result.error || "Failed to save bill design", type: "error" });
      }
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : "Failed to save bill design",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    if (confirm("Are you sure you want to reset to default design? This will discard all your changes.")) {
      form.reset();
      setLogoPreview(null);
      setLogoFile(null);
      setBarcodePreview(null);
      setBarcodeFile(null);
      setQrCodePreview(null);
      setQrCodeFile(null);
      if (logoInputRef.current) {
        logoInputRef.current.value = "";
      }
      if (barcodeInputRef.current) {
        barcodeInputRef.current.value = "";
      }
      if (qrCodeInputRef.current) {
        qrCodeInputRef.current.value = "";
      }
      setHasUnsavedChanges(false);
    }
  }

  function handleExportTemplate() {
    try {
      const templateData = {
        ...form.getValues(),
        customLogo: logoPreview || form.getValues().customLogo,
        customBarcode: barcodePreview || form.getValues().customBarcode,
        customQRCode: qrCodePreview || form.getValues().customQRCode,
      };
      const jsonStr = JSON.stringify(templateData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bill-template-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setToast({ message: "Template exported successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast({ message: "Failed to export template", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }
  }

  function handleImportTemplate(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        form.reset(imported);
        if (imported.customLogo) {
          setLogoPreview(imported.customLogo);
        } else {
          setLogoPreview(null);
        }
        if (imported.customBarcode) {
          setBarcodePreview(imported.customBarcode);
        } else {
          setBarcodePreview(null);
        }
        if (imported.customQRCode) {
          setQrCodePreview(imported.customQRCode);
        } else {
          setQrCodePreview(null);
        }
        setHasUnsavedChanges(true);
        setToast({ message: "Template imported successfully!", type: "success" });
        setTimeout(() => setToast(null), 3000);
      } catch (error) {
        setToast({ message: "Failed to import template. Invalid file format.", type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = "";
  }

  const selectedTheme = themes.find((t) => t.id === form.watch("theme"));
  const isLandscape = form.watch("orientation") === "landscape";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2544d6] mx-auto mb-4" />
          <p className="text-sm text-slate-600">Loading your bill design...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            "fixed right-6 top-20 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all",
            toast.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          {toast.type === "success" ? (
            <Check className="h-5 w-5" />
          ) : (
            <X className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-auto text-current opacity-70 hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="rounded-xl border border-[#e5eaf4] bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-[#2544d6]" />
              <h2 className="text-xl font-semibold text-slate-900">Bill & Report Designer</h2>
            </div>
            <p className="text-sm text-slate-500">
              Customize your invoice, bills, and report layouts — applies only to your account.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPreviewOpen(true)}
              className="gap-2 rounded-xl"
            >
              <Eye className="h-4 w-4" />
              Preview All
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="gap-2 rounded-xl"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              disabled={isSubmitting || !hasUnsavedChanges}
              className="gap-2 rounded-xl bg-[#2544d6] hover:bg-[#1e3fb8]"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
        {hasUnsavedChanges && (
          <div className="mt-4 rounded-lg bg-orange-50 border border-orange-200 px-4 py-2">
            <p className="text-sm text-orange-800">You have unsaved changes</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left Sidebar - Design Components & Themes */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          {/* Design Components - Accordion */}
          <div className="rounded-xl border border-[#e5eaf4] bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Design Components</h3>
            <Accordion type="single" collapsible className="w-full">
              {/* Logo Component */}
              <AccordionItem value="logo" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Logo
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Show Logo</Label>
                    <Switch
                      checked={form.watch("showLogo")}
                      onCheckedChange={(checked) => form.setValue("showLogo", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Logo Position (Up/Down)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={form.watch("logoMargin") || 0}
                        onChange={(e) => form.setValue("logoMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("logoMargin") > 0 ? "+" : ""}{form.watch("logoMargin") || 0}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move logo up (-) or down (+) - Range: -50px to +50px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Logo Position (Left/Right)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-100"
                        max="100"
                        step="1"
                        value={form.watch("logoHorizontalMargin") || 0}
                        onChange={(e) => form.setValue("logoHorizontalMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-20 text-right">
                        {form.watch("logoHorizontalMargin") > 0 ? "+" : ""}{form.watch("logoHorizontalMargin") || 0}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move logo left (-) or right (+) - Range: -100px to +100px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Upload Logo</Label>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleLogoSelect}
                      className="hidden"
                      id="logo-upload-bill"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("logo-upload-bill")?.click()}
                        className="flex-1 gap-2 rounded-lg h-9"
                        size="sm"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </Button>
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveLogo}
                          className="gap-2 rounded-lg h-9"
                          size="sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {logoPreview && (
                      <div className="mt-2 p-2 border rounded-lg">
                        <img src={logoPreview} alt="Logo preview" className="max-h-16 mx-auto" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Logo Size</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="50"
                        max="300"
                        value={form.watch("logoSize")}
                        onChange={(e) => form.setValue("logoSize", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-12 text-right">
                        {form.watch("logoSize")}px
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Logo Alignment</Label>
                    <ToggleGroup
                      type="single"
                      value={form.watch("logoAlignment")}
                      onValueChange={(value) => {
                        if (value) form.setValue("logoAlignment", value as "left" | "center" | "right");
                      }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem value="left" aria-label="Left" className="rounded-lg">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" aria-label="Center" className="rounded-lg">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" aria-label="Right" className="rounded-lg">
                        <AlignJustify className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Logo Border</Label>
                    <Switch
                      checked={form.watch("logoBorder")}
                      onCheckedChange={(checked) => form.setValue("logoBorder", checked)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Business Info Component */}
              <AccordionItem value="businessInfo" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Business Info
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Show Business Info</Label>
                    <Switch
                      checked={form.watch("showBusinessInfo")}
                      onCheckedChange={(checked) => form.setValue("showBusinessInfo", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Business Info Position (Up/Down)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={form.watch("businessInfoMargin") || 0}
                        onChange={(e) => form.setValue("businessInfoMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("businessInfoMargin") > 0 ? "+" : ""}{form.watch("businessInfoMargin") || 0}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move business info up (-) or down (+) - Range: -50px to +50px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Text Alignment</Label>
                    <ToggleGroup
                      type="single"
                      value={form.watch("businessInfoAlignment")}
                      onValueChange={(value) => {
                        if (value) form.setValue("businessInfoAlignment", value as "left" | "center" | "right");
                      }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem value="left" aria-label="Left" className="rounded-lg">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" aria-label="Center" className="rounded-lg">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" aria-label="Right" className="rounded-lg">
                        <AlignJustify className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-xs text-slate-500">Align business info text left, center, or right</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Store Name</Label>
                    <Input
                      {...form.register("storeName")}
                      className="rounded-lg h-9 text-sm"
                      placeholder="Store Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Address</Label>
                    <Textarea
                      {...form.register("storeAddress")}
                      rows={2}
                      className="rounded-lg text-sm"
                      placeholder="Store Address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Phone</Label>
                    <Input
                      {...form.register("storePhone")}
                      className="rounded-lg h-9 text-sm"
                      placeholder="Phone Number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Email</Label>
                    <Input
                      {...form.register("storeEmail")}
                      type="email"
                      className="rounded-lg h-9 text-sm"
                      placeholder="Email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Website</Label>
                    <Input
                      {...form.register("storeWebsite")}
                      className="rounded-lg h-9 text-sm"
                      placeholder="Website"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Slogan (Optional)</Label>
                    <Input
                      {...form.register("storeSlogan")}
                      className="rounded-lg h-9 text-sm"
                      placeholder="Slogan"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Report Header Component */}
              <AccordionItem value="billHeader" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Report Header
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Show Header Title</Label>
                    <Switch
                      checked={form.watch("showHeaderTitle")}
                      onCheckedChange={(checked) => form.setValue("showHeaderTitle", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Header Title Position (Up/Down)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={form.watch("headerTitleMargin") || 0}
                        onChange={(e) => form.setValue("headerTitleMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("headerTitleMargin") > 0 ? "+" : ""}{form.watch("headerTitleMargin") || 0}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move header title up (-) or down (+) - Range: -50px to +50px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Header Title</Label>
                    <Select
                      value={form.watch("headerTitle")}
                      onValueChange={(value) => {
                        form.setValue("headerTitle", value);
                        if (value !== "CUSTOM") {
                          form.setValue("customHeaderTitle", "");
                        }
                      }}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REPORT">REPORT</SelectItem>
                        <SelectItem value="BILL">BILL</SelectItem>
                        <SelectItem value="RECEIPT">RECEIPT</SelectItem>
                        <SelectItem value="DELIVERY NOTE">DELIVERY NOTE</SelectItem>
                        <SelectItem value="QUOTATION">QUOTATION</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                    {form.watch("headerTitle") === "CUSTOM" && (
                      <Input
                        {...form.register("customHeaderTitle")}
                        className="rounded-lg h-9 text-sm mt-2"
                        placeholder="Enter custom header title"
                        onChange={(e) => {
                          form.setValue("customHeaderTitle", e.target.value);
                        }}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Header Style</Label>
                    <Select
                      value={form.watch("headerStyle")}
                      onValueChange={(value) => form.setValue("headerStyle", value as any)}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="boxed">Boxed</SelectItem>
                        <SelectItem value="underline">Underline</SelectItem>
                        <SelectItem value="topBorder">Top Border</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Header Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={form.watch("headerColor")}
                        onChange={(e) => form.setValue("headerColor", e.target.value)}
                        className="h-9 w-20 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={form.watch("headerColor")}
                        onChange={(e) => form.setValue("headerColor", e.target.value)}
                        className="rounded-lg h-9 text-sm flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Text Alignment</Label>
                    <ToggleGroup
                      type="single"
                      value={form.watch("headerAlignment")}
                      onValueChange={(value) => {
                        if (value) form.setValue("headerAlignment", value as "left" | "center" | "right");
                      }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem value="left" aria-label="Left" className="rounded-lg">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" aria-label="Center" className="rounded-lg">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" aria-label="Right" className="rounded-lg">
                        <AlignJustify className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Header Border</Label>
                    <Switch
                      checked={form.watch("headerBorder")}
                      onCheckedChange={(checked) => form.setValue("headerBorder", checked)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Table Layout Component */}
              <AccordionItem value="tableLayout" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Grid3x3 className="h-4 w-4" />
                    Table Layout
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Show Table</Label>
                    <Switch
                      checked={form.watch("showTable")}
                      onCheckedChange={(checked) => form.setValue("showTable", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Table Position (Up/Down)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={form.watch("tableMargin") || 0}
                        onChange={(e) => form.setValue("tableMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("tableMargin") > 0 ? "+" : ""}{form.watch("tableMargin") || 0}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move table up (-) or down (+) - Range: -50px to +50px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Table Alignment</Label>
                    <ToggleGroup
                      type="single"
                      value={form.watch("tableAlignment")}
                      onValueChange={(value) => {
                        if (value) form.setValue("tableAlignment", value as "left" | "center" | "right");
                      }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem value="left" aria-label="Left" className="rounded-lg">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" aria-label="Center" className="rounded-lg">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" aria-label="Right" className="rounded-lg">
                        <AlignJustify className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-xs text-slate-500">Align table left, center, or right</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Selected Columns</Label>
                    <div className="flex flex-wrap gap-2">
                      {form.watch("tableColumns").map((col) => (
                        <span
                          key={col}
                          className="inline-flex items-center gap-1 rounded-full bg-[#eef3ff] px-2 py-1 text-xs font-medium text-[#2544d6]"
                        >
                          {col}
                          <button
                            type="button"
                            onClick={() => {
                              const cols = form.watch("tableColumns").filter((c) => c !== col);
                              form.setValue("tableColumns", cols);
                            }}
                            className="hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <Select
                      onValueChange={(value) => {
                        const cols = form.watch("tableColumns");
                        if (!cols.includes(value)) {
                          form.setValue("tableColumns", [...cols, value]);
                        }
                      }}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm mt-2">
                        <SelectValue placeholder="Add column" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableColumns
                          .filter((col) => !form.watch("tableColumns").includes(col))
                          .map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={customColumnName}
                        onChange={(e) => setCustomColumnName(e.target.value)}
                        placeholder="Enter custom column name"
                        className="rounded-lg h-9 text-sm flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && customColumnName.trim()) {
                            const cols = form.watch("tableColumns");
                            if (!cols.includes(customColumnName.trim())) {
                              form.setValue("tableColumns", [...cols, customColumnName.trim()]);
                              setCustomColumnName("");
                            }
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (customColumnName.trim()) {
                            const cols = form.watch("tableColumns");
                            if (!cols.includes(customColumnName.trim())) {
                              form.setValue("tableColumns", [...cols, customColumnName.trim()]);
                              setCustomColumnName("");
                            }
                          }
                        }}
                        className="rounded-lg h-9 px-3"
                        disabled={!customColumnName.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Enter a custom column name and click Add</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Border Thickness</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="5"
                        value={form.watch("tableBorderThickness")}
                        onChange={(e) => form.setValue("tableBorderThickness", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-8 text-right">
                        {form.watch("tableBorderThickness")}px
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Header Background</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={form.watch("tableHeaderBgColor")}
                        onChange={(e) => form.setValue("tableHeaderBgColor", e.target.value)}
                        className="h-9 w-20 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={form.watch("tableHeaderBgColor")}
                        onChange={(e) => form.setValue("tableHeaderBgColor", e.target.value)}
                        className="rounded-lg h-9 text-sm flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Alternate Row Shading</Label>
                    <Switch
                      checked={form.watch("alternateRowShading")}
                      onCheckedChange={(checked) => form.setValue("alternateRowShading", checked)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Footer Section Component */}
              <AccordionItem value="footerSection" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <AlignLeft className="h-4 w-4" />
                    Footer Section
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Show Footer</Label>
                    <Switch
                      checked={form.watch("showFooter")}
                      onCheckedChange={(checked) => form.setValue("showFooter", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Footer Position (Up/Down)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={form.watch("footerMargin")}
                        onChange={(e) => form.setValue("footerMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("footerMargin") > 0 ? "+" : ""}{form.watch("footerMargin")}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move footer up (-) or down (+) - Range: -50px to +50px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Footer Alignment</Label>
                    <ToggleGroup
                      type="single"
                      value={form.watch("footerAlignment") || "center"}
                      onValueChange={(value) => {
                        if (value) form.setValue("footerAlignment", value as "left" | "center" | "right");
                      }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem value="left" aria-label="Left" className="rounded-lg">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" aria-label="Center" className="rounded-lg">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" aria-label="Right" className="rounded-lg">
                        <AlignJustify className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-xs text-slate-500">Align footer text left, center, or right</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Footer Text</Label>
                    <Textarea
                      {...form.register("footerText")}
                      rows={3}
                      className="rounded-lg text-sm"
                      placeholder="Thank you for your business!"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Notes Section Component */}
              <AccordionItem value="notesSection" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes Section
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Show Notes</Label>
                    <Switch
                      checked={form.watch("showNotesSection")}
                      onCheckedChange={(checked) => form.setValue("showNotesSection", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Notes Position (Up/Down)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={form.watch("notesMargin") || 0}
                        onChange={(e) => form.setValue("notesMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("notesMargin") > 0 ? "+" : ""}{form.watch("notesMargin") || 0}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move notes section up (-) or down (+) - Range: -50px to +50px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Notes Alignment</Label>
                    <ToggleGroup
                      type="single"
                      value={form.watch("notesAlignment")}
                      onValueChange={(value) => {
                        if (value) form.setValue("notesAlignment", value as "left" | "center" | "right");
                      }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem value="left" aria-label="Left" className="rounded-lg">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" aria-label="Center" className="rounded-lg">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" aria-label="Right" className="rounded-lg">
                        <AlignJustify className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-xs text-slate-500">Align notes text left, center, or right</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Notes Label</Label>
                    <Input
                      {...form.register("notesLabel")}
                      className="rounded-lg h-9 text-sm"
                      placeholder="Note:"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Notes Text</Label>
                    <Textarea
                      {...form.register("notesText")}
                      rows={3}
                      className="rounded-lg text-sm"
                      placeholder="Terms and conditions apply."
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Signature Component */}
              <AccordionItem value="signature" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileSignature className="h-4 w-4" />
                    Signature
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Show Signature Area</Label>
                    <Switch
                      checked={form.watch("showSignatureArea")}
                      onCheckedChange={(checked) => form.setValue("showSignatureArea", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Signature Position (Up/Down)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={form.watch("signatureMargin") || 0}
                        onChange={(e) => form.setValue("signatureMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("signatureMargin") > 0 ? "+" : ""}{form.watch("signatureMargin") || 0}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move signature section up (-) or down (+) - Range: -50px to +50px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Signature Alignment</Label>
                    <ToggleGroup
                      type="single"
                      value={form.watch("signatureAlignment")}
                      onValueChange={(value) => {
                        if (value) form.setValue("signatureAlignment", value as "left" | "center" | "right");
                      }}
                      className="grid grid-cols-3 gap-2"
                    >
                      <ToggleGroupItem value="left" aria-label="Left" className="rounded-lg">
                        <AlignLeft className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="center" aria-label="Center" className="rounded-lg">
                        <AlignCenter className="h-4 w-4" />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="right" aria-label="Right" className="rounded-lg">
                        <AlignJustify className="h-4 w-4" />
                      </ToggleGroupItem>
                    </ToggleGroup>
                    <p className="text-xs text-slate-500">Align signature area left, center, or right</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Customer Signature Label</Label>
                    <Input
                      {...form.register("customerSignatureLabel")}
                      className="rounded-lg h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Authorized Signature Label</Label>
                    <Input
                      {...form.register("authorizedSignatureLabel")}
                      className="rounded-lg h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Line Style</Label>
                    <Select
                      value={form.watch("signatureLineStyle")}
                      onValueChange={(value) => form.setValue("signatureLineStyle", value as any)}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Line</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="dotted">Dotted</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Line Length/Width</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="50"
                        max="500"
                        step="10"
                        value={form.watch("signatureLineLength") || 200}
                        onChange={(e) => form.setValue("signatureLineLength", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("signatureLineLength") || 200}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Adjust the length/width of the signature line</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Line Width</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={form.watch("signatureLineWidth") || 1}
                        onChange={(e) => form.setValue("signatureLineWidth", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-12 text-right">
                        {form.watch("signatureLineWidth") || 1}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Adjust the thickness of the signature line</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Line Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={form.watch("signatureLineColor") || "#94a3b8"}
                        onChange={(e) => form.setValue("signatureLineColor", e.target.value)}
                        className="h-9 w-20 rounded-lg cursor-pointer"
                      />
                      <Input
                        value={form.watch("signatureLineColor") || "#94a3b8"}
                        onChange={(e) => form.setValue("signatureLineColor", e.target.value)}
                        className="rounded-lg h-9 text-sm flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Line Spacing</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="30"
                        step="1"
                        value={form.watch("signatureLineSpacing") || 8}
                        onChange={(e) => form.setValue("signatureLineSpacing", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-12 text-right">
                        {form.watch("signatureLineSpacing") || 8}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Space between line and label text</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Signature Height</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="30"
                        max="150"
                        step="5"
                        value={form.watch("signatureHeight") || 60}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          form.setValue("signatureHeight", value, { shouldDirty: true, shouldValidate: true });
                        }}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-12 text-right">
                        {form.watch("signatureHeight") || 60}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Adjust the height of signature area (applies to box, solid, and dotted styles)</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Barcode Component */}
              <AccordionItem value="barcode" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    Barcode
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Show Barcode</Label>
                    <Switch
                      checked={form.watch("showBarcode")}
                      onCheckedChange={(checked) => form.setValue("showBarcode", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Barcode Position (Up/Down)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={form.watch("barcodeMargin") || 0}
                        onChange={(e) => form.setValue("barcodeMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("barcodeMargin") > 0 ? "+" : ""}{form.watch("barcodeMargin") || 0}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move barcode up (-) or down (+) - Range: -50px to +50px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Upload Barcode</Label>
                    <input
                      ref={barcodeInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleBarcodeSelect}
                      className="hidden"
                      id="barcode-upload"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("barcode-upload")?.click()}
                        className="flex-1 gap-2 rounded-lg h-9"
                        size="sm"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </Button>
                      {barcodePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveBarcode}
                          className="gap-2 rounded-lg h-9"
                          size="sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {barcodePreview && (
                      <div className="mt-2 p-2 border rounded-lg">
                        <img src={barcodePreview} alt="Barcode preview" className="max-h-16 mx-auto" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Barcode Position</Label>
                    <Select
                      value={form.watch("barcodePosition")}
                      onValueChange={(value) => form.setValue("barcodePosition", value as any)}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Choose where to place the barcode on the bill</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Barcode Size</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={form.watch("barcodeSize") || 100}
                        onChange={(e) => form.setValue("barcodeSize", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-12 text-right">
                        {form.watch("barcodeSize") || 100}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Adjust the size of the barcode</p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Font Component */}
              <AccordionItem value="font" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Font
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Font Family</Label>
                    <Select
                      value={form.watch("fontFamily")}
                      onValueChange={(value) => form.setValue("fontFamily", value)}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Body Font Size</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="8"
                        max="24"
                        step="1"
                        value={form.watch("fontSize") || 14}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          form.setValue("fontSize", value, { shouldDirty: true, shouldValidate: true });
                        }}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-12 text-right">
                        {form.watch("fontSize") || 14}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Adjust the base font size for body text</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Body Font Weight</Label>
                    <Select
                      value={form.watch("fontWeight")}
                      onValueChange={(value) => form.setValue("fontWeight", value as any)}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="semibold">Semibold</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Header Font Size</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="16"
                        max="72"
                        step="2"
                        value={form.watch("headerFontSize") || 36}
                        onChange={(e) => form.setValue("headerFontSize", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-12 text-right">
                        {form.watch("headerFontSize") || 36}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Adjust the font size for header title</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Header Font Weight</Label>
                    <Select
                      value={form.watch("headerFontWeight")}
                      onValueChange={(value) => form.setValue("headerFontWeight", value as any)}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="semibold">Semibold</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                        <SelectItem value="extrabold">Extra Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Table Font Size</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="8"
                        max="20"
                        step="1"
                        value={form.watch("tableFontSize") || 14}
                        onChange={(e) => form.setValue("tableFontSize", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-12 text-right">
                        {form.watch("tableFontSize") || 14}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Adjust the font size for table content</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Table Font Weight</Label>
                    <Select
                      value={form.watch("tableFontWeight")}
                      onValueChange={(value) => form.setValue("tableFontWeight", value as any)}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="semibold">Semibold</SelectItem>
                        <SelectItem value="bold">Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* QR Code Component */}
              <AccordionItem value="qrCode" className="border-none">
                <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Show QR Code</Label>
                    <Switch
                      checked={form.watch("showQRCode")}
                      onCheckedChange={(checked) => form.setValue("showQRCode", checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">QR Code Position (Up/Down)</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="-50"
                        max="50"
                        step="1"
                        value={form.watch("qrCodeMargin") || 0}
                        onChange={(e) => form.setValue("qrCodeMargin", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-16 text-right">
                        {form.watch("qrCodeMargin") > 0 ? "+" : ""}{form.watch("qrCodeMargin") || 0}px
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">Move QR code up (-) or down (+) - Range: -50px to +50px</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">Upload QR Code</Label>
                    <input
                      ref={qrCodeInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                      onChange={handleQRCodeSelect}
                      className="hidden"
                      id="qrcode-upload"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("qrcode-upload")?.click()}
                        className="flex-1 gap-2 rounded-lg h-9"
                        size="sm"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Upload
                      </Button>
                      {qrCodePreview && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleRemoveQRCode}
                          className="gap-2 rounded-lg h-9"
                          size="sm"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    {qrCodePreview && (
                      <div className="mt-2 p-2 border rounded-lg">
                        <img src={qrCodePreview} alt="QR Code preview" className="max-h-16 mx-auto" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">QR Code Type</Label>
                    <Select
                      value={form.watch("qrCodeType")}
                      onValueChange={(value) => form.setValue("qrCodeType", value as any)}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invoiceLink">Invoice Link</SelectItem>
                        <SelectItem value="paymentLink">Payment Link</SelectItem>
                        <SelectItem value="businessCard">Business Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">QR Code Size</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="50"
                        max="200"
                        value={form.watch("qrCodeSize")}
                        onChange={(e) => form.setValue("qrCodeSize", parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-xs text-slate-600 w-12 text-right">
                        {form.watch("qrCodeSize")}px
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-700">QR Code Position</Label>
                    <Select
                      value={form.watch("qrCodePosition") || "bottom-right"}
                      onValueChange={(value) => form.setValue("qrCodePosition", value as any)}
                    >
                      <SelectTrigger className="rounded-lg h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">Choose where to place the QR code on the bill</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* Theme Presets */}
          <div className="rounded-xl border border-[#e5eaf4] bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Theme Presets</h3>
            <div className="space-y-2">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    form.setValue("theme", theme.id as any);
                    form.setValue("primaryColor", theme.colors[2]);
                    form.setValue("backgroundColor", theme.colors[0]);
                    // Update header color to match theme
                    form.setValue("headerColor", theme.colors[2]);
                    // Update table header color and text color based on theme
                    form.setValue("tableHeaderBgColor", theme.colors[2]);
                    // For dark theme, use white text, otherwise use theme's text color
                    if (theme.id === "dark") {
                      form.setValue("tableTextColor", "#ffffff");
                    } else {
                      form.setValue("tableTextColor", theme.colors[1] === "#ffffff" ? "#000000" : theme.colors[1]);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition border",
                    form.watch("theme") === theme.id
                      ? "bg-[#eef3ff] text-[#2544d6] border-[#2544d6]"
                      : "bg-white text-slate-700 hover:bg-slate-50 border-slate-200",
                  )}
                >
                  <span>{theme.name}</span>
                  <div className="flex gap-1">
                    {theme.colors.map((color, idx) => (
                      <div
                        key={idx}
                        className="h-4 w-4 rounded border border-slate-200"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Import/Export */}
          <div className="rounded-xl border border-[#e5eaf4] bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Import / Export</h3>
            <div className="space-y-2">
              <input
                type="file"
                accept=".json"
                onChange={handleImportTemplate}
                className="hidden"
                id="import-template"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleExportTemplate}
                className="w-full gap-2 rounded-lg"
              >
                <Download className="h-4 w-4" />
                Export Template
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("import-template")?.click()}
                className="w-full gap-2 rounded-lg"
              >
                <Upload className="h-4 w-4" />
                Import Template
              </Button>
            </div>
          </div>
        </div>

        {/* Center - Live Preview */}
        <div className="col-span-12 lg:col-span-6">
          <div className="rounded-xl border border-[#e5eaf4] bg-white p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">Live Preview</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                  className="h-8 w-8"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-600 min-w-[60px] text-center">{zoomLevel}%</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setZoomLevel(Math.min(200, zoomLevel + 10))}
                  className="h-8 w-8"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div
              className="overflow-auto border-2 border-dashed border-slate-300 bg-slate-50 p-8 flex items-start justify-center"
              style={{ maxHeight: "800px" }}
            >
              <div className="flex justify-center w-full">
                <ReportPreview
                  design={form.watch()}
                  theme={selectedTheme}
                  logo={logoPreview}
                  barcode={barcodePreview}
                  qrCode={qrCodePreview}
                  zoom={zoomLevel}
                  isLandscape={isLandscape}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - General Settings */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          {/* General Layout */}
          <div className="rounded-xl border border-[#e5eaf4] bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">General Layout</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">Page Size</Label>
                <Select
                  value={form.watch("pageSize")}
                  onValueChange={(value) => form.setValue("pageSize", value as any)}
                >
                  <SelectTrigger className="rounded-lg h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                    <SelectItem value="POS">POS</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">Orientation</Label>
                <Select
                  value={form.watch("orientation")}
                  onValueChange={(value) => form.setValue("orientation", value as any)}
                >
                  <SelectTrigger className="rounded-lg h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">Header Position (Up/Down)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={form.watch("headerMargin")}
                    onChange={(e) => form.setValue("headerMargin", parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-slate-600 w-16 text-right">
                    {form.watch("headerMargin") > 0 ? "+" : ""}{form.watch("headerMargin")}px
                  </span>
                </div>
                <p className="text-xs text-slate-500">Move header up (-) or down (+) - Range: -50px to +50px</p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-slate-700">Footer Position (Up/Down)</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={form.watch("footerMargin")}
                    onChange={(e) => form.setValue("footerMargin", parseInt(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-xs text-slate-600 w-16 text-right">
                    {form.watch("footerMargin") > 0 ? "+" : ""}{form.watch("footerMargin")}px
                  </span>
                </div>
                <p className="text-xs text-slate-500">Move footer up (-) or down (+) - Range: -50px to +50px</p>
              </div>
            </div>
          </div>

          {/* Section Visibility */}
          <div className="rounded-xl border border-[#e5eaf4] bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Section Visibility</h3>
            <div className="space-y-3">
              {[
                { key: "showLogo", label: "Logo" },
                { key: "showBusinessInfo", label: "Business Info" },
                { key: "showHeaderTitle", label: "Header Title" },
                { key: "showBarcode", label: "Barcode" },
                { key: "showCustomerInfo", label: "Customer Info" },
                { key: "showAddress", label: "Address" },
                { key: "showPhone", label: "Phone Number" },
                { key: "showTable", label: "Table" },
                { key: "showProductCode", label: "Product Code" },
                { key: "showPrices", label: "Prices" },
                { key: "showTaxSection", label: "Tax Section" },
                { key: "showNotesSection", label: "Notes" },
                { key: "showSignatureArea", label: "Signature Area" },
                { key: "showFooter", label: "Footer" },
                { key: "showQRCode", label: "QR Code" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700 cursor-pointer">{label}</Label>
                  <Switch
                    checked={form.watch(key as any)}
                    onCheckedChange={(checked) => form.setValue(key as any, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Complete Bill Preview</DialogTitle>
            <DialogDescription>Full preview of your bill design - scroll to see all sections</DialogDescription>
          </DialogHeader>
          <div className="p-8 bg-slate-50 flex items-center justify-center min-h-[600px]">
            <ReportPreview
              design={form.watch()}
              theme={selectedTheme}
              logo={logoPreview}
              barcode={barcodePreview}
              qrCode={qrCodePreview}
              zoom={90}
              isLandscape={isLandscape}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes to your bill template. Do you want to save your changes before leaving this page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardChanges}
              className="bg-slate-200 text-slate-900 hover:bg-slate-300"
            >
              Discard Changes
            </AlertDialogAction>
            <AlertDialogAction onClick={handleSaveAndContinue} className="bg-blue-600 hover:bg-blue-700">
              Save & Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Bill Preview Component
function ReportPreview({
  design,
  theme,
  logo,
  barcode,
  qrCode,
  zoom,
  isLandscape,
}: {
  design: ReportDesignFormValues;
  theme?: (typeof themes)[number];
  logo: string | null;
  barcode: string | null;
  qrCode: string | null;
  zoom: number;
  isLandscape: boolean;
}) {
  const primaryColor = design.primaryColor || "#1c5bff";
  const bgColor = design.backgroundColor || "#ffffff";
  const logoAlign = design.logoAlignment || "left";
  const businessInfoAlign = design.businessInfoAlignment || "left";
  
  // Font styles
  const fontFamily = design.fontFamily || "Inter";
  const fontSize = design.fontSize || 14;
  const fontWeight = design.fontWeight || "normal";
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
  const headerTextColor = "#ffffff"; // Always white for header text on colored background
  const bodyTextColor = design.theme === "dark" ? "#ffffff" : "#000000";
  
  // Signature line color - use primary color if it's the default gray, otherwise use custom color
  const defaultSignatureLineColor = "#94a3b8";
  const signatureLineColor = (design.signatureLineColor === defaultSignatureLineColor || !design.signatureLineColor) 
    ? primaryColor 
    : design.signatureLineColor;
  
  // Get theme colors for alternate row shading - use theme colors based on selected theme
  let alternateRowBg = "#ffffff"; // Default white
  let rowBg = "#ffffff"; // Default white
  
  // For classic and bold themes, fill all rows with the theme color
  if (design.theme === "classic") {
    alternateRowBg = "#fef3c7"; // Light beige for all rows
    rowBg = "#fef3c7"; // Light beige for all rows
  } else if (design.theme === "bold") {
    alternateRowBg = "#fef08a"; // Light yellow for all rows
    rowBg = "#fef08a"; // Light yellow for all rows
  } else if (!design.alternateRowShading) {
    // If alternate row shading is disabled, both rows are white
    alternateRowBg = "#ffffff";
    rowBg = "#ffffff";
  } else {
    // Apply theme-based colors when shading is enabled
    if (design.theme === "dark") {
      alternateRowBg = "#334155"; // Dark gray for alternate rows
      rowBg = "#1e293b"; // Darker gray for regular rows
    } else if (design.theme === "colored") {
      alternateRowBg = "#eff6ff"; // Light blue for alternate rows
      rowBg = "#ffffff"; // White for regular rows
    } else if (design.theme === "minimal") {
      alternateRowBg = "#f8fafc"; // Very light gray for alternate rows
      rowBg = "#ffffff"; // White for regular rows
    } else if (design.theme === "modern") {
      alternateRowBg = "#f0fdfa"; // Light teal for alternate rows
      rowBg = "#ffffff"; // White for regular rows
    } else {
      // Light theme - subtle gray shading
      alternateRowBg = "#f8fafc"; // Very light gray for alternate rows
      rowBg = "#ffffff"; // White for regular rows
    }
  }

  return (
    <div
      className="bg-white shadow-lg mx-auto"
      style={{
        width: isLandscape ? "297mm" : "210mm",
        minHeight: isLandscape ? "210mm" : "297mm",
        transform: `scale(${zoom / 100})`,
        transformOrigin: "top center",
        padding: `${design.pageMargins?.top || 20}mm ${design.pageMargins?.right || 20}mm ${design.pageMargins?.bottom || 20}mm ${design.pageMargins?.left || 20}mm`,
        backgroundColor: bgColor,
        fontFamily: fontFamily,
        fontSize: `${fontSize}px`,
        fontWeight: getFontWeight(fontWeight),
      }}
    >
      {/* Header with Logo and Business Info */}
      <div className="mb-8 relative" style={{ marginTop: `${design.headerMargin || 0}px` }}>
        {/* Logo and Business Info Side-by-Side Layout */}
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
                <p className="font-semibold" style={{ color: bodyTextColor, fontSize: `${fontSize * 1.286}px` }}>{design.storeName}</p>
                <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>{design.storeAddress}</p>
                {design.showPhone && <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>{design.storePhone}</p>}
                <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>{design.storeEmail}</p>
                {design.storeWebsite && <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>{design.storeWebsite}</p>}
                {design.storeSlogan && <p className="italic mt-1" style={{ color: bodyTextColor, fontSize: `${fontSize}px`, opacity: 0.8 }}>{design.storeSlogan}</p>}
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
        {design.showQRCode && (design.qrCodePosition === "top-left" || design.qrCodePosition === "top-right") && (
          <div
            className={cn(
              "absolute z-10",
              design.qrCodePosition === "top-left" && "left-0 top-0",
              design.qrCodePosition === "top-right" && "right-0 top-0"
            )}
          >
            {qrCode ? (
              <img
                src={qrCode}
                alt="QR Code"
                className="object-contain"
                style={{ 
                  width: `${design.qrCodeSize}px`, 
                  height: `${design.qrCodeSize}px`
                }}
              />
            ) : (
              <div
                className="bg-slate-200 p-2 rounded"
                style={{ width: `${design.qrCodeSize}px`, height: `${design.qrCodeSize}px` }}
              >
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  QR Code
                </div>
              </div>
            )}
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
                : (design.headerTitle || "REPORT")}
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
              <span className="font-semibold">Invoice #:</span> INV-2025-001
            </p>
            <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>
              <span className="font-semibold">Date:</span> December 9, 2025
            </p>
          </div>
          {design.showCustomerInfo && (
            <div>
              <p className="mb-1" style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>
                <span className="font-semibold">Customer:</span> John Doe
              </p>
              {design.showPhone && (
                <p style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>
                  <span className="font-semibold">Phone:</span> +91 9876543210
                </p>
              )}
              {design.showAddress && (
                <p className="mt-1" style={{ color: bodyTextColor, fontSize: `${fontSize}px` }}>
                  456 Customer Ave, City, State 67890
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
          <table className="w-full" style={{ borderWidth: `${design.tableBorderThickness}px` }}>
          <thead>
            <tr style={{ backgroundColor: design.tableHeaderBgColor || primaryColor, color: headerTextColor }}>
              {design.tableColumns.map((col) => (
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
            {[1, 2].map((row) => {
              const isEvenRow = row % 2 === 0;
              // For classic and bold themes, use the same color for all rows
              // For other themes, use alternate row shading if enabled
              const rowBgColor = (design.theme === "classic" || design.theme === "bold")
                ? rowBg // Use same color for all rows
                : (design.alternateRowShading && isEvenRow ? alternateRowBg : rowBg);
              return (
              <tr
                key={row}
                style={{
                  backgroundColor: rowBgColor,
                }}
              >
                <td className={cn(
                  "px-4 py-3 text-sm border",
                  design.tableAlignment === "left" && "text-left",
                  design.tableAlignment === "center" && "text-center",
                  design.tableAlignment === "right" && "text-right"
                )} style={{ borderWidth: `${design.tableBorderThickness}px`, color: textColor, borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0" }}>
                  {design.showProductCode && "["}
                  CYL-00{row}
                  {design.showProductCode && "]"} 19kg LPG Cylinder
                </td>
                <td className={cn(
                  "px-4 py-3 text-sm border",
                  design.tableAlignment === "left" && "text-left",
                  design.tableAlignment === "center" && "text-center",
                  design.tableAlignment === "right" && "text-right"
                )} style={{ borderWidth: `${design.tableBorderThickness}px`, color: textColor, borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0" }}>
                  {row === 1 ? 2 : 1}
                </td>
                {design.showPrices && (
                  <>
                    <td className={cn(
                      "px-4 py-3 text-sm border",
                      design.tableAlignment === "left" && "text-left",
                      design.tableAlignment === "center" && "text-center",
                      design.tableAlignment === "right" && "text-right"
                    )} style={{ borderWidth: `${design.tableBorderThickness}px`, color: textColor, borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0" }}>
                      ₹850.00
                    </td>
                    <td className={cn(
                      "px-4 py-3 text-sm border font-semibold",
                      design.tableAlignment === "left" && "text-left",
                      design.tableAlignment === "center" && "text-center",
                      design.tableAlignment === "right" && "text-right"
                    )} style={{ borderWidth: `${design.tableBorderThickness}px`, color: textColor, borderColor: design.theme === "dark" ? "#475569" : "#e2e8f0" }}>
                      ₹{row === 1 ? "1,700.00" : "850.00"}
                    </td>
                  </>
                )}
              </tr>
            );
            })}
          </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mb-6">
        {design.showPrices && (
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between" style={{ color: textColor, fontSize: `${fontSize}px` }}>
                <span>Subtotal:</span>
                <span>₹2,350.00</span>
              </div>
              {design.showTaxSection && (
                <div className="flex justify-between" style={{ color: textColor, fontSize: `${fontSize}px` }}>
                  <span>Tax (18%):</span>
                  <span>₹423.00</span>
                </div>
              )}
              <div
                className="h-px my-2"
                style={{ backgroundColor: primaryColor }}
              />
              <div className="flex justify-between font-bold text-lg" style={{ color: textColor }}>
                <span>Total:</span>
                <span>₹2,773.00</span>
              </div>
            </div>
          </div>
        )}
      </div>

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
          <p className="font-semibold mb-1" style={{ color: textColor, fontSize: `${fontSize}px` }}>{design.notesLabel || "Note:"}</p>
          <p style={{ color: textColor, fontSize: `${fontSize}px` }}>{design.notesText}</p>
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
        {design.showQRCode && (design.qrCodePosition === "bottom-left" || design.qrCodePosition === "bottom-right") && (
          <div
            className={cn(
              "absolute z-10",
              design.qrCodePosition === "bottom-left" && "left-0 bottom-0",
              design.qrCodePosition === "bottom-right" && "right-0 bottom-0"
            )}
          >
            {qrCode ? (
              <img
                src={qrCode}
                alt="QR Code"
                className="object-contain"
                style={{ 
                  width: `${design.qrCodeSize}px`, 
                  height: `${design.qrCodeSize}px`
                }}
              />
            ) : (
              <div
                className="bg-slate-200 p-2 rounded"
                style={{ width: `${design.qrCodeSize}px`, height: `${design.qrCodeSize}px` }}
              >
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                  QR Code
                </div>
              </div>
            )}
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
          {design.footerText}
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
            {/* Show both fields for center, show one field for left/right */}
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
                  <p className="text-xs text-center" style={{ color: textColor }}>{design.customerSignatureLabel}</p>
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
                  <p className="text-xs text-center" style={{ color: textColor }}>{design.authorizedSignatureLabel}</p>
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
                    {design.signatureAlignment === "left" ? design.customerSignatureLabel : design.authorizedSignatureLabel}
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
