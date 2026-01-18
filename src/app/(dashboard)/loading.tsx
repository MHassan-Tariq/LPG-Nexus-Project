import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center bg-transparent">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-blue-100 opacity-75"></div>
          <Loader2 className="relative h-12 w-12 animate-spin text-blue-600" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">Loading Page</h3>
          <p className="text-sm text-slate-500">Please wait while we prepare your view...</p>
        </div>
      </div>
    </div>
  );
}
