"use client";

import { useEffect, useMemo, useState } from "react";
import type { Holding, InvestmentIdea, InvestmentReport, MarketSession, PortfolioSettings, RiskProfile } from "@/lib/investments/types";

const profileLabels: Record<RiskProfile, string> = {
  conservative: "Conservador",
  moderate: "Moderado",
  aggressive: "Agressivo",
};

const confidenceClass = {
  low: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  medium: "border-sky-500/40 bg-sky-500/10 text-sky-200",
  high: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200",
};

function inferHoldingType(ticker: string): Holding["type"] {
  const t = ticker.toUpperCase();
  if (["VWCE", "IWDA", "SXR8", "EXSA", "IUIT"].includes(t)) return "ETF UCITS";
  if (["AGGH"].includes(t)) return "Bond ETF UCITS";
  if (["XEON"].includes(t)) return "Cash-like ETF";
  if (t) return "Stock";
  return "Other";
}

function inferTags(ticker: string, type: Holding["type"]) {
  const t = ticker.toUpperCase();
  const tags = new Set<string>();
  if (type.includes("ETF")) tags.add("core");
  if (["SXR8", "IUIT", "MSFT", "BRK.B", "NVDA"].includes(t)) tags.add("us");
  if (["IUIT", "MSFT", "NVDA", "ASML"].includes(t)) tags.add("tech");
  if (["IUIT", "MSFT", "NVDA", "ASML"].includes(t)) tags.add("ai");
  if (["VWCE", "IWDA"].includes(t)) tags.add("global");
  return Array.from(tags);
}

function parseDegiroCsv(input: string): Holding[] {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delimiter).map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1);

  function pick(cols: string[], names: string[]) {
    for (const name of names) {
      const idx = headers.findIndex((h) => h.includes(name));
      if (idx >= 0 && cols[idx]) return cols[idx].replace(/^\"|\"$/g, "").trim();
    }
    return "";
  }

  function num(value: string) {
    const cleaned = value.replace(/\s/g, "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : undefined;
  }

  return rows.map((line) => {
    const cols = line.split(delimiter).map((c) => c.trim());
    const ticker = pick(cols, ["ticker", "símbolo", "symbol", "isin", "produto", "product"]).toUpperCase();
    const name = pick(cols, ["nome", "name", "produto", "product"]);
    const currentValue = num(pick(cols, ["valor", "value", "total", "montante"]));
    const quantity = num(pick(cols, ["quantidade", "quantity", "qtd"]));
    const averagePrice = num(pick(cols, ["preço", "price", "average", "médio", "medio"]));
    const currency = pick(cols, ["moeda", "currency"]) || "EUR";
    const type = inferHoldingType(ticker || name);
    return { ticker: ticker || name.slice(0, 12).toUpperCase(), name, type, quantity, averagePrice, currentValue, currency, tags: inferTags(ticker || name, type) } satisfies Holding;
  }).filter((holding) => holding.ticker);
}

function IdeaCard({ idea }: { idea: InvestmentIdea }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-black/40 p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">#{idea.rank} · {idea.type}</p>
          <h3 className="mt-1 text-xl font-bold text-zinc-50">{idea.ticker}</h3>
          <p className="text-sm text-zinc-400">{idea.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${confidenceClass[idea.confidence]}`}>
            {idea.confidence} confidence
          </span>
          <span className="text-xs text-zinc-500">score {idea.score}</span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
        <p><strong className="text-zinc-100">Preço:</strong> {idea.data.regularMarketPrice ? `${idea.data.regularMarketPrice.toFixed(2)} ${idea.data.currency}` : "n/d"}</p>
        <p className="mt-1"><strong className="text-zinc-100">Variação:</strong> {idea.data.changePercent !== undefined ? `${idea.data.changePercent.toFixed(2)}%` : "n/d"}</p>
        <p className="mt-1"><strong className="text-zinc-100">Fonte:</strong> {idea.data.source}</p>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-300"><strong className="text-zinc-100">Tese:</strong> {idea.thesis}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-emerald-300">Porquê agora</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
            {idea.whyNow.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-rose-300">Riscos</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-400">
            {idea.risks.map((item) => <li key={item}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-400">
        <p><strong className="text-zinc-200">Horizonte:</strong> {idea.horizon}</p>
        <p className="mt-2"><strong className="text-zinc-200">Personalização:</strong></p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {idea.personalization.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <p className="mt-2"><strong className="text-zinc-200">DEGIRO:</strong> {idea.degiroNote}</p>
      </div>
    </article>
  );
}

export default function InvestmentsPage() {
  const [session, setSession] = useState<MarketSession>("europe-open");
  const [report, setReport] = useState<InvestmentReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [emailPreview, setEmailPreview] = useState<string>("");
  const [settings, setSettings] = useState<PortfolioSettings | null>(null);
  const [holdingsJson, setHoldingsJson] = useState("[]");
  const [csvImport, setCsvImport] = useState("");

  async function loadReport(nextSession = session) {
    setLoading(true);
    try {
      const res = await fetch(`/api/investments/report?session=${nextSession}`, { cache: "no-store" });
      const data = await res.json();
      setReport(data);
      setEmailPreview("");
    } finally {
      setLoading(false);
    }
  }

  async function previewEmail() {
    const res = await fetch(`/api/investments/email-preview?session=${session}`, { cache: "no-store" });
    const data = await res.json();
    setEmailPreview(data.email.text);
  }

  async function loadSettings() {
    const res = await fetch("/api/investments/settings", { cache: "no-store" });
    const data = await res.json();
    setSettings(data.settings);
    setHoldingsJson(JSON.stringify(data.settings.holdings ?? [], null, 2));
  }

  async function saveSettings() {
    if (!settings) return;
    setSavingSettings(true);
    try {
      const payload = { ...settings, holdings: JSON.parse(holdingsJson || "[]") };
      const res = await fetch("/api/investments/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSettings(data.settings);
      setHoldingsJson(JSON.stringify(data.settings.holdings ?? [], null, 2));
      await loadReport(session);
    } finally {
      setSavingSettings(false);
    }
  }

  useEffect(() => {
    loadSettings();
    loadReport("europe-open");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generated = useMemo(() => {
    if (!report) return "";
    return new Date(report.generatedAt).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" });
  }, [report]);

  function switchSession(next: MarketSession) {
    setSession(next);
    loadReport(next);
  }

  function updateHolding(index: number, patch: Partial<Holding>) {
    if (!settings) return;
    const holdings = [...settings.holdings];
    holdings[index] = { ...holdings[index], ...patch };
    setSettings({ ...settings, holdings });
    setHoldingsJson(JSON.stringify(holdings, null, 2));
  }

  function addHolding() {
    if (!settings) return;
    const holding: Holding = { ticker: "VWCE", name: "", type: "ETF UCITS", currentValue: 0, currency: "EUR", tags: ["core", "global"] };
    const holdings = [...settings.holdings, holding];
    setSettings({ ...settings, holdings });
    setHoldingsJson(JSON.stringify(holdings, null, 2));
  }

  function removeHolding(index: number) {
    if (!settings) return;
    const holdings = settings.holdings.filter((_, i) => i !== index);
    setSettings({ ...settings, holdings });
    setHoldingsJson(JSON.stringify(holdings, null, 2));
  }

  function importCsv() {
    if (!settings) return;
    const parsed = parseDegiroCsv(csvImport);
    const holdings = [...settings.holdings, ...parsed];
    setSettings({ ...settings, holdings });
    setHoldingsJson(JSON.stringify(holdings, null, 2));
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#064e3b_0,#09090b_36%,#000_100%)] px-5 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-zinc-950/80 p-8 shadow-2xl shadow-emerald-950/30 backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.32em] text-emerald-300">Investment Research Agent</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight md:text-6xl">Market-open research para Portugal + DEGIRO</h1>
              <p className="mt-4 max-w-3xl text-zinc-400">
                Relatórios para Europa e EUA, com três perfis de risco. Sem crypto. Foco em ETFs UCITS e ações que fazem sentido para um investidor EU.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-black/50 p-4 text-sm text-zinc-300">
              <p><strong className="text-zinc-100">Broker:</strong> DEGIRO</p>
              <p><strong className="text-zinc-100">Base:</strong> EUR · Portugal/EU</p>
              <p><strong className="text-zinc-100">Email:</strong> jptms@iscte-iul.pt</p>
              <p><strong className="text-zinc-100">Crypto:</strong> excluída</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => switchSession("europe-open")}
              className={`rounded-xl px-5 py-3 font-semibold ${session === "europe-open" ? "bg-emerald-400 text-black" : "border border-zinc-800 bg-zinc-950 text-zinc-300"}`}
            >
              Europa open
            </button>
            <button
              onClick={() => switchSession("us-open")}
              className={`rounded-xl px-5 py-3 font-semibold ${session === "us-open" ? "bg-emerald-400 text-black" : "border border-zinc-800 bg-zinc-950 text-zinc-300"}`}
            >
              EUA open
            </button>
            <button onClick={() => loadReport()} className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 font-semibold text-zinc-300">
              {loading ? "A gerar..." : "Gerar relatório"}
            </button>
            <button onClick={previewEmail} className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-5 py-3 font-semibold text-emerald-200">
              Preview email
            </button>
          </div>
          {report && <p className="text-sm text-zinc-500">Gerado: {generated}</p>}
        </section>

        {settings && (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Personalização</p>
                <h2 className="mt-1 text-3xl font-black">Portfolio & regras</h2>
                <p className="mt-2 text-zinc-400">Estas regras ajustam o score: core ETF target, limite de stocks, exposição US/tech, fundo de emergência e contribuição mensal.</p>
              </div>
              <button onClick={saveSettings} className="rounded-xl bg-emerald-400 px-5 py-3 font-bold text-black disabled:opacity-50" disabled={savingSettings}>
                {savingSettings ? "A guardar..." : "Guardar settings"}
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <label className="text-sm text-zinc-300">Investimento mensal (€)<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" type="number" value={settings.monthlyContribution} onChange={(e) => setSettings({ ...settings, monthlyContribution: Number(e.target.value) })} /></label>
              <label className="text-sm text-zinc-300">Perfil preferido<select className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" value={settings.preferredProfile} onChange={(e) => setSettings({ ...settings, preferredProfile: e.target.value as RiskProfile })}><option value="conservative">Conservador</option><option value="moderate">Moderado</option><option value="aggressive">Agressivo</option></select></label>
              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-300"><input type="checkbox" checked={settings.emergencyFundReady} onChange={(e) => setSettings({ ...settings, emergencyFundReady: e.target.checked })} /> Fundo de emergência pronto</label>
              <label className="text-sm text-zinc-300">Core ETF target %<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" type="number" value={settings.coreEtfTargetPercent} onChange={(e) => setSettings({ ...settings, coreEtfTargetPercent: Number(e.target.value) })} /></label>
              <label className="text-sm text-zinc-300">Satélite/stocks target %<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" type="number" value={settings.satelliteTargetPercent} onChange={(e) => setSettings({ ...settings, satelliteTargetPercent: Number(e.target.value) })} /></label>
              <label className="text-sm text-zinc-300">Máx single stock %<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" type="number" value={settings.maxSingleStockPercent} onChange={(e) => setSettings({ ...settings, maxSingleStockPercent: Number(e.target.value) })} /></label>
              <label className="text-sm text-zinc-300">Máx sector/tech %<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" type="number" value={settings.maxSectorPercent} onChange={(e) => setSettings({ ...settings, maxSectorPercent: Number(e.target.value) })} /></label>
              <label className="text-sm text-zinc-300">Máx US %<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" type="number" value={settings.maxUSPercent} onChange={(e) => setSettings({ ...settings, maxUSPercent: Number(e.target.value) })} /></label>
              <label className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-300"><input type="checkbox" checked={settings.preferAccumulatingEtfs} onChange={(e) => setSettings({ ...settings, preferAccumulatingEtfs: e.target.checked })} /> Preferir accumulating ETFs</label>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <label className="text-sm text-zinc-300">Notas pessoais<textarea className="mt-1 min-h-32 w-full rounded-xl border border-zinc-800 bg-black p-3" value={settings.notes} onChange={(e) => setSettings({ ...settings, notes: e.target.value })} /></label>
              <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-zinc-100">Import DEGIRO CSV</p>
                    <p className="text-xs text-zinc-500">Cola export CSV/semicolon. Parser é tolerante e tenta inferir ticker/tipo/tags.</p>
                  </div>
                  <button onClick={importCsv} className="rounded-lg border border-emerald-500/40 px-3 py-2 text-sm text-emerald-200">Importar</button>
                </div>
                <textarea className="mt-3 min-h-24 w-full rounded-xl border border-zinc-800 bg-black p-3 font-mono text-xs text-zinc-300" value={csvImport} onChange={(e) => setCsvImport(e.target.value)} placeholder="Produto;Ticker;Quantidade;Preço médio;Valor;Moeda" />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-100">Holdings</p>
                  <p className="text-xs text-zinc-500">Editor visual — já não precisas mexer em JSON para o básico.</p>
                </div>
                <button onClick={addHolding} className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-black">Adicionar holding</button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm text-zinc-300">
                  <thead className="text-xs uppercase text-zinc-500">
                    <tr><th className="p-2">Ticker</th><th className="p-2">Nome</th><th className="p-2">Tipo</th><th className="p-2">Valor €</th><th className="p-2">Tags</th><th className="p-2"></th></tr>
                  </thead>
                  <tbody>
                    {settings.holdings.map((holding, index) => (
                      <tr key={`${holding.ticker}-${index}`} className="border-t border-zinc-900">
                        <td className="p-2"><input className="w-28 rounded-lg border border-zinc-800 bg-black p-2" value={holding.ticker} onChange={(e) => updateHolding(index, { ticker: e.target.value.toUpperCase(), tags: inferTags(e.target.value, holding.type) })} /></td>
                        <td className="p-2"><input className="w-56 rounded-lg border border-zinc-800 bg-black p-2" value={holding.name ?? ""} onChange={(e) => updateHolding(index, { name: e.target.value })} /></td>
                        <td className="p-2"><select className="rounded-lg border border-zinc-800 bg-black p-2" value={holding.type} onChange={(e) => updateHolding(index, { type: e.target.value as Holding["type"], tags: inferTags(holding.ticker, e.target.value as Holding["type"]) })}><option>ETF UCITS</option><option>Stock</option><option>Bond ETF UCITS</option><option>Cash-like ETF</option><option>Other</option></select></td>
                        <td className="p-2"><input className="w-28 rounded-lg border border-zinc-800 bg-black p-2" type="number" value={holding.currentValue ?? 0} onChange={(e) => updateHolding(index, { currentValue: Number(e.target.value) })} /></td>
                        <td className="p-2"><input className="w-48 rounded-lg border border-zinc-800 bg-black p-2" value={(holding.tags ?? []).join(",")} onChange={(e) => updateHolding(index, { tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} /></td>
                        <td className="p-2"><button onClick={() => removeHolding(index)} className="rounded-lg border border-rose-500/40 px-3 py-2 text-rose-200">Remover</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!settings.holdings.length && <p className="py-6 text-center text-zinc-500">Sem holdings ainda. Adiciona manualmente ou cola CSV da DEGIRO.</p>}
              </div>
            </div>

            <details className="mt-4 rounded-2xl border border-zinc-800 bg-black/30 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-300">JSON avançado</summary>
              <textarea className="mt-3 min-h-32 w-full rounded-xl border border-zinc-800 bg-black p-3 font-mono text-xs" value={holdingsJson} onChange={(e) => setHoldingsJson(e.target.value)} />
            </details>
          </section>
        )}

        {report && (
          <>
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
              <h2 className="text-2xl font-bold">{report.title}</h2>
              <p className="mt-1 text-zinc-400">{report.subtitle}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4"><p className="text-xs uppercase text-zinc-500">Portfolio</p><p className="mt-1 text-xl font-bold">€{report.portfolioAnalysis.totalValue.toFixed(0)}</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4"><p className="text-xs uppercase text-zinc-500">Core ETF</p><p className="mt-1 text-xl font-bold">{report.portfolioAnalysis.coreEtfPercent.toFixed(1)}%</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4"><p className="text-xs uppercase text-zinc-500">Stocks</p><p className="mt-1 text-xl font-bold">{report.portfolioAnalysis.stockPercent.toFixed(1)}%</p></div>
                <div className="rounded-2xl border border-zinc-800 bg-black/40 p-4"><p className="text-xs uppercase text-zinc-500">US / Tech</p><p className="mt-1 text-xl font-bold">{report.portfolioAnalysis.usTaggedPercent.toFixed(1)}% / {report.portfolioAnalysis.techTaggedPercent.toFixed(1)}%</p></div>
              </div>

              <div className={`mt-4 rounded-2xl border p-4 text-sm ${report.dataFreshness.ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100" : "border-amber-500/30 bg-amber-500/10 text-amber-100"}`}>
                <p><strong>Data freshness:</strong> {report.dataFreshness.ok ? "OK" : "degraded"}</p>
                <p className="mt-1"><strong>Fetched:</strong> {new Date(report.dataFreshness.fetchedAt).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" })}</p>
                <p className="mt-1"><strong>Live sources:</strong> {report.dataFreshness.sourceCount}</p>
                {!!report.dataFreshness.errors.length && <p className="mt-1"><strong>Errors:</strong> {report.dataFreshness.errors.join(" | ")}</p>}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {report.signals.map((signal) => (
                  <article key={signal.id} className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-400">{signal.region}</span>
                      <span className="text-xs uppercase tracking-widest text-emerald-300">{signal.impact}</span>
                    </div>
                    <h3 className="mt-3 font-bold text-zinc-100">{signal.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{signal.summary}</p>
                    <p className="mt-3 text-xs text-zinc-600">{signal.source}{signal.publishedAt ? ` · ${signal.publishedAt}` : ""}</p>
                  </article>
                ))}
              </div>

              <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-800 bg-black/30">
                <table className="min-w-full text-left text-sm text-zinc-300">
                  <thead className="bg-zinc-950 text-zinc-500">
                    <tr>
                      <th className="p-3">Ticker</th>
                      <th className="p-3">Preço</th>
                      <th className="p-3">Variação</th>
                      <th className="p-3">Moeda</th>
                      <th className="p-3">Fonte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.marketData.map((point) => (
                      <tr key={point.symbol} className="border-t border-zinc-900">
                        <td className="p-3 font-medium text-zinc-100">{point.label}</td>
                        <td className="p-3">{point.regularMarketPrice !== undefined ? point.regularMarketPrice.toFixed(2) : "n/d"}</td>
                        <td className="p-3">{point.changePercent !== undefined ? `${point.changePercent.toFixed(2)}%` : "n/d"}</td>
                        <td className="p-3">{point.currency}</td>
                        <td className="p-3">{point.error ? `${point.source} (${point.error})` : point.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {report.profiles.map((profile) => (
              <section key={profile.profile} className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
                <div className="mb-5">
                  <p className="text-sm uppercase tracking-[0.28em] text-emerald-300">Perfil</p>
                  <h2 className="mt-1 text-3xl font-black">{profileLabels[profile.profile]}</h2>
                  <p className="mt-2 max-w-4xl text-zinc-400">{profile.profileWhy}</p>
                </div>
                <div className="grid gap-4 xl:grid-cols-3">
                  {profile.ideas.map((idea) => <IdeaCard key={`${profile.profile}-${idea.rank}-${idea.ticker}`} idea={idea} />)}
                </div>
              </section>
            ))}

            <section className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
              <h2 className="text-xl font-bold">Notas e guardrails</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-400">
                {report.notes.map((note) => <li key={note}>{note}</li>)}
              </ul>
              <p className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">{report.disclaimer}</p>
            </section>
          </>
        )}

        {emailPreview && (
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-xl font-bold">Email preview</h2>
            <p className="mt-1 text-sm text-zinc-500">Ainda não envia email real — isto é o conteúdo que será enviado quando ligarmos SMTP/Resend.</p>
            <pre className="mt-4 max-h-[480px] overflow-auto whitespace-pre-wrap rounded-2xl bg-black p-4 text-xs leading-5 text-zinc-300">{emailPreview}</pre>
          </section>
        )}
      </div>
    </main>
  );
}
