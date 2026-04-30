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

export type Holding = {
  ticker: string;
  isin?: string;
  name?: string;
  type: "ETF UCITS" | "Stock" | "Bond ETF UCITS" | "Cash-like ETF" | "Other";
  quantity?: number;
  averagePrice?: number;
  currency?: string;
  currentValue?: number;
  tags?: string[];
};

export type PortfolioSettings = {
  monthlyContribution: number;
  emergencyFundReady: boolean;
  preferredProfile: RiskProfile;
  coreEtfTargetPercent: number;
  satelliteTargetPercent: number;
  maxSingleStockPercent: number;
  maxSectorPercent: number;
  maxUSPercent: number;
  preferAccumulatingEtfs: boolean;
  notes: string;
  holdings: Holding[];
};

export type PortfolioAnalysis = {
  totalValue: number;
  coreEtfPercent: number;
  stockPercent: number;
  bondOrCashPercent: number;
  usTaggedPercent: number;
  techTaggedPercent: number;
  warnings: string[];
  allocationNotes: string[];
};

export type MarketSignal = {
  id: string;
  title: string;
  summary: string;
  region: "Europe" | "US" | "Global";
  impact: "low" | "medium" | "high";
  source: string;
  url?: string;
  publishedAt?: string;
};

export type MarketDataPoint = {
  symbol: string;
  label: string;
  type: "ETF UCITS" | "Stock" | "Bond ETF UCITS" | "Cash-like ETF" | "Index" | "FX";
  currency: string;
  regularMarketPrice?: number;
  previousClose?: number;
  changePercent?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  dayRange?: string;
  source: string;
  fetchedAt: string;
  error?: string;
};

export type AssetCandidate = {
  ticker: string;
  yahooSymbol: string;
  name: string;
  type: "ETF UCITS" | "Stock" | "Bond ETF UCITS" | "Cash-like ETF";
  profiles: RiskProfile[];
  sessions: MarketSession[];
  thesis: string;
  risks: string[];
  horizon: string;
  degiroNote: string;
  tags: string[];
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
  score: number;
  data: MarketDataPoint;
  personalization: string[];
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
  settings: PortfolioSettings;
  portfolioAnalysis: PortfolioAnalysis;
  signals: MarketSignal[];
  marketData: MarketDataPoint[];
  profiles: ProfileReport[];
  dataFreshness: {
    ok: boolean;
    fetchedAt: string;
    sourceCount: number;
    errors: string[];
  };
  notes: string[];
  disclaimer: string;
};
