"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function getBillTemplateDesign() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { billTemplateDesign: true },
    });

    return user?.billTemplateDesign as any || null;
  } catch (error: any) {
    if (error?.digest?.includes('DYNAMIC') || error?.message?.includes('dynamic') || error?.message?.includes('bailout')) {
      throw error;
    }
    console.error("Error fetching bill template design:", error);
    return null;
  }
}

