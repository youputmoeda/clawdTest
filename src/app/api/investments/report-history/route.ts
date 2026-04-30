import { NextResponse } from "next/server";
import { normalisePersonId } from "@/lib/investments/people";
import { clearReportHistory, loadReportHistory } from "@/lib/investments/reports/history";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = normalisePersonId(searchParams.get("personId"));
  return NextResponse.json({ personId, history: await loadReportHistory(personId) });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = normalisePersonId(searchParams.get("personId"));
  await clearReportHistory(personId);
  return NextResponse.json({ personId, history: [] });
}
