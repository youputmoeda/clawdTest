import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const profile = await prisma.userProfile.findFirst();
  const skills = await prisma.skill.findMany({ orderBy: [{ years: "desc" }, { name: "asc" }] });
  return NextResponse.json({ profile, skills });
}
