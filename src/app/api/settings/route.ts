import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type AppSettingRow = {
  key: string;
  value: string;
};

export async function GET() {
  const settings = await prisma.appSetting.findMany();
  return NextResponse.json(Object.fromEntries((settings as AppSettingRow[]).map((setting) => [setting.key, setting.value])));
}

export async function POST(req: Request) {
  const body = await req.json();
  const entries = Object.entries(body) as [string, string][];
  await Promise.all(
    entries.map(([key, value]) =>
      prisma.appSetting.upsert({ where: { key }, update: { value: String(value) }, create: { key, value: String(value) } }),
    ),
  );
  return NextResponse.json({ ok: true });
}
