import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const repos = await prisma.repository.findMany({ include: { _count: { select: { commits: true } } }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(repos);
}

export async function POST(req: Request) {
  const body = await req.json();
  const repo = await prisma.repository.upsert({
    where: { path: body.path },
    update: { name: body.name, description: body.description, stack: body.stack ?? [] },
    create: { name: body.name, path: body.path, description: body.description, stack: body.stack ?? [] },
  });
  return NextResponse.json(repo);
}
