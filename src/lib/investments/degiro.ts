import type { Holding } from "./types";

const isinMap: Record<string, { ticker: string; type: Holding["type"]; tags: string[]; name?: string }> = {
  US1912161007: { ticker: "KO", type: "Stock", tags: ["us", "defensive", "consumer"], name: "Coca-Cola Co" },
  ES0127797019: { ticker: "EDPR", type: "Stock", tags: ["europe", "renewables", "energy"], name: "EDP Renováveis" },
  PTJMT0AE0001: { ticker: "JMT", type: "Stock", tags: ["europe", "portugal", "consumer"], name: "Jerónimo Martins" },
  US67066G1040: { ticker: "NVDA", type: "Stock", tags: ["us", "tech", "ai", "semiconductors"], name: "NVIDIA Corp" },
  IE00B4L5Y983: { ticker: "IWDA", type: "ETF UCITS", tags: ["core", "global", "developed", "ucits", "us"], name: "iShares Core MSCI World UCITS ETF" },
  IE00B5BMR087: { ticker: "SXR8", type: "ETF UCITS", tags: ["core", "us", "sp500", "ucits"], name: "iShares Core S&P 500 UCITS ETF" },
  IE00BYVQ9F29: { ticker: "NQSE", type: "ETF UCITS", tags: ["us", "tech", "nasdaq", "hedged", "ucits"], name: "iShares Nasdaq-100 UCITS EUR Hedged ETF" },
};

function parseCsvRows(input: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    const next = input[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field.trim());
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field || row.length) {
    row.push(field.trim());
    if (row.some(Boolean)) rows.push(row);
  }

  return rows;
}

function parsePtNumber(value?: string) {
  if (!value) return undefined;
  const cleaned = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

function inferFromProduct(product: string): { ticker: string; type: Holding["type"]; tags: string[] } {
  const p = product.toLowerCase();
  if (p.includes("cash")) return { ticker: "CASH_EUR", type: "Cash-like ETF", tags: ["cash", "eur", "defensive"] };
  if (p.includes("msci world")) return { ticker: "IWDA", type: "ETF UCITS", tags: ["core", "global", "developed", "ucits", "us"] };
  if (p.includes("s&p 500")) return { ticker: "SXR8", type: "ETF UCITS", tags: ["core", "us", "sp500", "ucits"] };
  if (p.includes("nasdaq")) return { ticker: "NQSE", type: "ETF UCITS", tags: ["us", "tech", "nasdaq", "hedged", "ucits"] };
  if (p.includes("nvidia")) return { ticker: "NVDA", type: "Stock", tags: ["us", "tech", "ai", "semiconductors"] };
  if (p.includes("coca-cola")) return { ticker: "KO", type: "Stock", tags: ["us", "defensive", "consumer"] };
  if (p.includes("edp renov")) return { ticker: "EDPR", type: "Stock", tags: ["europe", "renewables", "energy"] };
  if (p.includes("jeronimo") || p.includes("jerónimo")) return { ticker: "JMT", type: "Stock", tags: ["europe", "portugal", "consumer"] };
  return { ticker: product.slice(0, 12).toUpperCase(), type: "Other", tags: [] };
}

export function parseDegiroPortfolioCsv(input: string): Holding[] {
  const rows = parseCsvRows(input.replace(/^\uFEFF/, ""));
  if (rows.length < 2) return [];

  return rows.slice(1).map((row) => {
    const product = row[0] || "";
    const isin = (row[1] || "").trim().toUpperCase();
    const mapped = isinMap[isin] || inferFromProduct(product);
    const quantity = parsePtNumber(row[2]);
    const averagePrice = parsePtNumber(row[3]);
    const currency = row[4] || "EUR";
    const currentValue = parsePtNumber(row[6] || row[5]);

    return {
      ticker: mapped.ticker,
      isin: isin || undefined,
      name: mapped.name || product,
      type: mapped.type,
      quantity,
      averagePrice,
      currency,
      currentValue,
      tags: mapped.tags,
    } satisfies Holding;
  }).filter((holding) => holding.ticker && holding.currentValue !== undefined);
}
