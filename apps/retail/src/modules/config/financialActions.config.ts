import type { FinancialActionsConfig } from "@insurance-poc/common/financial";

export type RetailFinancialScreen = "cvt";

/**
 * Which sections and buttons each Retail screen shows on the Financial page.
 * - `hiddenSectionKeys`: sections that are not rendered, even when the API returns them
 * - `defaultMode` / `sectionModes`: the buttons of the sections that are shown
 *   - "edit":          Edit / Reset / Save
 *   - "review":        Agree / Disagree
 *   - "editAndReview": Both
 *   - "readOnly":      no buttons
 */
export const RETAIL_FINANCIAL_ACTIONS_CONFIG: Record<
  RetailFinancialScreen,
  FinancialActionsConfig
> = {
  cvt: {
    hiddenSectionKeys: [
      "bre_financial_decision", // BRE Financial Decision
      "decision", // Decision
    ],
    defaultMode: "readOnly",
    sectionModes: {},
  },
};
