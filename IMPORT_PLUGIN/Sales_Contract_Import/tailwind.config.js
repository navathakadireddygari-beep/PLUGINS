// Loaded by @config in src/styles/globals.css; it only sets `important`.
// As a selector it scopes every utility under the
// widget root, so utilities generated from stray words in the source (e.g.
// .container, .hidden, .table) can never match the host APEX page's own
// elements, and the ID out-ranks the host's rules. The `important` flag on
// the utilities import separately marks them !important.
export default {
  important: ":is(#sales-contracts-investment-report-root, #fin-eval-widget-root)",
};
