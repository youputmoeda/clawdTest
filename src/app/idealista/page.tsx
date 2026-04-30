"use client";

import { useMemo, useState } from "react";

type Listing = {
  title: string;
  price?: string;
  location?: string;
  url: string;
  propertyType?: string;
  bedrooms?: string;
  area?: string;
  floor?: string;
  description?: string;
  source: string;
};

type SearchResult = {
  idealistaUrl: string;
  listings: Listing[];
  blocked: boolean;
  error?: string;
  message: string;
  filters: Record<string, unknown>;
};

const columns: { key: keyof Listing; label: string }[] = [
  { key: "title", label: "Título" },
  { key: "price", label: "Preço" },
  { key: "location", label: "Localização" },
  { key: "bedrooms", label: "Quartos" },
  { key: "area", label: "Área" },
  { key: "floor", label: "Piso" },
  { key: "description", label: "Descrição" },
  { key: "url", label: "URL" },
];

function toCsv(rows: Listing[]) {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    columns.map((c) => escape(c.label)).join(","),
    ...rows.map((row) => columns.map((c) => escape(row[c.key])).join(",")),
  ].join("\n");
}

export default function IdealistaPage() {
  const [mode, setMode] = useState<"structured" | "natural">("structured");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [form, setForm] = useState({
    naturalText: "T2 em Lisboa até 1200 euros com varanda e garagem",
    location: "Lisboa",
    operation: "arrendar",
    propertyType: "casas",
    minPrice: "",
    maxPrice: "1200",
    minBedrooms: "2",
    maxBedrooms: "",
    minArea: "",
    maxArea: "",
  });

  const csv = useMemo(() => toCsv(result?.listings ?? []), [result]);

  async function search() {
    setLoading(true);
    try {
      const payload = { mode, ...form };
      const res = await fetch("/api/idealista/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResult(data);
      if (data.idealistaUrl) window.open(data.idealistaUrl, "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "idealista-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadXlsx() {
    const res = await fetch("/api/idealista/export", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ listings: result?.listings ?? [] }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "idealista-results.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-400">Idealista Researcher</p>
          <h1 className="mt-2 text-4xl font-bold">Pesquisa casas, abre Idealista e gera tabela exportável</h1>
          <p className="mt-3 max-w-3xl text-zinc-400">
            Pesquisa por campos estruturados ou texto natural. A app abre o Idealista com os filtros e tenta extrair resultados públicos para tabela.
            Se o Idealista bloquear scraping, ficas com o URL gerado para inspeção manual.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="mb-4 flex rounded-xl bg-black p-1">
              <button onClick={() => setMode("structured")} className={`flex-1 rounded-lg px-3 py-2 ${mode === "structured" ? "bg-emerald-400 text-black" : "text-zinc-400"}`}>Campos</button>
              <button onClick={() => setMode("natural")} className={`flex-1 rounded-lg px-3 py-2 ${mode === "natural" ? "bg-emerald-400 text-black" : "text-zinc-400"}`}>Texto natural</button>
            </div>

            {mode === "natural" ? (
              <label className="block text-sm text-zinc-300">
                Pedido em linguagem natural
                <textarea className="mt-2 min-h-32 w-full rounded-xl border border-zinc-800 bg-black p-3 text-zinc-100" value={form.naturalText} onChange={(e) => setForm({ ...form, naturalText: e.target.value })} />
              </label>
            ) : (
              <div className="grid gap-3">
                <label className="text-sm text-zinc-300">Localização<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm text-zinc-300">Operação<select className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" value={form.operation} onChange={(e) => setForm({ ...form, operation: e.target.value })}><option value="arrendar">Arrendar</option><option value="comprar">Comprar</option></select></label>
                  <label className="text-sm text-zinc-300">Tipo<select className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" value={form.propertyType} onChange={(e) => setForm({ ...form, propertyType: e.target.value })}><option value="casas">Casas</option><option value="quartos">Quartos</option><option value="garagens">Garagens</option><option value="terrenos">Terrenos</option></select></label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm text-zinc-300">Preço min<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} /></label>
                  <label className="text-sm text-zinc-300">Preço max<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} /></label>
                  <label className="text-sm text-zinc-300">Quartos min<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" value={form.minBedrooms} onChange={(e) => setForm({ ...form, minBedrooms: e.target.value })} /></label>
                  <label className="text-sm text-zinc-300">Área min<input className="mt-1 w-full rounded-xl border border-zinc-800 bg-black p-3" value={form.minArea} onChange={(e) => setForm({ ...form, minArea: e.target.value })} /></label>
                </div>
              </div>
            )}

            <button onClick={search} disabled={loading} className="mt-5 w-full rounded-xl bg-emerald-400 px-5 py-3 font-bold text-black disabled:opacity-50">
              {loading ? "A pesquisar..." : "Pesquisar + abrir Idealista"}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Resultados</h2>
                {result?.idealistaUrl && <a className="text-sm text-emerald-400 underline" href={result.idealistaUrl} target="_blank">Abrir URL gerado</a>}
              </div>
              <div className="flex gap-2">
                <button onClick={downloadCsv} disabled={!result?.listings?.length} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">CSV</button>
                <button onClick={downloadXlsx} disabled={!result?.listings?.length} className="rounded-lg border border-zinc-700 px-3 py-2 disabled:opacity-40">Excel</button>
              </div>
            </div>

            {result && <p className={`mt-3 text-sm ${result.blocked ? "text-amber-300" : "text-zinc-400"}`}>{result.message}</p>}

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="text-zinc-400">
                  <tr>{columns.map((c) => <th key={c.key} className="border-b border-zinc-800 p-3">{c.label}</th>)}</tr>
                </thead>
                <tbody>
                  {(result?.listings ?? []).map((listing, index) => (
                    <tr key={`${listing.url}-${index}`} className="border-b border-zinc-900">
                      {columns.map((c) => <td key={c.key} className="max-w-xs p-3 align-top text-zinc-300">{c.key === "url" ? <a className="text-emerald-400 underline" href={listing.url} target="_blank">link</a> : String(listing[c.key] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {!result?.listings?.length && <p className="py-10 text-center text-zinc-500">Ainda sem resultados extraídos.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
