import type { IdealistaFilters } from "./types";

function numberFrom(text: string) {
  const cleaned = text.replace(/[.\s]/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export function parseNaturalSearch(input: string): Partial<IdealistaFilters> {
  const text = input.toLowerCase();
  const filters: Partial<IdealistaFilters> = { naturalText: input };

  if (/comprar|compra|venda|buy/.test(text)) filters.operation = "comprar";
  if (/arrendar|alugar|renda|rentar|rent/.test(text)) filters.operation = "arrendar";

  const isLookingForRoom = /(?:^|\s)(quarto|room)(?:s|\s|$)/.test(text) && !/\bt\d\b|apartamento|casa|moradia|flat|apartment/.test(text);
  const isLookingForGarage = /(?:^|\s)(garagem|garage)(?:s|\s|$)/.test(text) && !/com garagem|c\/ garagem|apartamento|casa|moradia|\bt\d\b/.test(text);
  const isLookingForLand = /(?:^|\s)(terreno|land)(?:s|\s|$)/.test(text);

  if (isLookingForRoom) filters.propertyType = "quartos";
  else if (isLookingForGarage) filters.propertyType = "garagens";
  else if (isLookingForLand) filters.propertyType = "terrenos";
  else filters.propertyType = "casas";

  const maxPriceMatch = text.match(/(?:até|ate|max(?:imo)?|menos de|under)\s*€?\s*([0-9 .]+)/i) || text.match(/([0-9 .]+)\s*€?\s*(?:máximo|max|por mês|\/mês)/i);
  if (maxPriceMatch) filters.maxPrice = numberFrom(maxPriceMatch[1]);

  const minPriceMatch = text.match(/(?:desde|min(?:imo)?|mais de|over)\s*€?\s*([0-9 .]+)/i);
  if (minPriceMatch) filters.minPrice = numberFrom(minPriceMatch[1]);

  const bedroomsMatch = text.match(/(\d+)\s*(?:quartos?|t\d|bedrooms?|beds?)/i) || text.match(/t(\d)/i);
  if (bedroomsMatch) filters.minBedrooms = Number(bedroomsMatch[1]);

  const areaMatch = text.match(/(?:mínimo|min|desde|mais de)\s*(\d+)\s*m[²2]/i);
  if (areaMatch) filters.minArea = Number(areaMatch[1]);

  const locationMatch = input.match(/(?:em|na|no|perto de|near)\s+([A-Za-zÀ-ÿ\s-]+?)(?:,| com| até| de | para |$)/i);
  if (locationMatch) filters.location = locationMatch[1].trim();

  const features: string[] = [];
  if (/varanda|balcony/.test(text)) features.push("varanda");
  if (/garagem|parking|estacionamento/.test(text)) features.push("garagem");
  if (/elevador|lift/.test(text)) features.push("elevador");
  if (/mobilad[ao]|furnished/.test(text)) features.push("mobilado");
  if (/terraço|terraco|terrace/.test(text)) features.push("terraco");
  if (features.length) filters.features = features;

  return filters;
}
