import { NextResponse } from "next/server";
import { generateAllocationPlan } from "@/lib/investments/allocation";
import { analysePortfolio, loadPortfolioSettings } from "@/lib/investments/settings";

export async function GET() {
  const settings = await loadPortfolioSettings();
  const analysis = analysePortfolio(settings);
  return NextResponse.json({ settings, analysis, plan: generateAllocationPlan(settings, analysis) });
}

export async function POST() {
  const settings = await loadPortfolioSettings();
  const analysis = analysePortfolio(settings);
  return NextResponse.json({ settings, analysis, plan: generateAllocationPlan(settings, analysis) });
}
