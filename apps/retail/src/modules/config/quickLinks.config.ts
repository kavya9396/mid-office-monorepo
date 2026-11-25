import type { QuickLinkItem } from "@insurance-poc/common/quick-links";

export interface ScreenQuickLinksConfig {
  items: QuickLinkItem[];
  defaultRoleType: string;
}

export type RetailQuickLinksScreen = "cuw";

/** Which quick links each Retail screen shows. Every link opens as a new page. */
export const RETAIL_QUICK_LINKS_CONFIG: Record<
  RetailQuickLinksScreen,
  ScreenQuickLinksConfig
> = {
  cuw: {
    items: [
      { id: "applicant-profile", label: "Applicant Profile" },
      { id: "proposal-documents", label: "Proposal Form & Documents" },
      { id: "previous-policies", label: "Previous Policies" },
      { id: "open-tasks", label: "Open Tasks" },
      { id: "risk-details", label: "Risk Details" },
      { id: "audit-trail", label: "Audit Trail" },
      { id: "raise-grievance", label: "Raise Grievance" },
    ],
    defaultRoleType: "CUW User",
  },
};
