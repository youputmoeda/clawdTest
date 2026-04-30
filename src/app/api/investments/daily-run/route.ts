import { NextResponse } from "next/server";
import { generateActionPlan } from "@/lib/investments/action-plan";
import { generateAllocationPlan } from "@/lib/investments/allocation";
import { normalisePersonId } from "@/lib/investments/people";
import { appendReportHistory } from "@/lib/investments/reports/history";
import { generateInvestmentReport } from "@/lib/investments/reports/generate-report";
import { analysePortfolio, loadPortfolioSettings } from "@/lib/investments/settings";

function isWeekday(date = new Date()) {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
}

function authorised(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}` || new URL(req.url).searchParams.get("secret") === secret;
}

export async function GET(req: Request) {
  if (!authorised(req)) return NextResponse.json({ ok: false, error: "unauthorised" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const personId = normalisePersonId(searchParams.get("personId") || "joao");
  const session = searchParams.get("session") === "us-open" ? "us-open" : "europe-open";
  const force = searchParams.get("force") === "true";

  if (!force && !isWeekday()) {
    return NextResponse.json({ ok: true, skipped: true, reason: "weekend", personId, session });
  }

  const settings = await loadPortfolioSettings(personId);
  const analysis = analysePortfolio(settings);
  const report = await generateInvestmentReport(session, personId);
  const history = await appendReportHistory(report, personId);
  const allocationPlan = generateAllocationPlan(settings, analysis);
  const actionPlan = generateActionPlan(settings, analysis);

  return NextResponse.json({
    ok: true,
    personId,
    session,
    generatedAt: new Date().toISOString(),
    historyCount: history.length,
    report: {
      title: report.title,
      dataFreshness: report.dataFreshness,
      topIdeas: report.profiles.map((profile) => ({ profile: profile.profile, ideas: profile.ideas.slice(0, 3).map((idea) => ({ ticker: idea.ticker, score: idea.score, confidence: idea.confidence })) })),
    },
    allocationPlan,
    actionPlan,
  });
}

export async function POST(req: Request) {
  return GET(req);
}
