import fs from "node:fs/promises";
import path from "node:path";

async function getPrisma() {
  if (!process.env.DATABASE_URL) return null;
  try {
    const mod = await import("@/lib/prisma");
    return mod.prisma;
  } catch {
    return null;
  }
}

const dataDir = path.join(process.cwd(), "data");

export async function readJsonSetting<T>(key: string, fallback: T): Promise<T> {
  const prisma = await getPrisma();
  if (prisma) {
    try {
      const row = await prisma.appSetting.findUnique({ where: { key } });
      if (row?.value) return JSON.parse(row.value) as T;
    } catch {
      // fallback to local file below
    }
  }

  try {
    const file = path.join(dataDir, `${key}.json`);
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonSetting<T>(key: string, value: T): Promise<T> {
  const serialized = JSON.stringify(value, null, 2);
  const prisma = await getPrisma();
  if (prisma) {
    try {
      await prisma.appSetting.upsert({
        where: { key },
        create: { key, value: serialized },
        update: { value: serialized },
      });
      return value;
    } catch {
      // fallback to local file below
    }
  }

  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, `${key}.json`), `${serialized}\n`, "utf8");
  return value;
}
