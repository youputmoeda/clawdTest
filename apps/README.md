# Apps

This folder contains product-specific workspaces inside the `clawdTest` multi-project repo.

The root Next.js app still lives in `src/`, but each project has its own folder here for:

- README / usage docs;
- PROJECT context;
- TODO tracking;
- generated AI/Cursor context;
- future project-specific source if it grows large enough to split out.

## Current apps

| App | Folder | Runtime route | Purpose |
| --- | --- | --- | --- |
| Investment Research Agent | `apps/investment-research-agent` | `/investments` | Daily investment research for Portugal/EU + DEGIRO |
| Idealista Researcher | `apps/idealista-researcher` | `/idealista` | Idealista property search/export assistant |

## How to run any current app

From repo root:

```bash
npm install
npm run dev
```

Then open the relevant route:

```txt
http://localhost:3000/investments
http://localhost:3000/idealista
```

## Creating a new app

```bash
npm run project:new -- "Project Name" "Stack,List"
```

New app docs should explain:

- what the app is;
- what problem it solves;
- routes/API routes;
- how to run locally;
- required environment variables;
- folder structure;
- known limitations;
- next steps.
