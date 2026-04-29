import { prisma } from "../src/lib/prisma";
import { defaultPreferences, defaultSkills } from "../src/lib/profile-defaults";

async function main() {
  await prisma.userProfile.upsert({
    where: { id: "default" },
    update: { preferences: defaultPreferences },
    create: {
      id: "default",
      name: "João Magalhães",
      role: "Software Engineer",
      email: "jptmagalhaes2001@gmail.com",
      portfolio: "https://magalhaescode.netlify.app/",
      linkedin: "https://www.linkedin.com/in/joaomagalhaes2001",
      preferences: defaultPreferences,
    },
  });

  for (const [name, years, source] of defaultSkills) {
    await prisma.skill.upsert({
      where: { name },
      update: { years: years ?? undefined, source: source as any },
      create: { name, years: years as number | null, source: source as any, notes: "Seeded from João's CV / explicit confirmations." },
    });
  }

  await prisma.decision.create({
    data: {
      title: "DevMind grounding rule",
      description: "AI should ground claims in CV, commits, Obsidian notes, or explicit user confirmation. If evidence is missing, ask or inspect before asserting.",
      source: "USER_CONFIRMED",
    },
  }).catch(() => null);
}

main().finally(() => prisma.$disconnect());
