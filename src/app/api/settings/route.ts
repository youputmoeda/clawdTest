import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.appSetting.findMany();
  return NextResponse.json(Object.fromEntries(settings.map((s) => [s.key, s.value])));
}

export async function POST(req: Request) {
  const body = await req.json();
  const entries = Object.entries(body) as [string, string][];
  await Promise.all(entries.map(([key, value]) => prisma.appSetting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } })));
  return NextResponse.json({ ok: true });
}
