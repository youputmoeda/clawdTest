# Idealista Researcher — Project Context

## Goal

Build a browser-facing app that helps João search for houses on Idealista using either structured fields or natural language. After selecting/searching, the app should automate opening Idealista with the provided filters, collect listing data, show a table in the same page, and allow export to Excel/CSV.

## MVP scope

- Input mode A: structured form with location + basic filters.
- Input mode B: natural language prompt parsed into filters.
- Build an Idealista search URL from filters.
- Open Idealista in a new tab for transparency/manual inspection.
- Fetch/scrape publicly available Idealista listing pages when possible.
- Display extracted listings in a table.
- Export table to CSV and Excel-compatible format.

## Data to extract

Default columns:

- title
- price
- location
- url
- property type
- bedrooms
- area m²
- floor
- description snippet
- source

## Constraints / ethics

- Do not bypass captchas, login walls, anti-bot systems, or paywalls.
- Prefer opening Idealista transparently in the browser.
- If scraping is blocked, keep the search URL and allow manual import/paste later.
- Do not store personal secrets.

## Future improvements

- Browser extension for user-assisted extraction from open Idealista pages.
- Map view.
- Scoring/ranking by preferences.
- Saved searches.
- Alerts.
