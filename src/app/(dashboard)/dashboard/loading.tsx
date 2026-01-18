import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-[80vh] w-full items-center justify-center bg-[#f5f7fb]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#1c5bff]/10 opacity-75"></div>
          <Loader2 className="relative h-10 w-10 animate-spin text-[#1c5bff]" strokeWidth={2} />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-slate-800">Hang tight!</h3>
          <p className="text-xs text-slate-400">Loading your dashboard insights...</p>
        </div>
      </div>
    </div>
  );
}
