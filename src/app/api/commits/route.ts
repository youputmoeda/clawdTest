import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const commits = await prisma.commit.findMany({ include: { repository: true }, orderBy: { committedAt: "desc" }, take: 50 });
  return NextResponse.json(commits);
}
