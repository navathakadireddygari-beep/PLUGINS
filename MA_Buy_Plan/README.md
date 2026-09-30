# Buy Plan

Standalone Vite/React/TS widget for the **BuyPlan** panel shown in the M&A
wireframe's left-hand nav once a GSPC proposal reaches Approved status
(`M_A_Authoring 08-05 (2).html` → `sb-buyplan` / `prop-buyplan`).

Renders the "GSPC Proforma Financials" table — every active section of the
proposal's M&A financial evaluation (Revenue, Costs, Returns Analysis), each
line broken into FORECAST / Buy Plan / Variance columns per fiscal year — with
a local/USD currency toggle backed by a live exchange rate, K/M/B scale
toggles, plus the Data Lake (purple) vs Financial Evaluation (blue) colour key.

## Buy Plan API

Buy Plan is stored on the financial evaluation itself, so it uses the same
endpoints as FIN_EVAL/MA (`api/buy-plan-api.ts`):

- **GET** `{api_endpoint}/GIS/proposalAuthoring/financialEvaluation?proposal_id=X`
  — per line, `year_values.fyNN.spc_projected_amount` is the FORECAST and
  `buy_plan_amount` is the Buy Plan. Fiscal-year columns come from the payload.
- **PUT** `{api_endpoint}/GIS/proposalAuthoring/{proposal_id}/financialEvaluation`
  — body `{ sections: [{ fin_eval_section_id, lines: [{ fin_eval_line_id,
  account, year_values }] }] }`, holding every section with an edit and all of
  that section's input (`is_calculated: "N"`) lines. Year buckets echo the GET
  with `buy_plan_amount` replaced; `total` is re-summed.

Buy Plan cells are editable on input lines only. Calculated lines (subtotals,
EBIT, EBIT Margin %) are the server's and refresh from a re-GET after saving.
`proposal_id` comes from `window.__APP_CONFIG__` or `?proposal_id=`.

Amounts are in the proposal's `local_currency`, in thousands (the base the
K/M/B toggles assume).

## Currency, scale and number format

Copied from FIN_EVAL/MA so every figure converts exactly as it does there:
`context/CurrencyFormatContext.tsx` owns currency / scale / number format / FX
rate, and `lib/` (formats, currency-conversion, number-format, format) does the
math. Stored amounts are USD in thousands; `usd_fbr` ("1 USD = rate <local>",
fetched from `currencyExchangeRates`) multiplies them into the local currency;
K/M/B divide by 1 / 1,000 / 1,000,000.

The top bar (`BuyPlanToolbar`) reuses MA's `CurrencyToggle`, `NumberFormatToolbar`
and `FxCard`. Two tables render: "GSPC Proforma — Local Currency" and
"GSPC Proforma — US$ at Actual Rates" (just the US$ one for a USD proposal).
Buy Plan is typed into the table whose currency is selected in the top bar.

## Dev

```
npm install
npm run dev
```

