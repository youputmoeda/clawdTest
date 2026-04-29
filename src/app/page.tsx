import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

function JsonPill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300">{children}</span>;
}

export default async function Home() {
  const [profile, skills, repos, commits, decisions] = await Promise.all([
    prisma.userProfile.findFirst(),
    prisma.skill.findMany({ orderBy: [{ years: "desc" }, { name: "asc" }], take: 24 }),
    prisma.repository.findMany({ include: { _count: { select: { commits: true } } }, orderBy: { updatedAt: "desc" }, take: 8 }),
    prisma.commit.findMany({ include: { repository: true }, orderBy: { committedAt: "desc" }, take: 10 }),
    prisma.decision.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  return (
    <main className="min-h-screen bg-black text-zinc-100">
      <section className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">DevMind v0.1</p>
              <h1 className="mt-2 text-4xl font-bold">Personal engineering memory for Cursor + Obsidian</h1>
            </div>
            <Link className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-black" href="/api/cursor-context">View Cursor Context</Link>
          </div>
          <p className="max-w-3xl text-zinc-400">
            Tracks commits, keeps grounded technical memory, writes Obsidian notes, and generates Cursor rules so AI stops navegar na maionese.
          </p>
          <div className="flex flex-wrap gap-2">
            <JsonPill>{profile?.name ?? "João Magalhães"}</JsonPill>
            <JsonPill>{profile?.role ?? "Software Engineer"}</JsonPill>
            <JsonPill>Neon Postgres</JsonPill>
            <JsonPill>Cursor rules</JsonPill>
            <JsonPill>Obsidian-ready</JsonPill>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 lg:col-span-2">
            <h2 className="text-xl font-semibold">Recent commits</h2>
            <div className="mt-4 space-y-3">
              {commits.length ? commits.map((commit) => (
                <article key={commit.id} className="rounded-xl border border-zinc-800 bg-black p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
                    <span>{commit.repository.name}</span><span>•</span><code>{commit.shortHash}</code><span>•</span><span>{commit.committedAt.toLocaleString()}</span>
                  </div>
                  <h3 className="mt-2 font-medium">{commit.message}</h3>
                  <div className="mt-3 flex flex-wrap gap-2">{(commit.tags as string[]).map((tag) => <JsonPill key={tag}>#{tag}</JsonPill>)}</div>
                </article>
              )) : <p className="text-zinc-500">No commits captured yet. Install a hook with <code>npm run devmind:install-hook -- /path/to/repo</code>.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold">Grounded skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {skills.map((skill) => <JsonPill key={skill.id}>{skill.name}{skill.years ? ` · ${skill.years}y` : ""}</JsonPill>)}
            </div>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold">Repositories</h2>
            <div className="mt-4 space-y-2">
              {repos.length ? repos.map((repo) => <div key={repo.id} className="rounded-xl bg-black p-4"><div className="font-medium">{repo.name}</div><div className="text-sm text-zinc-500">{repo.path} · {repo._count.commits} commits</div></div>) : <p className="text-zinc-500">No repos registered yet.</p>}
            </div>
          </section>
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-xl font-semibold">Grounding rules / decisions</h2>
            <div className="mt-4 space-y-2">
              {decisions.map((d) => <div key={d.id} className="rounded-xl bg-black p-4"><div className="font-medium">{d.title}</div><p className="text-sm text-zinc-400">{d.description}</p></div>)}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
