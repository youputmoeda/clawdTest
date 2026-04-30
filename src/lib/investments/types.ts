export type MarketSession = "europe-open" | "us-open";
export type RiskProfile = "conservative" | "moderate" | "aggressive";

export type InvestmentConfig = {
  investorCountry: "Portugal";
  broker: "DEGIRO";
  baseCurrency: "EUR";
  emailTo: string;
  includeCrypto: false;
  sessions: MarketSession[];
  profiles: RiskProfile[];
};

export type MarketSignal = {
  id: string;
  title: string;
  summary: string;
  region: "Europe" | "US" | "Global";
  impact: "low" | "medium" | "high";
  source: string;
  url?: string;
};

export type InvestmentIdea = {
  rank: number;
  ticker: string;
  name: string;
  type: "ETF UCITS" | "Stock" | "Bond ETF UCITS" | "Cash-like ETF";
  profile: RiskProfile;
  thesis: string;
  whyNow: string[];
  risks: string[];
  horizon: string;
  confidence: "low" | "medium" | "high";
  degiroNote: string;
};

export type ProfileReport = {
  profile: RiskProfile;
  profileWhy: string;
  ideas: InvestmentIdea[];
};

export type InvestmentReport = {
  id: string;
  generatedAt: string;
  session: MarketSession;
  title: string;
  subtitle: string;
  config: InvestmentConfig;
  signals: MarketSignal[];
  profiles: ProfileReport[];
  notes: string[];
  disclaimer: string;
};
