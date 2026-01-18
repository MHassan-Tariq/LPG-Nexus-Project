export const dynamic = "force-dynamic";
export const revalidate = 0;

import { TeamClientForm } from "@/components/team/team-client-form";
import { Users } from "lucide-react";

export default async function TeamPage() {
  return (
    <>
      <div className="rounded-[24px] border border-transparent px-1">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3ff]">
            <Users className="h-5 w-5 text-[#2544d6]" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Team Information</h1>
            <p className="text-sm text-slate-500">Your company & team details</p>
          </div>
        </div>
      </div>

      <TeamClientForm />
    </>
  );
}
