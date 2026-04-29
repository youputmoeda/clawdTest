export function inferTags(files: string[], message = "") {
  const text = `${message} ${files.join(" ")}`.toLowerCase();
  const tags = new Set<string>();
  if (/react|tsx|jsx|component|page|css|tailwind|frontend|ui/.test(text)) tags.add("frontend");
  if (/api|server|controller|service|backend|route|endpoint/.test(text)) tags.add("backend");
  if (/prisma|sql|migration|schema|postgres|mysql|database|db/.test(text)) tags.add("database");
  if (/auth|login|session|jwt|oauth/.test(text)) tags.add("auth");
  if (/test|spec|jest|vitest|playwright/.test(text)) tags.add("testing");
  if (/fix|bug|hotfix/.test(text)) tags.add("bugfix");
  if (/refactor|cleanup|rename/.test(text)) tags.add("refactor");
  if (/ci|pipeline|deploy|docker|github\/workflows/.test(text)) tags.add("devops");
  return [...tags];
}

export function summarizeCommit(message: string, files: string[], diffStat?: string) {
  const tags = inferTags(files, message);
  const changed = files.slice(0, 12).map((f) => `- ${f}`).join("\n");
  return [
    `Commit: ${message}`,
    tags.length ? `Likely areas: ${tags.join(", ")}.` : "Likely areas: general development.",
    files.length ? `Changed files:\n${changed}${files.length > 12 ? `\n- ...and ${files.length - 12} more` : ""}` : "No file list captured.",
    diffStat ? `Diff/stat:\n${diffStat}` : "",
  ].filter(Boolean).join("\n\n");
}
