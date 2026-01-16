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
  } catch (error) {
    console.error("Error fetching bill template design:", error);
    return null;
  }
}

