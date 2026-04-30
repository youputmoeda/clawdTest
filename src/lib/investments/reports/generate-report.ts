import { investmentConfig, profileWhy, sessionLabels } from "../config";
import { assetUniverse } from "../data/assets";
import { fetchMarketData } from "../market-data";
import { fetchMarketNews } from "../news";
import { scoreIdeas } from "../scoring";
import type { InvestmentReport, MarketSession } from "../types";

export async function generateInvestmentReport(session: MarketSession): Promise<InvestmentReport> {
  const labels = sessionLabels[session];
  const generatedAt = new Date().toISOString();
  const sessionAssets = assetUniverse.filter((asset) => asset.sessions.includes(session));
  const [signals, marketData] = await Promise.all([fetchMarketNews(session), fetchMarketData(sessionAssets)]);
  const errors = [
    ...marketData.filter((point) => point.error).map((point) => `${point.label}: ${point.error}`),
    ...signals.filter((signal) => /unavailable|error|failed/i.test(signal.title)).map((signal) => `${signal.source}: ${signal.summary}`),
  ];

  return {
    id: `${session}-${generatedAt}`,
    generatedAt,
    session,
    title: labels.title,
    subtitle: labels.subtitle,
    config: investmentConfig,
    signals,
    marketData,
    profiles: investmentConfig.profiles.map((profile) => ({
      profile,
      profileWhy: profileWhy[profile],
      ideas: scoreIdeas({ assets: sessionAssets, marketData, signals, profile, session }),
    })),
    dataFreshness: {
      ok: errors.length === 0 && marketData.length > 0 && signals.length > 0,
      fetchedAt: generatedAt,
      sourceCount: new Set([...marketData.map((point) => point.source), ...signals.map((signal) => signal.source)]).size,
      errors,
    },
    notes: [
      "Portugal/EU lens: prefer UCITS ETFs and instruments available through European brokers such as DEGIRO.",
      "Crypto is intentionally excluded from this research universe.",
      "This report now uses live RSS/news feeds and Yahoo Finance chart data where available; missing data lowers confidence.",
      "The agent can say no/low-confidence by reducing scores when market data or news context is weak.",
      "This is still research infrastructure, not a portfolio-aware recommendation engine; personal allocation settings come next.",
    ],
    disclaimer:
      "Research brief only. Not financial advice. Verify availability, costs, taxation, risk, currency exposure and suitability before investing.",
  };
}
