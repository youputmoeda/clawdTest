# Idealista Researcher

A DevMind sub-app for searching Idealista by structured filters or natural language, extracting listing information into a table, and exporting results.

## Run

This app is implemented as routes inside the main DevMind Next.js app:

```txt
/idealista
/api/idealista/search
```

From repo root:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/idealista
```

## Features

- structured search form
- natural language parser
- Idealista URL generator
- opens Idealista in a new tab
- listing table
- CSV export
- Excel export endpoint
