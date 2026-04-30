import type { InvestmentConfig } from "./types";

export const investmentConfig: InvestmentConfig = {
  investorCountry: "Portugal",
  broker: "DEGIRO",
  baseCurrency: "EUR",
  emailTo: "jptms@iscte-iul.pt",
  includeCrypto: false,
  sessions: ["europe-open", "us-open"],
  profiles: ["conservative", "moderate", "aggressive"],
};

export const sessionLabels = {
  "europe-open": {
    title: "Europe Market Open Brief",
    subtitle: "Portugal/EU investor lens — Euronext/Xetra/London context",
    localTimeHint: "Europe/Lisbon morning",
  },
  "us-open": {
    title: "US Market Open Brief",
    subtitle: "Portugal/EU investor lens — NYSE/Nasdaq context before US cash open",
    localTimeHint: "Europe/Lisbon afternoon",
  },
} as const;

export const profileWhy = {
  conservative:
    "Prioritises capital preservation, broad diversification, lower volatility and EUR-aware instruments. Ideas should be boring on purpose.",
  moderate:
    "Balances long-term growth with diversification. Accepts equity volatility, but avoids single-theme concentration as the default.",
  aggressive:
    "Targets higher upside with higher drawdown risk. Uses quality growth, cyclicals or thematic exposure only when the thesis is clear.",
} as const;
