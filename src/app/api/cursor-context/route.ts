import { NextResponse } from "next/server";
import { buildCursorContext, writeCursorContext } from "@/lib/cursor-context";

export async function GET() {
  return new NextResponse(await buildCursorContext(), { headers: { "content-type": "text/markdown; charset=utf-8" } });
}

export async function POST(req: Request) {
  const { repoPath } = await req.json();
  const target = await writeCursorContext(repoPath);
  return NextResponse.json({ ok: true, target });
}
