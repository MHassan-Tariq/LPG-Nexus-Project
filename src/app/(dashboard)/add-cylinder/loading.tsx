import { Loader2 } from "lucide-react";

export default function CylinderLoading() {
  return (
    <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      <p className="text-sm font-medium text-slate-500">Loading cylinder logistics...</p>
    </div>
  );
}
