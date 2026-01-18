import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/profile-form";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export default async function ProfilePage() {
  // Get the current logged-in user from JWT
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Fetch the full user data from database
  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId },
  });

  if (!user) {
    return (
      <div className="rounded-[32px] border border-[#e5eaf4] bg-white p-8 shadow-none">
        <p className="text-sm text-slate-600">User not found. Please log in again.</p>
      </div>
    );
  }

  return <ProfileForm initialData={user} />;
}

