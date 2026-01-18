import { DashboardTopbar } from "./topbar";
import { getSoftwareName, getFullUserData } from "@/lib/dashboard-data";

export async function DashboardTopbarWrapper() {
  const [softwareName, user] = await Promise.all([
    getSoftwareName(),
    getFullUserData(),
  ]);

  return <DashboardTopbar userData={user} softwareName={softwareName} />;
}

