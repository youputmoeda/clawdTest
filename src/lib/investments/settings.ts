import { z } from "zod";
import { readJsonSetting, writeJsonSetting } from "./store";
import type { Holding, PortfolioAnalysis, PortfolioSettings } from "./types";

const SETTINGS_KEY = "investment-settings";

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

const msg = {
  "pt-PT": {
    emergency: "Fundo de emergência não marcado como pronto; evita sobre-alocar a activos de risco.",
    noHoldings: "Ainda não há holdings configuradas; a personalização usa apenas regras default.",
    coreBelow: "Alocação core ETF abaixo do target; favorecer ETFs UCITS amplos antes de satélites.",
    stockAbove: "Exposição a ações/satélites acima do target.",
    usAbove: "Exposição marcada como US acima do máximo configurado.",
    techAbove: "Exposição marcada como tech/AI acima do máximo sectorial configurado.",
    noContribution: "Contribuição mensal é zero; relatórios devem ser apenas watchlist.",
  },
  "en-GB": {
    emergency: "Emergency fund not marked as ready; avoid over-allocating to risky assets.",
    noHoldings: "No holdings configured yet; personalisation is based only on default rules.",
    coreBelow: "Core ETF allocation is below target; favour broad UCITS ETFs before adding satellites.",
    stockAbove: "Single-stock/satellite exposure is above target.",
    usAbove: "US-tagged exposure is above configured max.",
    techAbove: "Tech/AI tagged exposure is above configured sector max.",
    noContribution: "Monthly contribution is zero; reports should be watchlist-only until contribution is set.",
  },
} as const;

export async function loadPortfolioSettings(): Promise<PortfolioSettings> {
  const stored = await readJsonSetting<unknown>(SETTINGS_KEY, defaultPortfolioSettings);
  return portfolioSettingsSchema.parse(stored);
}

export async function savePortfolioSettings(input: unknown): Promise<PortfolioSettings> {
  const parsed = portfolioSettingsSchema.parse(input);
  return writeJsonSetting(SETTINGS_KEY, parsed);
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
  const t = msg[settings.locale] ?? msg["pt-PT"];
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

  if (!settings.emergencyFundReady) warnings.push(t.emergency);
  if (!settings.holdings.length) warnings.push(t.noHoldings);
  if (coreEtfPercent < settings.coreEtfTargetPercent && totalValue > 0) allocationNotes.push(t.coreBelow);
  if (stockPercent > settings.satelliteTargetPercent && totalValue > 0) warnings.push(t.stockAbove);
  if (usTaggedPercent > settings.maxUSPercent && totalValue > 0) warnings.push(t.usAbove);
  if (techTaggedPercent > settings.maxSectorPercent && totalValue > 0) warnings.push(t.techAbove);
  if (settings.monthlyContribution <= 0) warnings.push(t.noContribution);

  return { totalValue, coreEtfPercent, stockPercent, bondOrCashPercent, usTaggedPercent, techTaggedPercent, warnings, allocationNotes };
}
