import type { BillStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const classes: Record<BillStatus, { bg: string; text: string }> = {
  PAID: { bg: "bg-emerald-50 text-emerald-700 border-emerald-100", text: "Paid" },
  PARTIALLY_PAID: { bg: "bg-amber-50 text-amber-700 border-amber-100", text: "Partially Paid" },
  NOT_PAID: { bg: "bg-rose-50 text-rose-700 border-rose-100", text: "Not Paid" },
};

export function BillStatusBadge({ status }: { status: BillStatus }) {
  const styles = classes[status];
  return (
    <span 
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold", 
        styles.bg,
        // Remove hover effects by matching base styles
        status === "PAID" && "hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100",
        status === "PARTIALLY_PAID" && "hover:bg-amber-50 hover:text-amber-700 hover:border-amber-100",
        status === "NOT_PAID" && "hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100",
      )}
    >
      {styles.text}
    </span>
  );
}

