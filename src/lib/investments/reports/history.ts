import { readJsonSetting, writeJsonSetting } from "../store";
import type { InvestmentReport, MarketSession } from "../types";

const HISTORY_KEY = "investment-report-history";
const MAX_HISTORY = 100;

export type ReportHistoryEntry = {
  id: string;
  generatedAt: string;
  session: MarketSession;
  title: string;
  dataFreshnessOk: boolean;
  topIdeas: Array<{ profile: string; ticker: string; score: number; confidence: string }>;
  allocationSummary?: string;
};

function summarise(report: InvestmentReport): ReportHistoryEntry {
  return {
    id: report.id,
    generatedAt: report.generatedAt,
    session: report.session,
    title: report.title,
    dataFreshnessOk: report.dataFreshness.ok,
    topIdeas: report.profiles.flatMap((profile) =>
      profile.ideas.slice(0, 1).map((idea) => ({ profile: profile.profile, ticker: idea.ticker, score: idea.score, confidence: idea.confidence })),
    ),
  };
}

export async function loadReportHistory() {
  return readJsonSetting<ReportHistoryEntry[]>(HISTORY_KEY, []);
}

export async function appendReportHistory(report: InvestmentReport) {
  const history = await loadReportHistory();
  const next = [summarise(report), ...history.filter((entry) => entry.id !== report.id)].slice(0, MAX_HISTORY);
  await writeJsonSetting(HISTORY_KEY, next);
  return next;
}
