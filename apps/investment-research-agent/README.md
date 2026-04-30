# Investment Research Agent

Daily investment research dashboard for a Portugal/EU investor using DEGIRO.

The app is designed as a **research and decision-support tool**, not an automatic trading system and not financial advice.

---

## What it does

- imports DEGIRO portfolio CSVs;
- supports multiple people/investor profiles (`joao`, `namorada`, or custom names);
- analyses portfolio exposure;
- fetches live market data;
- fetches and ranks financial news;
- scores ideas against each person's portfolio;
- generates monthly allocation plans;
- stores report history;
- tracks performance of previous report ideas;
- supports `pt-PT` and `en-GB` UI.

---

## Main route

```txt
/investments
```

Run locally:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/investments
```

---

## API routes

```txt
GET  /api/investments/people
POST /api/investments/people

GET  /api/investments/settings?personId=joao
POST /api/investments/settings?personId=joao

GET  /api/investments/report?personId=joao&session=europe-open
GET  /api/investments/report?personId=joao&session=us-open

GET  /api/investments/allocation-plan?personId=joao
GET  /api/investments/report-history?personId=joao
GET  /api/investments/report-performance?personId=joao
GET  /api/investments/email-preview?personId=joao&session=us-open
```

`personId` keeps portfolios/settings/history separate.

---

## People / simulations

The app supports multiple investor profiles.

Default people:

```txt
joao
namorada
```

Each person has separate:

- locale;
- monthly contribution;
- risk profile;
- emergency fund flag;
- allocation limits;
- holdings;
- report history;
- performance tracking.

This prevents João's portfolio from being mixed with someone else's.

---

## DEGIRO CSV import

Expected DEGIRO portfolio CSV shape:

```csv
Produto,Ticker / ISIN,Quant.,Preço,Valor,,Valor em EUR
COCA-COLA CO,US1912161007,1,"78,87",USD,"78,87","67,54"
```

The parser maps known ISINs/tickers to useful symbols and tags, for example:

```txt
US1912161007 → KO
US67066G1040 → NVDA
IE00B4L5Y983 → IWDA
IE00B5BMR087 → SXR8
IE00BYVQ9F29 → NQSE
```

CSV import is per person/profile.

---

## Market data

Provider is configurable:

```txt
MARKET_DATA_PROVIDER=yahoo|twelvedata|finnhub
TWELVE_DATA_API_KEY=...
FINNHUB_API_KEY=...
```

Current behaviour:

```txt
Official provider → Yahoo fallback → stale cache fallback
```

Notes:

- Twelve Data works well for many US stocks.
- Some European UCITS ETF symbols may fail on Twelve Data; Yahoo fallback handles those.
- Free API plans can hit rate limits; cache reduces damage.

---

## News intelligence

Sources include:

- ECB RSS;
- Federal Reserve RSS;
- Yahoo Finance RSS;
- MarketWatch RSS;
- CNBC RSS;
- Finnhub general/company news when `FINNHUB_API_KEY` is configured.

The app ranks news by:

- session relevance: Europe vs US open;
- macro impact;
- portfolio holdings affected;
- tags affected (`tech`, `ai`, `us`, `consumer`, etc.);
- relevance score.

---

## Monthly allocation plan

Endpoint:

```txt
/api/investments/allocation-plan?personId=joao
```

The plan uses:

- monthly contribution;
- emergency fund flag;
- core ETF target;
- satellite target;
- max single-stock limit;
- max US exposure;
- max tech/AI exposure;
- current holdings.

Example output buckets:

```txt
Core UCITS ETF
Defensive / cash / bonds
Satellite stocks/themes
```

---

## Report history and performance

Reports can be saved and later evaluated.

```txt
/api/investments/report-history?personId=joao
/api/investments/report-performance?personId=joao
```

Important: normal auto-loading uses `saveHistory=false`; explicit report generation can save a snapshot.

---

## Deployment

See:

```txt
apps/investment-research-agent/DEPLOYMENT.md
```

Production requirements:

```txt
DATABASE_URL=...
INVESTMENTS_AUTH_USER=...
INVESTMENTS_AUTH_PASSWORD=...
```

Do not deploy publicly without auth. Portfolio data is private.

---

## Current limitations

- Not financial advice.
- Does not place trades.
- Market/news APIs can rate-limit or fail.
- Twelve Data symbol mapping for UCITS ETFs needs improvement.
- Email/scheduling is intentionally left for later.
- Report performance needs time/data to become meaningful.
