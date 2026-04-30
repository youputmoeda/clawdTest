import { NextResponse } from "next/server";
import { z } from "zod";
import { generateInvestmentReport } from "@/lib/investments/reports/generate-report";
import { appendReportHistory } from "@/lib/investments/reports/history";

const schema = z.object({
  session: z.enum(["europe-open", "us-open"]).default("europe-open"),
  saveHistory: z.coerce.boolean().default(true),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = searchParams.get("session") || "europe-open";
  const saveHistory = searchParams.get("saveHistory") ?? "true";
  const parsed = schema.parse({ session, saveHistory });
  const report = await generateInvestmentReport(parsed.session);
  const history = parsed.saveHistory ? await appendReportHistory(report) : undefined;
  return NextResponse.json({ ...report, historyCount: history?.length });
}

export async function POST(req: Request) {
  const body = schema.parse(await req.json().catch(() => ({})));
  const report = await generateInvestmentReport(body.session);
  const history = body.saveHistory ? await appendReportHistory(report) : undefined;
  return NextResponse.json({ ...report, historyCount: history?.length });
}
