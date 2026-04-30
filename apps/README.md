# Apps workspace

This folder is where new projects/apps should be created when the assistant only has access to this single GitHub repository.

Each project gets its own folder:

```txt
apps/
  devmind/          # optional future move of the hub app
  my-new-app/       # project-specific source code
```

For now, the DevMind hub app still lives at the repository root to avoid breaking the working MVP. New projects should go under `apps/<project-slug>/`.
