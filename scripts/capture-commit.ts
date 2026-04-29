import path from "node:path";
import simpleGit from "simple-git";
import { prisma } from "../src/lib/prisma";
import { inferTags, summarizeCommit } from "../src/lib/summarize";
import { appendDailyNote, writeProjectCommit } from "../src/lib/obsidian";
import { writeCursorContext } from "../src/lib/cursor-context";

async function main() {
  const repoPath = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const git = simpleGit(repoPath);
  const [root, log, branch] = await Promise.all([git.revparse(["--show-toplevel"]), git.log({ maxCount: 1 }), git.revparse(["--abbrev-ref", "HEAD"])]);
  const latest = log.latest;
  if (!latest) throw new Error("No commit found");

  const repoName = path.basename(root.trim());
  const hash = latest.hash;
  const shortHash = hash.slice(0, 7);
  const files = (await git.show(["--name-only", "--format=", hash])).split("\n").map((x) => x.trim()).filter(Boolean);
  const diffStat = await git.show(["--stat", "--oneline", hash]);
  const tags = inferTags(files, latest.message);
  const aiSummary = summarizeCommit(latest.message, files, diffStat);

  const repo = await prisma.repository.upsert({
    where: { path: root.trim() },
    update: { name: repoName, mainBranch: branch.trim() },
    create: { name: repoName, path: root.trim(), mainBranch: branch.trim() },
  });

  const commit = await prisma.commit.upsert({
    where: { repoId_hash: { repoId: repo.id, hash } },
    update: { message: latest.message, files, diffSummary: diffStat, aiSummary, tags, branch: branch.trim() },
    create: {
      repoId: repo.id,
      hash,
      shortHash,
      branch: branch.trim(),
      message: latest.message,
      authorName: latest.author_name,
      authorEmail: latest.author_email,
      committedAt: new Date(latest.date),
      files,
      diffSummary: diffStat,
      aiSummary,
      tags,
      source: "GIT_HOOK",
    },
  });

  const vault = process.env.OBSIDIAN_VAULT_PATH || "";
  const md = `---\ntype: commit\nrepo: ${repoName}\nhash: ${hash}\ndate: ${latest.date}\ntags: [${tags.join(", ")}]\n---\n\n# ${repoName} ${shortHash}\n\n${aiSummary}\n`;
  await writeProjectCommit(vault, repoName, shortHash, md, new Date(latest.date));
  await appendDailyNote(vault, `## Commit ${repoName}/${shortHash}\n\n${aiSummary}`, new Date(latest.date));
  await writeCursorContext(root.trim()).catch(() => null);

  console.log(JSON.stringify({ ok: true, commit: commit.shortHash, repo: repo.name, tags }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
