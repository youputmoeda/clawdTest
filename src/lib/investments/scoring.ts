import type {
  AssetCandidate,
  InvestmentIdea,
  MarketDataPoint,
  MarketSession,
  MarketSignal,
  PortfolioAnalysis,
  PortfolioSettings,
  RiskProfile,
} from "./types";

function confidence(score: number, data: MarketDataPoint): InvestmentIdea["confidence"] {
  if (data.error) return "low";
  if (score >= 75) return "high";
  if (score >= 45) return "medium";
  return "low";
}

function tagNewsScore(asset: AssetCandidate, signals: MarketSignal[]) {
  const haystack = signals.map((signal) => `${signal.title} ${signal.summary}`.toLowerCase()).join(" ");
  return asset.tags.reduce((sum, tag) => sum + (haystack.includes(tag.toLowerCase()) ? 8 : 0), 0);
}

function profileBase(profile: RiskProfile, asset: AssetCandidate) {
  if (!asset.profiles.includes(profile)) return -100;
  if (profile === "conservative") {
    if (asset.type === "Bond ETF UCITS" || asset.type === "Cash-like ETF") return 42;
    if (asset.type === "ETF UCITS") return 34;
    return 8;
  }
  if (profile === "moderate") {
    if (asset.type === "ETF UCITS") return 40;
    if (asset.type === "Stock") return 24;
    return 22;
  }
  if (asset.type === "Stock") return 38;
  if (asset.type === "ETF UCITS") return 34;
  return 10;
}

function momentumScore(data: MarketDataPoint, profile: RiskProfile) {
  if (data.error || data.changePercent === undefined) return -18;
  const change = data.changePercent;
  if (profile === "conservative") {
    if (Math.abs(change) < 0.75) return 12;
    if (change < -1.5) return -8;
    return 4;
  }
  if (profile === "moderate") {
    if (change > 0.2 && change < 2.5) return 14;
    if (change < -2.5) return -10;
    return 5;
  }
  if (change > 0.5 && change < 4) return 18;
  if (change < -4) return -12;
  return 6;
}

function rangeScore(data: MarketDataPoint, profile: RiskProfile) {
  if (!data.regularMarketPrice || !data.fiftyTwoWeekHigh || !data.fiftyTwoWeekLow) return 0;
  const range = data.fiftyTwoWeekHigh - data.fiftyTwoWeekLow;
  if (range <= 0) return 0;
  const percentile = (data.regularMarketPrice - data.fiftyTwoWeekLow) / range;

  if (profile === "conservative") {
    if (percentile > 0.95) return -8;
    if (percentile < 0.25) return 5;
    return 8;
  }
  if (profile === "moderate") {
    if (percentile > 0.98) return -6;
    if (percentile > 0.5 && percentile < 0.9) return 10;
    return 4;
  }
  if (percentile > 0.55 && percentile < 0.98) return 12;
  return 2;
}

function sessionScore(asset: AssetCandidate, session: MarketSession) {
  return asset.sessions.includes(session) ? 12 : -100;
}

function holdingValue(settings: PortfolioSettings, ticker: string) {
  const holding = settings.holdings.find((h) => h.ticker.toLowerCase() === ticker.toLowerCase());
  if (!holding) return 0;
  if (holding.currentValue !== undefined) return holding.currentValue;
  if (holding.quantity !== undefined && holding.averagePrice !== undefined) return holding.quantity * holding.averagePrice;
  return 0;
}

function personalizationScore(asset: AssetCandidate, settings: PortfolioSettings, analysis: PortfolioAnalysis) {
  let score = 0;
  const notes: string[] = [];
  const total = analysis.totalValue;
  const existingValue = holdingValue(settings, asset.ticker);
  const existingPercent = total ? (existingValue / total) * 100 : 0;

  if (!settings.emergencyFundReady && asset.type === "Stock") {
    score -= 18;
    notes.push("Emergency fund not ready: single stocks are penalised until basic safety buffer is confirmed.");
  }

  if (asset.type === "ETF UCITS" && analysis.coreEtfPercent < settings.coreEtfTargetPercent) {
    score += 12;
    notes.push("Core ETF allocation is below target, so broad UCITS ETFs get a boost.");
  }

  if (asset.type === "Stock" && analysis.stockPercent >= settings.satelliteTargetPercent) {
    score -= 15;
    notes.push("Satellite/single-stock exposure is already at or above target.");
  }

  if (asset.type === "Stock" && existingPercent >= settings.maxSingleStockPercent) {
    score -= 25;
    notes.push(`Existing ${asset.ticker} exposure is at/above max single-stock limit.`);
  }

  if (asset.tags.includes("us") && analysis.usTaggedPercent >= settings.maxUSPercent) {
    score -= 10;
    notes.push("US-tagged exposure is at/above configured max.");
  }

  if ((asset.tags.includes("tech") || asset.tags.includes("ai")) && analysis.techTaggedPercent >= settings.maxSectorPercent) {
    score -= 12;
    notes.push("Tech/AI exposure is at/above configured sector max.");
  }

  if (settings.preferAccumulatingEtfs && asset.type.includes("ETF")) {
    score += 4;
    notes.push("Preference for accumulating ETFs supports UCITS ETF candidates; still verify share class.");
  }

  if (settings.monthlyContribution > 0) {
    notes.push(`Monthly contribution configured: ${settings.monthlyContribution.toFixed(0)} EUR.`);
  } else {
    score -= 10;
    notes.push("No monthly contribution configured; treat as watchlist-only.");
  }

  if (!notes.length) notes.push("No portfolio-specific adjustment applied.");
  return { score, notes };
}

export function scoreIdeas(params: {
  assets: AssetCandidate[];
  marketData: MarketDataPoint[];
  signals: MarketSignal[];
  profile: RiskProfile;
  session: MarketSession;
  settings: PortfolioSettings;
  analysis: PortfolioAnalysis;
}): InvestmentIdea[] {
  const dataByLabel = new Map(params.marketData.map((point) => [point.label, point]));

  return params.assets
    .map((asset) => {
      const data = dataByLabel.get(asset.ticker) || {
        symbol: asset.yahooSymbol,
        label: asset.ticker,
        type: asset.type,
        currency: "unknown",
        source: "missing",
        fetchedAt: new Date().toISOString(),
        error: "Missing market data",
      } satisfies MarketDataPoint;

      const personal = personalizationScore(asset, params.settings, params.analysis);
      const score = Math.max(
        0,
        Math.min(
          100,
          profileBase(params.profile, asset) +
            sessionScore(asset, params.session) +
            momentumScore(data, params.profile) +
            rangeScore(data, params.profile) +
            tagNewsScore(asset, params.signals) +
            personal.score,
        ),
      );

      const changeText = data.changePercent === undefined ? "price change unavailable" : `${data.changePercent.toFixed(2)}% today/latest`;
      const priceText = data.regularMarketPrice === undefined ? "price unavailable" : `${data.regularMarketPrice.toFixed(2)} ${data.currency}`;
      const newsHits = asset.tags.filter((tag) =>
        params.signals.some((signal) => `${signal.title} ${signal.summary}`.toLowerCase().includes(tag.toLowerCase())),
      );

      return {
        rank: 0,
        ticker: asset.ticker,
        name: asset.name,
        type: asset.type,
        profile: params.profile,
        thesis: asset.thesis,
        whyNow: [
          `Latest market data: ${priceText}, ${changeText}.`,
          newsHits.length ? `Related live news tags detected: ${newsHits.join(", ")}.` : "No strong matching news tag; scored mainly on profile fit and market data.",
          data.error ? `Data quality penalty: ${data.error}.` : `Data source: ${data.source}, fetched ${new Date(data.fetchedAt).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}.`,
        ],
        risks: asset.risks,
        horizon: asset.horizon,
        confidence: confidence(score, data),
        degiroNote: asset.degiroNote,
        score,
        data,
        personalization: personal.notes,
      } satisfies InvestmentIdea;
    })
    .filter((idea) => idea.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((idea, index) => ({ ...idea, rank: index + 1 }));
}
