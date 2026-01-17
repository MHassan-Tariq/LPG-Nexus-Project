export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";

import { getReportsData } from "../get-reports-data";
// Core utilities
import { createErrorResponse } from "@/core/api/api-errors";
import { successResponse } from "@/core/api/api-response";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get("startDate") || "";
    const endDateParam = searchParams.get("endDate") || "";
    const filterType = searchParams.get("filterType") || "";
    const month = searchParams.get("month") || "";

    const data = await getReportsData(startDateParam, endDateParam, filterType, month);

    return successResponse(data);
  } catch (error) {
    console.error("Error fetching reports data:", error);
    return createErrorResponse("Failed to fetch reports data", 500);
  }
}
