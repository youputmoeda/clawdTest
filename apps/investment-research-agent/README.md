# Investment Research Agent

Local investment research dashboard and scheduled report generator for a Portugal/EU investor using DEGIRO.

## Routes

```txt
/investments
/api/investments/report
/api/investments/email-preview
```

## MVP

- Europe and US market-open reports
- Conservative, moderate, aggressive profiles
- ETFs UCITS + stocks, no crypto
- Email-ready report preview
- Live RSS/news ingestion
- Live market data via Yahoo Finance chart API
- Visible data freshness, sources, and confidence scoring
- Portfolio/personalisation settings
- Allocation-aware scoring adjustments
- Visual holdings editor
- Basic DEGIRO CSV paste/import helper
- Monthly allocation plan based on contribution, portfolio exposure, emergency fund flag, and concentration caps
- pt-PT/en-GB UI language preference

## Run

From repo root:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/investments
```
