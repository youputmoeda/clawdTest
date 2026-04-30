# Repository structure

This repository is the single workspace the assistant can use to build many projects.

## Principle

If João wants a new project built and the assistant only has access to this repo, create it inside this repo instead of needing a separate GitHub repository.

## Layout

```txt
.
├── apps/                 # real projects/apps built in this repo
│   └── <project>/
├── packages/             # shared libraries/components/config
├── memory/               # DevMind generated memory exports
│   └── projects/
├── docs/                 # architecture and workflow docs
├── prisma/               # DevMind hub database schema
├── scripts/              # DevMind automation scripts
└── src/                  # current DevMind hub Next.js app
```

## Where to create new projects

Use:

```txt
apps/<project-slug>/
```

Examples:

```txt
apps/job-application-agent/
apps/portfolio-v2/
apps/invoice-saas/
apps/ai-study-buddy/
```

## Per-project conventions

Each project should include:

```txt
apps/<project>/
  README.md
  PROJECT.md             # product intent, decisions, scope
  TODO.md                # current tasks
  .cursor/rules/         # project-specific Cursor context
  src/                   # app source when applicable
```

## DevMind integration

For every project created here:

```bash
npm run devmind:register -- ./apps/<project> "Project Name" "stack,tags"
npm run devmind:cursor -- ./apps/<project>
npm run devmind:export
```

If the project has its own Git repo, install a hook:

```bash
npm run devmind:install-hook -- ./apps/<project>
```

If it does not have its own Git repo, the main repository history still tracks its files.

## Access model

The assistant only needs access to this one GitHub repo. All project code, docs, memory, and generated context can live here.
