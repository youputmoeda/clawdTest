import * as cheerio from "cheerio";
import type { MarketSession, MarketSignal } from "./types";

type RssSource = {
  id: string;
  name: string;
  url: string;
  region: MarketSignal["region"];
  sessions: MarketSession[];
};

const rssSources: RssSource[] = [
  {
    id: "ecb-press",
    name: "European Central Bank",
    url: "https://www.ecb.europa.eu/rss/press.html",
    region: "Europe",
    sessions: ["europe-open"],
  },
  {
    id: "fed-press",
    name: "Federal Reserve",
    url: "https://www.federalreserve.gov/feeds/press_all.xml",
    region: "US",
    sessions: ["us-open"],
  },
  {
    id: "yahoo-finance",
    name: "Yahoo Finance",
    url: "https://finance.yahoo.com/news/rssindex",
    region: "Global",
    sessions: ["europe-open", "us-open"],
  },
  {
    id: "marketwatch-topstories",
    name: "MarketWatch Top Stories",
    url: "https://feeds.marketwatch.com/marketwatch/topstories/",
    region: "US",
    sessions: ["us-open"],
  },
];

function text($: cheerio.CheerioAPI, el: any, selector: string) {
  return $(el).find(selector).first().text().trim();
}

function link($: cheerio.CheerioAPI, el: any) {
  return text($, el, "link") || $(el).find("link").first().attr("href") || undefined;
}

function impactFromTitle(title: string): MarketSignal["impact"] {
  const t = title.toLowerCase();
  if (/rate|inflation|cpi|fed|ecb|earnings|recession|tariff|war|jobs|yield/.test(t)) return "high";
  if (/market|stock|bond|euro|dollar|oil|ai|semiconductor|tech/.test(t)) return "medium";
  return "low";
}

function relevanceScore(signal: MarketSignal, session: MarketSession) {
  const text = `${signal.title} ${signal.summary}`.toLowerCase();
  let score = signal.impact === "high" ? 4 : signal.impact === "medium" ? 2 : 1;
  if (session === "europe-open" && /ecb|europe|euro|inflation|rate|bond/.test(text)) score += 3;
  if (session === "us-open" && /fed|us|nasdaq|s&p|earnings|cpi|jobs|ai|tech/.test(text)) score += 3;
  if (/crypto|bitcoin|ether/.test(text)) score -= 5;
  return score;
}

async function fetchSource(source: RssSource, session: MarketSession): Promise<MarketSignal[]> {
  try {
    const res = await fetch(source.url, {
      headers: {
        "user-agent": "Mozilla/5.0 investment-research-agent/0.1",
        accept: "application/rss+xml, application/xml, text/xml, */*",
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      return [
        {
          id: `${source.id}-error`,
          title: `${source.name} feed unavailable`,
          summary: `Could not fetch RSS feed: HTTP ${res.status}`,
          region: source.region,
          impact: "low",
          source: source.name,
          url: source.url,
          publishedAt: new Date().toISOString(),
        },
      ];
    }

    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items: MarketSignal[] = [];

    $("item, entry").slice(0, 8).each((index, el) => {
      const title = text($, el, "title");
      const summary = text($, el, "description") || text($, el, "summary") || text($, el, "content");
      const publishedAt = text($, el, "pubDate") || text($, el, "updated") || text($, el, "published") || undefined;
      if (!title) return;
      items.push({
        id: `${source.id}-${index}-${title.slice(0, 32)}`,
        title,
        summary: summary.replace(/<[^>]*>/g, "").slice(0, 260) || "No summary provided by source.",
        region: source.region,
        impact: impactFromTitle(title),
        source: source.name,
        url: link($, el),
        publishedAt,
      });
    });

    return items;
  } catch (err) {
    return [
      {
        id: `${source.id}-error`,
        title: `${source.name} feed error`,
        summary: err instanceof Error ? err.message : "Unknown RSS error",
        region: source.region,
        impact: "low",
        source: source.name,
        url: source.url,
        publishedAt: new Date().toISOString(),
      },
    ];
  }
}

export async function fetchMarketNews(session: MarketSession): Promise<MarketSignal[]> {
  const sources = rssSources.filter((source) => source.sessions.includes(session));
  const settled = await Promise.allSettled(sources.map((source) => fetchSource(source, session)));
  const signals = settled.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    const source = sources[index];
    return [
      {
        id: `${source.id}-fatal-error`,
        title: `${source.name} feed failed`,
        summary: result.reason instanceof Error ? result.reason.message : "Unknown RSS failure",
        region: source.region,
        impact: "low" as const,
        source: source.name,
        url: source.url,
        publishedAt: new Date().toISOString(),
      },
    ];
  });

  const deduped = Array.from(new Map(signals.map((s) => [s.title, s])).values());
  return deduped
    .filter((signal) => !/crypto|bitcoin|ether/i.test(`${signal.title} ${signal.summary}`))
    .sort((a, b) => relevanceScore(b, session) - relevanceScore(a, session))
    .slice(0, 6);
}
