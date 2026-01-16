import { formatDistanceToNow } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Wrench, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TransactionItem = {
  id: string;
  type: "ISSUE" | "RETURN" | "MAINTENANCE" | "INSPECTION";
  recordedAt: Date;
  cylinder: {
    serialNumber: string;
  };
  customer: {
    name: string | null;
  } | null;
  notes: string | null;
};

const iconByType: Record<TransactionItem["type"], JSX.Element> = {
  ISSUE: <ArrowUpRight className="h-4 w-4 text-emerald-500" />,
  RETURN: <ArrowDownRight className="h-4 w-4 text-sky-500" />,
  MAINTENANCE: <Wrench className="h-4 w-4 text-amber-500" />,
  INSPECTION: <ClipboardCheck className="h-4 w-4 text-indigo-500" />,
};

export function TransactionTimeline({ items }: { items: TransactionItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Movement Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <div className="mt-1">{iconByType[item.type]}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between text-sm font-medium text-foreground">
                <span>{item.cylinder.serialNumber}</span>
                <Badge variant="outline">{item.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {item.customer?.name ?? "Warehouse"} ·{" "}
                {formatDistanceToNow(item.recordedAt, { addSuffix: true })}
              </p>
              {item.notes ? (
                <p className="text-xs text-muted-foreground/80">{item.notes}</p>
              ) : null}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

