import type { FinancialActionsConfig } from "@insurance-poc/common/financial";

export type GroupFinancialScreen = "dvt";

/**
 * Which sections and buttons each Group screen shows on the Financial page.
 * - `hiddenSectionKeys`: sections that are not rendered, even when the API returns them
 * - `defaultMode` / `sectionModes`: the buttons of the sections that are shown
 *   - "edit":          Edit / Reset / Save
 *   - "review":        Agree / Disagree
 *   - "editAndReview": Both
 *   - "readOnly":      no buttons
 */
export const GROUP_FINANCIAL_ACTIONS_CONFIG: Record<
  GroupFinancialScreen,
  FinancialActionsConfig
> = {
  dvt: {
    hiddenSectionKeys: [
      "bre_financial_decision", // BRE Financial Decision
      "decision", // Decision
    ],
    defaultMode: "edit",
    sectionModes: {},
  },
};
