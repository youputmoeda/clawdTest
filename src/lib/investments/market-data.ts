import type { AssetCandidate, MarketDataPoint } from "./types";

const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        currency?: string;
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
      };
    }>;
    error?: { description?: string } | null;
  };
};

function pct(price?: number, previous?: number) {
  if (!price || !previous) return undefined;
  return ((price - previous) / previous) * 100;
}

export async function fetchYahooMarketData(asset: AssetCandidate): Promise<MarketDataPoint> {
  const fetchedAt = new Date().toISOString();
  const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(asset.yahooSymbol)}?range=5d&interval=1d`;

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 investment-research-agent/0.1",
        accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return {
        symbol: asset.yahooSymbol,
        label: asset.ticker,
        type: asset.type,
        currency: "unknown",
        source: "Yahoo Finance chart API",
        fetchedAt,
        error: `HTTP ${res.status}`,
      };
    }

    const json = (await res.json()) as YahooChartResponse;
    const error = json.chart?.error?.description;
    const meta = json.chart?.result?.[0]?.meta;

    if (error || !meta) {
      return {
        symbol: asset.yahooSymbol,
        label: asset.ticker,
        type: asset.type,
        currency: meta?.currency || "unknown",
        source: "Yahoo Finance chart API",
        fetchedAt,
        error: error || "Missing chart metadata",
      };
    }

    const previousClose = meta.previousClose ?? meta.chartPreviousClose;
    const price = meta.regularMarketPrice;
    const low = meta.regularMarketDayLow;
    const high = meta.regularMarketDayHigh;

    return {
      symbol: asset.yahooSymbol,
      label: asset.ticker,
      type: asset.type,
      currency: meta.currency || "unknown",
      regularMarketPrice: price,
      previousClose,
      changePercent: pct(price, previousClose),
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
      dayRange: low && high ? `${low.toFixed(2)} - ${high.toFixed(2)}` : undefined,
      source: "Yahoo Finance chart API",
      fetchedAt,
    };
  } catch (err) {
    return {
      symbol: asset.yahooSymbol,
      label: asset.ticker,
      type: asset.type,
      currency: "unknown",
      source: "Yahoo Finance chart API",
      fetchedAt,
      error: err instanceof Error ? err.message : "Unknown market data error",
    };
  }
}

export async function fetchMarketData(assets: AssetCandidate[]) {
  const results = await Promise.allSettled(assets.map(fetchYahooMarketData));
  return results.map((result, index): MarketDataPoint => {
    if (result.status === "fulfilled") return result.value;
    const asset = assets[index];
    return {
      symbol: asset.yahooSymbol,
      label: asset.ticker,
      type: asset.type,
      currency: "unknown",
      source: "Yahoo Finance chart API",
      fetchedAt: new Date().toISOString(),
      error: result.reason instanceof Error ? result.reason.message : "Unknown error",
    };
  });
}
