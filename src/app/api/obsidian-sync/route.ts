import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendDailyNote } from "@/lib/obsidian";

export async function POST() {
  const setting = await prisma.appSetting.findUnique({ where: { key: "obsidianVaultPath" } });
  const vault = setting?.value || process.env.OBSIDIAN_VAULT_PATH || "";
  if (!vault) return NextResponse.json({ ok: false, error: "Missing Obsidian vault path" }, { status: 400 });
  const commits = await prisma.commit.findMany({ include: { repository: true }, orderBy: { committedAt: "desc" }, take: 10 });
  const content = `# DevMind sync\n\n${commits.map((c) => `- ${c.repository.name}/${c.shortHash}: ${c.message}`).join("\n")}`;
  const file = await appendDailyNote(vault, content);
  return NextResponse.json({ ok: true, file });
}
