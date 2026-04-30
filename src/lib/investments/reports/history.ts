import { assetUniverse } from "../data/assets";
import { fetchMarketData } from "../market-data";
import { readJsonSetting, writeJsonSetting } from "../store";
import type { InvestmentReport, MarketSession } from "../types";

const HISTORY_KEY = "investment-report-history";
function historyKey(personId?: string) { return personId ? `${HISTORY_KEY}:${personId}` : HISTORY_KEY; }
const MAX_HISTORY = 100;

export type ReportHistoryEntry = {
  id: string;
  generatedAt: string;
  session: MarketSession;
  title: string;
  dataFreshnessOk: boolean;
  topIdeas: Array<{
    profile: string;
    ticker: string;
    name?: string;
    score: number;
    confidence: string;
    price?: number;
    currency?: string;
    source?: string;
  }>;
};

export type ReportPerformanceEntry = ReportHistoryEntry & {
  ageDays: number;
  performance: Array<{
    profile: string;
    ticker: string;
    entryPrice?: number;
    currentPrice?: number;
    currency?: string;
    returnPercent?: number;
    status: "ok" | "missing-entry-price" | "missing-current-price";
  }>;
};

function summarise(report: InvestmentReport): ReportHistoryEntry {
  return {
    id: report.id,
    generatedAt: report.generatedAt,
    session: report.session,
    title: report.title,
    dataFreshnessOk: report.dataFreshness.ok,
    topIdeas: report.profiles.flatMap((profile) =>
      profile.ideas.slice(0, 1).map((idea) => ({
        profile: profile.profile,
        ticker: idea.ticker,
        name: idea.name,
        score: idea.score,
        confidence: idea.confidence,
        price: idea.data.regularMarketPrice,
        currency: idea.data.currency,
        source: idea.data.source,
      })),
    ),
  };
}

export async function loadReportHistory(personId?: string) {
  return readJsonSetting<ReportHistoryEntry[]>(historyKey(personId), []);
}

export async function appendReportHistory(report: InvestmentReport, personId?: string) {
  const history = await loadReportHistory(personId);
  const next = [summarise(report), ...history.filter((entry) => entry.id !== report.id)].slice(0, MAX_HISTORY);
  await writeJsonSetting(historyKey(personId), next);
  return next;
}

export async function clearReportHistory(personId?: string) {
  await writeJsonSetting(historyKey(personId), []);
}

export async function evaluateReportPerformance(personId?: string) {
  const history = await loadReportHistory(personId);
  const tickers = Array.from(new Set(history.flatMap((entry) => entry.topIdeas.map((idea) => idea.ticker))));
  const pseudoAssets = tickers.map((ticker) => {
    const known = assetUniverse.find((asset) => asset.ticker === ticker);
    return known ?? {
      ticker,
      yahooSymbol: ticker,
      name: ticker,
      type: "Stock" as const,
      profiles: [],
      sessions: [],
      thesis: "",
      risks: [],
      horizon: "",
      degiroNote: "",
      tags: [],
    };
  });
  const current = await fetchMarketData(pseudoAssets);
  const byTicker = new Map(current.map((point) => [point.label, point]));

  return history.map((entry): ReportPerformanceEntry => {
    const ageDays = (Date.now() - new Date(entry.generatedAt).getTime()) / (1000 * 60 * 60 * 24);
    return {
      ...entry,
      ageDays,
      performance: entry.topIdeas.map((idea) => {
        const point = byTicker.get(idea.ticker);
        const currentPrice = point?.regularMarketPrice;
        if (!idea.price) return { profile: idea.profile, ticker: idea.ticker, entryPrice: idea.price, currentPrice, currency: idea.currency, status: "missing-entry-price" };
        if (!currentPrice) return { profile: idea.profile, ticker: idea.ticker, entryPrice: idea.price, currentPrice, currency: idea.currency, status: "missing-current-price" };
        return {
          profile: idea.profile,
          ticker: idea.ticker,
          entryPrice: idea.price,
          currentPrice,
          currency: point?.currency || idea.currency,
          returnPercent: ((currentPrice - idea.price) / idea.price) * 100,
          status: "ok",
        };
      }),
    };
  });
}
