import { investmentConfig, profileWhy, sessionLabels } from "../config";
import { assetUniverse } from "../data/assets";
import { fetchMarketData } from "../market-data";
import { fetchMarketNews } from "../news";
import { scoreIdeas } from "../scoring";
import { analysePortfolio, loadPortfolioSettings } from "../settings";
import type { InvestmentReport, MarketSession } from "../types";

export async function generateInvestmentReport(session: MarketSession): Promise<InvestmentReport> {
  const labels = sessionLabels[session];
  const generatedAt = new Date().toISOString();
  const sessionAssets = assetUniverse.filter((asset) => asset.sessions.includes(session));
  const settings = await loadPortfolioSettings();
  const portfolioAnalysis = analysePortfolio(settings);
  const [signals, marketData] = await Promise.all([fetchMarketNews(session, settings.holdings), fetchMarketData(sessionAssets)]);
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
    settings,
    portfolioAnalysis,
    signals,
    marketData,
    profiles: investmentConfig.profiles.map((profile) => ({
      profile,
      profileWhy: profileWhy[profile],
      ideas: scoreIdeas({ assets: sessionAssets, marketData, signals, profile, session, settings, analysis: portfolioAnalysis }),
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
      "This report uses live RSS/news feeds and Yahoo Finance chart data where available; missing data lowers confidence.",
      "Portfolio settings now adjust scoring: core ETF target, satellite limits, US/tech caps, emergency fund flag and monthly contribution.",
      ...portfolioAnalysis.warnings.map((warning) => `Portfolio warning: ${warning}`),
      ...portfolioAnalysis.allocationNotes.map((note) => `Allocation note: ${note}`),
    ],
    disclaimer:
      "Research brief only. Not financial advice. Verify availability, costs, taxation, risk, currency exposure and suitability before investing.",
  };
}
