/**
 * FinancialEvaluationService
 * --------------------------
 * Fetches the financial evaluation template and maps the wire payload onto the
 * shape the Financial Evaluation screen renders. Pure + framework-agnostic:
 * no React, no component types.
 *
 * Units: template amounts are authored in the same display units as the
 * screen's defaults (see DEFAULT_* in lib/currency), so every amount is parsed
 * back to a stored BASE value here. Components therefore receive base values
 * and must not convert again.
 */

import {
  parseDisplayedToBase,
  scaleDivisor,
  toDisplayCurrency,
  DEFAULT_CURRENCY,
  DEFAULT_FX_RATE,
  DEFAULT_NUMBER_FORMAT,
  DEFAULT_SCALE,
  type MoneySettings,
} from "@/lib";
import { getItems, putItems } from "@/lib/axios";
import { getAppConfig, type AppConfig } from "@/config/app-config";
import type {
  FinancialEvaluationResponse,
  FinancialEvaluationSavePayload,
  FinEvalLine,
  FinEvalSection,
  FinEvalYearValue,
} from "@/types";

export const FINANCIAL_EVALUATION_PATH =
  "/GIS/proposalAuthoring/financialEvaluation";

/** PUT path for one proposal's evaluation. */
export const financialEvaluationSavePath = (proposalId: string | number) =>
  `/GIS/proposalAuthoring/${proposalId}/financialEvaluation`;

/**
 * Query parameters that identify which evaluation to GET — the same
 * either/or the reference project's `buildFinancialUrl` applies:
 *
 *   proposal exists      → ?proposal_id=X          (the saved evaluation)
 *   no proposal yet      → ?spc_type_id=X&template_type_id=Y   (the template)
 *
 * A proposal id always wins: once the proposal exists its stored evaluation is
 * the truth, and the template ids only describe where it started from. When
 * neither is configured there is nothing to fetch, so this throws rather than
 * firing a request the gateway would reject.
 */
export const buildFinancialEvaluationParams = (
  cfg: AppConfig,
): Record<string, string | number> => {
  if (cfg.proposal_id != null) {
    return { proposal_id: cfg.proposal_id };
  }
  if (cfg.spc_type_id != null || cfg.template_type_id != null) {
    const params: Record<string, string | number> = {};
    if (cfg.spc_type_id != null) params.spc_type_id = cfg.spc_type_id;
    if (cfg.template_type_id != null)
      params.template_type_id = cfg.template_type_id;
    return params;
  }
  throw new Error(
    "Missing proposal_id, spc_type_id or template_type_id in window.__APP_CONFIG__",
  );
};

/** The units template amounts are authored in. */
const TEMPLATE_UNITS: MoneySettings = {
  currency: DEFAULT_CURRENCY,
  localCurrency: DEFAULT_CURRENCY,
  fxRate: DEFAULT_FX_RATE,
  scale: DEFAULT_SCALE,
  numberFormat: DEFAULT_NUMBER_FORMAT,
};

/**
 * Grids the screen renders year-by-year lines into.
 *
 * `cus` is the block of sections the USER added. It sits below every table the
 * template defines — below the NPV calculation — rather than inside one of
 * them, so an added section is never mistaken for part of Combined Operating
 * Results and never lands between two of the template's own sections.
 */
export type FinEvalGridId = "cor" | "fcf" | "ptr" | "cus";

/**
 * Which grid each `section_type` feeds. Unmapped section types fall back to
 * `cor` so a new template section still shows up rather than disappearing.
 */
const SECTION_GRID: Record<string, FinEvalGridId> = {
  REVENUE: "cor",
  COSTS: "cor",
  RETURNS_ANALYSIS: "cor",
  COMBINED_FREE_CASH_FLOWS: "fcf",
  FREE_CASH_FLOWS: "fcf",
  POST_TAX_RETURN: "ptr",
  POST_TAX_RETURNS: "ptr",
};

/**
 * Whether a section is one the USER added, rather than one the template
 * defines. It decides both which grid the section renders in and whether the
 * screen offers to rename or delete it, so it is one predicate, not two.
 *
 * Keyed on `section_type`, NOT on `is_custom`, even though `buildNewSection`
 * writes both. `is_custom` is not trustworthy on the way back in: this
 * builder used to default every echoed section to "Y" when the response
 * omitted it, so evaluations saved before that was fixed have TEMPLATE sections
 * flagged custom in the database. Reading the flag would move Revenue, Costs
 * and Returns Analysis into the user's block on those proposals. The type is
 * only ever "CUSTOM" on a section this screen created.
 */
const isCustomSection = (section: FinEvalSection): boolean =>
  section.section_type === "CUSTOM";

/**
 * Which grid one section feeds.
 *
 * A section the user added goes to its own block below the NPV table. The
 * type-based table has no entry for "CUSTOM" and its fallback is the first
 * grid, so without this an added section drops back into Combined Operating
 * Results on the very next reload — somewhere the screen never put it.
 */
const gridIdOf = (section: FinEvalSection): FinEvalGridId =>
  isCustomSection(section)
    ? "cus"
    : (SECTION_GRID[section.section_type] ?? "cor");

/** Row background: blue = system calculated, yellow = manual entry. */
export type RowTint = "yellow" | "blue";

/** A year-based line ready for the grid, with values already in base units. */
export interface FinEvalGridRow {
  /**
   * Position-based identity within the raw payload (`s<section>l<line>`), used
   * to write the row's edits back onto the right line when saving.
   */
  key: string;
  /** Stable identity from the template. */
  code: string;
  /**
   * Server-side row id (`fin_eval_line_id`), needed to DELETE the line. Null on
   * a template that has not been saved as a proposal yet, in which case there
   * is nothing on the server to delete.
   */
  lineId: number | null;
  label: string;
  /** Stable server-side row type, e.g. "STANDALONE_REVENUES". */
  lineType: string | null;
  /** Template identifier for the line, when the endpoint supplies one. */
  lineIdentifier: string | null;
  /** "Y" rows cannot be deleted (Prod parity). */
  isMandatory: boolean;
  /** Non-custom template rows are not deletable (Prod parity). */
  isCustom: boolean;
  tint: RowTint;
  /** True when the server marks the line as calculated/system-owned. */
  isCalculated: boolean;
  readOnly: boolean;
  /** Base-unit strings keyed by fiscal-year bucket, e.g. `{ fy26: "121000" }`. */
  yearValues: Record<string, string>;
  /** Section the line came from, for grouping/tooltips. */
  sectionName: string;
  sectionType: string;
  /**
   * Identity of the OWNING SECTION, as its position in `raw.sections` (`s0`,
   * `s3`, ...).
   *
   * Grouping used to key on `section_type`, which is fine while every section
   * has a distinct one — but the moment two user-added sections come back from
   * the server they both carry `section_type: "CUSTOM"` and would be drawn as
   * a single merged block. The position is unique by construction.
   */
  sectionKey: string;
  /** Server-side id of the owning section, needed to DELETE it. */
  sectionId: number | null;
  /**
   * True when the owning section is one the USER added (`is_custom: "Y"`).
   * Only those may be renamed or removed on screen; template sections are the
   * backend's.
   */
  sectionIsCustom: boolean;
  /**
   * Whether the owning section accepts new lines, from its own
   * `is_new_line_required`. The SERVER decides this — "Y" on Revenue and Costs,
   * "N" on Returns Analysis — and the reference gates its add button on exactly
   * this flag (`group.isNewLineRequired !== "N"`). Reading it is what stops the
   * rule being a list of section names hardcoded in the UI, which silently goes
   * stale the moment the template gains a section.
   */
  allowsNewLines: boolean;
}

/** A row of the NPV Calculation table (three fixed columns). */
export interface FinEvalNpvRow {
  /** Position-based identity within `m_a_npv_calculation.components`. */
  key: string;
  code: string;
  label: string;
  /** "Y" rows cannot be deleted (Prod parity). */
  isMandatory: boolean;
  tint: RowTint;
  /** True when the component is server-calculated/system-owned. */
  isCalculated: boolean;
  /** [target standalone, Experian factor, total] in base units. */
  values: [string, string, string];
}

/** A row of the Key Inputs panel. */
export interface FinEvalKeyInputRow {
  code: string;
  label: string;
  /** Percentage as a plain string, e.g. "10". */
  value: string;
}

/* ─────────────────────────── Read-only rule ─────────────────────── */
/**
 * Proposal workflow states in which the evalunpmation is view-only. Copied from
 * the reference project (Prod Dev → src/api/financial-api.ts): once a proposal
 * has left the drafting stage its numbers are frozen.
 */
const READONLY_PROPOSAL_STATUSES: ReadonlySet<string> = new Set([
  "SUBMITTED",
  "IN_PROGRESS",
  "APPROVED",
  "CLOSED",
]);

/** True when the proposal's status alone makes the screen view-only. */
export const isProposalStatusReadonly = (
  status: string | null | undefined,
): boolean => !!status && READONLY_PROPOSAL_STATUSES.has(status.toUpperCase());

/** Everything the screen needs from one template fetch. */
export interface FinancialEvaluationModel {
  /** Projection columns the template wants shown; null when unspecified. */
  displayYears: number | null;
  /**
   * The fiscal-year buckets this evaluation actually carries, in chronological
   * order — e.g. ["fy24", ..., "fy33"]. The grid's columns come from HERE, not
   * from the browser clock: the backend decides which years an evaluation
   * spans, and deriving them locally silently shifts every value one column
   * sideways whenever the two disagree.
   */
  fiscalYears: string[];
  /** Currency the proposal's raw values are authored in. */
  localCurrency: string | null;
  /** Currency the proposal should be displayed/converted into. */
  displayCurrency: string | null;
  /**
   * The rate STORED on the proposal ("1 USD = exchange_rate <local>"). The live
   * `currencyExchangeRates` fetch supersedes it, but this is the correct
   * starting point and the correct fallback when that fetch fails — far better
   * than a hardcoded constant, which is not even the right currency pair.
   */
  exchangeRate: number | null;
  /** Owning proposal's workflow status; drives the view-only rule. */
  proposalStatus: string | null;
  keyInputs: FinEvalKeyInputRow[];
  cor: FinEvalGridRow[];
  fcf: FinEvalGridRow[];
  ptr: FinEvalGridRow[];
  /** Sections the user added, rendered as their own block below the rest. */
  cus: FinEvalGridRow[];
  npv: FinEvalNpvRow[];
  /**
   * The untouched wire payload. The save endpoint round-trips the whole
   * evaluation, so it is kept here to rebuild the PUT body from.
   */
  raw: FinancialEvaluationResponse | null;
}

/** Template amount -> stored base string ("" when absent). */
const toBase = (value: number | null | undefined): string =>
  value === null || value === undefined
    ? ""
    : parseDisplayedToBase(String(value), TEMPLATE_UNITS);

/**
 * Inverse of `toBase`: stored base string -> wire amount. Mirrors
 * parseDisplayedToBase under TEMPLATE_UNITS exactly, so a value that is loaded
 * and saved untouched goes back out as it came in. Blank/unparseable -> null.
 */
const fromBase = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const inCurrency = toDisplayCurrency(
    parsed,
    TEMPLATE_UNITS.currency,
    TEMPLATE_UNITS.fxRate,
  );
  return inCurrency / scaleDivisor(TEMPLATE_UNITS.scale);
};

/**
 * Every `fyNN` bucket present anywhere in the payload, chronologically ordered.
 * Two-digit years are compared as written (this domain is entirely 20xx), and
 * `total` — a derived column the grid computes itself — is excluded.
 */
const collectFiscalYears = (items: FinancialEvaluationResponse): string[] => {
  const seen = new Set<string>();
  (items.sections ?? []).forEach((section) =>
    (section.lines ?? []).forEach((line) =>
      Object.keys(line.year_values ?? {}).forEach((key) => {
        if (/^fy\d{2}$/i.test(key)) seen.add(key.toLowerCase());
      }),
    ),
  );
  return [...seen].sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));
};

/** Identity of a line by its position in the raw payload. */
const lineKey = (sectionIndex: number, lineIndex: number): string =>
  `s${sectionIndex}l${lineIndex}`;

/** Identity of a SECTION by its position in the raw payload. */
export const sectionKeyOf = (sectionIndex: number): string => `s${sectionIndex}`;

/** Identity of an NPV component by its position in the raw payload. */
const npvKey = (index: number): string => `n${index}`;

/** Percentages are not currency and are stored as authored. */
const toPercent = (value: number | null | undefined): string =>
  value === null || value === undefined ? "" : String(value);

const tintOf = (isCalculated: string): RowTint =>
  isCalculated === "Y" ? "blue" : "yellow";

const byDisplayOrder = <T extends { display_order: number }>(a: T, b: T) =>
  (a.display_order ?? 0) - (b.display_order ?? 0);

/** Map one template line, keeping only real fiscal-year buckets. */
const mapLine = (
  line: FinEvalLine,
  section: FinEvalSection,
  key: string,
  sectionKey: string,
): FinEvalGridRow => {
  const yearValues: Record<string, string> = {};
  Object.entries(line.year_values ?? {}).forEach(([key, bucket]) => {
    // `total` is a derived column the grid computes itself.
    if (!/^fy\d{2}$/i.test(key) || !bucket) return;
    yearValues[key.toLowerCase()] = toBase(bucket.spc_projected_amount);
  });
  return {
    key,
    code: line.line_item_code,
    lineId: line.fin_eval_line_id ?? null,
    label: line.line_item_name,
    isMandatory: line.is_mandatory === "Y",
    isCustom: line.is_custom !== "N",
    tint: tintOf(line.is_calculated),
    isCalculated: line.is_calculated === "Y",
    // `line_type` is the stable row identity in principle, but M&A proposal
    // payloads leave it null on EVERY template line and carry the identity in
    // `line_item_code` instead (STANDALONE_REVENUES, TERMINAL_VALUE,
    // POST_TAX_RETURN, ...). Falling back to the code is what makes the live
    // recalculation engine and the percentage-row rules see anything at all —
    // keyed on the null `line_type` alone they matched no row, so no calculated
    // line updated between saves and "Post tax return" (whose label carries no
    // "%") was run through the currency formatter.
    //
    // This mirrors the precedent already set on the way OUT, where
    // `buildFinancialEvaluationPayload` writes `line_type ?? line_item_code`.
    lineType: line.line_type ?? line.line_item_code ?? null,
    lineIdentifier: line.line_identifier ?? null,
    // Editable ONLY when the backend says the line is not calculated. A
    // calculated line is owned by the server — its value is recomputed on
    // save, so letting it be typed into just discards the input. `is_calculated`
    // is the single authority here: the row-level and section-level
    // `is_read_only` flags are not consulted, because payloads exist where a
    // calculated line is still flagged `is_read_only: "N"` (Prod Dev's
    // TOTAL_CAPEX, SUBTOTAL_REVENUE, OPEX_COSTS all do this).
    //
    // Treat an absent or blank flag as editable on first load. Some initial
    // template payloads omit the flag during the first fetch before the backend
    // settles, and defaulting that to `true` turns the whole grid into a read-
    // only surface even though the user should be able to type immediately.
    // Cast to a broader runtime type so the guard does not trip TS on the
    // strict `YesNo` union while still keeping the same behavior at runtime.
    readOnly: (() => {
      const flag = line.is_calculated as string | null | undefined;
      return flag != null && flag !== "" ? flag !== "N" : false;
    })(),
    yearValues,
    sectionName: section.section_name,
    sectionType: section.section_type,
    sectionKey,
    sectionId: section.fin_eval_section_id ?? null,
    sectionIsCustom: isCustomSection(section),
    // Absent flag means "allowed", matching the reference's `!== "N"`.
    allowsNewLines: section.is_new_line_required !== "N",
  };
};

/**
 * Convert the raw response into the screen's view model. Tolerant of nulls —
 * an empty template yields empty grids rather than throwing.
 */
export const mapFinancialEvaluation = (
  raw: FinancialEvaluationResponse | FinancialEvaluationResponse[],
): FinancialEvaluationModel => {
  // `data.items` is normally the header object itself, but some GIS endpoints
  // answer with a single-element array instead. The reference project handles
  // both (Prod Dev -> it wraps `data.items` in an array and reads `[0]`), and
  // the difference is invisible when it goes wrong: an array reaches the header
  // getters as `undefined`, so `local_currency` silently becomes null and the
  // currency toggle collapses to USD-only.
  const items = (Array.isArray(raw) ? raw[0] : raw) ?? ({} as FinancialEvaluationResponse);

  const grids: Record<FinEvalGridId, FinEvalGridRow[]> = {
    cor: [],
    fcf: [],
    ptr: [],
    cus: [],
  };

  // Positions in the raw arrays are captured before sorting so every row keeps
  // a key that points back at its own entry in the payload.
  (items.sections ?? [])
    .map((section, sectionIndex) => ({ section, sectionIndex }))
    .filter(({ section }) => section.status !== "INACTIVE")
    .sort((a, b) => byDisplayOrder(a.section, b.section))
    .forEach(({ section, sectionIndex }) => {
      const gridId = gridIdOf(section);
      (section.lines ?? [])
        .map((line, lineIndex) => ({ line, lineIndex }))
        .filter(({ line }) => line.status !== "INACTIVE")
        .sort((a, b) => byDisplayOrder(a.line, b.line))
        .forEach(({ line, lineIndex }) =>
          grids[gridId].push(
            mapLine(
              line,
              section,
              lineKey(sectionIndex, lineIndex),
              sectionKeyOf(sectionIndex),
            ),
          ),
        );
    });

  const keyInputs = [...(items.m_a_key_inputs?.inputs ?? [])]
    .sort(byDisplayOrder)
    .map((input) => ({
      code: input.input_code,
      label: input.label,
      value: toPercent(input.value),
    }));

  const npv = (items.m_a_npv_calculation?.components ?? [])
    .map((component, index) => ({ component, key: npvKey(index) }))
    .sort((a, b) => byDisplayOrder(a.component, b.component))
    .map(({ component, key }) => ({
      key,
      code: component.component_code,
      label: component.label,
      isMandatory: component.is_mandatory === "Y",
      tint: tintOf(component.is_calculated),
      isCalculated: component.is_calculated === "Y",
      values: [
        toBase(component.target_standalone),
        toBase(component.experian_factor),
        toBase(component.total),
      ] as [string, string, string],
    }));

  return {
    displayYears: items.display_years ?? null,
    fiscalYears: collectFiscalYears(items),
    localCurrency: items.local_currency ?? null,
    displayCurrency: items.display_currency ?? null,
    exchangeRate:
      typeof items.exchange_rate === "number" &&
      Number.isFinite(items.exchange_rate) &&
      items.exchange_rate > 0
        ? items.exchange_rate
        : null,
    proposalStatus: items.proposal_status ?? null,
    keyInputs,
    npv,
    raw: items,
    ...grids,
  };
};

/**
 * GET the financial evaluation.
 *
 * With no overrides the ids come from the host config: the saved evaluation
 * when a proposal exists, otherwise the SPC/template it starts from (see
 * `buildFinancialEvaluationParams`). Any id passed here overrides that one
 * value and takes part in the same precedence.
 */
export const fetchFinancialEvaluation = async (
  options: {
    proposalId?: string | number;
    spcTypeId?: string | number;
    templateTypeId?: string | number;
    signal?: AbortSignal;
  } = {},
): Promise<FinancialEvaluationModel> => {
  const cfg = getAppConfig();
  const params = buildFinancialEvaluationParams({
    ...cfg,
    proposal_id:
      options.proposalId != null ? Number(options.proposalId) : cfg.proposal_id,
    spc_type_id:
      options.spcTypeId != null ? Number(options.spcTypeId) : cfg.spc_type_id,
    template_type_id:
      options.templateTypeId != null
        ? Number(options.templateTypeId)
        : cfg.template_type_id,
  });
  const items = await getItems<FinancialEvaluationResponse>(
    FINANCIAL_EVALUATION_PATH,
    params,
    options.signal,
  );
  // The currency pair drives the whole toggle/FX strip, and it is the one part
  // of the payload that is invisible when it is missing (the strip just falls
  // back to USD-only). Log it so a "why is it stuck on USD?" question is one
  // glance at the console, exactly as the reference project logs its requests.
  const header = (Array.isArray(items) ? items[0] : items) ?? {};
  console.log("[financial-api] GET", FINANCIAL_EVALUATION_PATH, params, {
    local_currency: header.local_currency,
    display_currency: header.display_currency,
    exchange_rate: header.exchange_rate,
    proposal_status: header.proposal_status,
    // If the three above are undefined rather than null, the header is not
    // where we think it is — these keys say what actually came back.
    responseIsArray: Array.isArray(items),
    topLevelKeys: Object.keys(header),
  });
  return mapFinancialEvaluation(items);
};

/* ───────────────────────── Save (PUT) ───────────────────────── */

/**
 * The screen's current state, keyed the way `mapFinancialEvaluation` keyed the
 * rows it handed out. Every field is optional: whatever is not supplied is
 * echoed back from the loaded payload unchanged.
 */
export interface FinancialEvaluationEdits {
  /** Row key -> `{ fy26: "<base>" }`. Only the years present are written. */
  yearValues?: Record<string, Record<string, string>>;
  /** NPV row key -> [target standalone, Experian factor, total] in base units. */
  npv?: Record<string, [string, string, string]>;
  /** Key Inputs code -> percentage as typed, e.g. "10.5". */
  keyInputs?: Record<string, string>;
  /** Rows the user added on screen, to be inserted as brand-new lines. */
  newLines?: NewLineEdit[];
  /**
   * Sections the user added on screen ("+ Add Section"), each with the lines
   * typed into it. Sent with `fin_eval_section_id: null` so the database
   * assigns the id, exactly as a new LINE is sent.
   */
  newSections?: NewSectionEdit[];
  /**
   * Renamed sections: index into `raw.sections` (as a string) -> new name.
   *
   * Only CUSTOM sections can be renamed on screen, but the builder does not
   * enforce that — it writes whatever the screen reports, and the screen
   * reports only what it let the user edit.
   */
  sectionNames?: Record<string, string>;
  /**
   * `fin_eval_section_id`s already DELETED through the delete endpoint this
   * session. Same reason as `deletedLineIds`: the response being echoed back
   * predates the delete and still carries the section, so without this the
   * next save would send it — and every line under it — straight back.
   */
  deletedSectionIds?: number[];
  /**
   * `fin_eval_line_id`s already DELETED through the delete endpoint this
   * session, which must be left out of the payload.
   *
   * The PUT is assembled by echoing back the lines the last GET returned, and
   * that response still contains the deleted row. Without this list the next
   * save sends the line straight back — with its original id — and the row
   * reappears after the following reload. Deleting and reloading WITHOUT
   * saving looked fine, which is what made it read as a save bug rather than a
   * delete one.
   */
  deletedLineIds?: number[];
  displayCurrency?: string;
  exchangeRate?: number;
  displayYears?: number;
}

/**
 * A row the user added in the grid. It has no server identity yet — the row is
 * sent with `fin_eval_line_id: null` and the database assigns the real id, which
 * comes back on the next GET.
 */
export interface NewLineEdit {
  /** Index into `raw.sections` of the section the row belongs to. */
  sectionIndex: number;
  /** Row label as typed. */
  name: string;
  /** Base-unit strings keyed by fiscal-year bucket, e.g. `{ fy26: "121000" }`. */
  yearValues: Record<string, string>;
  /**
   * Key of the template line this row sits DIRECTLY BELOW on screen, or
   * undefined when it is the first row of its section.
   *
   * The grid inserts a new line above its section's subtotal ("Revenue
   * (Total)", "Total Costs"), because a row that feeds a total has to sit above
   * it. `display_order` is what carries that position to the server, and the
   * GET sorts by it — so without an anchor the row is saved after the subtotal
   * and jumps below it on the next load, undoing the placement.
   */
  afterKey?: string;
}

/**
 * A section the user added in the grid. Like a new line it has no server
 * identity yet: it goes out with `fin_eval_section_id: null` and its lines with
 * `fin_eval_line_id: null`, and the real ids come back on the next GET.
 */
export interface NewSectionEdit {
  /** Local identity from the screen; not sent, only used to group lines. */
  id: string;
  /** Section name as typed. */
  name: string;
  /** Lines typed into the section, in screen order. */
  lines: Array<{ name: string; yearValues: Record<string, string> }>;
}

/** Position of a section within `raw.sections`, read back out of a row key. */
export const sectionIndexOfKey = (key: string): number | null => {
  const match = /^s(\d+)l\d+$/.exec(key);
  return match ? Number(match[1]) : null;
};

/** Build the wire line for a row the user added. */
const buildNewLine = (
  edit: NewLineEdit,
  displayOrder: number,
  sectionId: number | null,
): FinEvalLine => {
  const year_values: Record<string, FinEvalYearValue | null> = {};
  let total = 0;
  let hasTotal = false;

  Object.entries(edit.yearValues).forEach(([bucket, value]) => {
    if (!/^fy\d{2}$/i.test(bucket)) return;
    const amount = fromBase(value);
    year_values[bucket.toLowerCase()] = {
      ...emptyYearValue(),
      spc_projected_amount: amount,
    };
    if (amount !== null) {
      total += amount;
      hasTotal = true;
    }
  });
  year_values.total = {
    ...emptyYearValue(),
    spc_projected_amount: hasTotal ? total : null,
  };

  // Identity is the database's to assign: the id is null and the row is flagged
  // custom, so the backend inserts rather than trying to match an existing line.
  return {
    fin_eval_line_id: null,
    template_fin_eval_line_id: null,
    // The owning section, same as every existing line carries. The row is
    // nested inside that section's `lines` already, but the echoed template
    // lines all state it explicitly and a new row that alone omits it is asking
    // the backend to infer an attachment the rest of the payload spells out.
    fin_eval_section_id: sectionId,
    line_item_name: edit.name,
    line_item_code: "",
    line_type: "CUSTOM",
    // UPPERCASE, matching both the reference project
    // (`(value.lineIdentifier ?? "FINANCIAL").toUpperCase()`) and the branch
    // just below that echoes existing lines. A new row sending "Financial"
    // while every other line in the same payload sends "FINANCIAL" is a
    // difference the backend has no reason to expect.
    line_identifier: "FINANCIAL",
    is_calculated: "N",
    is_read_only: "N",
    is_mandatory: "N",
    is_custom: "Y",
    // Sent explicitly as null, as the reference does and as the echoed lines
    // do. M&A has no account column, but omitting the key altogether makes a
    // new row the only line in the payload without it.
    account: null,
    display_order: displayOrder,
    year_values,
    status: "ACTIVE",
    // Every echoed line ends up with this; a new row should not be the one
    // exception.
    language_code: "EN",
  };
};

/**
 * Build the wire section for a section the user added.
 *
 * Mirrors `buildNewLine`: a null id so the backend inserts rather than matches,
 * `is_custom: "Y"` so it comes back marked as the user's, and
 * `is_new_line_required: "Y"` so the section keeps taking rows after the round
 * trip. `section_type` is "CUSTOM", which `SECTION_GRID` deliberately does not
 * map — the fallback puts it in the first grid, which is where the screen shows
 * it, so the section does not move on reload.
 */
const buildNewSection = (
  edit: NewSectionEdit,
  displayOrder: number,
): Record<string, unknown> => ({
  fin_eval_section_id: null,
  template_section_id: null,
  section_name: edit.name,
  section_type: "CUSTOM",
  section_description: null,
  display_order: displayOrder,
  is_read_only: "N",
  is_new_line_required: "Y",
  is_custom: "Y",
  status: "ACTIVE",
  language_code: "EN",
  lines: edit.lines.map((line, i) =>
    buildNewLine(
      // `sectionIndex` is how the caller routes a new LINE to an existing
      // section; a new section carries its lines directly, so the field has
      // nothing to point at.
      { sectionIndex: -1, name: line.name, yearValues: line.yearValues },
      (i + 1) * 10,
      null,
    ),
  ),
});

/** Percentage string -> number (null when blank / unparseable). */
const percentOrNull = (value: string | undefined): number | null => {
  if (value === undefined || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const emptyYearValue = (): FinEvalYearValue => ({
  spc_projected_amount: null,
  ytd_budgeted_forecast: null,
  ytd_actuals: null,
  variance: null,
});

/** Rebuild one line's year buckets, recomputing `total` from the years. */
const applyYearValues = (
  line: FinEvalLine,
  edits: Record<string, string> | undefined,
): FinEvalLine => {
  const source = line.year_values ?? {};
  if (!edits) return line;

  const next: Record<string, FinEvalYearValue | null> = {};
  let total = 0;
  let hasTotal = false;

  Object.entries(source).forEach(([bucket, value]) => {
    if (bucket.toLowerCase() === "total") {
      next[bucket] = value;
      return;
    }
    const edited = edits[bucket.toLowerCase()];
    const amount =
      edited === undefined
        ? (value?.spc_projected_amount ?? null)
        : fromBase(edited);
    next[bucket] = {
      ...(value ?? emptyYearValue()),
      spc_projected_amount: amount,
    };
    if (amount !== null) {
      total += amount;
      hasTotal = true;
    }
  });

  // Years the payload did not carry but the user filled in.
  Object.entries(edits).forEach(([bucket, edited]) => {
    if (next[bucket] !== undefined || !/^fy\d{2}$/i.test(bucket)) return;
    const amount = fromBase(edited);
    if (amount === null) return;
    next[bucket] = { ...emptyYearValue(), spc_projected_amount: amount };
    total += amount;
    hasTotal = true;
  });

  if (source.total !== undefined) {
    next.total = {
      ...(source.total ?? emptyYearValue()),
      spc_projected_amount: hasTotal ? total : null,
    };
  }

  return { ...line, year_values: next };
};

/**
 * Apply the screen's edits onto the payload the GET returned, producing the
 * body for the PUT. The endpoint replaces the whole evaluation, so everything
 * it sent — including fields this UI never renders — is echoed back untouched.
 */
export const buildFinancialEvaluationPayload = (
  raw: FinancialEvaluationResponse,
  edits: FinancialEvaluationEdits = {},
): FinancialEvaluationSavePayload => {
  const deletedSections = new Set(edits.deletedSectionIds ?? []);
  const sections = (raw.sections ?? []).map((section, sectionIndex) => {
    const deleted = new Set(edits.deletedLineIds ?? []);
    const keyed = (section.lines ?? []).map((line, lineIndex) => {
      const withValues = applyYearValues(
        line,
        edits.yearValues?.[lineKey(sectionIndex, lineIndex)],
      ) as unknown as Record<string, unknown>;

      const lineType =
        (withValues.line_type as string | null | undefined) ??
        (withValues.line_item_code as string | null | undefined) ??
        "CUSTOM";

      // Echo the line back WHOLE, with only the edited year values and the
      // few normalised fields overridden. The M&A payload carries identity the
      // narrower Prod Dev shape has no slot for — `line_item_code`,
      // `template_fin_eval_line_id`, `is_read_only`, `is_mandatory`, the
      // `parent_*` links — and the backend matches lines on those. Dropping
      // them is why a save could be acknowledged and then not come back on the
      // next GET.
      return {
        // The row's key travels WITH the built line. Filtering deleted rows out
        // of a plain array would renumber it, and `afterKey` resolves against
        // that position — a deleted line above an added one would silently
        // re-anchor it to the wrong neighbour.
        key: lineKey(sectionIndex, lineIndex),
        line: {
        ...withValues,
        fin_eval_line_id:
          (withValues.fin_eval_line_id as number | null | undefined) ?? null,
        fin_eval_section_id:
          (withValues.fin_eval_section_id as number | null | undefined) ??
          section.fin_eval_section_id ??
          null,
        line_type: lineType,
        line_item_name:
          (withValues.line_item_name as string | undefined) ?? "Line Item",
        line_identifier:
          ((withValues.line_identifier as string | undefined) ?? "FINANCIAL").toUpperCase(),
        is_calculated:
          (withValues.is_calculated as string | undefined) ?? "N",
        is_custom: (withValues.is_custom as string | undefined) ?? "Y",
        account: (withValues.account as string | null | undefined) ?? null,
        display_order:
          (withValues.display_order as number | undefined) ?? lineIndex + 1,
        year_values: withValues.year_values,
        status: (withValues.status as string | undefined) ?? "ACTIVE",
        language_code:
          (withValues.language_code as string | undefined) ?? "EN",
        },
      };
    });

    /**
     * Rows the payload must NOT carry, for two reasons that look the same to
     * the user but arrive by different routes:
     *
     *  - deleted THIS SESSION through the delete endpoint. The response being
     *    echoed predates the delete, so it still contains the row.
     *  - already INACTIVE in the response. `mapFinancialEvaluation` filters
     *    these out of the grid, so the screen never shows them — but the
     *    builder echoed them straight back. Where the backend soft-deletes,
     *    that hands it a row it had retired and an upsert can revive it, which
     *    is why deleting then RELOADING looked fine while deleting then SAVING
     *    brought the row back.
     *
     * A payload should say what the screen says. Anything the grid does not
     * render has no business in the save.
     */
    const isDropped = (line: Record<string, unknown>): boolean => {
      if (line.status === "INACTIVE") return true;
      const id = line.fin_eval_line_id as number | null;
      // New rows carry a null id and are never filtered.
      return id != null && deleted.has(id);
    };
    const surviving = keyed.filter(({ line }) => !isDropped(line));
    const existing = surviving.map(({ line }) => line);
    const keyAt = surviving.map(({ key }) => key);

    // Rows added on screen are spliced in at the position they occupy THERE,
    // each with a null id for the database to fill in.
    //
    // Appending them to the end of the section instead (the old `max + 10`)
    // put every new line after its section's subtotal. The grid shows it above
    // — a line that feeds "Revenue (Total)" has to sit above it — and the GET
    // sorts by `display_order`, so the row jumped below the total on the next
    // load and the placement was lost on every round trip.
    const added = (edits.newLines ?? []).filter(
      (line) => line.sectionIndex === sectionIndex,
    );
    const ordered: Array<Record<string, unknown>> = [...existing];
    // The last row inserted against each anchor. Several rows can share one —
    // "+ Add Row" twice puts both under the same template line — and each must
    // go after the PREVIOUS insert, not after the anchor. Splicing every one at
    // `anchor + 1` pushes the earlier row down and reverses them.
    const lastInsertFor = new Map<string, Record<string, unknown>>();
    added.forEach((line) => {
      const built = buildNewLine(
        line,
        0,
        section.fin_eval_section_id ?? null,
      ) as unknown as Record<string, unknown>;
      // The anchor is the template line the row sits under. Its key encodes the
      // line's ORIGINAL index, which is where it still sits in `existing`.
      const anchor = line.afterKey ? keyAt.indexOf(line.afterKey) : -1;
      // No anchor (first row of its section, or a key that no longer resolves):
      // fall back to the end, which is the old behaviour and never loses data.
      if (anchor < 0) {
        ordered.push(built);
        return;
      }
      const key = line.afterKey as string;
      const after = lastInsertFor.get(key) ?? existing[anchor];
      ordered.splice(ordered.indexOf(after) + 1, 0, built);
      lastInsertFor.set(key, built);
    });

    // Renumber the whole section in screen order. Interpolating between the
    // neighbours instead would collide as soon as two rows were added in the
    // same gap, and `display_order` is an integer column.
    const lines = ordered.map((line, i) => ({ ...line, display_order: (i + 1) * 10 }));

    const sectionAny = section as unknown as Record<string, unknown>;
    // Same rule as the lines: echo the section whole so `template_section_id`,
    // `parent_*`, `is_read_only` and the rest survive the round trip.
    return {
      ...sectionAny,
      fin_eval_section_id: section.fin_eval_section_id ?? null,
      // A CUSTOM section's name is the user's to edit, so the screen's value
      // wins where it sent one. Template sections send none and echo back
      // whatever the response carried.
      section_name:
        edits.sectionNames?.[String(sectionIndex)] ?? section.section_name,
      section_type: section.section_type,
      // "N" when the response did not say. This echoes a section the TEMPLATE
      // defines — the user's own are appended below, by `buildNewSection`,
      // which states "Y" outright. Defaulting to "Y" here wrote "this section
      // is the user's" onto Revenue, Costs and Returns Analysis on every save.
      is_custom: (sectionAny.is_custom as string | undefined) ?? "N",
      display_order: section.display_order,
      status: section.status ?? "ACTIVE",
      language_code: (sectionAny.language_code as string | undefined) ?? "EN",
      lines,
    };
  })
    /**
     * Sections dropped for the same two reasons lines are: deleted through the
     * endpoint THIS SESSION (the echoed response predates the delete), or
     * already INACTIVE in the response (the grid never rendered them, so the
     * save has no business reviving them).
     *
     * Filtered AFTER the map, never before: `sectionIndex` is the identity every
     * row key encodes, and renumbering it would re-point every `yearValues` edit
     * at the wrong section.
     */
    .filter((section) => {
      if (section.status === "INACTIVE") return false;
      const id = section.fin_eval_section_id;
      return !(id != null && deletedSections.has(id));
    });

  // Sections the user added, appended after everything the template carries.
  // The display order continues past the highest the response used, so the new
  // block sorts to the BOTTOM on the next GET — which is where the screen put
  // it. An unnamed section is a placeholder, not data, and is skipped for the
  // same reason an unnamed row is.
  const maxSectionOrder = (raw.sections ?? []).reduce(
    (max, section) => Math.max(max, section.display_order ?? 0),
    0,
  );
  const addedSections = (edits.newSections ?? [])
    .filter((section) => section.name.trim() !== "")
    .map((section, i) =>
      buildNewSection(
        { ...section, name: section.name.trim() },
        maxSectionOrder + (i + 1) * 10,
      ),
    );
  const allSections: unknown[] = [...sections, ...addedSections];

  const inputs = (raw.m_a_key_inputs?.inputs ?? []).map((input) => {
    const edited = edits.keyInputs?.[input.input_code];
    return edited === undefined
      ? input
      : { ...input, value: percentOrNull(edited) };
  });

  const components = (raw.m_a_npv_calculation?.components ?? []).map(
    (component, index) => {
      const edited = edits.npv?.[npvKey(index)];
      if (!edited) return component;
      const [target, factor, total] = edited;
      return {
        ...component,
        target_standalone: fromBase(target),
        experian_factor: fromBase(factor),
        total: fromBase(total),
      };
    },
  );

  // The Key Inputs panel is the editable face of these two header fields, so
  // keep them in step with what the user sees.
  const discountRate =
    percentOrNull(edits.keyInputs?.DISCOUNT_RATE) ?? raw.discount_rate_percent;
  const taxRate =
    percentOrNull(edits.keyInputs?.TAX_RATE) ?? raw.tax_rate_percent;

  const displayYears = edits.displayYears ?? raw.display_years;

  const rawAny = raw as unknown as Record<string, unknown>;

  // The endpoint REPLACES the whole evaluation, so the body is the GET payload
  // with this screen's edits applied on top — not a hand-picked subset. The
  // header carries identity and units the UI never renders (`proposal_id`,
  // `local_currency`, `kpi_type`, `number_of_years`, `status`,
  // `amortisation_period_years`, …); sending a narrowed object drops them and
  // the backend has nothing to match the save against, which is how a PUT can
  // answer "S" and still leave the stored evaluation untouched.
  return {
    ...rawAny,
    fin_eval_header_id: raw.fin_eval_header_id ?? null,
    proposal_id: raw.proposal_id ?? getAppConfig().proposal_id ?? null,
    user_email: getAppConfig().app_user,
    // Local currency is the units the amounts are authored in — echo it back
    // untouched. Only the DISPLAY currency is the user's to change.
    local_currency: raw.local_currency ?? null,
    display_currency: edits.displayCurrency ?? raw.display_currency,
    exchange_rate: edits.exchangeRate ?? raw.exchange_rate,
    display_years: displayYears,
    discount_rate_percent: discountRate,
    tax_rate_percent: taxRate,
    m_a_key_inputs: { inputs },
    m_a_npv_calculation: {
      ...(raw.m_a_npv_calculation ?? {}),
      discount_rate_percent: discountRate,
      components,
    },
    sections: allSections,
  } as unknown as FinancialEvaluationSavePayload;
};

/**
 * PUT the evaluation for a proposal.
 *
 * `proposalId` defaults to the id resolved from the host page / URL, falling
 * back to the `proposal_id` the GET returned — a template fetched by
 * spc_type_id still carries the proposal it belongs to, and that is the id the
 * save path needs. Resolves once the gateway acknowledges the save.
 */
export const saveFinancialEvaluation = async (
  payload: FinancialEvaluationSavePayload,
  options: { proposalId?: string | number; signal?: AbortSignal } = {},
): Promise<void> => {
  const proposalId =
    options.proposalId ?? getAppConfig().proposal_id ?? payload.proposal_id;
  if (!proposalId) {
    throw new Error("No proposal id — cannot save the financial evaluation.");
  }
  const path = financialEvaluationSavePath(proposalId);
  // The reference project logs the full PUT body; keep that here. The endpoint
  // acknowledges a save it did not apply, so the body is the only evidence of
  // what was actually asked for when the next GET comes back unchanged.
  console.log("[financial-api] PUT", path, payload);
  const response = await putItems(path, payload, options.signal);
  console.log("[financial-api] PUT response", response);
};