import { PaymentEventType } from "@prisma/client";
import { cn } from "@/lib/utils";

const styles: Record<
  PaymentEventType,
  { className: string; label: string }
> = {
  BILL_GENERATED: { className: "bg-green-100 text-green-700 border border-green-200", label: "Bill Generated" },
  BILL_UPDATED: { className: "bg-[#e6f2ff] text-[#0b4a8f]", label: "Bill Updated" },
  BILL_DELETED: { className: "bg-[#ffe7e7] text-[#a01111]", label: "Bill Deleted" },
  PAYMENT_RECEIVED: { className: "bg-[#0f172a] text-white", label: "Payment Received" },
  PARTIAL_PAYMENT: { className: "bg-[#fff4db] text-[#8a5300]", label: "Partial Payment" },
  INVOICE_GENERATED: { className: "bg-emerald-100 text-emerald-700 border border-emerald-200", label: "Invoice Generated" },
  INVOICE_DOWNLOADED: { className: "bg-blue-100 text-blue-700 border border-blue-200", label: "Invoice Downloaded" },
  INVOICE_DELETED: { className: "bg-rose-100 text-rose-700 border border-rose-200", label: "Invoice Deleted" },
};

export function PaymentEventBadge({ type }: { type: PaymentEventType }) {
  const style = styles[type];
  
  // Fallback for unknown event types
  if (!style) {
    return (
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm whitespace-nowrap bg-gray-100 text-gray-700">
        {type}
      </span>
    );
  }
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold shadow-sm whitespace-nowrap",
        style.className,
        // Remove hover effects by matching base styles
        type === "BILL_GENERATED" && "hover:bg-green-100 hover:text-green-700 hover:border-green-200",
        type === "BILL_UPDATED" && "hover:bg-[#e6f2ff] hover:text-[#0b4a8f]",
        type === "BILL_DELETED" && "hover:bg-[#ffe7e7] hover:text-[#a01111]",
        type === "PAYMENT_RECEIVED" && "hover:bg-[#0f172a] hover:text-white",
        type === "PARTIAL_PAYMENT" && "hover:bg-[#fff4db] hover:text-[#8a5300]",
        type === "INVOICE_GENERATED" && "hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-200",
        type === "INVOICE_DOWNLOADED" && "hover:bg-blue-100 hover:text-blue-700 hover:border-blue-200",
        type === "INVOICE_DELETED" && "hover:bg-rose-100 hover:text-rose-700 hover:border-rose-200",
      )}
    >
      {style.label}
    </span>
  );
}

