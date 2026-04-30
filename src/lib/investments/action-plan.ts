import type { PortfolioAnalysis, PortfolioSettings } from "./types";

export type ActionTodo = {
  title: string;
  amount?: number;
  reason: string;
  kind: "buy" | "avoid" | "review" | "save";
};

export type ActionPlan = {
  generatedAt: string;
  targetAmount: number;
  targetDate: string;
  currentValue: number;
  monthlyContribution: number;
  expectedAnnualReturn: number;
  requiredMonthlyContribution: number;
  projectedValueAtTargetDate: number;
  projectedGap: number;
  onTrack: boolean;
  assumptions: string[];
  todos: ActionTodo[];
  warnings: string[];
};

function monthsUntil(date: string) {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return 1;
  const now = new Date();
  return Math.max(1, (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth()));
}

function money(value: number) {
  return Math.max(0, Math.round(value * 100) / 100);
}

function futureValue(currentValue: number, monthlyContribution: number, months: number, annualReturnPercent: number) {
  const monthlyRate = annualReturnPercent / 100 / 12;
  if (Math.abs(monthlyRate) < 0.000001) return currentValue + monthlyContribution * months;
  const currentFuture = currentValue * Math.pow(1 + monthlyRate, months);
  const contributionFuture = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  return currentFuture + contributionFuture;
}

function requiredMonthly(currentValue: number, targetAmount: number, months: number, annualReturnPercent: number) {
  const monthlyRate = annualReturnPercent / 100 / 12;
  const currentFuture = currentValue * Math.pow(1 + monthlyRate, months);
  const remaining = targetAmount - currentFuture;
  if (remaining <= 0) return 0;
  if (Math.abs(monthlyRate) < 0.000001) return remaining / months;
  return remaining / ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
}

export function generateActionPlan(settings: PortfolioSettings, analysis: PortfolioAnalysis): ActionPlan {
  const months = monthsUntil(settings.targetDate);
  const expectedAnnualReturn = settings.expectedAnnualReturn;
  const requiredMonthlyContribution = money(requiredMonthly(analysis.totalValue, settings.targetAmount, months, expectedAnnualReturn));
  const projectedValueAtTargetDate = money(futureValue(analysis.totalValue, settings.monthlyContribution, months, expectedAnnualReturn));
  const projectedGap = money(Math.max(0, settings.targetAmount - projectedValueAtTargetDate));
  const onTrack = projectedValueAtTargetDate >= settings.targetAmount;
  const todos: ActionTodo[] = [];

  if (!settings.emergencyFundReady) {
    todos.push({
      title: "Priorizar fundo de emergência / bucket defensivo",
      amount: money(settings.monthlyContribution * 0.4),
      reason: "O fundo de emergência não está marcado como pronto; reduzir risco vem antes de aumentar satélites.",
      kind: "save",
    });
  }

  if (analysis.usTaggedPercent > settings.maxUSPercent || analysis.techTaggedPercent > settings.maxSectorPercent) {
    todos.push({
      title: "Não comprar mais US tech/Nasdaq/NVIDIA este mês",
      reason: `Exposição US ${analysis.usTaggedPercent.toFixed(1)}% e tech/AI ${analysis.techTaggedPercent.toFixed(1)}% estão acima dos limites configurados.`,
      kind: "avoid",
    });
  }

  const coreAmount = settings.emergencyFundReady ? settings.monthlyContribution * 0.75 : settings.monthlyContribution * 0.6;
  todos.push({
    title: "Reforçar core ETF global UCITS",
    amount: money(coreAmount),
    reason: "Mantém o plano simples, diversificado e menos dependente de stock picking.",
    kind: "buy",
  });

  const defensiveAmount = settings.monthlyContribution - coreAmount;
  if (defensiveAmount > 0) {
    todos.push({
      title: "Alocar restante a defensivo/cash-like/bonds",
      amount: money(defensiveAmount),
      reason: "Compensa a concentração actual e mantém liquidez para oportunidades melhores.",
      kind: "buy",
    });
  }

  todos.push({
    title: onTrack ? "Manter contribuição mensal actual" : "Aumentar contribuição mensal ou ajustar prazo/objectivo",
    amount: onTrack ? settings.monthlyContribution : requiredMonthlyContribution,
    reason: onTrack
      ? `Com ${settings.monthlyContribution.toFixed(0)}€/mês, assumindo ${expectedAnnualReturn.toFixed(1)}%/ano, a projecção chega a ~${projectedValueAtTargetDate.toFixed(0)}€ até ${settings.targetDate}.`
      : `Com ${settings.monthlyContribution.toFixed(0)}€/mês, assumindo ${expectedAnnualReturn.toFixed(1)}%/ano, ficas ~${projectedGap.toFixed(0)}€ abaixo. Ritmo necessário: ~${requiredMonthlyContribution.toFixed(0)}€/mês.`,
    kind: "review",
  });

  return {
    generatedAt: new Date().toISOString(),
    targetAmount: settings.targetAmount,
    targetDate: settings.targetDate,
    currentValue: analysis.totalValue,
    monthlyContribution: settings.monthlyContribution,
    expectedAnnualReturn,
    requiredMonthlyContribution,
    projectedValueAtTargetDate,
    projectedGap,
    onTrack,
    assumptions: [
      `Retorno anual esperado: ${expectedAnnualReturn.toFixed(1)}%.`,
      `Cálculo com capitalização mensal por ${months} meses.`,
      "Não inclui impostos, comissões, inflação, derrapagem cambial ou alterações futuras na contribuição.",
    ],
    todos,
    warnings: analysis.warnings,
  };
}
