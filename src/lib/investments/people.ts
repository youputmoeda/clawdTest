import { readJsonSetting, writeJsonSetting } from "./store";
import type { InvestmentPerson } from "./types";

const PEOPLE_KEY = "investment-people";
export const DEFAULT_PERSON_ID = "joao";

export const defaultPeople: InvestmentPerson[] = [
  { id: "joao", name: "João", relationship: "owner", createdAt: "2026-04-30T00:00:00.000Z" },
  { id: "namorada", name: "Namorada", relationship: "partner", createdAt: "2026-04-30T00:00:00.000Z" },
];

export function normalisePersonId(id?: string | null) {
  return (id || DEFAULT_PERSON_ID).toLowerCase().replace(/[^a-z0-9_-]/g, "-").replace(/^-+|-+$/g, "") || DEFAULT_PERSON_ID;
}

export async function loadPeople() {
  const people = await readJsonSetting<InvestmentPerson[]>(PEOPLE_KEY, defaultPeople);
  const merged = [...people];
  for (const person of defaultPeople) {
    if (!merged.some((p) => p.id === person.id)) merged.push(person);
  }
  return merged;
}

export async function savePeople(people: InvestmentPerson[]) {
  return writeJsonSetting(PEOPLE_KEY, people);
}

export async function addPerson(input: { id?: string; name: string; relationship?: string }) {
  const people = await loadPeople();
  const id = normalisePersonId(input.id || input.name);
  const next = { id, name: input.name.trim() || id, relationship: input.relationship, createdAt: new Date().toISOString() };
  const merged = [next, ...people.filter((p) => p.id !== id)];
  await savePeople(merged);
  return next;
}
