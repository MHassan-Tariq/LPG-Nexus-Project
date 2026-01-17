export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// Core utilities
import { createErrorResponse } from "@/core/api/api-errors";
import { successResponse, createdResponse } from "@/core/api/api-response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module");
    const userId = searchParams.get("userId");
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {};
    
    if (module) {
      where.module = module;
    }
    
    if (userId) {
      where.userId = userId;
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return successResponse({ logs });
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    return createErrorResponse(
      error?.message || "Internal server error",
      500
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, action, module, details, ipAddress, userAgent } = body;

    if (!action) {
      return createErrorResponse("Action is required", 400);
    }

    const log = await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        module: module || null,
        details: details || null,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });

    return createdResponse({ log });
  } catch (error) {
    console.error("Error creating activity log:", error);
    return createErrorResponse("Internal server error", 500);
  }
}

