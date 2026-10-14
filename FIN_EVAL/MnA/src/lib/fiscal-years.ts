/**
 * Splitting a proposal's fiscal-year buckets into ACTUALS and PROJECTIONS.
 *
 * The two halves come from DIFFERENT facts and must be derived separately:
 *
 *   PROJECTIONS  the response's `display_years` — how many forward years the
 *                proposal is modelled over. It also drives the "N Years"
 *                stepper, so the banner and the control cannot disagree.
 *   ACTUALS      the fiscal years that have already begun, taken from the
 *                CLOCK. Nothing in the payload states where the split falls.
 *
 * Deriving actuals as "whatever display_years does not cover" (length − display)
 * conflates the two, and silently relabels a projection as an actual whenever a
 * response carries more year buckets than it displays.
 */

/**
 * Calendar month (1-based) a fiscal year starts in — April, so FY26 runs
 * April 2026 to March 2027 and is written "2026-2027".
 *
 * This is the one policy constant here, and it exists precisely so the split is
 * NOT hardcoded to a column count: everything below is derived from it and the
 * current date. Without it, `getFullYear()` alone would roll the fiscal year
 * over on 1 January — so for January to March the grid would call the year in
 * progress a projection and shift the partition a column early.
 */
export const FISCAL_YEAR_START_MONTH = 4;

/**
 * The fiscal year in progress, as the two digits the buckets are keyed by.
 *
 * Named after the calendar year the fiscal year STARTS in: August 2026 and
 * January 2027 are both inside FY 2026-2027, so both answer 26.
 *
 * `now` is injectable so the split can be tested without the wall clock.
 */
export const currentFiscalYear = (now: Date = new Date()): number => {
  const startYear =
    now.getMonth() + 1 >= FISCAL_YEAR_START_MONTH
      ? now.getFullYear()
      : now.getFullYear() - 1;
  return ((startYear % 100) + 100) % 100;
};

/** Two-digit fiscal year for a "fy26"-style bucket, or null if unparseable. */
export const fyNumberOf = (fy: string): number | null => {
  const m = /^fy(\d{2})$/i.exec(fy.trim());
  return m ? Number(m[1]) : null;
};

/**
 * How many leading buckets in `fiscalYears` are ACTUALS — i.e. where the
 * partition falls.
 *
 * A bucket is an actual when its fiscal year is the current one OR earlier.
 * The CURRENT year sits on the actuals side: FY26 is under way, so against a
 * current FY26 the partition falls between FY26 and FY27, not between FY25 and
 * FY26. That inclusive boundary is the whole rule.
 *
 * Counted as a leading RUN rather than a filter, because the partition is a
 * single vertical line: the actuals must be a contiguous prefix, so the first
 * bucket that is unparseable or in the future ends the block whatever follows
 * it.
 *
 * There is deliberately NO cap on the count. Capping at a fixed three columns
 * put the partition in the wrong place the moment a response carried four or
 * more historic buckets — the line would sit three columns in rather than after
 * the current year. How much history to send is the backend's decision; where
 * the line goes is the calendar's.
 *
 * Returns 0 when no bucket has started yet, or when the buckets are not
 * "fyNN"-shaped: no ACTUALS block and no partition is the honest rendering of
 * "we cannot tell", and is better than drawing the line at a guessed column.
 */
export const actualsCountOf = (
  fiscalYears: string[],
  currentFy: number = currentFiscalYear(),
): number => {
  let count = 0;
  for (const fy of fiscalYears) {
    const year = fyNumberOf(fy);
    if (year === null || year > currentFy) break;
    count += 1;
  }
  return count;
};
