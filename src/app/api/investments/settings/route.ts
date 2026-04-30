import { NextResponse } from "next/server";
import { analysePortfolio, loadPortfolioSettings, savePortfolioSettings } from "@/lib/investments/settings";

export async function GET() {
  const settings = await loadPortfolioSettings();
  return NextResponse.json({ settings, analysis: analysePortfolio(settings) });
}

export async function POST(req: Request) {
  const settings = await savePortfolioSettings(await req.json());
  return NextResponse.json({ settings, analysis: analysePortfolio(settings) });
}
