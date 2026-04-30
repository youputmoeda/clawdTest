import { NextResponse } from "next/server";
import { z } from "zod";
import { formatInvestmentEmail } from "@/lib/investments/delivery/email";
import { generateInvestmentReport } from "@/lib/investments/reports/generate-report";

const schema = z.object({
  session: z.enum(["europe-open", "us-open"]).default("europe-open"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = searchParams.get("session") || "europe-open";
  const parsed = schema.parse({ session });
  const report = await generateInvestmentReport(parsed.session);
  return NextResponse.json({ report, email: formatInvestmentEmail(report), delivery: "preview-only" });
}

export async function POST(req: Request) {
  const body = schema.parse(await req.json().catch(() => ({})));
  const report = await generateInvestmentReport(body.session);
  return NextResponse.json({ report, email: formatInvestmentEmail(report), delivery: "preview-only" });
}
