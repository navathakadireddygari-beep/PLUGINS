import { PROPOSAL_META } from "@/config/proposal-meta";

export default function BuyPlanHeader() {
  return (
    <div className="bp-header-card">
      <div className="bp-header-top">
        <div>
          <div className="bp-badge">{PROPOSAL_META.badge}</div>
          <h1 className="bp-title">{PROPOSAL_META.title}</h1>
          <div className="bp-subtitle">{PROPOSAL_META.subtitle}</div>
        </div>
        <div className="bp-ebs">
          <div className="bp-ebs-label">EBS Project Code</div>
          <span className="bp-ebs-code">{PROPOSAL_META.ebsProjectCode}</span>
        </div>
      </div>
      <div className="bp-meta-row">
        <span>
          <strong>Deal Sponsor:</strong> {PROPOSAL_META.dealSponsor}
        </span>
        <span>
          <strong>Corp Dev Lead:</strong> {PROPOSAL_META.corpDevLead}
        </span>
        <span>
          <strong>Finance Lead:</strong> {PROPOSAL_META.financeLead}
        </span>
        <span>
          <strong>Y/E:</strong> {PROPOSAL_META.yearEnd}
        </span>
        <span>
          <strong>FBR Rate:</strong> {PROPOSAL_META.fbrRate}
        </span>
      </div>
    </div>
  );
}
