# Deployment Notes — Daily Use

Recommended target: **Vercel**.

## Why Vercel first

The app is Next.js, so Vercel can host both:

- `/investments` dashboard
- API routes under `/api/investments/*`

Expo/native mobile can come later if we need push notifications or native UX. For now, mobile browser/PWA is enough.

## Required production env

```txt
DATABASE_URL=postgresql://...
INVESTMENTS_AUTH_USER=<choose-user>
INVESTMENTS_AUTH_PASSWORD=<strong-password>
MARKET_DATA_PROVIDER=yahoo|twelvedata|finnhub
TWELVE_DATA_API_KEY=<optional-if-provider-twelvedata>
FINNHUB_API_KEY=<optional-if-provider-finnhub>
```

The app now stores investment settings and market-data cache through `AppSetting` when `DATABASE_URL` is available. If DB is unavailable, it falls back to local `data/*.json`, which is fine for local dev but not robust for Vercel.

## Current data providers

### Market data

Primary/fallback currently:

```txt
Yahoo Finance chart API
```

This is not an official paid market data API. The app now caches successful responses in `AppSetting` and can fall back to stale cache if live fetch fails.

For serious daily use, add one of:

- Twelve Data
- Finnhub
- Polygon
- Financial Modeling Prep
- Alpha Vantage

### News

Current RSS feeds:

- ECB
- Federal Reserve
- Yahoo Finance
- MarketWatch where available

RSS may fail or change. Reports expose source errors and data freshness.

## Persistence

Do **not** rely on local files in Vercel. Use DB-backed `AppSetting`.

Private local file ignored by git:

```txt
data/investment-settings.json
```

## Daily-use checklist before relying on it

- [x] Build passes
- [x] Portfolio settings can persist via DB-backed AppSetting
- [x] Market data has cache + stale fallback
- [x] DEGIRO CSV import works for João's current export format
- [x] Monthly allocation plan exists
- [x] pt-PT/en-GB UI preference exists
- [x] Add official market data provider abstraction (Twelve Data/Finnhub configurable, Yahoo fallback)
- [x] Add Basic Auth protection for `/investments` and `/api/investments/*`
- [x] Add report history summaries
- [ ] Add email/cron delivery after provider choice (Resend/SendGrid)

## Deployment recommendation

1. Deploy to Vercel connected to GitHub repo.
2. Set `DATABASE_URL` in Vercel env.
3. Run Prisma deploy/migration step if schema changes.
4. Open `/investments` on mobile.
5. Add to home screen as web app.

## Important security note

This app contains personal portfolio data. Before making it public:

- add authentication, or
- restrict deployment access, or
- keep it local/private.
