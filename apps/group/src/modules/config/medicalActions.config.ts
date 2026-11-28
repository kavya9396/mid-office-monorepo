import type { MedicalActionsConfig } from "@insurance-poc/common/medical";

export type GroupMedicalScreen = "dvt" | "guw" | "dptNmr" | "dptMr";

/**
 * Which sections and buttons each Group screen shows on the Medical page.
 * - `hiddenSectionKeys`: sections that are not rendered (cards, left navigation, document dropdown),
 *   even when the API returns them
 * - `defaultMode` / `sectionModes`: the buttons of the sections that are shown
 *   - "edit":          Edit / Reset / Save
 *   - "review":        Agree
 *   - "editAndReview": Both
 *   - "readOnly":      no buttons (History stays)
 */
export const GROUP_MEDICAL_ACTIONS_CONFIG: Record<GroupMedicalScreen, MedicalActionsConfig> = {
  dvt: {
    hiddenSectionKeys: [
      "bre_medical_decision", // BRE Medical Decision
      "decision", // Decision
    ],
    defaultMode: "readOnly",
    sectionModes: {},
  },
  dptNmr: {
    hiddenSectionKeys: [
      "bre_medical_decision", // BRE Medical Decision
      "decision", // Decision
    ],
    defaultMode: "edit",
    sectionModes: {},
  },
  dptMr: {
    hiddenSectionKeys: [
      "bre_medical_decision", // BRE Medical Decision
      "decision", // Decision
    ],
    defaultMode: "edit",
    sectionModes: {},
  },
  // Same sections as DVT, with the Agree button added next to Edit / Reset / Save.
  guw: {
    hiddenSectionKeys: [],
    defaultMode: "editAndReview",
    sectionModes: {},
  },
};
