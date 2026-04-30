import type { IdealistaFilters } from "./types";

function slugifyLocation(location: string) {
  return location
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildIdealistaUrl(filters: IdealistaFilters) {
  const country = filters.country ?? "pt";
  const operation = filters.operation ?? "arrendar";
  const propertyType = filters.propertyType ?? "casas";
  const location = slugifyLocation(filters.location || "portugal");

  const base = `https://www.idealista.${country}/${operation}-${propertyType}/${location}/`;
  const params = new URLSearchParams();

  if (filters.minPrice) params.set("preco-min", String(filters.minPrice));
  if (filters.maxPrice) params.set("preco-max", String(filters.maxPrice));
  if (filters.minBedrooms) params.set("quartos-min", String(filters.minBedrooms));
  if (filters.maxBedrooms) params.set("quartos-max", String(filters.maxBedrooms));
  if (filters.minArea) params.set("area-min", String(filters.minArea));
  if (filters.maxArea) params.set("area-max", String(filters.maxArea));

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
