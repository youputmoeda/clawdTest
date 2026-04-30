import * as cheerio from "cheerio";
import { subDays, format } from "date-fns";
import type { Holding, MarketSession, MarketSignal } from "./types";

type RssSource = {
  id: string;
  name: string;
  url: string;
  region: MarketSignal["region"];
  sessions: MarketSession[];
};

const rssSources: RssSource[] = [
  { id: "ecb-press", name: "European Central Bank", url: "https://www.ecb.europa.eu/rss/press.html", region: "Europe", sessions: ["europe-open"] },
  { id: "fed-press", name: "Federal Reserve", url: "https://www.federalreserve.gov/feeds/press_all.xml", region: "US", sessions: ["us-open"] },
  { id: "yahoo-finance", name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", region: "Global", sessions: ["europe-open", "us-open"] },
  { id: "marketwatch-topstories", name: "MarketWatch Top Stories", url: "https://feeds.marketwatch.com/marketwatch/topstories/", region: "US", sessions: ["us-open"] },
  { id: "cnbc-top-news", name: "CNBC Top News", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", region: "US", sessions: ["us-open"] },
];

function text($: cheerio.CheerioAPI, el: any, selector: string) {
  return $(el).find(selector).first().text().trim();
}

function link($: cheerio.CheerioAPI, el: any) {
  return text($, el, "link") || $(el).find("link").first().attr("href") || undefined;
}

function impactFromTitle(title: string): MarketSignal["impact"] {
  const t = title.toLowerCase();
  if (/rate|inflation|cpi|fed|ecb|earnings|recession|tariff|war|jobs|yield|nvidia|microsoft|tariffs|guidance/.test(t)) return "high";
  if (/market|stock|bond|euro|dollar|oil|ai|semiconductor|tech|nasdaq|s&p/.test(t)) return "medium";
  return "low";
}

function baseRelevanceScore(signal: MarketSignal, session: MarketSession) {
  const text = `${signal.title} ${signal.summary}`.toLowerCase();
  let score = signal.impact === "high" ? 4 : signal.impact === "medium" ? 2 : 1;
  if (session === "europe-open" && /ecb|europe|euro|inflation|rate|bond|edp|jeronimo|jerónimo/.test(text)) score += 3;
  if (session === "us-open" && /fed|us|nasdaq|s&p|earnings|cpi|jobs|ai|tech|nvidia|microsoft|coca-cola/.test(text)) score += 3;
  if (/crypto|bitcoin|ether/.test(text)) score -= 5;
  return score;
}

function tokenMatches(haystack: string, token: string) {
  const clean = token.toLowerCase().trim();
  if (clean.length < 3) return false;
  return new RegExp(`(^|[^a-z0-9])${clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(haystack);
}

function nameTokens(name?: string) {
  return (name || "")
    .split(/\s+/)
    .map((token) => token.replace(/[^a-z0-9.-]/gi, ""))
    .filter((token) => token.length >= 5 && !/^(core|ucits|etf|fund|corp|company|holding|class|world|global|ishares|vanguard)$/i.test(token));
}

function enrichWithPortfolio(signal: MarketSignal, holdings: Holding[] = [], session: MarketSession): MarketSignal {
  const haystack = `${signal.title} ${signal.summary}`.toLowerCase();
  const affectedHoldings = holdings
    .filter((holding) => {
      const tokens = [holding.ticker, holding.isin, ...nameTokens(holding.name)].filter(Boolean).map((v) => String(v));
      return tokens.some((token) => tokenMatches(haystack, token));
    })
    .map((holding) => holding.ticker);

  const affectedTags = Array.from(new Set(holdings.flatMap((holding) => holding.tags ?? []).filter((tag) => tokenMatches(haystack, tag))));
  let relevanceScore = baseRelevanceScore(signal, session) + affectedHoldings.length * 5 + affectedTags.length * 2;
  const portfolioImpact: MarketSignal["portfolioImpact"] = affectedHoldings.length >= 2 || affectedTags.length >= 3 ? "high" : affectedHoldings.length || affectedTags.length ? "medium" : relevanceScore >= 6 ? "low" : "none";
  if (portfolioImpact === "high") relevanceScore += 3;
  if (portfolioImpact === "medium") relevanceScore += 2;

  return { ...signal, relevanceScore, affectedHoldings, affectedTags, portfolioImpact };
}

async function fetchFinnhubNews(holdings: Holding[]): Promise<MarketSignal[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];

  const out: MarketSignal[] = [];
  const from = format(subDays(new Date(), 7), "yyyy-MM-dd");
  const to = format(new Date(), "yyyy-MM-dd");
  const symbols = Array.from(new Set(holdings.map((h) => h.ticker).filter((ticker) => /^[A-Z.]{1,8}$/.test(ticker)).slice(0, 8)));

  try {
    const general = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${key}`, { next: { revalidate: 600 } });
    if (general.ok) {
      const json = (await general.json()) as any[];
      out.push(...json.slice(0, 12).map((item, index) => ({
        id: `finnhub-general-${index}-${item.id ?? item.datetime ?? item.headline?.slice(0, 20)}`,
        title: item.headline || "Finnhub news",
        summary: item.summary || "No summary provided by source.",
        region: "Global" as const,
        impact: impactFromTitle(item.headline || item.summary || ""),
        source: `Finnhub/${item.source || "market news"}`,
        url: item.url,
        publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : undefined,
      }))
      );
    }
  } catch {
    // RSS sources still cover baseline news.
  }

  await Promise.all(symbols.map(async (symbol) => {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}&token=${key}`, { next: { revalidate: 600 } });
      if (!res.ok) return;
      const json = (await res.json()) as any[];
      out.push(...json.slice(0, 5).map((item, index) => ({
        id: `finnhub-${symbol}-${index}-${item.id ?? item.datetime ?? item.headline?.slice(0, 20)}`,
        title: item.headline || `${symbol} news`,
        summary: item.summary || "No summary provided by source.",
        region: "US" as const,
        impact: impactFromTitle(item.headline || item.summary || ""),
        source: `Finnhub/${item.source || symbol}`,
        url: item.url,
        publishedAt: item.datetime ? new Date(item.datetime * 1000).toISOString() : undefined,
      }))
      );
    } catch {
      // Ignore per-symbol failures; other sources remain.
    }
  }));

  return out;
}

async function fetchSource(source: RssSource): Promise<MarketSignal[]> {
  try {
    const res = await fetch(source.url, {
      headers: { "user-agent": "Mozilla/5.0 investment-research-agent/0.1", accept: "application/rss+xml, application/xml, text/xml, */*" },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return [{ id: `${source.id}-error`, title: `${source.name} feed unavailable`, summary: `Could not fetch RSS feed: HTTP ${res.status}`, region: source.region, impact: "low", source: source.name, url: source.url, publishedAt: new Date().toISOString() }];
    }

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: MarketSignal[] = [];

    $("item, entry").slice(0, 10).each((index, el) => {
      const title = text($, el, "title");
      const summary = text($, el, "description") || text($, el, "summary") || text($, el, "content");
      const publishedAt = text($, el, "pubDate") || text($, el, "updated") || text($, el, "published") || undefined;
      if (!title) return;
      items.push({ id: `${source.id}-${index}-${title.slice(0, 32)}`, title, summary: summary.replace(/<[^>]*>/g, "").slice(0, 320) || "No summary provided by source.", region: source.region, impact: impactFromTitle(title), source: source.name, url: link($, el), publishedAt });
    });

    return items;
  } catch (err) {
    return [{ id: `${source.id}-error`, title: `${source.name} feed error`, summary: err instanceof Error ? err.message : "Unknown RSS error", region: source.region, impact: "low", source: source.name, url: source.url, publishedAt: new Date().toISOString() }];
  }
}

export async function fetchMarketNews(session: MarketSession, holdings: Holding[] = []): Promise<MarketSignal[]> {
  const sources = rssSources.filter((source) => source.sessions.includes(session));
  const [settled, finnhubSignals] = await Promise.all([
    Promise.allSettled(sources.map((source) => fetchSource(source))),
    fetchFinnhubNews(holdings),
  ]);
  const signals = settled.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    const source = sources[index];
    return [{ id: `${source.id}-fatal-error`, title: `${source.name} feed failed`, summary: result.reason instanceof Error ? result.reason.message : "Unknown RSS failure", region: source.region, impact: "low" as const, source: source.name, url: source.url, publishedAt: new Date().toISOString() }];
  });

  const deduped = Array.from(new Map([...signals, ...finnhubSignals].map((s) => [s.title, s])).values());
  return deduped
    .filter((signal) => !/crypto|bitcoin|ether/i.test(`${signal.title} ${signal.summary}`))
    .map((signal) => enrichWithPortfolio(signal, holdings, session))
    .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
    .slice(0, 10);
}
