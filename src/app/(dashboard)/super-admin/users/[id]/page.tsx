import { UserAccountView } from "@/components/super-admin/user-account-view";
import { enforcePagePermission } from "@/lib/permission-check";

interface UserAccountPageProps {
  params: {
    id: string;
  };
}

export default async function UserAccountPage({ params }: UserAccountPageProps) {
  await enforcePagePermission("/super-admin");
  
  return <UserAccountView userId={params.id} />;
}

