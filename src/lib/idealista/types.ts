export type IdealistaFilters = {
  location: string;
  country?: "pt" | "es" | "it";
  operation?: "arrendar" | "comprar";
  propertyType?: "casas" | "quartos" | "garagens" | "terrenos";
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minArea?: number;
  maxArea?: number;
  features?: string[];
  naturalText?: string;
  requestedColumns?: string[];
};

export type IdealistaListing = {
  title: string;
  price?: string;
  location?: string;
  url: string;
  propertyType?: string;
  bedrooms?: string;
  area?: string;
  floor?: string;
  description?: string;
  source: "idealista" | "mock" | "manual";
};
