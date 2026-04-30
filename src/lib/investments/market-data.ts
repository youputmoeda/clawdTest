import { readJsonSetting, writeJsonSetting } from "./store";
import type { AssetCandidate, MarketDataPoint } from "./types";

const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const CACHE_KEY = "investment-market-data-cache";
const CACHE_TTL_MS = 15 * 60 * 1000;

type MarketDataCache = Record<string, MarketDataPoint>;

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

function isFresh(point?: MarketDataPoint) {
  if (!point) return false;
  return Date.now() - new Date(point.fetchedAt).getTime() < CACHE_TTL_MS;
}

async function readCache() {
  return readJsonSetting<MarketDataCache>(CACHE_KEY, {});
}

async function writeCache(cache: MarketDataCache) {
  return writeJsonSetting(CACHE_KEY, cache);
}

async function fetchYahooMarketDataRaw(asset: AssetCandidate): Promise<MarketDataPoint> {
  const fetchedAt = new Date().toISOString();
  const url = `${YAHOO_CHART_BASE}/${encodeURIComponent(asset.yahooSymbol)}?range=5d&interval=1d`;

  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 investment-research-agent/0.1",
      accept: "application/json",
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = (await res.json()) as YahooChartResponse;
  const error = json.chart?.error?.description;
  const meta = json.chart?.result?.[0]?.meta;
  if (error || !meta) throw new Error(error || "Missing chart metadata");

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
}

export async function fetchYahooMarketData(asset: AssetCandidate, cache?: MarketDataCache): Promise<MarketDataPoint> {
  const cacheKey = asset.yahooSymbol;
  const cached = cache?.[cacheKey];
  if (cached && isFresh(cached)) return { ...cached, source: `${cached.source} (cache)` };

  try {
    const point = await fetchYahooMarketDataRaw(asset);
    if (cache) cache[cacheKey] = point;
    return point;
  } catch (err) {
    if (cached) {
      return {
        ...cached,
        source: `${cached.source} (stale cache fallback)`,
        error: `Live fetch failed; using stale cache. ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
    return {
      symbol: asset.yahooSymbol,
      label: asset.ticker,
      type: asset.type,
      currency: "unknown",
      source: "Yahoo Finance chart API",
      fetchedAt: new Date().toISOString(),
      error: err instanceof Error ? err.message : "Unknown market data error",
    };
  }
}

export async function fetchMarketData(assets: AssetCandidate[]) {
  const cache = await readCache();
  const results = await Promise.allSettled(assets.map((asset) => fetchYahooMarketData(asset, cache)));
  await writeCache(cache);

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
