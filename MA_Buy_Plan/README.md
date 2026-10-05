# Buy Plan

Standalone Vite/React/TS widget for the **BuyPlan** panel shown in the M&A
wireframe's left-hand nav once a GSPC proposal reaches Approved status
(`M_A_Authoring 08-05 (2).html` → `sb-buyplan` / `prop-buyplan`).

Renders the "GSPC Proforma Financials" tables — Revenue and EBIT (+ EBIT
Margin %), each broken into FORECAST / BUY PLAN / VAR columns per fiscal year —
with a local/USD currency toggle, K/M/B scale and number-format toggles.

## Buy Plan API (`api/buy-plan-api.ts`)

- **GET** `{api_endpoint}/GIS/MA/buyPlan` — headers `proposal_id` (and
  optionally `currency`). Sent WITHOUT `currency`, so each section's
  `fy_data.fyNN` carries both `forecast_/buyplan_/variance_local` and `_usd`;
  the local table shows the former, the US$ table the latter. Columns start at
  `proposal_info.first_fy_key`.
- **POST** `{api_endpoint}/GIS/MA/buyPlan/adjustment` — body `{ proposal_id,
  fin_eval_section_id, description, amount, fiscal_year, created_by }`. One
  call per new row per fiscal year with an amount.

Forecast, Buy Plan and Var on the server's rows are read-only (Var is the
server's forecast − buy plan). Only rows added with "+ Add Row" are editable
(description + Buy Plan amounts); saving POSTs them as adjustments and
re-fetches. `proposal_id` and `user_id` (sent as `created_by`) come from
`window.__APP_CONFIG__` or `?proposal_id=` / `?user_id=`.

## Currency, scale and number format

Copied from FIN_EVAL/MA: `context/CurrencyFormatContext.tsx` owns currency /
scale / number format / FX rate, and `lib/` does the math. Server figures are
already in each table's currency, so they are only scaled. New-row amounts are
held in USD and shown in the local table via `proposal_info.fx_rate`
("1 USD = rate <local>"). K/M/B divide by 1 / 1,000 / 1,000,000.

Two tables render: "GSPC Proforma — Local Currency" and "GSPC Proforma — US$ at
Actual Rates" (just the US$ one for a USD proposal). New rows are typed into
the table whose currency is selected in the top bar.

## Dev

```
npm install
npm run dev
```

