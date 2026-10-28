import type { ComponentProps } from "react";
import { DecisionBar } from "@insurance-poc/common/decision-bar";
import { DetailCard } from "@insurance-poc/common/detail-card";
import { LifeAssured } from "@insurance-poc/common/life-assured";
import { OpenTasksDialog } from "@insurance-poc/common/open-tasks";
import { PreviousPolicyDialog } from "@insurance-poc/common/previous-policy";
import { QuickLinksModule } from "@insurance-poc/common/quick-links";

/* ------------------------------------------------------------------ */
/* GROUP SCREEN CONFIG — single source of truth for every Group user.  */
/*                                                                    */
/* To change what a user sees: edit that user's entry in              */
/* GROUP_SCREENS below. Do not edit the page JSX.                     */
/* ------------------------------------------------------------------ */

/* ---------- 1. Which @insurance-poc/common component can be used ---------- */

export const COMPONENT_REGISTRY = {
  DETAIL_CARD: DetailCard,
  QUICK_LINKS: QuickLinksModule,
  DECISION_BAR: DecisionBar,
  LIFE_ASSURED: LifeAssured,
  PREVIOUS_POLICY_DIALOG: PreviousPolicyDialog,
  OPEN_TASKS_DIALOG: OpenTasksDialog,
} as const;

export type ComponentKey = keyof typeof COMPONENT_REGISTRY;

/* ---------- 2. Access model (field / action level) ---------- */

export type Access = "hidden" | "read" | "write";

/** Named actions each component can expose. Value in config = who may use it. */
type ActionsByComponent = {
  DETAIL_CARD: never;
  QUICK_LINKS: never;
  DECISION_BAR: "refresh" | "viewDetail";
  LIFE_ASSURED: "edit" | "viewMedical" | "viewFinancial";
  PREVIOUS_POLICY_DIALOG: never;
  OPEN_TASKS_DIALOG: never;
};

/** Declarative replacement for onClick handlers (config cannot hold functions). */
export type ConfigAction =
  | { type: "NAVIGATE"; to: "PREVIOUS_POLICY_PAGE" | "OPEN_TASKS_PAGE" | "AUDIT_TRAIL_PAGE" }
  | { type: "OPEN_DIALOG"; target: "PREVIOUS_POLICY_DIALOG" | "OPEN_TASKS_DIALOG" }
  | { type: "NOTIFY" };

/* ---------- 3. Where data comes from (keys of the DRS response) ---------- */

export type DataKey =
  | "cardDetails.APPLICATION"
  | "cardDetails.SOURCE"
  | "cardDetails.GROUP"
  | "cardDetails.RISK"
  | "bre"
  | "applicants";

/** Page regions. The page renders sections of the same slot together, by `order`. */
export type Slot = "cards" | "floating" | "body" | "footer";

/* ---------- 4. Section shape ---------- */

type SectionBase<K extends ComponentKey> = {
  /** Unique within the screen; also used for `data-testid`. */
  id: string;
  component: K;
  order: number;
  slot: Slot;
  /** `hidden` = not rendered. `read` / `write` = rendered. */
  access: Access;
  /** Where the section reads its data from. Omit for static sections. */
  dataKey?: DataKey;
  /** Fixed props passed straight to the component. */
  staticProps?: Partial<ComponentProps<(typeof COMPONENT_REGISTRY)[K]>>;
  /** Access per named action of this component (missing = inherits `access`). */
  actions?: Partial<Record<ActionsByComponent[K], Access>>;
  /**
   * Field-level access, keyed by the field name coming from the API
   * (e.g. DetailCard attribute `name`). Missing field = `defaultFieldAccess`.
   */
  fields?: Record<string, Access>;
  defaultFieldAccess?: Access;
};

type QuickLinkConfig = {
  id: string;
  label: string;
  access: Access;
  action: ConfigAction;
};

export type SectionConfig =
  | SectionBase<"DETAIL_CARD">
  | SectionBase<"DECISION_BAR">
  | SectionBase<"LIFE_ASSURED">
  | SectionBase<"PREVIOUS_POLICY_DIALOG">
  | SectionBase<"OPEN_TASKS_DIALOG">
  | (SectionBase<"QUICK_LINKS"> & { links: QuickLinkConfig[] });

export type GroupScreenConfig = {
  screenId: string;
  /** Value of `screenType` in the DRS API response. */
  screenType: string;
  /** Page-level layout for the `cards` slot. */
  cardsGrid: { columns: number; gap: number };
  /** What the "Previous Policies" quick link does for this user. */
  previousPolicyMode: "page" | "modal";
  /** What the "Open Tasks" quick link does for this user. */
  openTasksMode?: "page" | "modal";
  sections: SectionConfig[];
};

/* ---------- 5. Screens per Group user ---------- */

export const GROUP_SCREENS = {
  /* ===================== DVT USER ===================== */
  DVT: {
    screenId: "dvt-informal-drs",
    screenType: "DVT_INFORMAL",
    cardsGrid: { columns: 4, gap: 2 },
    previousPolicyMode: "page",
    openTasksMode: "page",
    sections: [
      /* ---- detail cards ---- */
      {
        id: "card-application",
        component: "DETAIL_CARD",
        order: 1,
        slot: "cards",
        access: "read",
        dataKey: "cardDetails.APPLICATION",
        staticProps: { title: "Application Detail" },
        defaultFieldAccess: "read",
      },
      {
        id: "card-source",
        component: "DETAIL_CARD",
        order: 2,
        slot: "cards",
        access: "read",
        dataKey: "cardDetails.SOURCE",
        staticProps: { title: "Source Detail" },
        defaultFieldAccess: "read",
      },
      {
        id: "card-group",
        component: "DETAIL_CARD",
        order: 3,
        slot: "cards",
        access: "read",
        dataKey: "cardDetails.GROUP",
        staticProps: { title: "Group Detail" },
        defaultFieldAccess: "read",
      },
      {
        id: "card-risk",
        component: "DETAIL_CARD",
        order: 4,
        slot: "cards",
        access: "read",
        dataKey: "cardDetails.RISK",
        staticProps: { title: "Risk Detail" },
        defaultFieldAccess: "read",
      },

      /* ---- quick links ---- */
      {
        id: "quick-links",
        component: "QUICK_LINKS",
        order: 1,
        slot: "floating",
        access: "write",
        staticProps: { title: "Quick Links" },
        links: [
          { id: "proposal-documents", label: "Proposal Form & Documents", access: "write", action: { type: "NOTIFY" } },
          { id: "previous-policies", label: "Previous Policy", access: "write", action: { type: "NAVIGATE", to: "PREVIOUS_POLICY_PAGE" } },
          { id: "open-tasks", label: "Open Task", access: "write", action: { type: "NAVIGATE", to: "OPEN_TASKS_PAGE" } },
          { id: "audit-trail", label: "Audit Trail", access: "write", action: { type: "NAVIGATE", to: "AUDIT_TRAIL_PAGE" } },
        ],
      },

      /* ---- previous policy (used when previousPolicyMode = "modal") ---- */
      {
        id: "previous-policy-dialog",
        component: "PREVIOUS_POLICY_DIALOG",
        order: 2,
        slot: "floating",
        access: "read",
      },

      /* ---- open tasks (used when openTasksMode = "modal") ---- */
      {
        id: "open-tasks-dialog",
        component: "OPEN_TASKS_DIALOG",
        order: 3,
        slot: "floating",
        access: "read",
      },

      /* ---- BRE decision bar ---- */
      {
        id: "bre-decision",
        component: "DECISION_BAR",
        order: 1,
        slot: "footer",
        access: "write",
        dataKey: "bre",
        staticProps: {
          title: "BRE Decision",
          refreshLabel: "BRE Retrigger",
        },
        actions: { refresh: "write", viewDetail: "read" },
      },

      /* ---- applicant profile ---- */
      {
        id: "life-assured",
        component: "LIFE_ASSURED",
        order: 1,
        slot: "body",
        access: "write",
        dataKey: "applicants",
        actions: { edit: "write", viewMedical: "read", viewFinancial: "read" },
      },
    ],
  },
} satisfies Record<string, GroupScreenConfig>;

export type GroupUserType = keyof typeof GROUP_SCREENS;

/* ---------- 6. Helpers ---------- */

export function getGroupScreenConfig(userType: GroupUserType): GroupScreenConfig {
  return GROUP_SCREENS[userType];
}

/** Sections the user may see, optionally filtered by slot, sorted by `order`. */
export function getVisibleSections(
  userType: GroupUserType,
  slot?: Slot,
): SectionConfig[] {
  const screen: GroupScreenConfig = GROUP_SCREENS[userType];
  return screen.sections
    .filter((section) => section.access !== "hidden")
    .filter((section) => slot === undefined || section.slot === slot)
    .sort((a, b) => a.order - b.order);
}

/** Resolved access for one field: explicit field entry → section default → section access. */
export function resolveFieldAccess(
  section: SectionConfig,
  fieldName: string,
): Access {
  return section.fields?.[fieldName] ?? section.defaultFieldAccess ?? section.access;
}

/** Resolved access for one named action: explicit action entry → section access. */
export function resolveActionAccess(
  section: SectionConfig,
  action: string,
): Access {
  const map: Partial<Record<string, Access>> | undefined = section.actions;
  return map?.[action] ?? section.access;
}
