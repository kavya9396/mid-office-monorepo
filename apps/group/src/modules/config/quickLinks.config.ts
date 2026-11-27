import type { QuickLinkItem } from "@insurance-poc/common/quick-links";

export interface ScreenQuickLinksConfig {
  items: QuickLinkItem[];
  defaultRoleType: string;
}


export type GroupQuickLinksScreen = "dvt" | "guw" | "dptNmr" | "dptMr" | "refCmo";

/** Which quick links each Group screen shows. Every link opens as a new page. */
export const GROUP_QUICK_LINKS_CONFIG: Record<
  GroupQuickLinksScreen,
  ScreenQuickLinksConfig
> = {
  dvt: {
    items: [
      { id: "proposal-documents", label: "Proposal Form & Documents" },
      { id: "previous-policies", label: "Previous Policy" },
      { id: "open-tasks", label: "Open Task" },
      { id: "audit-trail", label: "Audit Trail" },
    ],
    defaultRoleType: "DVT User",
  },
  dptNmr: {
    items: [
      { id: "proposal-documents", label: "Proposal Form & Documents" },
      { id: "previous-policies", label: "Previous Policy" },
      { id: "open-tasks", label: "Open Task" },
      { id: "audit-trail", label: "Audit Trail" },
    ],
    defaultRoleType: "Group Data Entry NMR User",
  },
  dptMr: {
    items: [
      { id: "proposal-documents", label: "Proposal Form & Documents" },
      { id: "previous-policies", label: "Previous Policy" },
      { id: "open-tasks", label: "Open Task" },
      { id: "audit-trail", label: "Audit Trail" },
    ],
    defaultRoleType: "Group Data Entry MR User",
  },
  guw: {
    items: [
      { id: "applicant-profile", label: "Applicant Profile" },
      { id: "proposal-documents", label: "Proposal Form & Documents" },
      { id: "previous-policies", label: "Previous Policies" },
      { id: "open-tasks", label: "Open Tasks" },
      { id: "risk-details", label: "Risk Details" },
      { id: "audit-trail", label: "Audit Trail" },
      { id: "raise-grievance", label: "Raise Grievance" },
    ],
    defaultRoleType: "GUW User",
  },
  refCmo: {
    items: [
      { id: "applicant-profile", label: "Applicant Profile" },
      { id: "previous-policies", label: "Previous Policies" },
      { id: "open-tasks", label: "Open Tasks" },
      { id: "risk-details", label: "Risk Details" },
      { id: "audit-trail", label: "Audit Trail" },
      { id: "raise-grievance", label: "Raise Grievance" },
    ],
    defaultRoleType: "REF CMO",
  },
};
