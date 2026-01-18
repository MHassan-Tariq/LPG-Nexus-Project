import { SuperAdminResetAccessCode } from "@/components/super-admin/super-admin-reset-access-code";
import { Suspense } from "react";

export default function ResetAccessCodePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuperAdminResetAccessCode />
    </Suspense>
  );
}
