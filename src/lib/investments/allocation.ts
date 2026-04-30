import type { Holding, PortfolioAnalysis, PortfolioSettings } from "./types";

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
  const contribution = settings.monthlyContribution;
  const warnings = [...analysis.warnings];
  const rulesApplied: string[] = [];

  if (contribution <= 0) {
    return {
      monthlyContribution: contribution,
      generatedAt: new Date().toISOString(),
      buckets: [
        {
          id: "hold",
          label: "Watchlist only",
          amount: 0,
          percent: 100,
          rationale: ["Monthly contribution is zero, so the plan should not allocate new money."],
          preferredInstruments: ["No new buys"],
        },
      ],
      warnings,
      rulesApplied: ["No contribution configured"],
      summary: "No allocation generated because monthly contribution is 0 EUR.",
    };
  }

  let corePercent = 70;
  let defensivePercent = 20;
  let satellitePercent = 10;

  if (!settings.emergencyFundReady) {
    defensivePercent += 20;
    satellitePercent = 0;
    corePercent = 60;
    rulesApplied.push("Emergency fund not ready: satellite allocation set to 0%, defensive bucket increased.");
  }

  if (analysis.usTaggedPercent >= settings.maxUSPercent) {
    satellitePercent = Math.max(0, satellitePercent - 5);
    defensivePercent += 5;
    rulesApplied.push("US exposure above max: avoid adding US-heavy satellites this month.");
  }

  if (analysis.techTaggedPercent >= settings.maxSectorPercent) {
    satellitePercent = Math.max(0, satellitePercent - 5);
    corePercent += 5;
    rulesApplied.push("Tech/AI exposure above max: avoid adding Nasdaq/NVIDIA/AI satellite exposure.");
  }

  if (analysis.coreEtfPercent < settings.coreEtfTargetPercent) {
    corePercent += 10;
    defensivePercent = Math.max(0, defensivePercent - 5);
    satellitePercent = Math.max(0, satellitePercent - 5);
    rulesApplied.push("Core ETF below target: prioritise broad UCITS core allocation.");
  }

  const totalPercent = corePercent + defensivePercent + satellitePercent;
  corePercent = (corePercent / totalPercent) * 100;
  defensivePercent = (defensivePercent / totalPercent) * 100;
  satellitePercent = (satellitePercent / totalPercent) * 100;

  const coreInstruments = ["IWDA / VWCE-like broad global UCITS ETF"];
  if (analysis.usTaggedPercent >= settings.maxUSPercent) coreInstruments.push("Prefer non-US tilt or global core over extra S&P/Nasdaq exposure");
  const defensiveInstruments = settings.emergencyFundReady
    ? ["XEON-like EUR cash/money-market ETF", "AGGH-like global aggregate bond UCITS ETF"]
    : ["Emergency fund / cash reserve first", "XEON-like EUR cash/money-market ETF only if suitable"];
  const satelliteInstruments = analysis.techTaggedPercent >= settings.maxSectorPercent || analysis.usTaggedPercent >= settings.maxUSPercent
    ? ["No new US tech satellite this month", "Watchlist only for NVDA/MSFT/Nasdaq"]
    : ["Quality single stocks capped by max single-stock rule", "Small thematic UCITS satellite only"];

  const buckets: AllocationBucket[] = [
    {
      id: "core",
      label: "Core UCITS ETF",
      percent: roundMoney(corePercent),
      amount: roundMoney((contribution * corePercent) / 100),
      rationale: ["Keeps portfolio anchored in diversified UCITS exposure.", `Current core ETF exposure: ${analysis.coreEtfPercent.toFixed(1)}% vs target ${settings.coreEtfTargetPercent}%.`],
      preferredInstruments: coreInstruments,
    },
    {
      id: "defensive",
      label: "Defensive / cash / bonds",
      percent: roundMoney(defensivePercent),
      amount: roundMoney((contribution * defensivePercent) / 100),
      rationale: ["Reduces risk while emergency fund/US-tech concentration is unresolved.", `Bond/cash-like exposure: ${analysis.bondOrCashPercent.toFixed(1)}%.`],
      preferredInstruments: defensiveInstruments,
    },
    {
      id: "satellite",
      label: "Satellite stocks/themes",
      percent: roundMoney(satellitePercent),
      amount: roundMoney((contribution * satellitePercent) / 100),
      rationale: ["Satellite allocation should stay limited and respect US/tech concentration caps.", `Current stock exposure: ${analysis.stockPercent.toFixed(1)}%.`],
      preferredInstruments: satelliteInstruments,
    },
  ];

  const investedHoldings = settings.holdings.filter((h) => holdingValue(h) > 0).length;
  const summary = `Allocate ${contribution.toFixed(0)} EUR across ${buckets.length} buckets. Portfolio has ${investedHoldings} valued holdings; US exposure ${analysis.usTaggedPercent.toFixed(1)}%, tech/AI ${analysis.techTaggedPercent.toFixed(1)}%.`;

  if (hasTag(settings, "tech") && analysis.techTaggedPercent >= settings.maxSectorPercent) warnings.push("Do not add more tech/AI exposure unless deliberately overriding the cap.");

  return { monthlyContribution: contribution, generatedAt: new Date().toISOString(), buckets, warnings, rulesApplied, summary };
}
