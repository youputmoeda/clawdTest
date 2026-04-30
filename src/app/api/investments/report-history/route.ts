import { NextResponse } from "next/server";
import { loadReportHistory } from "@/lib/investments/reports/history";

export async function GET() {
  return NextResponse.json({ history: await loadReportHistory() });
}
