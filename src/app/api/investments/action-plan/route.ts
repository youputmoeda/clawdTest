import { NextResponse } from "next/server";
import { generateActionPlan } from "@/lib/investments/action-plan";
import { normalisePersonId } from "@/lib/investments/people";
import { analysePortfolio, loadPortfolioSettings } from "@/lib/investments/settings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = normalisePersonId(searchParams.get("personId"));
  const settings = await loadPortfolioSettings(personId);
  const analysis = analysePortfolio(settings);
  return NextResponse.json({ personId, settings, analysis, actionPlan: generateActionPlan(settings, analysis) });
}
