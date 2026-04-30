import { NextResponse } from "next/server";
import { generateAllocationPlan } from "@/lib/investments/allocation";
import { normalisePersonId } from "@/lib/investments/people";
import { analysePortfolio, loadPortfolioSettings } from "@/lib/investments/settings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = normalisePersonId(searchParams.get("personId"));
  const settings = await loadPortfolioSettings(personId);
  const analysis = analysePortfolio(settings);
  return NextResponse.json({ personId, settings, analysis, plan: generateAllocationPlan(settings, analysis) });
}

export async function POST(req: Request) {
  return GET(req);
}
