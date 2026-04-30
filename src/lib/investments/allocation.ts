import type { AppLocale, Holding, PortfolioAnalysis, PortfolioSettings } from "./types";

export type AllocationBucket = {
  id: "core" | "defensive" | "satellite" | "hold";
  label: string;
  amount: number;
  percent: number;
  rationale: string[];
  preferredInstruments: string[];
};

export type AllocationPlan = {
  monthlyContribution: number;
  generatedAt: string;
  buckets: AllocationBucket[];
  warnings: string[];
  rulesApplied: string[];
  summary: string;
};

const copy = {
  "pt-PT": {
    watchlistOnly: "Apenas watchlist",
    noNewMoney: "A contribuição mensal é zero, por isso o plano não deve alocar dinheiro novo.",
    noNewBuys: "Sem novas compras",
    noContribution: "Sem contribuição configurada",
    noAllocation: "Sem alocação gerada porque a contribuição mensal é 0 EUR.",
    emergencyRule: "Fundo de emergência não pronto: satélite a 0%, bucket defensivo aumentado.",
    usRule: "Exposição US acima do máximo: evitar satélites muito expostos aos EUA este mês.",
    techRule: "Exposição tech/AI acima do máximo: evitar Nasdaq/NVIDIA/AI adicional.",
    coreRule: "Core ETF abaixo do target: priorizar alocação core UCITS ampla.",
    coreLabel: "Core UCITS ETF",
    defensiveLabel: "Defensivo / cash / bonds",
    satelliteLabel: "Ações/temas satélite",
    coreRationale: "Mantém o portfolio ancorado em exposição UCITS diversificada.",
    currentCore: (v: number, target: number) => `Exposição core ETF actual: ${v.toFixed(1)}% vs target ${target}%.`,
    defensiveRationale: "Reduz risco enquanto fundo de emergência/concentração US-tech não está resolvida.",
    bondCash: (v: number) => `Exposição bonds/cash-like: ${v.toFixed(1)}%.`,
    satelliteRationale: "Satélites devem ficar limitados e respeitar limites de concentração US/tech.",
    stockExposure: (v: number) => `Exposição actual a ações: ${v.toFixed(1)}%.`,
    coreInstrument: "IWDA / VWCE-like broad global UCITS ETF",
    nonUS: "Preferir tilt não-US ou core global em vez de mais S&P/Nasdaq",
    cash: "XEON-like EUR cash/money-market ETF",
    bonds: "AGGH-like global aggregate bond UCITS ETF",
    emergencyFirst: "Fundo de emergência / reserva cash primeiro",
    cashIfSuitable: "XEON-like EUR cash/money-market ETF só se adequado",
    noUsTech: "Sem novo satélite US tech este mês",
    watchNvda: "Apenas watchlist para NVDA/MSFT/Nasdaq",
    qualityStocks: "Quality single stocks limitadas pela regra max single-stock",
    thematic: "Pequeno satélite UCITS temático apenas",
    techWarning: "Não adicionar mais tech/AI salvo override deliberado do limite.",
    summary: (c: number, b: number, us: number, tech: number) => `Alocar ${c.toFixed(0)} EUR em ${b} buckets. Portfolio com exposição US ${us.toFixed(1)}% e tech/AI ${tech.toFixed(1)}%.`,
  },
  "en-GB": {
    watchlistOnly: "Watchlist only",
    noNewMoney: "Monthly contribution is zero, so the plan should not allocate new money.",
    noNewBuys: "No new buys",
    noContribution: "No contribution configured",
    noAllocation: "No allocation generated because monthly contribution is 0 EUR.",
    emergencyRule: "Emergency fund not ready: satellite allocation set to 0%, defensive bucket increased.",
    usRule: "US exposure above max: avoid adding US-heavy satellites this month.",
    techRule: "Tech/AI exposure above max: avoid adding Nasdaq/NVIDIA/AI satellite exposure.",
    coreRule: "Core ETF below target: prioritise broad UCITS core allocation.",
    coreLabel: "Core UCITS ETF",
    defensiveLabel: "Defensive / cash / bonds",
    satelliteLabel: "Satellite stocks/themes",
    coreRationale: "Keeps portfolio anchored in diversified UCITS exposure.",
    currentCore: (v: number, target: number) => `Current core ETF exposure: ${v.toFixed(1)}% vs target ${target}%.`,
    defensiveRationale: "Reduces risk while emergency fund/US-tech concentration is unresolved.",
    bondCash: (v: number) => `Bond/cash-like exposure: ${v.toFixed(1)}%.`,
    satelliteRationale: "Satellite allocation should stay limited and respect US/tech concentration caps.",
    stockExposure: (v: number) => `Current stock exposure: ${v.toFixed(1)}%.`,
    coreInstrument: "IWDA / VWCE-like broad global UCITS ETF",
    nonUS: "Prefer non-US tilt or global core over extra S&P/Nasdaq exposure",
    cash: "XEON-like EUR cash/money-market ETF",
    bonds: "AGGH-like global aggregate bond UCITS ETF",
    emergencyFirst: "Emergency fund / cash reserve first",
    cashIfSuitable: "XEON-like EUR cash/money-market ETF only if suitable",
    noUsTech: "No new US tech satellite this month",
    watchNvda: "Watchlist only for NVDA/MSFT/Nasdaq",
    qualityStocks: "Quality single stocks capped by max single-stock rule",
    thematic: "Small thematic UCITS satellite only",
    techWarning: "Do not add more tech/AI exposure unless deliberately overriding the cap.",
    summary: (c: number, b: number, us: number, tech: number) => `Allocate ${c.toFixed(0)} EUR across ${b} buckets. Portfolio has US exposure ${us.toFixed(1)}%, tech/AI ${tech.toFixed(1)}%.`,
  },
} as const;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function holdingValue(holding: Holding) {
  if (holding.currentValue !== undefined) return holding.currentValue;
  if (holding.quantity !== undefined && holding.averagePrice !== undefined) return holding.quantity * holding.averagePrice;
  return 0;
}

function hasTag(settings: PortfolioSettings, tag: string) {
  return settings.holdings.some((h) => h.tags?.includes(tag));
}

export function generateAllocationPlan(settings: PortfolioSettings, analysis: PortfolioAnalysis): AllocationPlan {
  const t = copy[settings.locale as AppLocale] ?? copy["pt-PT"];
  const contribution = settings.monthlyContribution;
  const warnings = [...analysis.warnings];
  const rulesApplied: string[] = [];

  if (contribution <= 0) {
    return {
      monthlyContribution: contribution,
      generatedAt: new Date().toISOString(),
      buckets: [{ id: "hold", label: t.watchlistOnly, amount: 0, percent: 100, rationale: [t.noNewMoney], preferredInstruments: [t.noNewBuys] }],
      warnings,
      rulesApplied: [t.noContribution],
      summary: t.noAllocation,
    };
  }

  let corePercent = 70;
  let defensivePercent = 20;
  let satellitePercent = 10;

  if (!settings.emergencyFundReady) {
    defensivePercent += 20;
    satellitePercent = 0;
    corePercent = 60;
    rulesApplied.push(t.emergencyRule);
  }
  if (analysis.usTaggedPercent >= settings.maxUSPercent) {
    satellitePercent = Math.max(0, satellitePercent - 5);
    defensivePercent += 5;
    rulesApplied.push(t.usRule);
  }
  if (analysis.techTaggedPercent >= settings.maxSectorPercent) {
    satellitePercent = Math.max(0, satellitePercent - 5);
    corePercent += 5;
    rulesApplied.push(t.techRule);
  }
  if (analysis.coreEtfPercent < settings.coreEtfTargetPercent) {
    corePercent += 10;
    defensivePercent = Math.max(0, defensivePercent - 5);
    satellitePercent = Math.max(0, satellitePercent - 5);
    rulesApplied.push(t.coreRule);
  }

  const totalPercent = corePercent + defensivePercent + satellitePercent;
  corePercent = (corePercent / totalPercent) * 100;
  defensivePercent = (defensivePercent / totalPercent) * 100;
  satellitePercent = (satellitePercent / totalPercent) * 100;

  const coreInstruments: string[] = [t.coreInstrument];
  if (analysis.usTaggedPercent >= settings.maxUSPercent) coreInstruments.push(t.nonUS);
  const defensiveInstruments = settings.emergencyFundReady ? [t.cash, t.bonds] : [t.emergencyFirst, t.cashIfSuitable];
  const satelliteInstruments = analysis.techTaggedPercent >= settings.maxSectorPercent || analysis.usTaggedPercent >= settings.maxUSPercent ? [t.noUsTech, t.watchNvda] : [t.qualityStocks, t.thematic];

  const buckets: AllocationBucket[] = [
    { id: "core", label: t.coreLabel, percent: roundMoney(corePercent), amount: roundMoney((contribution * corePercent) / 100), rationale: [t.coreRationale, t.currentCore(analysis.coreEtfPercent, settings.coreEtfTargetPercent)], preferredInstruments: coreInstruments },
    { id: "defensive", label: t.defensiveLabel, percent: roundMoney(defensivePercent), amount: roundMoney((contribution * defensivePercent) / 100), rationale: [t.defensiveRationale, t.bondCash(analysis.bondOrCashPercent)], preferredInstruments: defensiveInstruments },
    { id: "satellite", label: t.satelliteLabel, percent: roundMoney(satellitePercent), amount: roundMoney((contribution * satellitePercent) / 100), rationale: [t.satelliteRationale, t.stockExposure(analysis.stockPercent)], preferredInstruments: satelliteInstruments },
  ];

  if (hasTag(settings, "tech") && analysis.techTaggedPercent >= settings.maxSectorPercent) warnings.push(t.techWarning);
  return { monthlyContribution: contribution, generatedAt: new Date().toISOString(), buckets, warnings, rulesApplied, summary: t.summary(contribution, buckets.length, analysis.usTaggedPercent, analysis.techTaggedPercent) };
}
