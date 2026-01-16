import { format } from "date-fns";
import { AlertTriangle, Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type MaintenanceItem = {
  id: string;
  serialNumber: string;
  location: string;
  nextInspection: Date | null;
  status: string;
};

interface MaintenanceListProps {
  items: MaintenanceItem[];
}

export function MaintenanceList({ items }: MaintenanceListProps) {
  return (
    <Card id="logistics">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium">Upcoming Maintenance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cylinders requiring attention within 30 days.
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Wrench className="h-3 w-3" /> {items.length}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scheduled inspections this month.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{item.serialNumber}</p>
                <p className="text-xs text-muted-foreground">{item.location}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                {item.nextInspection ? format(item.nextInspection, "PP") : "Schedule"}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

