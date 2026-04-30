# Multi-project workflow

This repository is the **DevMind hub**. You only need to give write access to this one GitHub repo.

For every other project, keep the code wherever it already lives. DevMind can still track it locally and export memory here.

## Add a local project

```bash
cd /home/node/.openclaw/workspace/devmind
npm run devmind:register -- /absolute/path/to/project "Project Name" "Next.js,TypeScript,PostgreSQL"
npm run devmind:install-hook -- /absolute/path/to/project
npm run devmind:capture -- /absolute/path/to/project
npm run devmind:cursor -- /absolute/path/to/project
```

## Export all project memories into this hub repo

```bash
npm run devmind:export
```

This writes portable markdown into:

```txt
projects/
  README.md
  <project-name>/memory.md
```

Then push this hub repo. That means I can review project history/memory later even if I only have access to this repository.

## What is stored here?

- commit summaries
- tags
- decisions
- grounded skill evidence
- generated AI context

## What is NOT stored here by default?

- full source code of your private projects
- secrets
- `.env` files
- raw credentials

If you want to include a project snapshot later, add it intentionally under `projects/<name>/snapshot/` after removing secrets.
