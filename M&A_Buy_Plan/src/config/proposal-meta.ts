export interface ProposalMeta {
  badge: string;
  title: string;
  subtitle: string;
  ebsProjectCode: string;
  dealSponsor: string;
  corpDevLead: string;
  financeLead: string;
  yearEnd: string;
  fbrRate: string;
}

/** Static proposal header info, transcribed from the wireframe's mock GSPC
 * BuyPlan (SPC-2026-0063 v2, Project Orion / NovaCredit Analytics GmbH). */
export const PROPOSAL_META: ProposalMeta = {
  badge: "GSPC BuyPlan — SPC-2026-0063 v2",
  title: "BuyPlan — GSPC Proforma Financials",
  subtitle:
    "Project Orion · NovaCredit Analytics GmbH · M&A · EMAP · Approved 02 Apr 2026",
  ebsProjectCode: "CEA-042",
  dealSponsor: "M. Pinheiro",
  corpDevLead: "T. McNally",
  financeLead: "V. Patel",
  yearEnd: "30 September",
  fbrRate: "0.85 EUR/USD",
};
