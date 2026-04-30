import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendDailyNote } from "@/lib/obsidian";

type CommitWithRepository = {
  shortHash: string;
  message: string;
  repository: { name: string };
};

export async function POST() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "obsidianVaultPath" } });
  const vault = setting?.value || process.env.OBSIDIAN_VAULT_PATH || "";
  if (!vault) return NextResponse.json({ ok: false, error: "Missing Obsidian vault path" }, { status: 400 });
  const commits = await prisma.commit.findMany({ include: { repository: true }, orderBy: { committedAt: "desc" }, take: 10 });
  const content = `# DevMind sync\n\n${(commits as CommitWithRepository[]).map((commit) => `- ${commit.repository.name}/${commit.shortHash}: ${commit.message}`).join("\n")}`;
  const file = await appendDailyNote(vault, content);
  return NextResponse.json({ ok: true, file });
}
