# Daily Readiness Checklist

Current status: **MVP dashboard works, but it is not ready for real daily investing decisions yet.**

## Verified

- `/investments` dashboard renders locally.
- `npm run build` passes.
- `/api/investments/report?session=europe-open` returns:
  - 3 signals
  - 3 profiles
  - 3 ideas per profile
- `/api/investments/report?session=us-open` returns:
  - 3 signals
  - 3 profiles
  - 3 ideas per profile
- `/api/investments/email-preview` returns email-ready text/HTML for `jptms@iscte-iul.pt`.
- Current outputs are Portugal/EU/DEGIRO aware and exclude crypto.

## Not ready / missing before daily use

### 1. Real market data

Current ideas are seeded/static research logic. Before daily use, the agent needs live/recent data:

- ETF prices and returns
- stock prices and returns
- volume/liquidity
- volatility/drawdown
- EUR/USD impact
- bond yields/rate expectations
- basic valuation data for stocks

Candidate providers:

- Finnhub
- Alpha Vantage
- Polygon
- Twelve Data
- Yahoo Finance fallback for MVP only

### 2. Real news ingestion

Need RSS/API ingestion and deduplication.

Initial free sources:

- ECB press/news
- Fed/FOMC calendar
- Eurostat
- Yahoo Finance RSS
- MarketWatch/CNBC RSS where accessible
- Euronext notices
- company earnings calendar

Optional paid/better sources:

- Reuters
- Financial Times
- Bloomberg alternatives
- Benzinga/Finnhub news

### 3. Scoring engine

Need a transparent scoring system before ranking ideas:

- macro score
- news relevance score
- momentum score
- valuation score
- risk score
- liquidity/DEGIRO suitability score
- confidence penalty for missing data

The agent must be allowed to say: **no high-conviction ideas today**.

### 4. Email delivery

Currently email is preview-only.

Need one provider configured:

- Resend recommended
- SMTP acceptable
- SendGrid acceptable
- Gmail app password possible but less clean

Required env:

```txt
EMAIL_PROVIDER=
EMAIL_FROM=
EMAIL_TO=jptms@iscte-iul.pt
RESEND_API_KEY= / SMTP_*
```

### 5. Scheduler

Need automated runs:

- Europe market open report
- US market open report

Recommended schedule for Portugal:

```txt
Europe brief: Mon-Fri around 08:00-08:30 Europe/Lisbon
US brief: Mon-Fri around 14:00-14:20 Europe/Lisbon, adjusted for DST/NYSE open
```

Must use exchange calendars/holidays eventually, not just naive cron.

### 6. LLM provider

Current MVP does not call a model.

Needed provider abstraction:

- `openai-api` official path
- `chatgpt-session` only if a local authenticated harness supports it safely
- `local-ollama` fallback for summarisation

Avoid brittle ChatGPT web UI scraping.

### 7. Portfolio/risk settings

Before recommending ideas, the dashboard should know:

- current holdings
- monthly contribution amount
- emergency fund status
- max single-stock allocation
- preferred time horizon
- tax/account constraints
- whether accumulating ETFs are preferred

### 8. Audit/security

Current npm audit reports vulnerabilities, including `xlsx` with no fix available.

Need to remove/replace risky dependency if possible:

- replace `xlsx` with safer CSV-first export or another maintained library
- review Prisma/Next audit warnings carefully, avoiding breaking downgrades

## Minimum next milestone to become useful

1. Add real RSS/news ingestion.
2. Add market data provider with cached daily data.
3. Add scoring engine and confidence penalties.
4. Add email sending via Resend/SMTP.
5. Add OpenClaw cron or local scheduler.
6. Add settings for current portfolio and monthly investment amount.

Only after that should the daily report be used as a serious research input.

## Product rule

The agent should produce **research briefs**, not orders.

Every report must include:

- thesis
- why now
- risks
- confidence
- data freshness
- sources
- suitability notes for Portugal/EU/DEGIRO
- “no trade / wait” when appropriate
