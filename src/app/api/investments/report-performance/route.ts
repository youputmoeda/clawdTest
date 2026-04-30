import { NextResponse } from "next/server";
import { evaluateReportPerformance } from "@/lib/investments/reports/history";

export async function GET() {
  return NextResponse.json({ performance: await evaluateReportPerformance() });
}
