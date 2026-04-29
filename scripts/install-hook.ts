import fs from "node:fs/promises";
import path from "node:path";
import simpleGit from "simple-git";

async function main() {
  const repoPath = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const root = (await simpleGit(repoPath).revparse(["--show-toplevel"])).trim();
  const hookPath = path.join(root, ".git", "hooks", "post-commit");
  const appRoot = path.resolve(__dirname, "..");
  const hook = `#!/bin/sh\ncd "${appRoot}" || exit 0\nnpm run devmind:capture -- "${root}" >> "${root}/.git/devmind.log" 2>&1 || true\n`;
  await fs.writeFile(hookPath, hook, { mode: 0o755 });
  console.log(`Installed post-commit hook: ${hookPath}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
