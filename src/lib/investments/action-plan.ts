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
  requiredMonthlyContribution: number;
  onTrack: boolean;
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

export function generateActionPlan(settings: PortfolioSettings, analysis: PortfolioAnalysis): ActionPlan {
  const months = monthsUntil(settings.targetDate);
  const gap = Math.max(0, settings.targetAmount - analysis.totalValue);
  const requiredMonthlyContribution = money(gap / months);
  const onTrack = settings.monthlyContribution >= requiredMonthlyContribution;
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
      ? `Com ${settings.monthlyContribution.toFixed(0)}€/mês estás no ritmo para o objectivo, ignorando retorno de mercado.`
      : `Para chegar a ${settings.targetAmount.toFixed(0)}€ até ${settings.targetDate}, precisarias de cerca de ${requiredMonthlyContribution.toFixed(0)}€/mês, ignorando retorno de mercado.`,
    kind: "review",
  });

  return {
    generatedAt: new Date().toISOString(),
    targetAmount: settings.targetAmount,
    targetDate: settings.targetDate,
    currentValue: analysis.totalValue,
    monthlyContribution: settings.monthlyContribution,
    requiredMonthlyContribution,
    onTrack,
    todos,
    warnings: analysis.warnings,
  };
}
