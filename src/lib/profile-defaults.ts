export const defaultPreferences = {
  tone: "Direct, practical, pt-PT with some English when useful.",
  codingStyle: [
    "Prefer TypeScript, React, .NET/C#, SQL-backed solutions when appropriate.",
    "Do not overengineer; prefer small, readable, incremental changes.",
    "Preserve existing architecture unless there is a clear reason to change.",
    "Ground claims in CV, commits, Obsidian notes, or explicit user confirmation.",
  ],
  aiRules: [
    "Do not invent João's skills or experience.",
    "If evidence is missing, say so and ask or inspect the project.",
    "Before large rewrites, inspect current conventions and explain tradeoffs briefly.",
  ],
};

export const defaultSkills = [
  ["React", 4, "USER_CONFIRMED"],
  ["React.js", 4, "USER_CONFIRMED"],
  ["React Native", 3, "INFERRED"],
  ["TypeScript", 4, "USER_CONFIRMED"],
  ["JavaScript", 4, "CV"],
  ["SQL", 4, "USER_CONFIRMED"],
  ["Python", 4, "USER_CONFIRMED"],
  ["C#", 4, "CV"],
  [".NET", 4, "CV"],
  [".NET Core", 4, "CV"],
  ["HTML", 4, "CV"],
  ["CSS", 4, "USER_CONFIRMED"],
  ["TailwindCSS", null, "CV"],
  ["ThreeJS", null, "CV"],
  ["NodeJS", null, "CV"],
  ["PostgreSQL", null, "CV"],
  ["SQL Server", null, "CV"],
  ["MySQL", null, "CV"],
  ["Git", 4, "CV"],
  ["Azure DevOps", null, "CV"],
  ["CI/CD", null, "CV"],
  ["Agile/Scrum", null, "CV"],
] as const;
