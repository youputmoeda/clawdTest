import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_.-]+/g, "-").replace(/^-|-$/g, "");
}

async function exportRepo(repoIdOrName?: string) {
  const where = repoIdOrName
    ? { OR: [{ id: repoIdOrName }, { name: repoIdOrName }, { path: repoIdOrName }] }
    : undefined;

  const repos = await prisma.repository.findMany({
    where,
    include: { commits: { orderBy: { committedAt: "desc" }, take: 50 }, decisions: { orderBy: { createdAt: "desc" } } },
    orderBy: { updatedAt: "desc" },
  });

  await fs.mkdir(path.join("memory", "projects"), { recursive: true });

  const indexLines = ["# DevMind Projects", "", "This folder is a portable project-memory export. It lets one GitHub repo act as the hub for many local projects.", ""];

  for (const repo of repos) {
    const slug = slugify(repo.name);
    const dir = path.join("memory", "projects", slug);
    await fs.mkdir(dir, { recursive: true });

    const md = `# ${repo.name}\n\n- Path: \`${repo.path}\`\n- Main branch: ${repo.mainBranch ?? "unknown"}\n- Stack: ${(repo.stack as string[]).join(", ") || "not set"}\n- Commits captured: ${repo.commits.length}\n\n## Recent commits\n\n${repo.commits.map((commit) => `### ${commit.shortHash} — ${commit.message}\n\n- Date: ${commit.committedAt.toISOString()}\n- Tags: ${(commit.tags as string[]).join(", ") || "none"}\n\n${commit.aiSummary ?? "No summary."}`).join("\n\n")}\n\n## Decisions\n\n${repo.decisions.map((decision) => `- **${decision.title}** — ${decision.description}`).join("\n") || "No decisions recorded."}\n`;

    await fs.writeFile(path.join(dir, "memory.md"), md, "utf8");
    indexLines.push(`- [${repo.name}](./${slug}/memory.md) — ${repo.commits.length} recent commits exported`);
  }

  await fs.writeFile(path.join("memory", "projects", "README.md"), `${indexLines.join("\n")}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, exported: repos.map((r) => r.name) }, null, 2));
}

exportRepo(process.argv[2]).catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
