# DevMind

Personal engineering memory for Cursor + Obsidian.

DevMind captures Git commits, stores grounded developer memory in Neon Postgres, writes Markdown notes for Obsidian, and generates Cursor context files so AI tools understand your real skills, preferences, commits, and project decisions.

## Stack

- Next.js 16 + React + TypeScript
- Prisma 7 + Neon Postgres
- Tailwind CSS
- simple-git
- Obsidian Markdown writer
- Cursor `.cursor/rules/devmind-memory.mdc` generator

## Setup

```bash
cp .env.example .env
# set DATABASE_URL and optional OBSIDIAN_VAULT_PATH
npm install
npm run db:push
npm run devmind:seed
npm run dev
```

## Useful commands

```bash
# Open dashboard
npm run dev

# Push schema to Neon
npm run db:push

# Seed João's grounded profile/skills
npm run devmind:seed

# Install post-commit hook into a repo
npm run devmind:install-hook -- /absolute/path/to/repo

# Capture latest commit manually
npm run devmind:capture -- /absolute/path/to/repo

# Generate Cursor context for a repo
npm run devmind:cursor -- /absolute/path/to/repo
```

## Cursor integration

For a repo, run:

```bash
npm run devmind:cursor -- /path/to/repo
```

This writes:

- `.cursor/rules/devmind-memory.mdc`
- `AI_CONTEXT.md`

## Obsidian integration

Set `OBSIDIAN_VAULT_PATH` in `.env`, then captures write:

```txt
Dev/Daily/YYYY-MM-DD.md
Dev/Commits/<repo>/YYYY-MM-DD-<hash>.md
```

## Grounding rule

DevMind should not invent João's experience. Skills and decisions should come from:

- explicit user confirmation
- CV/portfolio evidence
- commits
- Obsidian notes
- inspected project files

If evidence is missing, the AI should ask or inspect.

## Multi-project hub mode

This repo can act as the only GitHub repository I need access to. Other projects can stay private/local while DevMind captures their commits and exports portable memory into this repo.

See: [`docs/multi-project-workflow.md`](./docs/multi-project-workflow.md)

```bash
# Register another local repo
npm run devmind:register -- /absolute/path/to/project "Project Name" "React,TypeScript,.NET"

# Install commit watcher into that repo
npm run devmind:install-hook -- /absolute/path/to/project

# Generate Cursor memory in that repo
npm run devmind:cursor -- /absolute/path/to/project

# Export all project memories into this hub repo
npm run devmind:export
```

## Single-repo multi-project workspace

This repository is also the workspace for any new project João wants built when the assistant only has access to this repo.

New projects go under:

```txt
apps/<project-slug>/
```

Create a new project workspace:

```bash
npm run project:new -- "My New Project" "Next.js,TypeScript,PostgreSQL"
```

See: [`docs/repo-structure.md`](./docs/repo-structure.md)
