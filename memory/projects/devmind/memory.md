# devmind

- Path: `/home/node/.openclaw/workspace/devmind`
- Main branch: master
- Stack: not set
- Commits captured: 3

## Recent commits

### 885f2ed — Update generated AI context

- Date: 2026-04-30T00:00:38.000Z
- Tags: none

Commit: Update generated AI context

Likely areas: general development.

Changed files:
- .cursor/rules/devmind-memory.mdc
- AI_CONTEXT.md

Diff/stat:
885f2ed Update generated AI context
 .cursor/rules/devmind-memory.mdc | 1 +
 AI_CONTEXT.md                    | 1 +
 2 files changed, 2 insertions(+)


### d98b53a — Capture initial commit context

- Date: 2026-04-29T23:50:20.000Z
- Tags: none

Commit: Capture initial commit context

Likely areas: general development.

Changed files:
- .cursor/rules/devmind-memory.mdc
- AI_CONTEXT.md

Diff/stat:
d98b53a Capture initial commit context
 .cursor/rules/devmind-memory.mdc | 2 +-
 AI_CONTEXT.md                    | 2 +-
 2 files changed, 2 insertions(+), 2 deletions(-)


### a813ec8 — Initial DevMind MVP

- Date: 2026-04-29T23:49:18.000Z
- Tags: frontend, backend, database

Commit: Initial DevMind MVP

Likely areas: frontend, backend, database.

Changed files:
- .cursor/rules/devmind-memory.mdc
- .env.example
- .gitignore
- AGENTS.md
- AI_CONTEXT.md
- CLAUDE.md
- README.md
- eslint.config.mjs
- next.config.ts
- package-lock.json
- package.json
- postcss.config.mjs
- ...and 27 more

Diff/stat:
a813ec8 Initial DevMind MVP
 .cursor/rules/devmind-memory.mdc    |   46 +
 .env.example                        |    3 +
 .gitignore                          |   30 +
 AGENTS.md                           |    5 +
 AI_CONTEXT.md                       |   46 +
 CLAUDE.md                           |    1 +
 README.md                           |   81 +
 eslint.config.mjs                   |   18 +
 next.config.ts                      |    7 +
 package-lock.json                   | 8321 +++++++++++++++++++++++++++++++++++
 package.json                        |   43 +
 postcss.config.mjs                  |    7 +
 prisma.config.ts                    |    8 +
 prisma/schema.prisma                |  108 +
 public/file.svg                     |    1 +
 public/globe.svg                    |    1 +
 public/next.svg                     |    1 +
 public/vercel.svg                   |    1 +
 public/window.svg                   |    1 +
 scripts/capture-commit.ts           |   61 +
 scripts/generate-cursor-context.ts  |   10 +
 scripts/install-hook.ts             |   14 +
 scripts/seed-profile.ts             |   36 +
 src/app/api/commits/route.ts        |    7 +
 src/app/api/cursor-context/route.ts |   12 +
 src/app/api/obsidian-sync/route.ts  |   13 +
 src/app/api/profile/route.ts        |    8 +
 src/app/api/repositories/route.ts   |   17 +
 src/app/api/settings/route.ts       |   14 +
 src/app/favicon.ico                 |  Bin 0 -> 25931 bytes
 src/app/globals.css                 |   26 +
 src/app/layout.tsx                  |   19 +
 src/app/page.tsx                    |   83 +
 src/lib/cursor-context.ts           |   51 +
 src/lib/obsidian.ts                 |   22 +
 src/lib/prisma.ts                   |   19 +
 src/lib/profile-defaults.ts         |   39 +
 src/lib/summarize.ts                |   24 +
 tsconfig.json                       |   43 +
 39 files changed, 9247 insertions(+)


## Decisions

No decisions recorded.
