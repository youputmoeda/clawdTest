import path from "node:path";
import simpleGit from "simple-git";
import { prisma } from "../src/lib/prisma";

function parseStack(input?: string) {
  return input ? input.split(",").map((s) => s.trim()).filter(Boolean) : [];
}

async function main() {
  const repoPathArg = process.argv[2];
  if (!repoPathArg) {
    console.error("Usage: npm run devmind:register -- /path/to/repo [name] [stack,csv]");
    process.exit(1);
  }

  const repoPath = path.resolve(repoPathArg);
  const git = simpleGit(repoPath);
  const root = (await git.revparse(["--show-toplevel"])).trim();
  const branch = (await git.revparse(["--abbrev-ref", "HEAD"])).trim().catch(() => null);
  const name = process.argv[3] || path.basename(root);
  const stack = parseStack(process.argv[4]);

  const repo = await prisma.repository.upsert({
    where: { path: root },
    update: { name, mainBranch: branch, stack },
    create: { name, path: root, mainBranch: branch, stack },
  });

  console.log(JSON.stringify({ ok: true, repo }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(() => prisma.$disconnect());
