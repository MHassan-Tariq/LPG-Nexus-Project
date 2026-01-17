import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/jwt";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { teamProfile: true }
    });

    return NextResponse.json({ teamProfile: dbUser?.teamProfile || {} });
  } catch (error) {
    console.error("Error fetching team profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { teamProfile } = body;

    if (!teamProfile) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.userId },
      data: { teamProfile },
      select: { teamProfile: true }
    });

    return NextResponse.json({ success: true, teamProfile: updatedUser.teamProfile });
  } catch (error: any) {
    console.error("CRITICAL: Error updating team profile:", error);
    
    // Better Prisma error detection
    const errorMessage = error?.message || String(error);
    const isPrismaError = errorMessage.includes('prisma') || errorMessage.includes('invocation');
    const isPayloadTooLarge = errorMessage.includes('Payload Too Large') || errorMessage.includes('413');
    
    return NextResponse.json({ 
      error: isPrismaError ? "Database Schema Sync Error" : (isPayloadTooLarge ? "Image Too Large" : "Internal Server Error"), 
      details: errorMessage,
      tip: isPrismaError 
        ? "The database schema might be out of sync. Please RESTART YOUR DEV SERVER and run 'npx prisma generate'." 
        : (isPayloadTooLarge ? "Try uploading smaller profile images (under 1MB)." : "Check server logs for details.")
    }, { status: 500 });
  }
}

// Ensure high payload limit for images
export const maxDuration = 60; // 60 seconds
export const dynamic = "force-dynamic";
