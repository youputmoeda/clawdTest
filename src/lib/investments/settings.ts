import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import type { Holding, PortfolioAnalysis, PortfolioSettings } from "./types";

const settingsPath = path.join(process.cwd(), "data", "investment-settings.json");

const holdingSchema = z.object({
  ticker: z.string().min(1),
  isin: z.string().optional(),
  name: z.string().optional(),
  type: z.enum(["ETF UCITS", "Stock", "Bond ETF UCITS", "Cash-like ETF", "Other"]),
  quantity: z.coerce.number().optional(),
  averagePrice: z.coerce.number().optional(),
  currency: z.string().optional(),
  currentValue: z.coerce.number().optional(),
  tags: z.array(z.string()).optional(),
});

export const portfolioSettingsSchema = z.object({
  locale: z.enum(["pt-PT", "en-GB"]).default("pt-PT"),
  monthlyContribution: z.coerce.number().min(0).default(500),
  emergencyFundReady: z.coerce.boolean().default(false),
  preferredProfile: z.enum(["conservative", "moderate", "aggressive"]).default("moderate"),
  coreEtfTargetPercent: z.coerce.number().min(0).max(100).default(70),
  satelliteTargetPercent: z.coerce.number().min(0).max(100).default(20),
  maxSingleStockPercent: z.coerce.number().min(0).max(100).default(10),
  maxSectorPercent: z.coerce.number().min(0).max(100).default(35),
  maxUSPercent: z.coerce.number().min(0).max(100).default(70),
  preferAccumulatingEtfs: z.coerce.boolean().default(true),
  notes: z.string().default(""),
  holdings: z.array(holdingSchema).default([]),
});

export const defaultPortfolioSettings: PortfolioSettings = {
  locale: "pt-PT",
  monthlyContribution: 500,
  emergencyFundReady: false,
  preferredProfile: "moderate",
  coreEtfTargetPercent: 70,
  satelliteTargetPercent: 20,
  maxSingleStockPercent: 10,
  maxSectorPercent: 35,
  maxUSPercent: 70,
  preferAccumulatingEtfs: true,
  notes: "Default placeholder settings. Replace with real portfolio before relying on personalised scoring.",
  holdings: [],
};

export async function loadPortfolioSettings(): Promise<PortfolioSettings> {
  try {
    const raw = await fs.readFile(settingsPath, "utf8");
    return portfolioSettingsSchema.parse(JSON.parse(raw));
  } catch {
    return defaultPortfolioSettings;
  }
}

export async function savePortfolioSettings(input: unknown): Promise<PortfolioSettings> {
  const parsed = portfolioSettingsSchema.parse(input);
  await fs.mkdir(path.dirname(settingsPath), { recursive: true });
  await fs.writeFile(settingsPath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return parsed;
}

function valueOf(holding: Holding) {
  if (holding.currentValue !== undefined) return holding.currentValue;
  if (holding.quantity !== undefined && holding.averagePrice !== undefined) return holding.quantity * holding.averagePrice;
  return 0;
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return (value / total) * 100;
}

export function analysePortfolio(settings: PortfolioSettings): PortfolioAnalysis {
  const totalValue = settings.holdings.reduce((sum, holding) => sum + valueOf(holding), 0);
  const core = settings.holdings.filter((h) => h.type === "ETF UCITS").reduce((sum, h) => sum + valueOf(h), 0);
  const stocks = settings.holdings.filter((h) => h.type === "Stock").reduce((sum, h) => sum + valueOf(h), 0);
  const bondOrCash = settings.holdings.filter((h) => h.type === "Bond ETF UCITS" || h.type === "Cash-like ETF").reduce((sum, h) => sum + valueOf(h), 0);
  const usTagged = settings.holdings.filter((h) => h.tags?.includes("us")).reduce((sum, h) => sum + valueOf(h), 0);
  const techTagged = settings.holdings.filter((h) => h.tags?.includes("tech") || h.tags?.includes("ai")).reduce((sum, h) => sum + valueOf(h), 0);

  const coreEtfPercent = pct(core, totalValue);
  const stockPercent = pct(stocks, totalValue);
  const bondOrCashPercent = pct(bondOrCash, totalValue);
  const usTaggedPercent = pct(usTagged, totalValue);
  const techTaggedPercent = pct(techTagged, totalValue);

  const warnings: string[] = [];
  const allocationNotes: string[] = [];

  if (!settings.emergencyFundReady) warnings.push("Emergency fund not marked as ready; avoid over-allocating to risky assets.");
  if (!settings.holdings.length) warnings.push("No holdings configured yet; personalisation is based only on default rules.");
  if (coreEtfPercent < settings.coreEtfTargetPercent && totalValue > 0) allocationNotes.push("Core ETF allocation is below target; favour broad UCITS ETFs before adding satellites.");
  if (stockPercent > settings.satelliteTargetPercent && totalValue > 0) warnings.push("Single-stock/satellite exposure is above target.");
  if (usTaggedPercent > settings.maxUSPercent && totalValue > 0) warnings.push("US-tagged exposure is above configured max.");
  if (techTaggedPercent > settings.maxSectorPercent && totalValue > 0) warnings.push("Tech/AI tagged exposure is above configured sector max.");
  if (settings.monthlyContribution <= 0) warnings.push("Monthly contribution is zero; reports should be watchlist-only until contribution is set.");

  return { totalValue, coreEtfPercent, stockPercent, bondOrCashPercent, usTaggedPercent, techTaggedPercent, warnings, allocationNotes };
}
