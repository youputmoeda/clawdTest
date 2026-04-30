import * as cheerio from "cheerio";
import type { IdealistaListing } from "./types";

function absoluteUrl(href?: string) {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `https://www.idealista.pt${href.startsWith("/") ? href : `/${href}`}`;
}

export async function scrapeIdealista(url: string): Promise<{ listings: IdealistaListing[]; blocked: boolean; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "accept-language": "pt-PT,pt;q=0.9,en;q=0.8",
      },
      next: { revalidate: 0 },
    });

    const html = await res.text();
    const blocked = res.status >= 400 || /captcha|blocked|robot|access denied/i.test(html);
    if (blocked) return { listings: [], blocked: true, error: `Idealista returned status ${res.status} or anti-bot page.` };

    const $ = cheerio.load(html);
    const listings: IdealistaListing[] = [];

    $("article.item, article[data-element-id], .item").each((_, el) => {
      const root = $(el);
      const title = root.find(".item-link, a.item-link, a[href*='/imovel/']").first().text().trim();
      const href = root.find(".item-link, a.item-link, a[href*='/imovel/']").first().attr("href");
      const price = root.find(".item-price, .price-row").first().text().replace(/\s+/g, " ").trim();
      const location = root.find(".item-detail-char .item-detail, .item-location, .breadcrumb").first().text().replace(/\s+/g, " ").trim();
      const details = root.find(".item-detail-char span, .item-detail-char .item-detail").map((_, d) => $(d).text().trim()).get();
      const description = root.find(".item-description, .description").first().text().replace(/\s+/g, " ").trim();
      const area = details.find((d) => /m²|m2/.test(d));
      const bedrooms = details.find((d) => /T\d|quarto|hab/.test(d));
      const floor = details.find((d) => /andar|floor/i.test(d));

      if (title && href) {
        listings.push({
          title,
          price,
          location,
          url: absoluteUrl(href),
          propertyType: undefined,
          bedrooms,
          area,
          floor,
          description,
          source: "idealista",
        });
      }
    });

    return { listings: listings.slice(0, 40), blocked: false };
  } catch (error) {
    return { listings: [], blocked: true, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
