# Idealista Researcher

Idealista Researcher is a property-search assistant built inside the DevMind root app.

It helps generate and inspect Idealista searches using:

- structured filters;
- natural-language parsing;
- listing extraction into a table;
- CSV/Excel-compatible export.

---

## Routes

```txt
/idealista
/api/idealista/search
/api/idealista/export
```

Run locally from repo root:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/idealista
```

---

## What it does

### Structured search

You can build searches using explicit fields such as:

- location;
- budget;
- bedrooms;
- bathrooms;
- property type;
- area;
- extras/amenities.

### Natural language search

You can also write prompts like:

```txt
T2 em Lisboa até 250k com garagem e varanda
```

The app parses the request and converts it into structured filters plus an Idealista search URL.

### Listing extraction

When listings can be reached publicly, the app tries to extract visible information into a table.

Typical fields:

- title;
- price;
- location;
- area;
- bedrooms;
- bathrooms;
- url;
- notes/extras if available.

### Export

The app supports export endpoints for tabular results.

---

## Important limitations

- It must not bypass anti-bot systems, captchas, login walls, or paywalls.
- Public HTML structure can change and break extraction.
- Results quality depends on what Idealista exposes publicly.
- Excel output exists for compatibility, but this repo has `xlsx` audit concerns and may later move to CSV-first export.

---

## Folder docs

See also:

```txt
apps/idealista-researcher/PROJECT.md
apps/idealista-researcher/TODO.md
```

Use:

- `README.md` for usage;
- `PROJECT.md` for deeper project context;
- `TODO.md` for next implementation tasks.
