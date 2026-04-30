import { NextResponse } from "next/server";
import { z } from "zod";
import { parseNaturalSearch } from "@/lib/idealista/parser";
import { buildIdealistaUrl } from "@/lib/idealista/url";
import { scrapeIdealista } from "@/lib/idealista/scraper";

const schema = z.object({
  mode: z.enum(["structured", "natural"]),
  naturalText: z.string().optional(),
  location: z.string().optional(),
  operation: z.enum(["arrendar", "comprar"]).optional(),
  propertyType: z.enum(["casas", "quartos", "garagens", "terrenos"]).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minBedrooms: z.coerce.number().optional(),
  maxBedrooms: z.coerce.number().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  features: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  const parsed = body.mode === "natural" && body.naturalText ? parseNaturalSearch(body.naturalText) : {};
  const filters = {
    ...body,
    ...parsed,
    location: parsed.location || body.location || "Portugal",
    operation: parsed.operation || body.operation || "arrendar",
    propertyType: parsed.propertyType || body.propertyType || "casas",
  } as any;

  const idealistaUrl = buildIdealistaUrl(filters);
  const result = await scrapeIdealista(idealistaUrl);

  return NextResponse.json({
    filters,
    idealistaUrl,
    ...result,
    message: result.blocked
      ? "Idealista may have blocked direct scraping. Open the generated URL and use manual inspection/import."
      : `Extracted ${result.listings.length} listings.`,
  });
}
