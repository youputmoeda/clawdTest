import { NextResponse } from "next/server";
import { z } from "zod";
import { generateInvestmentReport } from "@/lib/investments/reports/generate-report";

const schema = z.object({
  session: z.enum(["europe-open", "us-open"]).default("europe-open"),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const session = searchParams.get("session") || "europe-open";
  const parsed = schema.parse({ session });
  return NextResponse.json(generateInvestmentReport(parsed.session));
}

export async function POST(req: Request) {
  const body = schema.parse(await req.json().catch(() => ({})));
  return NextResponse.json(generateInvestmentReport(body.session));
}
