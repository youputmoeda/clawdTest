import { investmentConfig, profileWhy, sessionLabels } from "../config";
import { getIdeas, mockSignals } from "../data/universe";
import type { InvestmentReport, MarketSession } from "../types";

export function generateInvestmentReport(session: MarketSession): InvestmentReport {
  const labels = sessionLabels[session];
  const generatedAt = new Date().toISOString();

  return {
    id: `${session}-${generatedAt}`,
    generatedAt,
    session,
    title: labels.title,
    subtitle: labels.subtitle,
    config: investmentConfig,
    signals: mockSignals[session],
    profiles: investmentConfig.profiles.map((profile) => ({
      profile,
      profileWhy: profileWhy[profile],
      ideas: getIdeas(session, profile),
    })),
    notes: [
      "Portugal/EU lens: prefer UCITS ETFs and instruments available through European brokers such as DEGIRO.",
      "Crypto is intentionally excluded from this research universe.",
      "If signal quality is weak, the correct action can be watch/wait rather than buy.",
      "Real market/news API integration is not wired yet; current MVP uses seeded research logic and placeholders.",
    ],
    disclaimer:
      "Research brief only. Not financial advice. Verify availability, costs, taxation, risk, currency exposure and suitability before investing.",
  };
}
