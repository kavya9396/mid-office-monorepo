import type { MedicalActionsConfig } from "@insurance-poc/common/medical";

export type RetailMedicalScreen = "cvt" | "cptNmr" | "cptMr" | "cuw";

/**
 * Which sections and buttons each Retail screen shows on the Medical page.
 * - `hiddenSectionKeys`: sections that are not rendered (cards, left navigation, document dropdown),
 *   even when the API returns them
 * - `defaultMode` / `sectionModes`: the buttons of the sections that are shown
 *   - "edit":          Edit / Reset / Save
 *   - "review":        Agree
 *   - "editAndReview": Both
 *   - "readOnly":      no buttons (History stays)
 */
export const RETAIL_MEDICAL_ACTIONS_CONFIG: Record<RetailMedicalScreen, MedicalActionsConfig> = {
  cvt: {
    hiddenSectionKeys: [
      "bre_medical_decision", // BRE Medical Decision
      "decision", // Decision
    ],
    defaultMode: "readOnly",
    sectionModes: {},
  },
  cptNmr: {
    hiddenSectionKeys: [
      "bre_medical_decision", // BRE Medical Decision
      "decision", // Decision
    ],
    defaultMode: "edit",
    sectionModes: {},
  },
  cptMr: {
    hiddenSectionKeys: [
      "bre_medical_decision", // BRE Medical Decision
      "decision", // Decision
    ],
    defaultMode: "edit",
    sectionModes: {},
  },
  // Same as Group GUW: every section shown, with Edit / Reset / Save and Agree.
  cuw: {
    hiddenSectionKeys: [],
    defaultMode: "editAndReview",
    sectionModes: {},
  },
};
