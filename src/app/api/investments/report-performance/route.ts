import { NextResponse } from "next/server";
import { normalisePersonId } from "@/lib/investments/people";
import { evaluateReportPerformance } from "@/lib/investments/reports/history";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = normalisePersonId(searchParams.get("personId"));
  return NextResponse.json({ personId, performance: await evaluateReportPerformance(personId) });
}
