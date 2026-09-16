# Buy Plan

Standalone Vite/React/TS widget for the **BuyPlan** panel shown in the M&A
wireframe's left-hand nav once a GSPC proposal reaches Approved status
(`M_A_Authoring 08-05 (2).html` → `sb-buyplan` / `prop-buyplan`).

Renders the "GSPC Proforma Financials" tables — Revenue and EBIT, each broken
into FORECAST / Buy Plan / Variance columns per fiscal year (FY26–FY31) —
with an EUR/USD currency toggle backed by a live exchange rate, K/M/B scale
toggles, plus the Data Lake (purple) vs Financial Evaluation (blue) colour key.

Row/group data (Revenue, EBIT, EBIT Margin %) is still the mock figures
transcribed from the wireframe, stored in EUR. The **currency conversion is
real**: switching to USD calls the same `currencyExchangeRates` endpoint the
rest of the FinEval suite uses (see `api/currency-exchange-api.ts`), with a
manual-rate fallback when no live rate is available (no host config, no auth,
network failure, etc.) — see "Currency API" below.

## Structure

```
src/
  App.tsx              entry component
  main.tsx             React root mount
  types.ts             BuyPlan data model (rows/groups/dataset)
  config/
    app-config.ts        window.__APP_CONFIG__ reader (api_endpoint, auth ids)
    proposal-meta.ts      static proposal header info
  api/
    auth-api.ts           bearer token (APEX ajax, or OAuth for local dev)
    currency-exchange-api.ts   POST currencyExchangeRates -> usd_fbr
  hooks/
    useExchangeRate.ts     live fetch + manual override + fallback state
  data/
    buyplan-data.ts        single EUR-based mock dataset
  lib/
    format.ts               money/percent/variance formatting (scale-aware decimals)
    scale.ts                 K/M/B scale helper (same convention as FIN_EVAL/MA)
    currency-conversion.ts   EUR -> USD via the fetched/manual rate
  components/
    BuyPlanPage.tsx         composes header + controls + colour key + table
    BuyPlanHeader.tsx
    BuyPlanControls.tsx      currency + scale toggles, FX rate input/refresh
    ColourKey.tsx
    BuyPlanTable.tsx         the Revenue/EBIT proforma table, "+ Add Row" included
  styles/globals.css
```

## Currency API

`useExchangeRate` fetches `EUR`'s `usd_fbr` ("1 USD = usd_fbr EUR") from
`{api_endpoint}/GIS/proposalAuthoring/currencyExchangeRates` on mount and
whenever "⟳" is clicked. Auth follows the same 2-path pattern as the other
FinEval plugins:

- **Inside APEX**: the page's own `wwv_flow.ajax` callback — no secret ships
  in this bundle.
- **Standalone / local dev**: OAuth2 client-credentials at
  `{api_endpoint}/oauth/token`. Set `VITE_BUYPLAN_BASIC_AUTH` in a local
  `.env` (base64 `client_id:client_secret`) to exercise this path; it is
  deliberately **not** hardcoded anywhere in the repo.

Either path failing throws, and the UI falls back to the wireframe's static
`0.85` rate with an editable input — it never fabricates a "live" number.

## Dev

```
npm install
npm run dev
```

