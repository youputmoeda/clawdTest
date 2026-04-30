import { NextResponse } from "next/server";
import { normalisePersonId } from "@/lib/investments/people";
import { analysePortfolio, loadPortfolioSettings, savePortfolioSettings } from "@/lib/investments/settings";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = normalisePersonId(searchParams.get("personId"));
  const settings = await loadPortfolioSettings(personId);
  return NextResponse.json({ personId, settings, analysis: analysePortfolio(settings) });
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const personId = normalisePersonId(searchParams.get("personId"));
  const settings = await savePortfolioSettings(await req.json(), personId);
  return NextResponse.json({ personId, settings, analysis: analysePortfolio(settings) });
}
