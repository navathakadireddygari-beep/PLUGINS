/**
 * Financial evaluation STAGING API — M&A (Import Plugin)
 * ------------------------------------------------------
 * Same three endpoints every import plugin uses:
 *
 *   GET  {base}/GIS/proposalAuthoring/finEvaluationStaging?file_id=X
 *        → the staged (not-yet-migrated) evaluation for the imported file
 *   PUT  {base}/GIS/proposalAuthoring/finEvaluationStaging/{file_id}
 *        → re-validates the staged data (Validate button)
 *   POST {base}/GIS/proposalAuthoring/finEvalStagingMigrate/{file_id}
 *        → migrates staging → main proposal (Save Model button)
 *
 * Wire casing: like every other import plugin, the staging endpoints speak
 * camelCase for the structure (`finEvalLineStgId`, `yearValues`,
 * `mAKeyInputs`, …) while the blobs inside it stay snake_case (`fy27.
 * spc_projected_amount`, `inputs[].input_code`, …). Sample GET:
 * BUY_PLAN_APIS.txt (repo root). Incoming keys are normalised to snake_case so
 * the M&A FinEval code can read them; the PUT body is converted back to the
 * GET's camelCase shape. The migrate POST has no body.
 *
 * The staged header is mapped onto `FinancialEvaluationResponse`, the shape
 * the M&A FinEval screen already renders, with each `*_stg_id` placed in the
 * matching `fin_eval_*_id` slot. The grid, the recalculation engine and the
 * payload builder therefore run unchanged; only the envelope differs.
 */

import { AxiosError } from "axios";
import { apiClient, ApiError } from "@/lib/axios";
import { getAppConfig } from "@/config/app-config";
import {
  mapFinancialEvaluation,
  type FinancialEvaluationModel,
} from "@/api/financial-api";
import type {
  FinancialEvaluationResponse,
  FinancialEvaluationSavePayload,
} from "@/types";

export const FIN_EVALUATION_STAGING_PATH =
  "/GIS/proposalAuthoring/finEvaluationStaging";

export const finEvaluationStagingPutPath = (fileId: string | number) =>
  `${FIN_EVALUATION_STAGING_PATH}/${fileId}`;

export const finEvalStagingMigratePath = (fileId: string | number) =>
  `/GIS/proposalAuthoring/finEvalStagingMigrate/${fileId}`;

/* ─────────────────────────── Wire types ─────────────────────────── */

type Loose = Record<string, unknown>;

/** `data.file` — the imported file the staged evaluation came from. */
export interface StagingFile {
  file_id?: number | null;
  proposal_id?: number | null;
  file_name?: string | null;
  spc_type_id?: number | null;
  spc_type_template_id?: number | null;
  display_currency?: string | null;
  load_status?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  migrated_date?: string | null;
}

/** Validation fields the backend stamps on the header, each section and line. */
interface StagingValidation {
  validation_status?: string | null;
  error_code?: string | null;
  error_message?: string | null;
}

export interface StagingEnvelope {
  apiStatus?: string;
  apiMessage?: string;
  data?: {
    file?: StagingFile | null;
    header?: Loose | null;
    /** Some GIS endpoints answer with `items` rather than `header`. */
    items?: Loose | Loose[] | null;
    orphan_lines?: Loose[] | null;
  } | null;
}

/* ─────────────────────────── Key casing ─────────────────────────── */

/**
 * camelCase → snake_case, one underscore per capital so the M&A blobs map:
 * `mAKeyInputs` → `m_a_key_inputs`, `finEvalLineStgId` →
 * `fin_eval_line_stg_id`. Keys not starting lowercase are left alone.
 */
const toSnake = (key: string): string =>
  /^[a-z]/.test(key)
    ? key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
    : key;

/** snake_case → camelCase; the inverse of `toSnake`. */
const toCamel = (key: string): string =>
  key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/** Deep-convert object keys to snake_case. Values are left untouched. */
const snakeKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(snakeKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Loose).map(([k, v]) => [toSnake(k), snakeKeys(v)]),
    );
  }
  return value;
};

/**
 * Values whose own keys the staging GET sends in snake_case (the per-year
 * buckets, the M&A key inputs / NPV blobs, the hurdle checks). Only the key
 * naming them is camelised on the way out; their contents go back as-is.
 */
const OPAQUE_KEYS = new Set([
  "year_values",
  "m_a_key_inputs",
  "m_a_npv_calculation",
  "performance_metrics",
]);

/** Deep-convert structural keys to camelCase, leaving OPAQUE_KEYS' contents. */
const camelKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(camelKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Loose).map(([k, v]) => [
        toCamel(k),
        OPAQUE_KEYS.has(k) ? v : camelKeys(v),
      ]),
    );
  }
  return value;
};

/* ─────────────────────────── Id mapping ─────────────────────────── */

/**
 * Which id key the staging record uses. Staging rows carry their own
 * `*_stg_id`; the GET is inspected for it so the PUT answers in the same
 * spelling. With nothing to inspect (an empty file) the `_stg_id` form — the
 * one every other import plugin uses — is assumed.
 */
type IdStyle = "stg" | "plain";

const ID_KEYS = {
  header: { stg: "fin_eval_header_stg_id", plain: "fin_eval_header_id" },
  section: { stg: "fin_eval_section_stg_id", plain: "fin_eval_section_id" },
  parent: {
    stg: "parent_fin_eval_section_stg_id",
    plain: "parent_fin_eval_section_id",
  },
  line: { stg: "fin_eval_line_stg_id", plain: "fin_eval_line_id" },
} as const;

let detectedIdStyle: IdStyle = "stg";

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Read an id, preferring the `_stg_id` spelling. */
const readId = (
  obj: Loose,
  keys: { stg: string; plain: string },
): number | null => numOrNull(obj[keys.stg] ?? obj[keys.plain]);

/** Staging line → the M&A line shape (`fin_eval_line_id` = staging id). */
const toResponseLine = (line: Loose, sectionId: number | null): Loose => ({
  ...line,
  fin_eval_line_id: readId(line, ID_KEYS.line),
  fin_eval_section_id: readId(line, ID_KEYS.section) ?? sectionId,
  // Staged rows have no template line of their own.
  template_fin_eval_line_id: line.template_fin_eval_line_id ?? null,
  line_item_code: line.line_item_code ?? "",
});

const toResponseSection = (section: Loose): Loose => {
  const sectionId = readId(section, ID_KEYS.section);
  return {
    ...section,
    fin_eval_section_id: sectionId,
    parent_fin_eval_section_id: readId(section, ID_KEYS.parent),
    template_section_id: section.template_section_id ?? null,
    lines: ((section.lines as Loose[] | null) ?? []).map((l) =>
      toResponseLine(l, sectionId),
    ),
  };
};

/* ─────────────────────────── Validation issues ──────────────────── */

/**
 * One validation message plus, when known, the staged section / line it
 * belongs to — so the screen can point at the offending row instead of
 * leaving the user to hunt for it.
 */
export interface ValidationIssue {
  message: string;
  /** Staging section id (the grid's `sectionId`). */
  sectionId?: number;
  /** Staging line id (the grid's `lineId`). */
  lineId?: number;
  /** Header-level message (Key Inputs, currency, …). */
  header?: boolean;
}

/** Split a backend "a | b | c" message into its parts. */
const splitMessages = (raw: unknown): string[] =>
  typeof raw === "string"
    ? raw.split("|").map((s) => s.trim()).filter(Boolean)
    : [];

/**
 * Walk header → sections → lines, one issue per "|"-separated piece of EACH
 * object's own `error_message`, tagged with that object's id. The per-object
 * messages are refreshed by every Validate call; `file.error_message` is a
 * load-time snapshot that does not clear itself, so it only contributes
 * messages no object already reports (e.g. "Section X is missing").
 */
export const collectValidationIssues = (
  header: Loose | null,
  file: StagingFile | null | undefined,
  orphanLines: Loose[] = [],
): ValidationIssue[] => {
  const out: ValidationIssue[] = [];
  const push = (raw: unknown, target: Omit<ValidationIssue, "message">) =>
    splitMessages(raw).forEach((message) => out.push({ message, ...target }));

  if (header) {
    push((header as StagingValidation).error_message, { header: true });
    ((header.sections as Loose[] | null) ?? []).forEach((section) => {
      const sectionId = readId(section, ID_KEYS.section) ?? undefined;
      push((section as StagingValidation).error_message, { sectionId });
      ((section.lines as Loose[] | null) ?? []).forEach((line) => {
        const lineId = readId(line, ID_KEYS.line) ?? undefined;
        push((line as StagingValidation).error_message, { lineId, sectionId });
      });
    });
  }

  // Lines the import could not attach to any section.
  orphanLines.forEach((line) => {
    const name = typeof line.line_item_name === "string" ? line.line_item_name : "";
    splitMessages((line as StagingValidation).error_message).forEach((m) =>
      out.push({ message: name ? `${name}: ${m}` : m }),
    );
  });

  const seen = new Set(out.map((i) => i.message));
  splitMessages(file?.error_message)
    .filter((m) => !seen.has(m))
    .forEach((message) => out.push({ message }));

  return out;
};

/* ─────────────────────────── GET ─────────────────────────────────── */

/** The staged evaluation plus what only an import screen needs. */
export interface StagingModel extends FinancialEvaluationModel {
  validationIssues: ValidationIssue[];
  file: StagingFile | null;
}

const requireFileId = (fileId?: number | null): number => {
  const id = fileId ?? getAppConfig().file_id;
  if (id == null) {
    throw new Error("Missing file_id in window.__APP_CONFIG__");
  }
  return id;
};

/** Normalise any thrown value into an ApiError carrying the server message. */
const toApiError = (error: unknown, fallback: string): ApiError => {
  if (error instanceof ApiError) return error;
  if (error instanceof AxiosError) {
    const body = error.response?.data as Loose | undefined;
    const msg =
      (body?.apiMessage as string | undefined) ??
      (body?.api_message as string | undefined);
    return new ApiError(msg ?? fallback, error.response?.status ?? 0);
  }
  return new ApiError(error instanceof Error ? error.message : fallback);
};

/** Throw on a non-success `apiStatus` (either casing), when one was sent. */
const assertEnvelope = (body: unknown, fallback: string): Loose => {
  if (!body || typeof body !== "object") return {};
  const env = body as Loose;
  const status = (env.apiStatus ?? env.api_status) as string | undefined;
  if (status && status !== "S" && status !== "SUCCESS") {
    throw new ApiError(
      ((env.apiMessage ?? env.api_message) as string | undefined) || fallback,
    );
  }
  return env;
};

/**
 * Map the staging envelope onto the screen's model. Pure — exported for
 * testing and so the conversion can be inspected in isolation.
 */
export const mapStagingEnvelope = (envelope: StagingEnvelope): StagingModel => {
  const data = (snakeKeys(envelope?.data ?? {}) as StagingEnvelope["data"]) ?? {};
  const file = data?.file ?? null;
  const items = data?.header ?? data?.items ?? null;
  const header = (Array.isArray(items) ? items[0] : items) ?? null;

  if (header) {
    const hasStg = JSON.stringify(header).includes("_stg_id");
    const hasPlain = JSON.stringify(header).includes('"fin_eval_line_id"');
    detectedIdStyle = hasStg || !hasPlain ? "stg" : "plain";
  }

  const response = header
    ? ({
        ...header,
        fin_eval_header_id: readId(header, ID_KEYS.header),
        proposal_id:
          numOrNull(header.proposal_id) ??
          getAppConfig().proposal_id ??
          numOrNull(file?.proposal_id),
        proposal_title:
          (header.proposal_title as string | null | undefined) ??
          file?.file_name ??
          null,
        display_currency:
          (header.display_currency as string | null | undefined) ??
          file?.display_currency ??
          null,
        sections: ((header.sections as Loose[] | null) ?? []).map(
          toResponseSection,
        ),
      } as unknown as FinancialEvaluationResponse)
    : ({} as FinancialEvaluationResponse);

  return {
    ...mapFinancialEvaluation(response),
    // No header means nothing to validate or save against.
    raw: header ? response : null,
    validationIssues: collectValidationIssues(
      header,
      file,
      data?.orphan_lines ?? [],
    ),
    file,
  };
};

/** GET the staged evaluation for the configured (or given) file. */
export const fetchFinEvaluationStaging = async (
  options: { fileId?: number | null; signal?: AbortSignal } = {},
): Promise<StagingModel> => {
  const fileId = requireFileId(options.fileId);
  let body: StagingEnvelope;
  try {
    ({ data: body } = await apiClient.get<StagingEnvelope>(
      FIN_EVALUATION_STAGING_PATH,
      { params: { file_id: fileId }, signal: options.signal },
    ));
  } catch (error) {
    throw toApiError(error, "Failed to load the staged financial evaluation");
  }
  assertEnvelope(body, "Failed to load the staged financial evaluation");
  console.log("[staging-api] GET", FIN_EVALUATION_STAGING_PATH, { file_id: fileId }, body);
  return mapStagingEnvelope(body);
};

/* ─────────────────────────── PUT (Validate) ─────────────────────── */

/** Fields the backend owns on staging rows — never sent back. */
const SERVER_ONLY = ["validation_status", "error_code", "error_message", "val"];

/**
 * M&A FinEval fields `mapStagingEnvelope` fills in for the grid that the
 * staging record does not have — dropped so the PUT mirrors the GET.
 */
const MAPPER_ONLY = [
  "proposal_id",
  "proposal_title",
  "template_section_id",
  "template_fin_eval_line_id",
  "line_item_code",
];

const omit = (obj: Loose, keys: string[]): Loose =>
  Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)));

/** Move an id from the M&A slot back to the staging spelling. */
const withStagingId = (
  obj: Loose,
  keys: { stg: string; plain: string },
): Loose => {
  if (detectedIdStyle === "plain") return obj;
  const { [keys.plain]: id, ...rest } = obj;
  return { ...rest, [keys.stg]: id ?? null };
};

const stagingLine = (line: Loose): Loose =>
  withStagingId(
    withStagingId(omit(line, [...SERVER_ONLY, ...MAPPER_ONLY]), ID_KEYS.line),
    ID_KEYS.section,
  );

const stagingSection = (section: Loose): Loose => ({
  ...withStagingId(
    withStagingId(omit(section, [...SERVER_ONLY, ...MAPPER_ONLY]), ID_KEYS.section),
    ID_KEYS.parent,
  ),
  lines: ((section.lines as Loose[] | null) ?? []).map(stagingLine),
});

/**
 * The M&A save payload → the finEvaluationStaging PUT body, in the same
 * camelCase shape the GET returns:
 *
 *   { header: { finEvalHeaderStgId, …header fields, mAKeyInputs,
 *               mANpvCalculation, sections: [ { finEvalSectionStgId,
 *               …, lines: [ { finEvalLineStgId, …, yearValues } ] } ] } }
 *
 * `user_email` travels as a request header, as on every other import plugin.
 */
export const buildFinEvaluationStagingPayload = (
  payload: FinancialEvaluationSavePayload,
): { header: Loose } => {
  const { sections, ...header } = payload as unknown as Loose;
  return {
    header: camelKeys({
      ...withStagingId(
        omit(header, [...SERVER_ONLY, ...MAPPER_ONLY, "user_email"]),
        ID_KEYS.header,
      ),
      sections: ((sections as Loose[] | null) ?? []).map(stagingSection),
    }) as Loose,
  };
};

export interface StagingActionResult {
  message: string | null;
}

const messageOf = (env: Loose): string | null =>
  ((env.apiMessage ?? env.api_message) as string | undefined) || null;

/** PUT the staged evaluation so the backend re-runs validation. */
export const validateFinEvaluationStaging = async (
  payload: FinancialEvaluationSavePayload,
  options: { fileId?: number | null; signal?: AbortSignal } = {},
): Promise<StagingActionResult> => {
  const path = finEvaluationStagingPutPath(requireFileId(options.fileId));
  const body = buildFinEvaluationStagingPayload(payload);
  console.log("[staging-api] PUT", path, body);
  let response: unknown;
  try {
    ({ data: response } = await apiClient.put(path, body, {
      signal: options.signal,
    }));
  } catch (error) {
    throw toApiError(error, "Validation failed");
  }
  console.log("[staging-api] PUT response", response);
  return { message: messageOf(assertEnvelope(response, "Validation failed on server.")) };
};

/* ─────────────────────────── POST (Save Model / migrate) ────────── */

/** Migrate the staged evaluation into the proposal. No request body. */
export const migrateFinEvalStaging = async (
  options: { fileId?: number | null; signal?: AbortSignal } = {},
): Promise<StagingActionResult> => {
  const path = finEvalStagingMigratePath(requireFileId(options.fileId));
  console.log("[staging-api] POST", path);
  let response: unknown;
  try {
    ({ data: response } = await apiClient.post(path, undefined, {
      signal: options.signal,
    }));
  } catch (error) {
    throw toApiError(error, "Save failed");
  }
  console.log("[staging-api] POST response", response);
  return { message: messageOf(assertEnvelope(response, "Save failed on server.")) };
};
