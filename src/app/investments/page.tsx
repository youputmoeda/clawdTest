"use client";

import { useEffect, useMemo, useState } from "react";
import type { InvestmentIdea, InvestmentReport, MarketSession, RiskProfile } from "@/lib/investments/types";

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

function IdeaCard({ idea }: { idea: InvestmentIdea }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-black/40 p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">#{idea.rank} · {idea.type}</p>
          <h3 className="mt-1 text-xl font-bold text-zinc-50">{idea.ticker}</h3>
          <p className="text-sm text-zinc-400">{idea.name}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${confidenceClass[idea.confidence]}`}>
          {idea.confidence} confidence
        </span>
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
        <p className="mt-1"><strong className="text-zinc-200">DEGIRO:</strong> {idea.degiroNote}</p>
      </div>
    </article>
  );
}

export default function InvestmentsPage() {
  const [session, setSession] = useState<MarketSession>("europe-open");
  const [report, setReport] = useState<InvestmentReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailPreview, setEmailPreview] = useState<string>("");

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

  useEffect(() => {
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

        {report && (
          <>
            <section className="rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6">
              <h2 className="text-2xl font-bold">{report.title}</h2>
              <p className="mt-1 text-zinc-400">{report.subtitle}</p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {report.signals.map((signal) => (
                  <article key={signal.id} className="rounded-2xl border border-zinc-800 bg-black/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-zinc-400">{signal.region}</span>
                      <span className="text-xs uppercase tracking-widest text-emerald-300">{signal.impact}</span>
                    </div>
                    <h3 className="mt-3 font-bold text-zinc-100">{signal.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{signal.summary}</p>
                    <p className="mt-3 text-xs text-zinc-600">{signal.source}</p>
                  </article>
                ))}
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
