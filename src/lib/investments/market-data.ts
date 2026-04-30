import { readJsonSetting, writeJsonSetting } from "./store";
import type { AssetCandidate, MarketDataPoint } from "./types";

const YAHOO_CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const CACHE_KEY = "investment-market-data-cache";
const CACHE_TTL_MS = 15 * 60 * 1000;

type MarketDataProvider = "yahoo" | "twelvedata" | "finnhub";

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

function configuredProvider(): MarketDataProvider {
  const provider = (process.env.MARKET_DATA_PROVIDER || "yahoo").toLowerCase();
  if (provider === "twelvedata" || provider === "finnhub") return provider;
  return "yahoo";
}

async function fetchTwelveDataRaw(asset: AssetCandidate): Promise<MarketDataPoint> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) throw new Error("TWELVE_DATA_API_KEY is not configured");
  const fetchedAt = new Date().toISOString();
  const symbol = encodeURIComponent(asset.yahooSymbol || asset.ticker);
  const res = await fetch(`https://api.twelvedata.com/quote?symbol=${symbol}&apikey=${key}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Twelve Data HTTP ${res.status}`);
  const json = await res.json() as any;
  if (json.status === "error" || json.code) throw new Error(json.message || "Twelve Data quote error");
  const price = Number(json.close || json.price);
  const previousClose = Number(json.previous_close);
  return {
    symbol: asset.yahooSymbol,
    label: asset.ticker,
    type: asset.type,
    currency: json.currency || "unknown",
    regularMarketPrice: Number.isFinite(price) ? price : undefined,
    previousClose: Number.isFinite(previousClose) ? previousClose : undefined,
    changePercent: Number.isFinite(Number(json.percent_change)) ? Number(json.percent_change) : pct(price, previousClose),
    dayRange: json.low && json.high ? `${json.low} - ${json.high}` : undefined,
    source: "Twelve Data quote API",
    fetchedAt,
  };
}

async function fetchFinnhubRaw(asset: AssetCandidate): Promise<MarketDataPoint> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error("FINNHUB_API_KEY is not configured");
  const fetchedAt = new Date().toISOString();
  const symbol = encodeURIComponent(asset.ticker.replace(".", "-"));
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${key}`, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Finnhub HTTP ${res.status}`);
  const json = await res.json() as any;
  if (!json || json.c === 0) throw new Error("Finnhub quote missing/unsupported symbol");
  return {
    symbol: asset.yahooSymbol,
    label: asset.ticker,
    type: asset.type,
    currency: "unknown",
    regularMarketPrice: json.c,
    previousClose: json.pc,
    changePercent: pct(json.c, json.pc),
    dayRange: json.l && json.h ? `${json.l} - ${json.h}` : undefined,
    source: "Finnhub quote API",
    fetchedAt,
  };
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
    const provider = configuredProvider();
    let point: MarketDataPoint;
    try {
      if (provider === "twelvedata") point = await fetchTwelveDataRaw(asset);
      else if (provider === "finnhub") point = await fetchFinnhubRaw(asset);
      else point = await fetchYahooMarketDataRaw(asset);
    } catch (officialErr) {
      if (provider === "yahoo") throw officialErr;
      const fallback = await fetchYahooMarketDataRaw(asset);
      point = { ...fallback, source: `${fallback.source} (${provider} fallback)` };
    }
    if (cache) cache[cacheKey] = point;
    return point;
  } catch (err) {
    if (cached) {
      return {
        ...cached,
        source: `${cached.source} (stale cache fallback)`,
        error: "Live fetch failed; using stale cache.",
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
