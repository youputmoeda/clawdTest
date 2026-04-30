# packages/

This folder is reserved for **shared reusable code** extracted from multiple apps/projects in this repo.

Use `packages/` only when code is genuinely shared across projects. If something only belongs to one app, keep it inside that app or the root `src/` implementation until it clearly needs extraction.

## Intended examples

```txt
packages/
  ui/          shared components/design system
  config/      shared config loaders and constants
  database/    shared DB clients/helpers
  ai/          shared prompting/provider logic
  utils/       shared helpers used by multiple projects
```

## Current status

At the moment, most active logic still lives in:

```txt
src/
```

because the repo is evolving quickly and premature extraction would create noise.

## Rule of thumb

Move code into `packages/` only if:

1. at least two apps need it;
2. its public API is stable enough;
3. extracting it improves clarity more than it increases complexity.
