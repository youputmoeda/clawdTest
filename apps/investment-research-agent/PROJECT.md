# Investment Research Agent — Project Context

## Goal

Build a local-first investment research agent for a Portugal/EU investor using DEGIRO. It monitors Europe and US market-open context, reads market/news signals, and produces research briefs with top ideas for three risk profiles: conservative, moderate, aggressive.

## Important framing

This agent produces research ideas, not financial advice or automatic buy/sell orders. It must explain why each idea appears, show risks, list sources, and sometimes say that no high-conviction idea exists.

## User preferences

- Investor location: Portugal/EU
- Broker: DEGIRO
- Instruments: ETFs UCITS and stocks
- Exclude: crypto
- Reports: Europe open and US open
- Delivery: email to jptms@iscte-iul.pt
- During testing/building: send screenshots or screen recordings of the UI

## MVP scope

- Local dashboard at `/investments`
- API to generate Europe/US market-open reports
- Three profiles: conservative, moderate, aggressive
- UCITS-aware ETF/stocks universe suitable for DEGIRO/EU investor
- Email preview endpoint before real SMTP/Resend integration
- Clear risk, rationale, horizon, and confidence per idea

## Future scope

- Real RSS/news ingestion
- Market data APIs: Finnhub, Alpha Vantage, Polygon, Yahoo fallback
- SMTP/Resend/SendGrid delivery
- OpenClaw cron scheduling
- ChatGPT-session provider if local authenticated harness is available
- Performance tracking of past ideas
