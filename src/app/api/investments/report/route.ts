import { NextResponse } from "next/server";
import { z } from "zod";
import { normalisePersonId } from "@/lib/investments/people";
import { generateInvestmentReport } from "@/lib/investments/reports/generate-report";
import { appendReportHistory } from "@/lib/investments/reports/history";

const boolish = z.preprocess((value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(v)) return true;
    if (["false", "0", "no", "off", ""].includes(v)) return false;
  }
  return value;
}, z.boolean());

const schema = z.object({
  session: z.enum(["europe-open", "us-open"]).default("europe-open"),
  saveHistory: boolish.default(true),
  personId: z.string().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parsed = schema.parse({
    session: searchParams.get("session") || "europe-open",
    saveHistory: searchParams.get("saveHistory") ?? "true",
    personId: normalisePersonId(searchParams.get("personId")),
  });
  const report = await generateInvestmentReport(parsed.session, parsed.personId);
  const history = parsed.saveHistory ? await appendReportHistory(report, parsed.personId) : undefined;
  return NextResponse.json({ ...report, personId: parsed.personId, historyCount: history?.length });
}

export async function POST(req: Request) {
  const body = schema.parse(await req.json().catch(() => ({})));
  const personId = normalisePersonId(body.personId);
  const report = await generateInvestmentReport(body.session, personId);
  const history = body.saveHistory ? await appendReportHistory(report, personId) : undefined;
  return NextResponse.json({ ...report, personId, historyCount: history?.length });
}
