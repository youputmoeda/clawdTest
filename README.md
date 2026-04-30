# clawdTest — DevMind Multi-Project Hub

This repository is João/Rogue-Master's single GitHub workspace for assistant-built projects, developer memory, and portable AI context.

It currently contains:

1. **DevMind hub** — the root Next.js app for grounded engineering memory.
2. **Investment Research Agent** — daily investment research dashboard for Portugal/EU + DEGIRO.
3. **Idealista Researcher** — property-search assistant for Idealista research/export.
4. **Project memory exports** — generated context/memory for projects and AI tools.

The repo is intentionally organised as a **multi-project monorepo**: new apps go in `apps/<project-slug>/`, while shared/root app code currently lives in `src/`.

---

## Quick start

```bash
npm install
cp .env.example .env
# set DATABASE_URL and optional provider keys
npm run db:push
npm run dev
```

Open:

```txt
http://localhost:3000
```

Useful app routes:

```txt
/                       DevMind dashboard
/investments            Investment Research Agent
/idealista              Idealista Researcher
```

---

## Environment variables

Minimum:

```txt
DATABASE_URL=postgresql://...
```

Investment app optional/production:

```txt
INVESTMENTS_AUTH_USER=...
INVESTMENTS_AUTH_PASSWORD=...
MARKET_DATA_PROVIDER=yahoo|twelvedata|finnhub
TWELVE_DATA_API_KEY=...
FINNHUB_API_KEY=...
```

Never commit `.env` or API keys.

---

## Repository structure

```txt
.
├── apps/                         Project-specific app documentation/workspaces
│   ├── investment-research-agent/ Investment research product docs
│   └── idealista-researcher/      Idealista product docs
├── docs/                         Repo architecture and workflow docs
├── memory/                       Generated/exported project memory
├── packages/                     Shared packages placeholder
├── prisma/                       Prisma schema for DevMind DB
├── scripts/                      DevMind/project automation scripts
├── src/                          Main Next.js app implementation
│   ├── app/                      App Router pages and API routes
│   └── lib/                      Core logic and integrations
└── README.md                     This file
```

---

## Root app: DevMind

DevMind captures development context and keeps AI tools grounded in real evidence.

### What it does

- captures Git commits;
- stores developer/project memory in Neon/Postgres;
- writes Markdown exports for Obsidian;
- generates Cursor context files;
- keeps project decisions/skills grounded in evidence.

### Main commands

```bash
npm run dev                      # run local Next.js app
npm run build                    # production build check
npm run db:push                  # push Prisma schema
npm run devmind:seed             # seed João profile/skills
npm run devmind:capture -- <repo>
npm run devmind:install-hook -- <repo>
npm run devmind:cursor -- <repo>
npm run devmind:export
npm run project:new -- "Name" "Stack,List"
```

---

## App: Investment Research Agent

Docs:

```txt
apps/investment-research-agent/README.md
apps/investment-research-agent/DEPLOYMENT.md
apps/investment-research-agent/DAILY_READINESS.md
```

Run:

```bash
npm run dev
# open /investments
```

Purpose:

- Portugal/EU investment research for DEGIRO;
- multi-person portfolio simulation;
- DEGIRO CSV import;
- real market/news data with fallback/cache;
- monthly allocation plan;
- report history and performance tracking;
- pt-PT/en-GB UI.

---

## App: Idealista Researcher

Docs:

```txt
apps/idealista-researcher/README.md
apps/idealista-researcher/PROJECT.md
apps/idealista-researcher/TODO.md
```

Run:

```bash
npm run dev
# open /idealista
```

Purpose:

- search Idealista by fields or natural language;
- generate Idealista URLs;
- attempt public listing extraction;
- show tables;
- export CSV/Excel-compatible data.

Important: it must not bypass captchas, login walls, anti-bot systems or paywalls.

---

## Project creation workflow

Create a new project workspace:

```bash
npm run project:new -- "Project Name" "Next.js,TypeScript,PostgreSQL"
```

This creates:

```txt
apps/<project-slug>/
├── README.md
├── PROJECT.md
├── TODO.md
├── AI_CONTEXT.md
└── .cursor/rules/devmind-memory.mdc
```

Use `apps/<project-slug>/README.md` for product usage and `PROJECT.md` for deeper context.

---

## Grounding rule

Do not invent João's experience, project facts, holdings, or decisions. Use:

- explicit user confirmation;
- inspected project files;
- commits;
- CV/portfolio evidence;
- Obsidian/project notes;
- imported data files.

If evidence is missing, ask or inspect.
