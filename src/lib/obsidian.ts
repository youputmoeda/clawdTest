import fs from "node:fs/promises";
import path from "node:path";
import { format } from "date-fns";

export async function appendDailyNote(vaultPath: string, content: string, date = new Date()) {
  if (!vaultPath) return null;
  const dir = path.join(vaultPath, "Dev", "Daily");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${format(date, "yyyy-MM-dd")}.md`);
  await fs.appendFile(file, `${content}\n\n`, "utf8");
  return file;
}

export async function writeProjectCommit(vaultPath: string, repoName: string, shortHash: string, content: string, date = new Date()) {
  if (!vaultPath) return null;
  const safeRepo = repoName.replace(/[^a-z0-9_.-]+/gi, "-");
  const dir = path.join(vaultPath, "Dev", "Commits", safeRepo);
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, `${format(date, "yyyy-MM-dd")}-${shortHash}.md`);
  await fs.writeFile(file, content, "utf8");
  return file;
}
