import path from "node:path";
import { writeCursorContext } from "../src/lib/cursor-context";
import { prisma } from "../src/lib/prisma";

async function main() {
  const repoPath = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
  const target = await writeCursorContext(repoPath);
  console.log(`Wrote ${target}`);
}
main().finally(() => prisma.$disconnect());
