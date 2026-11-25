import { useState, useEffect, useRef, type ReactElement } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  CustomButton,
  CustomDialog,
  CustomMultiSelect,
  CustomRadioGroup,
  CustomSelect,
  CustomTextField,
  CustomTooltip,
  CustomSnackbar,
  EditIcon,
  DangerIcon,
  EyeIcon,
  InfoIcon,
  InfomationIcon,
  NoteIcon,
  TaskIcon,
} from "@insurance-poc/ui";
import { groupPaths, replaceUrl } from "@insurance-poc/routes";
import { ValidationList } from "@insurance-poc/common/validation-list";
import { getDrsRoleType, getDrsTaskIds, getMasterList, getSessionUser } from "@insurance-poc/utils";
import {
  findPendingValidationMessage,
  readGuwCaseDecisionOptions,
  type GuwRequiredValidations,
} from "../../services/drsService";
import {
  useGetGuwUwDecisionMutation,
  useGetUsersByRoleQuery,
  useSaveGuwParallelDecisionMutation,
} from "../../services/drsApi";
import {
  GUW_ASSIGNEE_ROLE,
  assigneeRoleForReferTo,
  assigneeRoleForReferralRow,
  guwSrUwReferralCode,
  isGuwSrUwReferral,
  SR_UW_OPINION_MASTER_VALUE,
  buildGuwCounterSignParallelDecisionRequest,
  buildGuwReferralParallelDecisionRequests,
  buildGuwUwDecisionProducts,
  buildGuwUwDecisionRequest,
  hasGuwDecisionProducts,
  GUW_UW_DECISION_SCREEN_TYPE,
  type GuwAssigneeOption,
} from "../../services/drsService";
import {
  buildGuwUwDecisionMappingRequest,
  fetchGuwDecisionCodeOptions,
  type GuwDecisionCodeOption,
} from "../../services/drsService";
import {
  clearGuwSubmittedDecision,
  saveGuwSubmittedDecision,
  toGuwValidationRequest,
  type GuwGuidelineCategory,
  type GuwPartyValidationRow,
  type GuwProductDetail,
  type GuwSavedValidationRow,
  type GuwSubmittedDecision,
  type GuwValidationResult,
  type GuwValidationRow,
} from "../../services/drsService";
import { useValidateGuwDecisionMutation } from "../../services/dvtValidationApi";

export interface GuwUwSummaryField {
  label: string;
  value?: string;
}

export interface GuwUwPanelProps {
  /** Member's `product_details` rows; the Decision Details table and the `productCode` sent to the APIs come from here. */
  products?: GuwProductDetail[];
  /** Used to hold the submitted decision (and UW guidelines) in the browser session. */
  applicationNo?: string;
  /** Application number of the DRS API response; sent to the `uw-decision` API (falls back to `applicationNo`). */
  drsApplicationNo?: string;
  /** DRS `caseType`; sent as `dataEntry` to the `uw_decision_mapping` master when loading Decision Codes. */
  caseType?: string;
  /**
   * Member's `partyId`. When set (member-level DRS), submitting a decision saves it through the
   * `uw-decision` API. Omit on the case-level summary.
   */
  partyId?: string;
  /** Session key for the held decision; defaults to applicationNo (the summary page uses its own). */
  storageKey?: string;
  /**
   * Claim Audit / Special Remarks rows that must be validated (Validate button in their dialogs) before the main
   * Submit is allowed. Validate clicks are read for the logged-in user under `storageKey ?? applicationNo`.
   */
  requiredValidations?: GuwRequiredValidations;
  /**
   * Case UW Decision code derived from the member decisions (member summary page). When it changes, the
   * dropdown follows it and any decision held for this panel is dropped. `undefined` = not derived.
   */
  derivedDecision?: string;
  /** Disables the Case UW Decision dropdown and shows its code in a read-only Decision Code field. */
  decisionReadOnly?: boolean;
  /** Where to go after a successful final submit (inbox, or the member summary page for multi-life). */
  redirectUrl?: string;
  breOverallDecision?: string;
  breOverallRemarks?: string;
  /**
   * Optional custom summary fields shown on the left card (e.g. Financial Decision, Medical Decision, LumiQ Decision).
   * When omitted, BRE Overall Decision / Remarks are shown.
   */
  summaryFields?: GuwUwSummaryField[];
  /**
   * Optional custom action decisions shown below the Case UW Decision dropdown.
   * When omitted, defaults to [{ value: "REFERRAL", label: "Raise Referral" }, { value: "HOLD", label: "Hold" }, { value: "APPROVER", label: "Counter Sign" }].
   */
  actionOptions?: { value: string; label: string }[];
  /** Callback when an action button or action decision is clicked */
  onActionClick?: (value: string) => void;
  initialSubmittedDecision?: GuwSubmittedDecision;
  onDecisionSubmit: (decision: string, remarks: string) => void;
}

interface CounterOfferRow {
  id: string;
  productName: string;
  isRider: boolean;
  type: string;
  bstdCode: string;
  sa: string;
  changedSa: string;
  pt: string;
  changedPt: string;
  loadingClass: string;
  loadingReason: string;
  isUserAdded?: boolean;
}

interface SubmittedField {
  label: string;
  value: string;
  wide?: boolean;
}

interface SubmittedDecision {
  fields: SubmittedField[];
  reconsiderationFields: SubmittedField[];
  remarks: string;
  counterOfferRows: CounterOfferRow[];
  showBstdColumn: boolean;
  reinsurerRows: { code: string; systemName: string; uwName: string }[];
  documentRows: { name: string; assigned: boolean[] }[];
  /** Static guidelines of snapshots saved before the validation API; new snapshots keep this empty. */
  guidelines: GuidelineRow[];
  /** UW Guidelines rows from the validation API, with the justifications the user saved. */
  validationRows?: GuwSavedValidationRow[];
  referralRows?: {
    target: string;
    label: string;
    selected: boolean;
    reason: string;
    remarks: string;
    assignedTo: string;
  }[];
}

/** "XXE - Counter Offer with Exclusion" -> "XXE" (the code is the part before the first " - "). */
const codeOfDecisionCodeText = (text: string) => text.split(" - ")[0].trim();

/** Case UW Decisions that show the Decision Code dropdown (options from the `uw_decision_mapping` master). */
const DECISION_CODE_DECISIONS = ["STD", "BOR_STD", "REJ", "DC", "POSTP", "CO", "EP"];

// Case UW Decision options come from master data (misc / GUW_TERM_DESC) via `readGuwCaseDecisionOptions`.
// Read at render time (like the DVT decision options), not at module load, because the master data is only
// in session after login.
const readDecisionOptions = readGuwCaseDecisionOptions;

/** Reason options of the given master `misc` types, in that order, from the post-login master data. */
const readReasonOptions = (types: string[]) =>
  types.flatMap((type) =>
    getMasterList("misc", type)
      .filter((entry) => entry.isActive === "Y")
      .map((entry) => {
        const text = entry.value ?? entry.description;
        return { value: text, label: text };
      }),
  );

/** BSTD Code options: master `misc` BSTD types combined; value and label are the master code. */
const readBstdCodeOptions = () =>
  ["GUW_BSD_CODE_MED", "GUW_BSD_CODE_NON_MED", "GUW_BSD_CODE_TELE", "GUW_BSD_CODE_VID"].flatMap((type) =>
    getMasterList("misc", type)
      .filter((entry) => entry.isActive === "Y")
      .map((entry) => ({ value: entry.code, label: entry.code })),
  );

/**
 * Options of the first master `misc` type that has active entries (the master mock still carries the
 * older GUW_RECONS_* names, so they are the fallback for GUW_REJ_RECONS_*).
 */
const readFirstAvailableMiscOptions = (types: string[]) => {
  for (const type of types) {
    const options = getMasterList("misc", type)
      .filter((entry) => entry.isActive === "Y")
      .map((entry) => {
        const text = entry.value ?? entry.description;
        return { value: text, label: text };
      });
    if (options.length > 0) return options;
  }
  console.warn(`[GuwUwPanel] No active master "misc" entries for type(s): ${types.join(", ")}`);
  return [];
};

const readPostponementPeriodOptions = () => readFirstAvailableMiscOptions(["POSTPONE_PERIOD"]);

const DENY_RIDER_TYPE = "Deny Rider";

// Decision Details "Type" master `misc` type per decision.
const TYPE_MASTER_BY_DECISION: Record<string, string | undefined> = {
  BOR_STD: "GUW_BSTD_TYPE",
  EP: "GUW_EP_TYPE",
  CO: "GUW_CO_TYPE",
};

/**
 * Decision Details "Type" options from master data: Borderline Standard -> GUW_BSTD_TYPE;
 * Extra Premium -> GUW_EP_TYPE; Counter Offer -> GUW_CO_TYPE. "Deny Rider" is offered for rider rows only.
 */
const readCounterOfferTypeOptions = (decision: string, isRider: boolean) => {
  const masterType = TYPE_MASTER_BY_DECISION[decision];
  if (!masterType) return [];
  return readFirstAvailableMiscOptions([masterType]).filter(
    (option) => option.value !== DENY_RIDER_TYPE || isRider,
  );
};

// Loading Class / Loading Reason Code values are the master text (the `uw-decision` request carries the text).
const readLoadingClassOptions = () => readFirstAvailableMiscOptions(["GUW_EP_LOAD_CLS"]);

const readLoadingReasonOptions = () => readFirstAvailableMiscOptions(["GUW_EP_LOAD_RSN_CODE"]);

const readHoldReasonOptions = () => readFirstAvailableMiscOptions(["GUW_HOLD_RSN"]);

// Counter Sign Refer To options from master data (GUW_CS from misc master, fallback to GUW_REF_TO)
const readReferToOptions = () => {
  const csOptions = readFirstAvailableMiscOptions(["GUW_CS"]);
  if (csOptions.length > 0) return csOptions;
  return readFirstAvailableMiscOptions(["GUW_REF_TO"]).filter(
    (option) => assigneeRoleForReferTo(option.value) !== "",
  );
};

// Counter Sign reasons depend on the selected Refer To (HOD / Sr UW)
const APPROVER_REASON_TYPE_BY_TARGET: Record<string, string | undefined> = {
  hod: "GUW_REF_HOD_CS",
  "sr uw": "GUW_REF_SRUW_CS",
  sruw: "GUW_REF_SRUW_CS",
  sr_uw: "GUW_REF_SRUW_CS",
  "senior uw": "GUW_REF_SRUW_CS",
};

const readApproverReasonOptions = (target: string) => {
  const type = APPROVER_REASON_TYPE_BY_TARGET[target.trim().toLowerCase()];
  return type ? readFirstAvailableMiscOptions([type]) : [];
};

const readReconsiderAfterOptions = () =>
  readFirstAvailableMiscOptions(["GUW_REJ_RECONS_AFTER", "GUW_RECONS_AFTER"]);

const readReconsiderReqTypeOptions = () =>
  readFirstAvailableMiscOptions(["GUW_REJ_RECONS_TYPE", "GUW_RECONS_TYPE"]);

// The master requirement type for "other" is "Others"; the free-text field opens for either spelling.
const isOtherRequirementType = (value: string) => /^others?$/i.test(value);

const readSmokerFlagOptions = () =>
  getMasterList("misc", "GUW_STD_SMOK")
    .filter((entry) => entry.isActive === "Y")
    .map((entry) => ({
      value: entry.value ?? entry.description,
      label: entry.value ?? entry.description,
    }));

// Decisions raised from the action buttons below the Case UW Decision dropdown
const ACTION_DECISION_OPTIONS = [
  { value: "REFERRAL", label: "Raise Referral" },
  { value: "HOLD", label: "Hold" },
  { value: "APPROVER", label: "Counter Sign" },
];

// Row code of each master `GUW_REF_TO` value (lower case). The row code drives the existing exclusive /
// reason / assign / reinsurer rules, so only the Refer To text comes from the master.
// Plain "HOD" / "SR UW" are Counter Sign values only; Raise Referral uses the "... Opinion" values.
// "SR UW Opinion" is not listed here: its row code is the master's own code (see `guwSrUwReferralCode`).
const REFERRAL_TARGET_BY_MASTER_VALUE: Record<string, string | undefined> = {
  it: "REF_IT",
  reinsurer: "REF_REINS",
  "hod opinion": "REF_HOD",
  "ho cmo": "REF_CMO",
  cmo: "REF_CMO_LOCAL",
  risk: "REF_RISK",
  accuity: "REF_ACU",
  "cuw claim": "REF_CUW_CLM",
  "tele mer": "REF_TELE_MER",
  "video mer": "REF_VIDEO_MER",
};

/**
 * Raise Referral "Refer To" rows from master `misc` type GUW_REF_TO (label = master value, in master order).
 * Read at render time because the master data is only in session after login.
 */
const readReferralTypeOptions = () => {
  const seen = new Set<string>();
  return readFirstAvailableMiscOptions(["GUW_REF_TO"]).flatMap((option) => {
    if (assigneeRoleForReferTo(option.value) !== "") return [];
    const key = option.value.trim().toLowerCase();
    const target = key === SR_UW_OPINION_MASTER_VALUE ? guwSrUwReferralCode() : REFERRAL_TARGET_BY_MASTER_VALUE[key];
    if (!target) {
      console.warn(`[GuwUwPanel] GUW_REF_TO value "${option.value}" has no referral row; skipped.`);
      return [];
    }
    // The master can list one value twice (numeric and coded entries); one row per referral target
    if (seen.has(target)) return [];
    seen.add(target);
    return [{ value: target, label: option.value }];
  });
};

// Referral rows that exclude every other row (Reinsurer, Sr UW Opinion, HOD Opinion)
const isExclusiveReferral = (target: string) =>
  target === "REF_REINS" || target === "REF_HOD" || isGuwSrUwReferral(target);

// Assigned To is enabled only for these referral rows (Sr UW Opinion, HOD Opinion)
const isAssignableReferral = (target: string) => target === "REF_HOD" || isGuwSrUwReferral(target);

// Referrals whose Reason dropdown is disabled
const DISABLED_REASON_REFERRALS = ["REF_ACU", "REF_CUW_CLM"];

// Referral reason options per referral row come from these master `misc` types.
// REF_VIDEO_MER has no master type yet, so it keeps its static list.
const REFERRAL_REASON_MASTER_TYPES: Record<string, string | undefined> = {
  REF_IT: "GUW_REF_IT_RSN",
  REF_REINS: "GUW_REF_REINS",
  REF_HOD: "GUW_REF_HOD_OP",
  REF_CMO: "GUW_HO_CMO_RSN",
  REF_CMO_LOCAL: "GUW_CMO_RSN",
  REF_RISK: "GUW_REF_RSK",
  REF_TELE_MER: "GUW_TELE_MER_RSN",
};

const REFERRAL_STATIC_REASON_OPTIONS: Record<string, string[] | undefined> = {
  REF_VIDEO_MER: ["Medical review", "Other"],
};

const SR_UW_OPINION_REASON_MASTER_TYPE = "GUW_REF_SRUW_OP";

const referralReasonMasterType = (target: string) =>
  isGuwSrUwReferral(target) ? SR_UW_OPINION_REASON_MASTER_TYPE : REFERRAL_REASON_MASTER_TYPES[target];

const hasReferralReasonOptions = (target: string) =>
  !DISABLED_REASON_REFERRALS.includes(target) &&
  (referralReasonMasterType(target) !== undefined || REFERRAL_STATIC_REASON_OPTIONS[target] !== undefined);

const readReferralReasonOptions = (target: string) => {
  if (DISABLED_REASON_REFERRALS.includes(target)) return [];
  const type = referralReasonMasterType(target);
  if (type) return readFirstAvailableMiscOptions([type]);
  return (REFERRAL_STATIC_REASON_OPTIONS[target] ?? []).map((text) => ({ value: text, label: text }));
};

const REINSURER_UW_OPTIONS = ["Swiss Re", "Munich Re", "Scor Re", "Gen Re", "RGA Re", "Hannover Re"];
const REFERRAL_DOCUMENTS = ["Application Form", "PhotoId Proof", "Address Proof"];

const DEFAULT_PRODUCTS = [
  { name: "iProtect Smart", code: "IPROTECT_SMART", sa: "₹50,00,000", pt: "20", isRider: false },
  { name: "Accidental Death Rider", code: "ADB", sa: "₹10,00,000", pt: "20", isRider: true },
  { name: "WOP Rider", code: "WOP", sa: "₹15,00,000", pt: "20", isRider: true },
];

export interface GuidelineRow {
  reason: string;
  remark: string;
  systemAction: string;
  justificationReason: string;
  justificationRemark: string;
}

export const INITIAL_GUIDELINES: GuidelineRow[] = [
  { reason: "Income document waived or not received", remark: "Income document waived or not raised. Please provide justification", systemAction: "", justificationReason: "", justificationRemark: "" },
  { reason: "Medical requirement waived or not received", remark: "Medical document waived or not raised. Please provide justification", systemAction: "", justificationReason: "", justificationRemark: "" },
  { reason: "Financially not viable", remark: "Justification required as financial eligibility is less than TFSA", systemAction: "", justificationReason: "", justificationRemark: "" },
  { reason: "DRC Risk Blank or Null Risk", remark: "DRC Risk value is Blank or Null Risk — kindly take counter signing", systemAction: "REFER_TO_CS", justificationReason: "", justificationRemark: "" },
  { reason: "TSA above your UW limit", remark: "Case above your underwriting limit, please take counter signing", systemAction: "REFER_TO_CS", justificationReason: "", justificationRemark: "" },
  { reason: "Application form validity expired", remark: "Please call for fresh medical questionnaire", systemAction: "REFER_TO_HOD", justificationReason: "", justificationRemark: "" },
  { reason: "BIU model response field is blank", remark: "BIU models predict response is blank — cannot take STD, XRT or COF decision. Kindly get the BIU response", systemAction: "", justificationReason: "", justificationRemark: "" }
];

// ---- UW Guidelines (decision-validation API) helpers ----

// reasonCode of "Other Reason": the only justification reason that needs a remark
const OTHER_REASON_CODE = "3";

const JUSTIFICATION_INCOMPLETE_MESSAGE = "Please select a reason for all justifications and checklists";

// A hard alert with this system action stops the submission
const BLOCKER_ACTION = "blocker";
const BLOCKER_MESSAGE = "User is not allowed to provide terminal decisions,please modify the decision";

const GUIDELINE_CATEGORY_META: Record<
  GuwGuidelineCategory,
  { label: string; icon: () => ReactElement }
> = {
  justification: { label: "Justification", icon: () => <TaskIcon /> },
  checklist: { label: "Checklist", icon: () => <NoteIcon /> },
  hardAlert: { label: "Hard Alert", icon: () => <DangerIcon /> },
  softAlert: { label: "Soft Alert", icon: () => <InfomationIcon /> },
};

const GUIDELINE_CELL = {
  padding: "8px 10px",
  borderRight: "1px solid #eadfd9",
  borderBottom: "1px solid #eadfd9",
} as const;
const GUIDELINE_CELL_LAST = { padding: "8px 10px", borderBottom: "1px solid #eadfd9" } as const;

// Exclusive referral rows, in pre-selection priority order after CMO / other rows (priority 0).
// The Sr UW row code comes from the master, so the list is built when it is read.
const readExclusiveReferrals = () => [
  { key: "sr uw", row: guwSrUwReferralCode(), priority: 1 },
  { key: "hod", row: "REF_HOD", priority: 2 },
  { key: "reinsurer", row: "REF_REINS", priority: 3 },
];

const guidelineRowKey = (row: { category: GuwGuidelineCategory; validationId: string }) =>
  `${row.category}-${row.validationId}`;

// Justification and checklist rows are filled by the user; hard / soft alerts are locked
const isJustificationRow = (row: GuwValidationRow) =>
  row.category === "justification" || row.category === "checklist";

const isJustificationComplete = (row: GuwSavedValidationRow) =>
  row.selectedReasonCode !== "" &&
  (row.category !== "justification" ||
    row.selectedReasonCode !== OTHER_REASON_CODE ||
    row.justificationRemark.trim() !== "");

const areJustificationsComplete = (rows: GuwSavedValidationRow[]) =>
  rows.filter(isJustificationRow).every(isJustificationComplete);

const hasBlockerAlert = (rows: GuwValidationRow[]) =>
  rows.some((r) => r.category === "hardAlert" && r.systemAction.trim().toLowerCase() === BLOCKER_ACTION);

/** Starts every row empty, restoring what the user saved earlier for the same validation row. */
function mergeSavedRows(
  rows: GuwValidationRow[],
  saved: GuwSavedValidationRow[] = [],
): GuwSavedValidationRow[] {
  return rows.map((row) => {
    const previous = saved.find((s) => guidelineRowKey(s) === guidelineRowKey(row));
    if (!previous || !row.justificationOptions.some((o) => o.code === previous.selectedReasonCode)) {
      return { ...row, selectedReasonCode: "", justificationRemark: "" };
    }
    return {
      ...row,
      selectedReasonCode: previous.selectedReasonCode,
      justificationRemark: previous.justificationRemark,
    };
  });
}

/** Referral targets named by the hard alerts ("Refer to HOD" -> "HOD"), de-duplicated, in response order. */
function referralTargetsOf(rows: GuwValidationRow[]): string[] {
  const targets = rows
    .filter((r) => r.category === "hardAlert")
    .map((r) => r.systemAction.trim())
    .filter((action) => /^refer to /i.test(action))
    .map((action) => action.replace(/^refer to /i, "").trim())
    .filter((target) => target !== "");
  return targets.filter((target, index) => targets.indexOf(target) === index);
}

/**
 * Only one Raise Referral row is pre-selected: CMO / other rows first, then Sr UW, HOD, Reinsurer.
 * Among CMO / other rows the response order decides.
 */
function pickReferralRow(targets: string[]): string | null {
  const referralOptions = readReferralTypeOptions();
  let best: { priority: number; row: string } | null = null;
  for (const target of targets) {
    const key = target.toLowerCase();
    const exclusive = readExclusiveReferrals().find((e) => e.row !== "" && e.key === key);
    const option = exclusive
      ? undefined
      : referralOptions.find((o) => o.label.toLowerCase() === key);
    const candidate = exclusive
      ? { priority: exclusive.priority, row: exclusive.row }
      : option
        ? { priority: 0, row: option.value }
        : null;
    if (candidate && (!best || candidate.priority < best.priority)) best = candidate;
  }
  return best ? best.row : null;
}

function GuidelineCategoryIcon({ category }: Readonly<{ category: GuwGuidelineCategory }>) {
  const { label, icon } = GUIDELINE_CATEGORY_META[category];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        flexShrink: 0,
        mr: "6px",
        verticalAlign: "middle",
        "& svg": { width: "16px", height: "16px" },
      }}
    >
      <CustomTooltip title={label}>
        <span role="img" aria-label={label} style={{ display: "inline-flex" }}>
          {icon()}
        </span>
      </CustomTooltip>
    </Box>
  );
}

export function GuwUwPanel({
  products,
  applicationNo = "",
  drsApplicationNo = "",
  caseType = "",
  partyId = "",
  storageKey,
  requiredValidations,
  derivedDecision,
  decisionReadOnly = false,
  redirectUrl = groupPaths.inbox,
  breOverallDecision,
  breOverallRemarks,
  summaryFields,
  actionOptions,
  onActionClick,
  initialSubmittedDecision,
  onDecisionSubmit,
}: Readonly<GuwUwPanelProps>) {
  const DECISION_OPTIONS = readDecisionOptions();
  const SMOKER_FLAG_OPTIONS = readSmokerFlagOptions();
  const ALL_DECISION_OPTIONS = [
    ...DECISION_OPTIONS,
    ...ACTION_DECISION_OPTIONS,
    { value: "AMR", label: "Raise Requirement" },
  ];
  const [selectedDecision, setSelectedDecision] = useState<string>(
    initialSubmittedDecision?.decisionCode ?? "",
  );
  const [remarks, setRemarks] = useState<string>(initialSubmittedDecision?.remarks ?? "");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
  const [submittedDecision, setSubmittedDecision] = useState<SubmittedDecision | null>(
    initialSubmittedDecision ?? null,
  );
  // Follow the decision derived from the members; a held decision that no longer matches is dropped
  useEffect(() => {
    if (derivedDecision === undefined || derivedDecision === selectedDecision) return;
    setSelectedDecision(derivedDecision);
    setSubmittedDecision(null);
    setRemarks("");
    clearGuwSubmittedDecision(storageKey ?? applicationNo);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to a change of the derived value
  }, [derivedDecision]);
  const [dialogDecision, setDialogDecision] = useState<string>("");
  // Case UW Decision chosen before switching to Counter Sign / Raise Referral from the UW Guidelines step
  const [approverBaseDecision, setApproverBaseDecision] = useState<string>("");
  // Keeps Counter Offer rows when moving between steps (the decision code changes but the data must stay)
  const keepCounterOfferRowsRef = useRef(false);
  // Decision shown before moving to Counter Sign / Raise Referral (used by Back)
  const decisionBeforeActionRef = useRef("");
  // True when Counter Sign / Raise Referral was opened from the UW Guidelines step: validation is done,
  // Submit is final and Back returns to UW Guidelines
  const [guidelinesConfirmed, setGuidelinesConfirmed] = useState<boolean>(false);
  const [dialogRemarks, setDialogRemarks] = useState<string>("");

  // Dialog multi-step & decision-validation (UW Guidelines) states
  const [dialogStep, setDialogStep] = useState<number>(1);
  const [validation, setValidation] = useState<GuwValidationResult | null>(null);
  const [validationRows, setValidationRows] = useState<GuwSavedValidationRow[]>(
    () => initialSubmittedDecision?.validationRows ?? [],
  );
  const [validating, setValidating] = useState<boolean>(false);
  // Party-level failures of the validation API; the Validations modal is open while this is not empty
  const [partyValidationRows, setPartyValidationRows] = useState<GuwPartyValidationRow[]>([]);
  const [validateGuwDecision] = useValidateGuwDecisionMutation();
  const [getUwDecision] = useGetGuwUwDecisionMutation();
  const [saveParallelDecision] = useSaveGuwParallelDecisionMutation();

  // Decision Code dropdown: options come from the masters `uw_decision_mapping` API, loaded when a Case UW Decision is picked
  const [decisionCodeOptions, setDecisionCodeOptions] = useState<GuwDecisionCodeOption[]>([]);
  // The summary stores "<code> - <description>" for display; only the code is held here and sent to `uw-decision`
  const [decisionCodeValue, setDecisionCodeValue] = useState<string>(() =>
    codeOfDecisionCodeText(initialSubmittedDecision?.fields.find((f) => f.label === "Decision Code")?.value ?? ""),
  );
  const decisionCodeRequestRef = useRef(0);

  const loadDecisionCodeOptions = async (caseDecisionCode: string, keepValue: string) => {
    const requestId = decisionCodeRequestRef.current + 1;
    decisionCodeRequestRef.current = requestId;
    setDecisionCodeOptions([]);
    setDecisionCodeValue("");
    if (!buildGuwUwDecisionMappingRequest(caseDecisionCode, caseType)) return;
    try {
      const options = await fetchGuwDecisionCodeOptions(caseDecisionCode, caseType);
      if (decisionCodeRequestRef.current !== requestId) return;
      setDecisionCodeOptions(options);
      if (options.some((o) => o.value === keepValue)) setDecisionCodeValue(keepValue);
    } catch (reason: unknown) {
      if (decisionCodeRequestRef.current !== requestId) return;
      console.error("[GuwUwPanel] uw_decision_mapping failed:", reason);
      notify("Unable to load Decision Codes. Please try again.", "error");
    }
  };

  // Snackbar states
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");

  const notify = (msg: string, severity: "success" | "error" | "warning" | "info" = "success") => {
    setSnackbarMessage(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Detailed Dynamic Form State
  const [smokerFlag, setSmokerFlag] = useState<string>(
    () => initialSubmittedDecision?.fields.find((f) => f.label === "Smoker Flag")?.value ?? "",
  );
  const [subStdReason, setSubStdReason] = useState<string[]>(() => {
    const raw = initialSubmittedDecision?.fields.find((f) => f.label === "Reasons")?.value;
    return raw ? raw.split(", ").map((r) => r.trim()).filter(Boolean) : [];
  });
  const [postponementPeriod, setPostponementPeriod] = useState<string>(
    () => initialSubmittedDecision?.fields.find((f) => f.label === "Postponement Period")?.value ?? "",
  );
  const [holdReason, setHoldReason] = useState<string>(
    () => initialSubmittedDecision?.fields.find((f) => f.label === "Hold Reasons")?.value ?? "",
  );

  // Approver states
  const [approverTarget, setApproverTarget] = useState<string>(
    () => initialSubmittedDecision?.fields.find((f) => f.label === "Refer To")?.value ?? "",
  );
  const [approverReason, setApproverReason] = useState<string>(
    () => initialSubmittedDecision?.fields.find((f) => f.label === "Reason")?.value ?? "",
  );
  const [approverAssignedTo, setApproverAssignedTo] = useState<string>(
    () => initialSubmittedDecision?.fields.find((f) => f.label === "Assigned To")?.value ?? "",
  );

  // Referral states
  const [referralReason, setReferralReason] = useState<string>(
    () => initialSubmittedDecision?.fields.find((f) => f.label === "Referral Reason")?.value ?? "",
  );
  const [referralRows, setReferralRows] = useState<{
    target: string;
    label: string;
    selected: boolean;
    reason: string;
    remarks: string;
    assignedTo: string;
  }[]>(() => {
    if (initialSubmittedDecision?.referralRows && initialSubmittedDecision.referralRows.length > 0) {
      return initialSubmittedDecision.referralRows.map((r) => ({ ...r }));
    }
    const savedReferrals = initialSubmittedDecision?.fields.find((f) => f.label === "Refer To")?.value;
    const names = savedReferrals ? savedReferrals.split(",").map((s) => s.trim().toLowerCase()) : [];
    const savedReason = initialSubmittedDecision?.fields.find((f) => f.label === "Referral Reason")?.value ?? "";
    const savedRemarks = initialSubmittedDecision?.fields.find((f) => f.label === "Referral Remarks")?.value ?? "";
    const savedAssigned = initialSubmittedDecision?.fields.find((f) => f.label === "Assigned To")?.value ?? "";
    return readReferralTypeOptions().map((opt) => ({
      target: opt.value,
      label: opt.label,
      selected: names.includes(opt.label.toLowerCase()) || names.includes(opt.value.toLowerCase()),
      reason: savedReason,
      remarks: savedRemarks,
      assignedTo: savedAssigned,
    }));
  });
  // "Assigned To" users come from the users-by-role API; a role is fetched only once HOD / Sr UW is picked
  const hodPicked =
    referralRows.some((r) => r.target === "REF_HOD" && r.selected) ||
    assigneeRoleForReferTo(approverTarget) === GUW_ASSIGNEE_ROLE.HOD;
  const srUwPicked =
    referralRows.some((r) => isGuwSrUwReferral(r.target) && r.selected) ||
    assigneeRoleForReferTo(approverTarget) === GUW_ASSIGNEE_ROLE.SR_UW;
  const hodUsers = useGetUsersByRoleQuery(GUW_ASSIGNEE_ROLE.HOD, { skip: !hodPicked });
  const srUwUsers = useGetUsersByRoleQuery(GUW_ASSIGNEE_ROLE.SR_UW, { skip: !srUwPicked });
  const assigneeOptionsForRole = (role: string): GuwAssigneeOption[] => {
    if (role === GUW_ASSIGNEE_ROLE.HOD) return hodUsers.data ?? [];
    if (role === GUW_ASSIGNEE_ROLE.SR_UW) return srUwUsers.data ?? [];
    return [];
  };
  const [reinsurerEditOpen, setReinsurerEditOpen] = useState<boolean>(false);
  const reinsurerSectionRef = useRef<HTMLDivElement | null>(null);

  const scrollToReinsurerSection = () => {
    const el = reinsurerSectionRef.current;
    if (!el) return;

    // Direct scroll into view
    el.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });

    // Explicitly scroll dialog container / paper / content
    const dialogContent =
      el.closest(".MuiDialogContent-root") ||
      el.closest(".MuiDialog-paper") ||
      el.closest(".MuiPaper-root") ||
      el.closest("[role='dialog']") ||
      document.querySelector(".MuiDialogContent-root");

    if (dialogContent) {
      const topPos = el.offsetTop - 15;
      dialogContent.scrollTo({
        top: topPos > 0 ? topPos : dialogContent.scrollHeight,
        behavior: "smooth",
      });
    }

    // Move active focus to the first interactive field inside the Reinsurer panel
    const firstFocusable =
      el.querySelector<HTMLElement>(".MuiSelect-select") ||
      el.querySelector<HTMLElement>("input, select, button") ||
      el;

    if (firstFocusable) {
      firstFocusable.focus();
    }
  };

  // Auto-focus and scroll to Reinsurer edit section when opened
  useEffect(() => {
    if (reinsurerEditOpen && dialogDecision === "REFERRAL") {
      const t1 = setTimeout(scrollToReinsurerSection, 50);
      const t2 = setTimeout(scrollToReinsurerSection, 150);
      const t3 = setTimeout(scrollToReinsurerSection, 300);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [reinsurerEditOpen, dialogDecision]);

  // Reconsideration states
  const [reconsiderPossible, setReconsiderPossible] = useState<"Yes" | "No" | "">("");
  const [reconsiderAfter, setReconsiderAfter] = useState<string>("");
  const [reconsiderReqType, setReconsiderReqType] = useState<string>("");
  const [reconsiderReqTypeOther, setReconsiderReqTypeOther] = useState<string>("");
  const [reconsiderReqDetails, setReconsiderReqDetails] = useState<string>("");

  // Reinsurer Details states
  const [reinsurerUwNames, setReinsurerUwNames] = useState<string[]>(["", ""]);
  const [reinsurerDocChecks, setReinsurerDocChecks] = useState<boolean[][]>([
    [true, false],
    [false, false],
    [false, true],
  ]);

  // Counter Offer Grid
  const [counterOfferRows, setCounterOfferRows] = useState<CounterOfferRow[]>([]);

  const effectiveDecision = dialogDecision;

  // Products of the member's `product_details`; the built-in list is only a fallback when the payload has none
  const productList: GuwProductDetail[] = products && products.length > 0 ? products : DEFAULT_PRODUCTS;

  // Initialize Counter Offer rows when dialog decision turns to CO, BOR_STD, or EP
  useEffect(() => {
    if (keepCounterOfferRowsRef.current) {
      keepCounterOfferRowsRef.current = false;
      return;
    }
    if (["CO", "BOR_STD", "EP"].includes(effectiveDecision)) {
      setCounterOfferRows(
        productList.map((prod, idx) => ({
          id: `dd-${idx}`,
          productName: prod.name,
          isRider: prod.isRider,
          type: "",
          bstdCode: "",
          sa: prod.sa,
          changedSa: "",
          pt: prod.pt,
          changedPt: "",
          loadingClass: "",
          loadingReason: "",
        }))
      );
    } else {
      setCounterOfferRows([]);
    }
  }, [effectiveDecision]);

  const decisionLabel = (code: string) =>
    ALL_DECISION_OPTIONS.find((o) => o.value === code)?.label ?? code;

  const actionDecisionOptions = actionOptions ?? ACTION_DECISION_OPTIONS;
  const isActionDecision =
    actionDecisionOptions.some((o) => o.value === dialogDecision) ||
    ACTION_DECISION_OPTIONS.some((o) => o.value === dialogDecision);

  // The Case UW Decision the user picked (kept while Counter Sign / Raise Referral is open).
  // On the referral path it is reset to Raise Referral only when that referral is finally submitted.
  const caseDecision =
    guidelinesConfirmed && dialogDecision === "REFERRAL"
      ? "REFERRAL"
      : approverBaseDecision || dialogDecision;

  // Message shown on UW Guidelines when the user must refer / counter sign instead of deciding
  const isBlocked = hasBlockerAlert(validationRows);
  const routingMessage = (() => {
    if (!validation) return "";
    if (isBlocked) return BLOCKER_MESSAGE;
    if (validation.referralRequired) {
      return `User is not allowed to provide terminal decisions, please refer the case to ${referralTargetsOf(validation.rows).join(", ")}`;
    }
    if (validation.counterSignRequired) {
      return "User is not allowed to provide terminal decisions, please counter sign the case";
    }
    return "";
  })();

  // Keep a previously submitted action decision visible in the dropdown (not selectable)
  const mainSelectOptions =
    selectedDecision && !DECISION_OPTIONS.some((o) => o.value === selectedDecision)
      ? [...DECISION_OPTIONS, { value: selectedDecision, label: decisionLabel(selectedDecision), disabled: true }]
      : DECISION_OPTIONS;

  const buildSubmittedDecision = (rows: GuwSavedValidationRow[] = validationRows): SubmittedDecision => {
    const fields: SubmittedField[] = [
      { label: "Case UW Decision", value: decisionLabel(caseDecision) },
    ];
    const add = (label: string, value: string, wide?: boolean) => {
      fields.push({ label, value, wide });
    };

    if (dialogDecision === "REFERRAL") {
      const selectedReferrals = referralRows.filter((r) => r.selected);
      add("Refer To", selectedReferrals.map((r) => r.label).join(", "));
      const reasons = selectedReferrals
        .filter((r) => r.reason)
        .map((r) => `${r.label}: ${r.reason}`)
        .join("; ");
      if (reasons) add("Referral Reason", reasons, true);
      const rowRemarks = selectedReferrals
        .filter((r) => r.remarks.trim())
        .map((r) => `${r.label}: ${r.remarks.trim()}`)
        .join("; ");
      if (rowRemarks) add("Referral Remarks", rowRemarks, true);
      const rowAssignees = selectedReferrals
        .filter((r) => r.assignedTo)
        .map((r) => `${r.label}: ${r.assignedTo}`)
        .join("; ");
      if (rowAssignees) add("Assigned To", rowAssignees, true);
    }
    if (dialogDecision !== "REFERRAL" && effectiveDecision) {
      const decisionCodeLabel = decisionCodeOptions.find((o) => o.value === decisionCodeValue)?.label;
      add("Decision Code", decisionCodeLabel ?? (decisionCodeValue || effectiveDecision));
    }
    if (effectiveDecision === "STD") {
      add("Smoker Flag", smokerFlag);
    }
    if (
      effectiveDecision &&
      !["STD", "HOLD", "APPROVER", "REFERRAL"].includes(effectiveDecision) &&
      !effectiveDecision.startsWith("REF_")
    ) {
      add("Reasons", subStdReason.join(", "), true);
    }
    if (effectiveDecision === "POSTP") add("Postponement Period", postponementPeriod);
    if (effectiveDecision === "HOLD") add("Hold Reasons", holdReason);
    if (dialogDecision !== "REFERRAL" && hasReferralReasonOptions(effectiveDecision)) {
      add("Referral Reason", referralReason);
    }

    if (effectiveDecision === "APPROVER") {
      add("Reason", approverReason);
      add("Refer To", approverTarget);
      add("Assigned To", approverAssignedTo);
    }

    const reconsiderationFields: SubmittedField[] = [];
    if (["DC", "POSTP", "REJ"].includes(effectiveDecision)) {
      reconsiderationFields.push({ label: "Reconsideration Possible?", value: reconsiderPossible });
      reconsiderationFields.push({ label: "Requirement Details", value: reconsiderReqDetails, wide: true });
      if (reconsiderPossible === "Yes") {
        reconsiderationFields.push({ label: "Reconsider After", value: reconsiderAfter });
        reconsiderationFields.push({ label: "Requirement Type", value: reconsiderReqType });
        if (isOtherRequirementType(reconsiderReqType)) {
          reconsiderationFields.push({ label: "Other Requirement Type", value: reconsiderReqTypeOther });
        }
      }
    }

    const isReinsurerSelected =
      dialogDecision === "REFERRAL"
        ? referralRows.some((r) => r.selected && r.target === "REF_REINS")
        : effectiveDecision === "REF_REINS";

    return {
      fields,
      reconsiderationFields,
      remarks:
        dialogDecision === "REFERRAL"
          ? referralRows
              .filter((r) => r.selected && r.remarks.trim())
              .map((r) => `${r.label}: ${r.remarks.trim()}`)
              .join("; ") || dialogRemarks
          : dialogRemarks,
      counterOfferRows: ["CO", "BOR_STD", "EP"].includes(caseDecision)
        ? counterOfferRows.map((r) => ({ ...r }))
        : [],
      showBstdColumn: isBstdColumnVisible,
      reinsurerRows: isReinsurerSelected
        ? reinsurerRows.map((r) => ({ code: r.code, systemName: r.systemName, uwName: r.uwName }))
        : [],
      documentRows: isReinsurerSelected
        ? REFERRAL_DOCUMENTS.map((name, rowIndex) => ({
            name,
            assigned: reinsurerRows.map((_, colIndex) => reinsurerDocChecks[rowIndex][colIndex]),
          }))
        : [],
      guidelines: [],
      validationRows: rows.map((r) => ({ ...r })),
      referralRows:
        dialogDecision === "REFERRAL"
          ? referralRows.map((r) => ({ ...r }))
          : undefined,
    };
  };

  const resetDecisionFields = () => {
    setDialogRemarks("");
    setSubStdReason([]);
    setPostponementPeriod("");
    setHoldReason("");
    setApproverTarget("");
    setApproverReason("");
    setApproverAssignedTo("");
    setReferralReason("");
    setReferralRows(
      readReferralTypeOptions().map((opt) => ({
        target: opt.value,
        label: opt.label,
        selected: false,
        reason: "",
        remarks: "",
        assignedTo: "",
      })),
    );
    setReconsiderPossible("");
    setReconsiderAfter("");
    setReconsiderReqType("");
    setReconsiderReqTypeOther("");
    setReconsiderReqDetails("");
    setSmokerFlag("");
    setDecisionCodeValue("");
    setReinsurerUwNames(["", ""]);
    setReinsurerDocChecks(REFERRAL_DOCUMENTS.map(() => reinsurerRows.map(() => false)));
    if (["CO", "BOR_STD", "EP"].includes(effectiveDecision)) {
      setCounterOfferRows(
        productList.map((prod, idx) => ({
          id: `dd-${idx}`,
          productName: prod.name,
          isRider: prod.isRider,
          type: "",
          bstdCode: "",
          sa: prod.sa,
          changedSa: "",
          pt: prod.pt,
          changedPt: "",
          loadingClass: "",
          loadingReason: "",
        })),
      );
    } else {
      setCounterOfferRows([]);
    }
  };

  const openDecisionDialog = (code: string) => {
    setDialogDecision(code);
    setApproverBaseDecision("");
    setGuidelinesConfirmed(false);
    setDialogStep(1);
    setValidation(null);
    if (code === "REFERRAL") {
      setReinsurerEditOpen(false);
    }

    const isCurrentSubmitted = submittedDecision && selectedDecision === code;
    if (isCurrentSubmitted) {
      if (submittedDecision.validationRows && submittedDecision.validationRows.length > 0) {
        setValidationRows(submittedDecision.validationRows.map((r) => ({ ...r })));
      } else {
        setValidationRows([]);
      }
      const savedDecisionCode = codeOfDecisionCodeText(
        submittedDecision.fields.find((f) => f.label === "Decision Code")?.value ?? "",
      );
      void loadDecisionCodeOptions(code, savedDecisionCode);
      setDialogRemarks(submittedDecision.remarks ?? remarks);
      const prevSmoker = submittedDecision.fields.find((f) => f.label === "Smoker Flag")?.value;
      if (prevSmoker) setSmokerFlag(prevSmoker);
      const prevReasons = submittedDecision.fields.find((f) => f.label === "Reasons")?.value;
      if (prevReasons) setSubStdReason(prevReasons.split(", ").map((r) => r.trim()).filter(Boolean));
      const prevHold = submittedDecision.fields.find((f) => f.label === "Hold Reasons")?.value;
      if (prevHold) setHoldReason(prevHold);
      const prevPostp = submittedDecision.fields.find((f) => f.label === "Postponement Period")?.value;
      if (prevPostp) setPostponementPeriod(prevPostp);
      const prevReconsider = submittedDecision.reconsiderationFields?.find((f) => f.label === "Reconsideration Possible?")?.value;
      if (prevReconsider === "Yes" || prevReconsider === "No") setReconsiderPossible(prevReconsider);
      const prevReqDetails = submittedDecision.reconsiderationFields?.find((f) => f.label === "Requirement Details")?.value;
      if (prevReqDetails) setReconsiderReqDetails(prevReqDetails);
      const prevAfter = submittedDecision.reconsiderationFields?.find((f) => f.label === "Reconsider After")?.value;
      if (prevAfter) setReconsiderAfter(prevAfter);
      const prevReqType = submittedDecision.reconsiderationFields?.find((f) => f.label === "Requirement Type")?.value;
      if (prevReqType) setReconsiderReqType(prevReqType);
      const prevReqOther = submittedDecision.reconsiderationFields?.find((f) => f.label === "Other Requirement Type")?.value;
      if (prevReqOther) setReconsiderReqTypeOther(prevReqOther);
      const prevReferTo = submittedDecision.fields.find((f) => f.label === "Refer To")?.value;
      if (prevReferTo) setApproverTarget(prevReferTo);
      const prevReason = submittedDecision.fields.find((f) => f.label === "Reason")?.value;
      if (prevReason) setApproverReason(prevReason);
      const prevAssigned = submittedDecision.fields.find((f) => f.label === "Assigned To")?.value;
      if (prevAssigned) setApproverAssignedTo(prevAssigned);
      if (submittedDecision.referralRows && submittedDecision.referralRows.length > 0) {
        setReferralRows(submittedDecision.referralRows.map((r) => ({ ...r })));
      }
      if (submittedDecision.counterOfferRows && submittedDecision.counterOfferRows.length > 0) {
        setCounterOfferRows(submittedDecision.counterOfferRows.map((r) => ({ ...r })));
      }
      if (submittedDecision.reinsurerRows && submittedDecision.reinsurerRows.length > 0) {
        setReinsurerUwNames(submittedDecision.reinsurerRows.map((r) => r.uwName));
      }
    } else {
      setValidationRows([]);
      resetDecisionFields();
      void loadDecisionCodeOptions(code, "");
    }

    setDialogOpen(true);
  };

  const handleMainSelectChange = (value: string) => {
    if (!value) return;
    if (value === "CLEAR") {
      setSelectedDecision("");
      setSubmittedDecision(null);
      setRemarks("");
      setSmokerFlag("");
      resetDecisionFields();
      clearGuwSubmittedDecision(storageKey ?? applicationNo);
      onDecisionSubmit("", "");
      return;
    }
    if (actionDecisionOptions.some((o) => o.value === value) && onActionClick) {
      onActionClick(value);
      return;
    }
    openDecisionDialog(value);
  };

  const handleDialogSubmit = async () => {
    if (validating) return;
    // Step 1 Validation
    if (dialogDecision === "REFERRAL") {
      const selectedReferrals = referralRows.filter((r) => r.selected);
      if (selectedReferrals.length === 0) {
        notify("Please select at least one referral", "error");
        return;
      }
      const mandatoryRef = validation?.mandatoryReferTo;
      if (
        mandatoryRef &&
        !selectedReferrals.some(
          (r) =>
            r.target === mandatoryRef ||
            r.target.toLowerCase() === mandatoryRef.toLowerCase() ||
            (mandatoryRef === "REF_CMO" && r.target === "REF_CMO"),
        )
      ) {
        notify(`Referral to ${mandatoryRef} is mandatory for this decision.`, "error");
        return;
      }
      // Sr UW / HOD Opinion: Reason, Remarks and Assigned To are mandatory
      const incomplete = selectedReferrals.find(
        (r) =>
          isAssignableReferral(r.target) &&
          (!r.reason.trim() || !r.remarks.trim() || !r.assignedTo.trim()),
      );
      if (incomplete) {
        const missing = [
          !incomplete.reason.trim() ? "Reason" : "",
          !incomplete.remarks.trim() ? "Remarks" : "",
          !incomplete.assignedTo.trim() ? "Assigned To" : "",
        ].filter(Boolean);
        notify(`Please enter ${missing.join(", ")} for ${incomplete.label}`, "error");
        return;
      }
    } else {
      if (!dialogRemarks.trim()) {
        notify("Please enter UW Remarks", "error");
        return;
      }
      if (DECISION_CODE_DECISIONS.includes(effectiveDecision) && decisionCodeOptions.length > 0 && !decisionCodeValue) {
        notify("Please select Decision Code", "error");
        return;
      }
    }

    if (effectiveDecision === "APPROVER") {
      if (!approverReason) {
        notify("Please select Reason", "error");
        return;
      }
      if (!approverTarget) {
        notify("Please select Refer To", "error");
        return;
      }
      if (!approverAssignedTo) {
        notify("Please select Assigned To", "error");
        return;
      }
    }

    // No API call here: the decision is held and the main Submit validates and submits it
    saveAndClose();
  };

  /** Decision Details table rows as the `uw-decision` / validation requests need them. */
  const decisionRowInputs = () =>
    counterOfferRows.map((row) => ({
      productName: row.productName,
      productCode: productList.find((p) => p.name === row.productName)?.code ?? "",
      isRider: row.isRider,
      type: row.type,
      bstdCode: row.bstdCode,
      sa: row.sa,
      changedSa: row.changedSa,
      pt: row.pt,
      changedPt: row.changedPt,
      loadingClass: row.loadingClass,
      loadingReason: row.loadingReason,
    }));

  // Main Submit: validation API first; `uw-decision` / `parallel-decision` only when nothing is left to resolve
  const validateAndSubmit = async () => {
    const requestApplicationNo = drsApplicationNo || applicationNo;
    const userId = getSessionUser()?.username ?? "";
    const validationRequest = toGuwValidationRequest(requestApplicationNo, {
      partyId,
      decision: selectedDecision,
      // Raise Referral: the selected Refer To values, e.g. ["IT", "HOD"]
      ...(dialogDecision === "REFERRAL"
        ? { refer_to: referralRows.filter((r) => r.selected).map((r) => r.label) }
        : {}),
      // Decision Details table rows only for Borderline Standard / Counter Offer / Extra Premium
      ...(hasGuwDecisionProducts(selectedDecision)
        ? { products: buildGuwUwDecisionProducts(requestApplicationNo, partyId, userId, decisionRowInputs()) }
        : {}),
    });
    console.log("[GuwUwPanel] validation request body:", validationRequest);

    if (validating) return;
    setValidating(true);
    try {
      const result = await validateGuwDecision(validationRequest).unwrap();
      setValidation(result);

      if (result.success) {
        await finalizeSubmit();
        return;
      }

      // If validation returns rows (either from partyValidations or justifications/alerts)
      if (result.rows.length > 0) {
        const rows = mergeSavedRows(result.rows, submittedDecision?.validationRows);
        setValidationRows(rows);

        // Already handled when the held decision is the Referral / Counter Sign the case needs and every
        // guideline is justified; otherwise the UW Guidelines open so the user can resolve them
        const requiresRouting =
          result.referralRequired || result.counterSignRequired || Boolean(result.mandatoryReferTo);
        const routed = !requiresRouting || ["REFERRAL", "APPROVER"].includes(dialogDecision);
        if (routed && !hasBlockerAlert(rows) && areJustificationsComplete(rows)) {
          await finalizeSubmit();
          return;
        }

        // Open UW Guidelines so the user can justify / route the case, then submit again
        setGuidelinesConfirmed(false);
        setDialogStep(2);
        setDialogOpen(true);
        return;
      }

      if (result.partyValidations.length > 0) {
        setPartyValidationRows(result.partyValidations);
        return;
      }

      // Failure without anything to resolve: the decision cannot be submitted
      notify("Validation failed. The decision cannot be submitted.", "error");
    } catch (reason: unknown) {
      // Validation service failed: nothing is submitted and the page stays as it is
      console.error("[GuwUwPanel] validation failed:", reason);
      notify("Unable to validate the decision. Please try again.", "error");
    } finally {
      setValidating(false);
    }
  };

  // Hold the current decision (and UW Guidelines rows) in state + session, and link the main dropdown
  const saveDraft = (rows: GuwSavedValidationRow[] = validationRows) => {
    const draft = buildSubmittedDecision(rows);
    setSubmittedDecision(draft);
    setSelectedDecision(caseDecision);
    setRemarks(dialogRemarks);
    saveGuwSubmittedDecision(storageKey ?? applicationNo, {
      ...draft,
      decisionCode: caseDecision,
      remarks: dialogRemarks,
    });
  };

  // Popup "Save": hold the decision (no API call) and close the popup; the main Submit calls the APIs
  const saveAndClose = () => {
    // Guideline justifications saved earlier stay when the rows are not reloaded in this popup session
    saveDraft(validationRows.length > 0 ? validationRows : (submittedDecision?.validationRows ?? []));
    setDialogOpen(false);
    notify("Decision saved. Click Submit to complete.", "success");
  };

  // Open Counter Sign / Raise Referral from UW Guidelines, keeping the guideline entries
  const switchToActionDecision = (code: "APPROVER" | "REFERRAL") => {
    decisionBeforeActionRef.current = dialogDecision;
    if (!isActionDecision) setApproverBaseDecision(dialogDecision);
    keepCounterOfferRowsRef.current = true;
    setDialogDecision(code);
    if (code === "REFERRAL") {
      const mandatoryRef = validation?.mandatoryReferTo;
      if (mandatoryRef) {
        setReferralRows((prev) =>
          prev.map((r) => ({
            ...r,
            selected:
              r.target === mandatoryRef ||
              r.target.toLowerCase() === mandatoryRef.toLowerCase() ||
              (mandatoryRef === "REF_CMO" && r.target === "REF_CMO"),
          })),
        );
        setReinsurerEditOpen(mandatoryRef === "REF_REINS");
      } else {
        // Only one referral row is pre-selected (CMO / other, then Sr UW, HOD, Reinsurer)
        const picked = pickReferralRow(referralTargetsOf(validationRows));
        setReferralRows((prev) => prev.map((r) => ({ ...r, selected: r.target === picked })));
        setReinsurerEditOpen(picked === "REF_REINS");
      }
    }
    setDialogStep(1);
  };

  // Back from Counter Sign / Raise Referral to UW Guidelines (saved justifications stay intact)
  const backToGuidelines = () => {
    keepCounterOfferRowsRef.current = true;
    setDialogDecision(approverBaseDecision || decisionBeforeActionRef.current);
    setApproverBaseDecision("");
    setGuidelinesConfirmed(false);
    setDialogStep(2);
  };

  const updateJustification = (
    key: string,
    patch: Partial<Pick<GuwSavedValidationRow, "selectedReasonCode" | "justificationRemark">>,
  ) => {
    setValidationRows((prev) => prev.map((r) => (guidelineRowKey(r) === key ? { ...r, ...patch } : r)));
  };

  const handleGuidelinesConfirm = () => {
    if (isBlocked) return;
    if (!areJustificationsComplete(validationRows)) {
      notify(JUSTIFICATION_INCOMPLETE_MESSAGE, "error");
      return;
    }

    // Referral always takes priority over counter sign; final submit happens from that screen.
    const mandatoryRef = validation?.mandatoryReferTo;
    const nextAction = validation?.referralRequired || Boolean(mandatoryRef)
      ? "REFERRAL"
      : validation?.counterSignRequired
        ? "APPROVER"
        : null;
    if (nextAction && dialogDecision !== nextAction) {
      // Save point: guidelines are held before moving to Counter Sign / Raise Referral
      saveDraft();
      setGuidelinesConfirmed(true);
      switchToActionDecision(nextAction);
      return;
    }

    saveAndClose();
  };

  const finalizeSubmit = async () => {
    // Member level: save the decision (by code) through the `uw-decision` API before the final commit
    if (!partyId) {
      console.warn("[GuwUwPanel] uw-decision API not called: partyId is empty", { applicationNo, drsApplicationNo });
    }
    if (partyId && ["REFERRAL", "APPROVER"].includes(effectiveDecision)) {
      // Raise Referral (Opinion / Referral) and Counter Sign go through the `parallel-decision` API
      const { taskId, instanceId } = getDrsTaskIds();
      const parallelBase = {
        applicationNo: drsApplicationNo || applicationNo,
        partyId,
        screenType: GUW_UW_DECISION_SCREEN_TYPE,
        userId: getSessionUser()?.username ?? "",
        taskId,
        instanceId,
      };
      // `assignedTo.name` is the selected user's full name and `assignedTo.value` is that user's NTID
      const ntidOf = (role: string, fullName: string) =>
        assigneeOptionsForRole(role).find((option) => option.value === fullName)?.ntid ?? "";
      const parallelRequests =
        effectiveDecision === "REFERRAL"
          ? buildGuwReferralParallelDecisionRequests(
              parallelBase,
              referralRows
                .filter((r) => r.selected)
                .map((r) => ({
                  ...r,
                  assignedToNtid: ntidOf(assigneeRoleForReferralRow(r.target), r.assignedTo),
                })),
            )
          : [
              buildGuwCounterSignParallelDecisionRequest(parallelBase, {
                reason: approverReason,
                referTo: approverTarget,
                assignedTo: approverAssignedTo,
                assignedToNtid: ntidOf(assigneeRoleForReferTo(approverTarget), approverAssignedTo),
                remarks: dialogRemarks,
              }),
            ];
      for (const parallelRequest of parallelRequests) {
        console.log("[GuwUwPanel] parallel-decision payload:", parallelRequest);
        const response = await saveParallelDecision(parallelRequest);
        if ("error" in response) {
          console.error("[GuwUwPanel] parallel-decision failed:", response.error);
          notify("Unable to submit the decision. Please try again.", "error");
          return;
        }
      }
    } else if (partyId) {
      const { taskId, instanceId } = getDrsTaskIds();
      const currentUsername = getSessionUser()?.username ?? "";
      const uwDecisionRequest = buildGuwUwDecisionRequest({
          applicationNo: drsApplicationNo || applicationNo,
          partyId,
          roleType: getDrsRoleType(),
          screenType: GUW_UW_DECISION_SCREEN_TYPE,
          userId: currentUsername,
          createdBy: currentUsername,
          taskId,
          instanceId,
          // Counter Sign is saved as APPROVER (with reason / referTo / assignedTo), not as the base decision
          decision: effectiveDecision === "APPROVER" ? "APPROVER" : caseDecision,
          // The Decision Code picked from the `uw_decision_mapping` master is sent as `decisionCode`
          decisionCode: effectiveDecision === "APPROVER" ? undefined : decisionCodeValue,
          uwRemarks: dialogRemarks,
          reasons: subStdReason,
          holdReason,
          postponePeriod: postponementPeriod,
          reconsiderPossible,
          reconsiderAfter,
          reconsiderReqType:
            isOtherRequirementType(reconsiderReqType) && reconsiderReqTypeOther.trim()
              ? reconsiderReqTypeOther.trim()
              : reconsiderReqType,
          reconsiderReqDetails,
          approver:
            effectiveDecision === "APPROVER"
              ? { reason: approverReason, referTo: approverTarget, assignedTo: approverAssignedTo }
              : undefined,
          rows: decisionRowInputs(),
        });
      console.log("[GuwUwPanel] uw-decision payload:", uwDecisionRequest);
      const response = await getUwDecision(uwDecisionRequest);
      if ("error" in response) {
        console.error("[GuwUwPanel] uw-decision failed:", response.error);
        notify("Unable to submit the decision. Please try again.", "error");
        return;
      }
    }

    // Success - Final commit
    const submitted = buildSubmittedDecision();
    setSubmittedDecision(submitted);
    saveGuwSubmittedDecision(storageKey ?? applicationNo, {
      ...submitted,
      decisionCode: caseDecision,
      remarks: dialogRemarks,
    });
    setSelectedDecision(caseDecision);
    setRemarks(dialogRemarks);
    onDecisionSubmit(caseDecision, dialogRemarks);
    setDialogOpen(false);
    notify("Decision submitted successfully", "success");

    // Inbox, or the member summary page for multi-life
    setTimeout(() => {
      replaceUrl(redirectUrl);
    }, 700);
  };

  // Main Submit: final submit of the decision already saved from the dialog
  const handleMainSubmit = () => {
    if (!submittedDecision || !dialogDecision || !selectedDecision) {
      notify("Please select a decision and complete the decision details before submitting", "error");
      return;
    }
    // Claim Audit / Special Remarks records must each be validated before uw-decision / parallel-decision
    const pendingValidation = findPendingValidationMessage(storageKey ?? applicationNo, requiredValidations);
    if (pendingValidation) {
      notify(pendingValidation, "error");
      return;
    }
    console.log("[GuwUwPanel] main Submit clicked", { selectedDecision, dialogDecision, partyId });
    void validateAndSubmit();
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleAddEpRow = () => {
    setCounterOfferRows((prev) => [
      ...prev,
      {
        id: `dd-u${Date.now()}`,
        productName: "",
        isRider: false,
        type: "",
        bstdCode: "",
        sa: "—",
        changedSa: "",
        pt: "—",
        changedPt: "",
        loadingClass: "",
        loadingReason: "",
        isUserAdded: true,
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    setCounterOfferRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRowFieldChange = (id: string, field: keyof CounterOfferRow, value: string) => {
    setCounterOfferRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };

        // Handle dynamic triggers
        if (field === "productName") {
          const defaultProd = productList.find((p) => p.name === value);
          updated.isRider = defaultProd ? defaultProd.isRider : false;
          updated.sa = defaultProd ? defaultProd.sa : "—";
          updated.pt = defaultProd ? defaultProd.pt : "—";
          updated.type = "";
          updated.bstdCode = "";
          updated.changedSa = "";
          updated.changedPt = "";
          updated.loadingClass = "";
          updated.loadingReason = "";
        }

        if (field === "type") {
          if (value !== "Borderline Standard") {
            updated.bstdCode = "";
          }
          if (value !== "Reduce Cover") {
            updated.changedSa = "";
          }
          if (value !== "Reduce PT") {
            updated.changedPt = "";
          }
          if (!["Medical Loading", "FE Loading", "Smoker Loading"].includes(value)) {
            updated.loadingClass = "";
            updated.loadingReason = "";
          }
        }

        return updated;
      })
    );
  };

  const handleSelectAllDocs = (colIndex: number) => {
    setReinsurerDocChecks((prev) => {
      const copy = prev.map((row) => [...row]);
      const shouldCheck = copy.some((row) => !row[colIndex]);
      for (let i = 0; i < copy.length; i++) {
        copy[i][colIndex] = shouldCheck;
      }
      return copy;
    });
  };

  const handleDocCheckChange = (rowIndex: number, colIndex: number, checked: boolean) => {
    setReinsurerDocChecks((prev) => {
      const copy = prev.map((row) => [...row]);
      copy[rowIndex][colIndex] = checked;
      return copy;
    });
  };

  // Reinsurer Details Rows Definitions
  const reinsurerRows = [
    { code: "ABC", systemName: "Munich Re", uwName: reinsurerUwNames[0] },
    { code: "CI", systemName: "Scor RE", uwName: reinsurerUwNames[1] },
  ];

  const getEffectiveReinsurerName = (idx: number) => {
    return reinsurerUwNames[idx] || reinsurerRows[idx].systemName;
  };

  // Reasons options for MultiSelect, from master data: Reject = GUW_NON_MED_RSN, every other decision =
  // GUW_MED_RSN + GUW_NON_MED_RSN. The value is the reason text (master codes repeat across the two types).
  const rejectReasonOptions = readReasonOptions(["GUW_NON_MED_RSN"]);
  const allReasonOptions = readReasonOptions(["GUW_MED_RSN", "GUW_NON_MED_RSN"]);

  const isBstdColumnVisible = counterOfferRows.some((r) => r.type === "Borderline Standard");

  const summaryItems: GuwUwSummaryField[] =
    summaryFields && summaryFields.length > 0
      ? summaryFields
      : [
          { label: "BRE Overall Decision", value: breOverallDecision },
          { label: "BRE Overall Remarks", value: breOverallRemarks },
        ];

  return (
    <Box
      sx={{
        margin: 0,
        padding: "4px 12px",
        background: "transparent",
        border: 0,
        borderRadius: 0,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: "6px",
        }}
      >
        {/* Read-only Summary (BRE overall or custom summary fields) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: summaryFields && summaryFields.length > 0
              ? `repeat(${summaryFields.length}, minmax(0, 1fr))`
              : "25% 1fr",
            background: "#fcfaf9",
            border: "1px solid #eadfd9",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          {summaryItems.map((field, idx) => (
            <Box
              key={field.label}
              sx={{
                padding: "5px 12px",
                minWidth: 0,
                borderLeft: idx > 0 ? "1px solid #eadfd9" : "none",
              }}
            >
              <Typography
                component="span"
                sx={{
                  display: "block",
                  marginBottom: "2px",
                  color: "#7b716c",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.4px",
                  textTransform: "uppercase",
                }}
              >
                {field.label}
              </Typography>
              <Typography
                component="span"
                sx={{
                  color: "#302a27",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                {field.value}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Case UW Decision Dropdown (+ read-only Decision Code beside it when the decision is derived) */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: "8px", pr: "70px" }}>
        <Box component="label" sx={{ display: "block", flex: 1, minWidth: 0 }}>
          <Typography
            component="span"
            sx={{
              display: "block",
              marginBottom: "2px",
              color: "#7b716c",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.4px",
              textTransform: "uppercase",
            }}
          >
            Case UW Decision
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: `${decisionReadOnly ? "#e4dedb" : "#e45f14"} !important`,
                  borderWidth: "2px !important",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: `${decisionReadOnly ? "#e4dedb" : "#e45f14"} !important`,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e45f14 !important",
                  borderWidth: "2px !important",
                },
              }}
            >
              <CustomSelect
                value={selectedDecision}
                onChange={handleMainSelectChange}
                options={mainSelectOptions}
                placeholder="Select"
                fullWidth
                disabled={decisionReadOnly}
              />
            </Box>
            {submittedDecision && (
              <CustomTooltip title="View decision details">
                <CustomButton
                  variant="outlined"
                  aria-label="View decision details"
                  onClick={(e) => {
                    e.preventDefault();
                    setViewDialogOpen(true);
                  }}
                  sx={{ width: 30, minWidth: 30, minHeight: 28, p: 0.5, borderRadius: "6px", flexShrink: 0 }}
                >
                  <EyeIcon />
                </CustomButton>
              </CustomTooltip>
            )}
            {submittedDecision && (
              <CustomTooltip title="Edit decision">
                <CustomButton
                  variant="outlined"
                  aria-label="Edit decision"
                  onClick={(e) => {
                    e.preventDefault();
                    openDecisionDialog(selectedDecision);
                  }}
                  sx={{ width: 30, minWidth: 30, minHeight: 28, p: 0.5, borderRadius: "6px", flexShrink: 0 }}
                >
                  <EditIcon width={18} height={18} />
                </CustomButton>
              </CustomTooltip>
            )}
          </Box>
        </Box>
        {decisionReadOnly && (
          <Box component="label" sx={{ display: "block", width: 160, flexShrink: 0 }}>
            <Typography
              component="span"
              sx={{
                display: "block",
                marginBottom: "2px",
                color: "#7b716c",
                fontSize: "11px",
                fontWeight: 600,
                letterSpacing: "0.4px",
                textTransform: "uppercase",
              }}
            >
              Decision Code
            </Typography>
            <CustomTextField
              value={selectedDecision}
              fullWidth
              htmlInputProps={{ readOnly: true, "aria-label": "Decision Code" }}
            />
          </Box>
        )}
        </Box>

        {/* Action buttons + Submit */}
        <Box sx={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "8px", pr: "70px" }}>
          {actionDecisionOptions.map((opt) => (
            <CustomButton
              key={opt.value}
              variant="outlined"
              onClick={() => {
                if (onActionClick) {
                  onActionClick(opt.value);
                } else {
                  openDecisionDialog(opt.value);
                }
              }}
              sx={{
                borderColor: "#e45f14",
                color: "#e45f14",
                fontWeight: "bold",
                "&:hover": { borderColor: "#c94f0d", background: "rgba(228, 95, 20, 0.06)" },
              }}
            >
              {opt.label}
            </CustomButton>
          ))}
          <CustomButton
            variant="contained"
            onClick={handleMainSubmit}
            sx={{
              background: "#e45f14",
              color: "#fff",
              fontWeight: "bold",
              px: 4,
              "&:hover": { background: "#c94f0d" },
            }}
          >
            Submit
          </CustomButton>
        </Box>
      </Box>

      {/* Decision Remarks/Confirmation Dialog */}
      <CustomDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        title={dialogStep === 2 ? "UW Guidelines" : undefined}
        showCloseIcon={dialogStep === 2}
        maxWidth="lg"
        fullWidth
        contentSx={{
          maxHeight: "82vh",
          overflowY: "auto",
          scrollBehavior: "smooth",
        }}
        paperSx={{
          maxHeight: "90vh",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 1 }}>
          {dialogStep === 2 ? (
            /* STEP 2: UW GUIDELINES VIEW */
            <Box>
              <Box
                sx={{
                  border: "1px solid #eadfd9",
                  borderRadius: "10px",
                  overflowX: "auto",
                  mb: 3,
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#ffead7", color: "#5b261c", fontWeight: 800 }}>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Reason</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Remark</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>System Action</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", width: "220px" }}>
                        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          Justification/Checklist
                          <CustomTooltip title="Select a reason for each justification and checklist item. A remark is mandatory when the justification reason is Other Reason.">
                            <span
                              role="img"
                              aria-label="Justification instructions"
                              style={{ display: "inline-flex", cursor: "help" }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  display: "inline-flex",
                                  color: "#9a2529",
                                  "& svg": { width: "14px", height: "14px" },
                                }}
                              >
                                <InfoIcon />
                              </Box>
                            </span>
                          </CustomTooltip>
                        </Box>
                      </th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9", textAlign: "left", width: "240px" }}>Justification Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationRows.map((row, rowIndex) => {
                      const rowKey = guidelineRowKey(row);
                      // Only justification rows are editable; hard / soft alerts are locked
                      const isEditable = isJustificationRow(row);
                      const isOtherReason = row.selectedReasonCode === OTHER_REASON_CODE;
                      const remarkEnabled = isEditable && row.selectedReasonCode !== "";

                      let remarkPlaceholder = "Not applicable";
                      if (isEditable) {
                        if (!remarkEnabled) remarkPlaceholder = "Select a reason first";
                        else remarkPlaceholder = isOtherReason ? "Add remarks (required)" : "Add remarks (optional)";
                      }

                      return (
                        <tr key={`${rowKey}-${rowIndex}`} data-testid={`guw-guideline-${row.validationId}`}>
                          <td style={GUIDELINE_CELL}>
                            <GuidelineCategoryIcon category={row.category} />
                            {row.reason}
                          </td>
                          <td style={GUIDELINE_CELL}>{row.remark}</td>
                          <td style={GUIDELINE_CELL}>{row.systemAction || "—"}</td>
                          <td style={GUIDELINE_CELL}>
                            <CustomSelect
                              value={row.selectedReasonCode}
                              onChange={(val) =>
                                updateJustification(rowKey, {
                                  selectedReasonCode: val,
                                  justificationRemark: "",
                                })
                              }
                              options={row.justificationOptions.map((o) => ({ value: o.code, label: o.text }))}
                              placeholder={isEditable ? "Select reason" : "Not applicable"}
                              disabled={!isEditable}
                              fullWidth
                            />
                          </td>
                          <td style={GUIDELINE_CELL_LAST}>
                            <CustomTextField
                              value={row.justificationRemark}
                              onChange={(e) => updateJustification(rowKey, { justificationRemark: e.target.value })}
                              placeholder={remarkPlaceholder}
                              disabled={!remarkEnabled}
                              fullWidth
                              size="small"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>

              {routingMessage && (
                <Typography
                  component="p"
                  role="alert"
                  sx={{ color: "#9a2529", fontSize: "12px", fontWeight: 700, lineHeight: 1.5, mb: 1 }}
                >
                  {routingMessage}
                </Typography>
              )}

              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
                <CustomButton
                  variant="outlined"
                  onClick={() => setDialogStep(1)}
                  sx={{
                    borderColor: "#eadfd9",
                    color: "#7b716c",
                    fontWeight: "bold",
                    px: 4,
                  }}
                >
                  Back
                </CustomButton>
                <CustomButton
                  variant="contained"
                  onClick={handleGuidelinesConfirm}
                  disabled={isBlocked}
                  sx={{
                    background: "#e45f14",
                    color: "#fff",
                    fontWeight: "bold",
                    px: 4,
                    "&:hover": { background: "#c94f0d" },
                    "&.Mui-disabled": { background: "#eadfd9", color: "#a79f9b" },
                  }}
                >
                  Save
                </CustomButton>
              </Box>
            </Box>
          ) : (
            /* STEP 1: CASE UW DECISION FIELDS VIEW */
            <>
              {/* Custom circular Close button matching prototype */}
              <Box
                component="button"
                onClick={handleDialogClose}
                sx={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  zIndex: 10,
                  display: "grid",
                  placeItems: "center",
                  width: "24px",
                  height: "24px",
                  border: "2px solid #aa262a",
                  borderRadius: "50%",
                  background: "transparent",
                  color: "#aa262a",
                  cursor: "pointer",
                  padding: 0,
                  transition: "background 0.2s",
                  "&:hover": {
                    background: "rgba(170, 38, 42, 0.08)",
                  },
                }}
              >
                <span style={{ fontSize: "12px", fontWeight: "bold", lineHeight: 1 }}>✕</span>
              </Box>

              {/* DECISION + DEPENDENT FIELDS GRID - Case UW Decision leads, UW Remarks is last */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: "6px 10px",
              mt: "6px",
            }}
          >
            {/* Dialog Decision select - hidden for Reinsurer Referral, Raise Referral and Hold; read-only for Counter Sign */}
            {effectiveDecision !== "REF_REINS" && !["REFERRAL", "HOLD"].includes(dialogDecision) && (
              <Box>
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Case UW Decision
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <CustomSelect
                      value={dialogDecision}
                      onChange={(val) => {
                        setDialogDecision(val);
                        resetDecisionFields();
                        // Decision Code options depend on the Case UW Decision: call the master API again
                        void loadDecisionCodeOptions(val, "");
                      }}
                      options={isActionDecision ? ACTION_DECISION_OPTIONS : DECISION_OPTIONS}
                      disabled={isActionDecision}
                      placeholder="Select"
                      fullWidth
                    />
                  </Box>
                  {dialogDecision === "APPROVER" && submittedDecision && (
                    <CustomButton
                      variant="outlined"
                      aria-label="View decision details"
                      title="View decision details"
                      onClick={(e) => {
                        e.preventDefault();
                        setViewDialogOpen(true);
                      }}
                      sx={{ width: 30, minWidth: 30, minHeight: 28, p: 0.5, borderRadius: "6px", flexShrink: 0 }}
                    >
                      <EyeIcon />
                    </CustomButton>
                  )}
                </Box>
              </Box>
            )}

            {/* REFERRAL MULTISELECT TABLE */}
            {dialogDecision === "REFERRAL" && (
              <Box sx={{ gridColumn: { xs: "auto", sm: "span 3" }, mt: 0.5 }}>
                <Box sx={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      background: "#fff",
                      fontSize: "11px",
                    }}
                  >
                    <thead>
                      <tr style={{ background: "#ffead7", color: "#5b261c" }}>
                        <th style={{ padding: "8px 10px", border: "1px solid #ded9d6", textAlign: "center", width: "40px" }}>
                          <input
                            type="checkbox"
                            disabled={referralRows.some((r) => isExclusiveReferral(r.target) && r.selected)}
                            checked={
                              referralRows.length > 0 &&
                              !referralRows.some((r) => isExclusiveReferral(r.target) && r.selected) &&
                              referralRows
                                .filter((r) => !isExclusiveReferral(r.target) && !["REF_TELE_MER", "REF_VIDEO_MER"].includes(r.target))
                                .every((r) => r.selected)
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setReferralRows((prev) =>
                                prev.map((r) => ({
                                  ...r,
                                  // Tele MER / Video MER are mutually exclusive, so select-all leaves them unchanged
                                  selected: isExclusiveReferral(r.target)
                                    ? false
                                    : ["REF_TELE_MER", "REF_VIDEO_MER"].includes(r.target)
                                    ? r.selected
                                    : checked,
                                }))
                              );
                            }}
                            style={{
                              cursor: referralRows.some((r) => isExclusiveReferral(r.target) && r.selected)
                                ? "not-allowed"
                                : "pointer",
                              transform: "scale(1.1)",
                            }}
                          />
                        </th>
                        <th style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800, width: "130px" }}>
                          Refer To
                        </th>
                        <th style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800, width: "200px" }}>
                          Reason
                        </th>
                        <th style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800 }}>
                          UW Remarks
                        </th>
                        <th style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800, width: "140px" }}>
                          Assigned To
                        </th>
                        <th style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "center", fontWeight: 800, width: "90px" }}>
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralRows.map((row, index) => {
                        const isReinsurer = row.target === "REF_REINS";
                        const isExclusive = isExclusiveReferral(row.target);
                        const isExclusiveSelected = referralRows.some(
                          (r) => isExclusiveReferral(r.target) && r.selected
                        );
                        const isHoCmoSelected = referralRows.some(
                          (r) => r.target === "REF_CMO" && r.selected
                        );
                        const isTeleMerSelected = referralRows.some((r) => r.target === "REF_TELE_MER" && r.selected);
                        const isVideoMerSelected = referralRows.some((r) => r.target === "REF_VIDEO_MER" && r.selected);
                        const isRowDisabled =
                          (isExclusiveSelected && !row.selected) ||
                          (row.target === "REF_CMO_LOCAL" && isHoCmoSelected) ||
                          (row.target === "REF_VIDEO_MER" && isTeleMerSelected) ||
                          (row.target === "REF_TELE_MER" && isVideoMerSelected);
                        const canAssign = isAssignableReferral(row.target);
                        const isReasonDisabled =
                          !row.selected || isRowDisabled || DISABLED_REASON_REFERRALS.includes(row.target);
                        const reasonOptions = readReferralReasonOptions(row.target);

                        return (
                          <tr
                            key={row.target}
                            style={{
                              background: row.selected
                                ? "#fffcf8"
                                : isRowDisabled
                                ? "#f9f9f9"
                                : "#fff",
                              color: isRowDisabled ? "#888" : "inherit",
                            }}
                          >
                            <td style={{ padding: "8px 10px", border: "1px solid #ded9d6", textAlign: "center" }}>
                              <input
                                type="checkbox"
                                checked={row.selected}
                                disabled={isRowDisabled}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setReferralRows((prev) => {
                                    if (isExclusive && checked) {
                                      // If Reinsurer, Sr UW, or HOD is checked, uncheck all other rows
                                      return prev.map((r) => ({
                                        ...r,
                                        selected: r.target === row.target,
                                      }));
                                    }
                                    if (row.target === "REF_CMO" && checked) {
                                      // If HO CMO is checked, uncheck CMO
                                      return prev.map((r) => {
                                        if (r.target === "REF_CMO_LOCAL") {
                                          return { ...r, selected: false };
                                        }
                                        if (r.target === "REF_CMO") {
                                          return { ...r, selected: true };
                                        }
                                        return r;
                                      });
                                    }
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], selected: checked };
                                    return copy;
                                  });
                                  if (isReinsurer) {
                                    if (checked) {
                                      setReinsurerEditOpen(true);
                                      setTimeout(scrollToReinsurerSection, 60);
                                      setTimeout(scrollToReinsurerSection, 200);
                                    } else {
                                      setReinsurerEditOpen(false);
                                    }
                                  }
                                }}
                                style={{
                                  cursor: isRowDisabled ? "not-allowed" : "pointer",
                                  transform: "scale(1.1)",
                                }}
                              />
                            </td>
                            <td style={{ padding: "8px 12px", border: "1px solid #ded9d6", fontWeight: 600 }}>
                              {row.label}
                            </td>
                            <td style={{ padding: "6px 8px", border: "1px solid #ded9d6" }}>
                              <CustomSelect
                                value={DISABLED_REASON_REFERRALS.includes(row.target) ? "" : row.reason}
                                onChange={(val) => {
                                  setReferralRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], reason: val };
                                    return copy;
                                  });
                                }}
                                options={isReasonDisabled ? [] : reasonOptions}
                                disabled={isReasonDisabled}
                                placeholder={DISABLED_REASON_REFERRALS.includes(row.target) ? "-" : "Select reason"}
                                fullWidth
                              />
                            </td>
                            <td style={{ padding: "6px 8px", border: "1px solid #ded9d6" }}>
                              <CustomTextField
                                value={row.remarks}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReferralRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], remarks: val };
                                    return copy;
                                  });
                                }}
                                disabled={!row.selected || isRowDisabled}
                                placeholder="Enter remarks"
                                fullWidth
                              />
                            </td>
                            <td style={{ padding: "6px 8px", border: "1px solid #ded9d6" }}>
                              <CustomSelect
                                value={row.assignedTo}
                                onChange={(val) => {
                                  setReferralRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], assignedTo: val };
                                    return copy;
                                  });
                                }}
                                options={assigneeOptionsForRole(assigneeRoleForReferralRow(row.target))}
                                disabled={!canAssign || !row.selected || isRowDisabled}
                                placeholder="Select User"
                                fullWidth
                              />
                            </td>
                            <td style={{ padding: "6px 8px", border: "1px solid #ded9d6", textAlign: "center" }}>
                              <CustomButton
                                variant={reinsurerEditOpen && isReinsurer ? "contained" : "outlined"}
                                aria-label={isReinsurer && reinsurerEditOpen ? "Hide" : "Edit"}
                                disabled={!row.selected || !isReinsurer}
                                onClick={() => {
                                  if (isReinsurer && row.selected) {
                                    setReinsurerEditOpen((prev) => {
                                      const next = !prev;
                                      if (next) {
                                        setTimeout(scrollToReinsurerSection, 60);
                                        setTimeout(scrollToReinsurerSection, 200);
                                      }
                                      return next;
                                    });
                                  }
                                }}
                                sx={{
                                  fontSize: "11px",
                                  py: 0.5,
                                  px: 1.5,
                                  minWidth: "60px",
                                  textTransform: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  ...(isReinsurer && row.selected
                                    ? {
                                        background: reinsurerEditOpen ? "#e45f14" : "transparent",
                                        color: reinsurerEditOpen ? "#fff" : "#e45f14",
                                        borderColor: "#e45f14",
                                        "&:hover": {
                                          background: reinsurerEditOpen ? "#c94f0d" : "#fff2e8",
                                          borderColor: "#c94f0d",
                                        },
                                      }
                                    : {
                                        color: "#aaa",
                                        borderColor: "#ddd",
                                      }),
                                }}
                              >
                                <EditIcon width={16} height={16} />
                              </CustomButton>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </Box>

                {/* REINSURER EDIT SECTION (OPENS AFTER REFERRAL TABLE) */}
                {reinsurerEditOpen && referralRows.find((r) => r.target === "REF_REINS")?.selected && (
                  <Box
                    ref={reinsurerSectionRef}
                    tabIndex={-1}
                    sx={{
                      p: 2.5,
                      mt: 2,
                      border: "1px solid #eadfd9",
                      borderRadius: "14px",
                      background: "#fffaf6",
                      outline: "none",
                    }}
                  >
                    <Typography
                      component="h3"
                      sx={{
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "#5b261c",
                        mb: 2,
                      }}
                    >
                      Reinsurer Referral Sheet
                    </Typography>

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1.1fr 1.9fr" },
                        gap: "24px",
                        alignItems: "start",
                      }}
                    >
                      {/* Reinsurer selects panel */}
                      <Box
                        sx={{
                          background: "#fff",
                          p: 2,
                          borderRadius: "14px",
                          border: "1px solid #ddd5d0",
                        }}
                      >
                        <Typography
                          component="h4"
                          sx={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#302a27",
                            mb: 1.5,
                          }}
                        >
                          Reinsurer Details
                        </Typography>

                        <Box sx={{ overflowX: "auto" }}>
                          <table
                            style={{
                              width: "100%",
                              borderCollapse: "collapse",
                              background: "#fff",
                              fontSize: "11px",
                            }}
                          >
                            <thead>
                              <tr style={{ background: "#ffead7", color: "#5b261c" }}>
                                <th style={{ padding: "8px 10px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800, width: "16%" }}>Code</th>
                                <th style={{ padding: "8px 10px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800, width: "38%" }}>Reinsurer Name - System</th>
                                <th style={{ padding: "8px 10px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800, width: "46%" }}>Reinsurer Name - UW</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reinsurerRows.map((row, index) => {
                                const options = REINSURER_UW_OPTIONS.filter(
                                  (name) => name.toLowerCase() !== row.systemName.toLowerCase()
                                );
                                return (
                                  <tr key={row.code}>
                                    <td style={{ padding: "8px 10px", border: "1px solid #ded9d6", fontWeight: 600 }}>{row.code}</td>
                                    <td style={{ padding: "8px 10px", border: "1px solid #ded9d6" }}>{row.systemName}</td>
                                    <td style={{ padding: "6px 8px", border: "1px solid #ded9d6" }}>
                                      <CustomSelect
                                        value={row.uwName}
                                        onChange={(val) => {
                                          setReinsurerUwNames((prev) => {
                                            const copy = [...prev];
                                            copy[index] = val;
                                            return copy;
                                          });
                                        }}
                                        options={options.map((opt) => ({ value: opt, label: opt }))}
                                        placeholder="Select"
                                        fullWidth
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </Box>
                      </Box>

                      {/* Document assignment card */}
                      <Box
                        sx={{
                          border: "1px solid #ddd5d0",
                          borderRadius: "14px",
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        <Box
                          sx={{
                            padding: "12px 24px",
                            background: "#e95d08",
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: 800,
                          }}
                        >
                          Assign Documents
                        </Box>

                        <Box sx={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                            <thead>
                              <tr style={{ background: "#ffead7", color: "#302a27" }}>
                                <th style={{ padding: "10px 12px", borderBottom: "1px solid #ded9d6", textAlign: "left", fontWeight: 700, width: "30%" }}>
                                  Document name
                                </th>
                                {reinsurerRows.map((row, index) => (
                                  <th
                                    key={row.code}
                                    style={{
                                      padding: "10px 12px",
                                      borderBottom: "1px solid #ded9d6",
                                      textAlign: "center",
                                      fontWeight: 700,
                                      width: "35%",
                                    }}
                                  >
                                    <Typography sx={{ fontSize: "12px", fontWeight: "bold", display: "block" }}>
                                      {getEffectiveReinsurerName(index)}
                                    </Typography>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectAllDocs(index)}
                                      style={{
                                        display: "block",
                                        margin: "3px auto 0",
                                        padding: 0,
                                        border: 0,
                                        outline: 0,
                                        background: "transparent",
                                        color: "#e95d08",
                                        fontSize: "11px",
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                      }}
                                    >
                                      (Select All)
                                    </button>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {REFERRAL_DOCUMENTS.map((docName, rowIndex) => (
                                <tr key={docName}>
                                  <td style={{ padding: "10px 12px", borderBottom: "1px solid #ded9d6" }}>{docName}</td>
                                  {reinsurerRows.map((_, colIndex) => (
                                    <td
                                      key={colIndex}
                                      style={{
                                        padding: "10px 12px",
                                        borderBottom: "1px solid #ded9d6",
                                        textAlign: "center",
                                      }}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={reinsurerDocChecks[rowIndex][colIndex]}
                                        onChange={(e) =>
                                          handleDocCheckChange(rowIndex, colIndex, e.target.checked)
                                        }
                                        style={{
                                          width: "18px",
                                          height: "18px",
                                          cursor: "pointer",
                                          accentColor: "#e95d08",
                                        }}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </Box>
                      </Box>
                    </Box>

                    {/* Generate Referral Sheet action trigger */}
                    <Box sx={{ display: "flex", gap: "20px", mt: 2.5 }}>
                      <CustomButton
                        variant="outlined"
                        onClick={() => {
                          const reinsurerRow = referralRows.find((r) => r.target === "REF_REINS");
                          const remarks = reinsurerRow?.remarks.trim() || dialogRemarks.trim();
                          if (!remarks) {
                            notify("Please add remarks before generating the referral sheet", "error");
                            return;
                          }
                          notify("Referral sheet generated successfully", "success");
                        }}
                        sx={{
                          borderColor: "#aa262a",
                          color: "#aa262a",
                          px: 3.5,
                          py: 1.2,
                          minWidth: "220px",
                          borderRadius: "28px",
                          fontWeight: "bold",
                          textTransform: "none",
                          fontSize: "12px",
                          "&:hover": {
                            borderColor: "#8f1f24",
                            background: "#fff2f2",
                          },
                        }}
                      >
                        Generate Referral Sheet
                      </CustomButton>
                    </Box>
                  </Box>
                )}
              </Box>
            )}

            {/* DECISION CODE - terminal decisions */}
            {dialogDecision !== "REFERRAL" && DECISION_CODE_DECISIONS.includes(effectiveDecision) && (
              <Box>
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Decision Code
                </Typography>
                <CustomSelect
                  value={decisionCodeValue}
                  onChange={setDecisionCodeValue}
                  options={decisionCodeOptions}
                  placeholder="Select"
                  fullWidth
                />
              </Box>
            )}

            {/* SMOKER FLAG - Standard decision only */}
            {effectiveDecision === "STD" && (
              <Box>
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Smoker Flag
                </Typography>
                <CustomSelect
                  value={smokerFlag}
                  onChange={(val) => setSmokerFlag(val)}
                  options={SMOKER_FLAG_OPTIONS}
                  placeholder="Select"
                  fullWidth
                />
              </Box>
            )}

            {/* REASONS - SUBSTANDARD & REJECT */}
            {effectiveDecision && !["STD", "HOLD", "APPROVER", "REFERRAL"].includes(effectiveDecision) && !effectiveDecision.startsWith("REF_") && (
              <Box sx={{ gridColumn: "span 2" }}>
                <CustomMultiSelect
                  label="Reasons"
                  value={subStdReason}
                  onChange={(val) => setSubStdReason(val)}
                  options={effectiveDecision === "REJ" ? rejectReasonOptions : allReasonOptions}
                  placeholder="Select reasons"
                  showSelectAll
                />
              </Box>
            )}

            {/* POSTPONEMENT PERIOD */}
            {effectiveDecision === "POSTP" && (
              <Box>
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Postponement Period
                </Typography>
                <CustomSelect
                  value={postponementPeriod}
                  onChange={(val) => setPostponementPeriod(val)}
                  options={readPostponementPeriodOptions()}
                  placeholder="Select"
                  fullWidth
                />
              </Box>
            )}

            {/* HOLD REASON */}
            {effectiveDecision === "HOLD" && (
              <Box>
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Hold Reasons
                </Typography>
                <CustomSelect
                  value={holdReason}
                  onChange={(val) => setHoldReason(val)}
                  options={readHoldReasonOptions()}
                  placeholder="Select"
                  fullWidth
                />
              </Box>
            )}

            {/* REFERRAL REASONS (non-referral modal decisions) */}
            {dialogDecision !== "REFERRAL" && hasReferralReasonOptions(effectiveDecision) && (
              <Box>
                <Typography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Referral Reason
                </Typography>
                <CustomSelect
                  value={referralReason}
                  onChange={(val) => setReferralReason(val)}
                  options={readReferralReasonOptions(effectiveDecision)}
                  placeholder="Select reason"
                  fullWidth
                />
              </Box>
            )}


            {/* APPROVER FIELDS (FOR REFER TO APPROVER) */}
            {effectiveDecision === "APPROVER" && (
              <>
                <Box>
                  <Typography
                    component="span"
                    sx={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#444",
                      fontSize: "11px",
                    }}
                  >
                    Refer To
                  </Typography>
                  <CustomSelect
                    value={approverTarget}
                    onChange={(val) => {
                      setApproverTarget(val);
                      // Counter Sign reasons and assignees depend on HOD / Sr UW
                      setApproverReason("");
                      setApproverAssignedTo("");
                    }}
                    options={readReferToOptions()}
                    placeholder="Select HOD or Sr UW"
                    fullWidth
                  />
                </Box>

                <Box>
                  <Typography
                    component="span"
                    sx={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#444",
                      fontSize: "11px",
                    }}
                  >
                    Reason
                  </Typography>
                  <CustomSelect
                    value={approverReason}
                    onChange={(val) => setApproverReason(val)}
                    options={readApproverReasonOptions(approverTarget)}
                    placeholder={approverTarget ? "Select Reason" : "Select Refer To first"}
                    disabled={!approverTarget}
                    fullWidth
                  />
                </Box>

                <Box>
                  <Typography
                    component="span"
                    sx={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#444",
                      fontSize: "11px",
                    }}
                  >
                    Assigned To
                  </Typography>
                  <CustomSelect
                    value={approverAssignedTo}
                    onChange={(val) => setApproverAssignedTo(val)}
                    options={assigneeOptionsForRole(assigneeRoleForReferTo(approverTarget))}
                    placeholder={approverTarget ? "Select User" : "Select Refer To first"}
                    disabled={!approverTarget}
                    fullWidth
                  />
                </Box>
              </>
            )}
          </Box>

          {/* RECONSIDERATION CARD FOR DC, POSTP, REJ */}
          {["DC", "POSTP", "REJ"].includes(effectiveDecision) && (
            <Box
              sx={{
                p: 2,
                mt: 3,
                border: "1px solid #eadfd9",
                borderRadius: "10px",
                background: "#fcfaf9",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                  gap: "6px 10px",
                }}
              >
                <Box
                  sx={{
                    "& .MuiFormLabel-root": { marginBottom: "5px" },
                    "& .MuiFormLabel-root .MuiTypography-root": {
                      color: "#444",
                      fontSize: "11px",
                      fontWeight: 400,
                    },
                  }}
                >
                  <CustomRadioGroup
                    label="Reconsideration Possible?"
                    row
                    value={reconsiderPossible}
                    onChange={(e) => {
                      setReconsiderPossible(e.target.value as "Yes" | "No");
                      if (e.target.value === "No") {
                        setReconsiderAfter("");
                        setReconsiderReqType("");
                        setReconsiderReqTypeOther("");
                      }
                    }}
                    options={[
                      { label: "Yes", value: "Yes" },
                      { label: "No", value: "No" },
                    ]}
                  />
                </Box>

                <Box sx={{ gridColumn: { xs: "auto", sm: "span 3" } }}>
                  <Typography
                    component="span"
                    sx={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#444",
                      fontSize: "11px",
                    }}
                  >
                    Requirement Details
                  </Typography>
                  <CustomTextField
                    value={reconsiderReqDetails}
                    onChange={(e) => setReconsiderReqDetails(e.target.value.slice(0, 4000))}
                    placeholder="Enter details... (max 4000 characters)"
                    multiline
                    rows={3}
                    fullWidth
                    sx={{
                      "& .MuiOutlinedInput-root.MuiInputBase-multiline": {
                        height: "auto",
                        minHeight: "80px",
                        padding: "8px 14px",
                      },
                    }}
                  />
                  <Typography
                    sx={{
                      display: "block",
                      textAlign: "right",
                      fontSize: "10px",
                      color: "#938883",
                      mt: 0.5,
                    }}
                  >
                    {reconsiderReqDetails.length}/4000
                  </Typography>
                </Box>

                {reconsiderPossible === "Yes" && (
                  <>
                    <Box>
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          marginBottom: "5px",
                          color: "#444",
                          fontSize: "11px",
                        }}
                      >
                        Reconsider After
                      </Typography>
                      <CustomSelect
                        value={reconsiderAfter}
                        onChange={(val) => setReconsiderAfter(val)}
                        options={readReconsiderAfterOptions()}
                        placeholder="Select"
                        fullWidth
                      />
                    </Box>

                    <Box>
                      <Typography
                        component="span"
                        sx={{
                          display: "block",
                          marginBottom: "5px",
                          color: "#444",
                          fontSize: "11px",
                        }}
                      >
                        Requirement Type
                      </Typography>
                      <CustomSelect
                        value={reconsiderReqType}
                        onChange={(val) => {
                          setReconsiderReqType(val);
                          if (!isOtherRequirementType(val)) setReconsiderReqTypeOther("");
                        }}
                        options={readReconsiderReqTypeOptions()}
                        placeholder="Select"
                        fullWidth
                      />
                    </Box>

                    {isOtherRequirementType(reconsiderReqType) && (
                      <Box>
                        <Typography
                          component="span"
                          sx={{
                            display: "block",
                            marginBottom: "5px",
                            color: "#444",
                            fontSize: "11px",
                          }}
                        >
                          Other Requirement Type
                        </Typography>
                        <CustomTextField
                          value={reconsiderReqTypeOther}
                          onChange={(e) => setReconsiderReqTypeOther(e.target.value)}
                          placeholder="Enter requirement type"
                          fullWidth
                        />
                      </Box>
                    )}
                  </>
                )}

              </Box>
            </Box>
          )}


          {/* COUNTER OFFER DETAILS TABLE FOR CO / BOR_STD / EP */}
          {["CO", "BOR_STD", "EP"].includes(effectiveDecision) && (
            <Box className="counter-offer-layout" sx={{ mt: 3 }}>
              <Typography
                component="h3"
                className="counter-offer-title"
                sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mb: 1.5 }}
              >
                Decision Details
              </Typography>

              <Box
                className="counter-offer-wrap"
                sx={{
                  border: "1px solid #eadfd9",
                  borderRadius: "10px",
                  overflowX: "auto",
                }}
              >
                <table
                  className="counter-offer-table"
                  style={{
                    width: "100%",
                    minWidth: "860px",
                    borderCollapse: "collapse",
                    fontSize: "10px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#ffead7", color: "#5b261c", fontWeight: 800 }}>
                      <th style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", whiteSpace: "nowrap" }}>Product</th>
                      <th style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", whiteSpace: "nowrap" }}>Type</th>
                      {isBstdColumnVisible && (
                        <th style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", whiteSpace: "nowrap" }}>BSTD Code</th>
                      )}
                      <th style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", whiteSpace: "nowrap" }}>SA</th>
                      <th style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", whiteSpace: "nowrap" }}>Changed SA</th>
                      <th style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", whiteSpace: "nowrap" }}>PT</th>
                      <th style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", whiteSpace: "nowrap" }}>Changed PT</th>
                      <th style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", whiteSpace: "nowrap" }}>Loading Class</th>
                      <th style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", whiteSpace: "nowrap" }}>Loading Reason Code</th>
                      <th style={{ padding: "7px 6px", borderBottom: "1px solid #eadfd9", textAlign: "center" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {counterOfferRows.map((row) => {
                      // Type dropdown options come from master data based on the effective decision
                      const typeOpts = readCounterOfferTypeOptions(effectiveDecision, row.isRider);

                      const isLoadingType = ["Medical Loading", "FE Loading", "Smoker Loading"].includes(row.type);

                      return (
                        <tr key={row.id}>
                          {/* Product */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            {row.isUserAdded ? (
                              <CustomSelect
                                value={row.productName}
                                onChange={(val) => handleRowFieldChange(row.id, "productName", val)}
                                options={productList.map((dp) => ({ value: dp.name, label: dp.name }))}
                                placeholder="Select product"
                                fullWidth
                              />
                            ) : (
                              <Typography sx={{ fontSize: "10px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                                {row.productName}
                              </Typography>
                            )}
                          </td>

                          {/* Type */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            <CustomSelect
                              value={row.type}
                              onChange={(val) => handleRowFieldChange(row.id, "type", val)}
                              options={typeOpts}
                              placeholder="Select"
                              fullWidth
                              disabled={row.isUserAdded && !row.productName}
                            />
                          </td>

                          {/* BSTD Code (conditional column) */}
                          {isBstdColumnVisible && (
                            <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                              <CustomSelect
                                value={row.bstdCode}
                                onChange={(val) => handleRowFieldChange(row.id, "bstdCode", val)}
                                options={readBstdCodeOptions()}
                                placeholder="Select"
                                fullWidth
                                disabled={row.type !== "Borderline Standard"}
                              />
                            </td>
                          )}

                          {/* SA */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            <CustomTextField value={row.sa} disabled fullWidth size="small" />
                          </td>

                          {/* Changed SA */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            <CustomTextField
                              value={row.changedSa}
                              onChange={(e) => handleRowFieldChange(row.id, "changedSa", e.target.value)}
                              placeholder="Enter SA"
                              disabled={row.type !== "Reduce Cover"}
                              fullWidth
                              size="small"
                            />
                          </td>

                          {/* PT */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            <CustomTextField value={row.pt} disabled fullWidth size="small" />
                          </td>

                          {/* Changed PT */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            <CustomTextField
                              value={row.changedPt}
                              onChange={(e) => handleRowFieldChange(row.id, "changedPt", e.target.value)}
                              placeholder="Enter PT"
                              disabled={row.type !== "Reduce PT"}
                              fullWidth
                              size="small"
                            />
                          </td>

                          {/* Loading Class */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            <CustomSelect
                              value={row.loadingClass}
                              onChange={(val) => handleRowFieldChange(row.id, "loadingClass", val)}
                              options={isLoadingType ? readLoadingClassOptions() : []}
                              placeholder="Select"
                              disabled={!isLoadingType}
                              fullWidth
                            />
                          </td>

                          {/* Loading Reason Code */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            <CustomSelect
                              value={row.loadingReason}
                              onChange={(val) => handleRowFieldChange(row.id, "loadingReason", val)}
                              options={isLoadingType ? readLoadingReasonOptions() : []}
                              placeholder="Select"
                              disabled={!isLoadingType}
                              fullWidth
                            />
                          </td>

                          {/* Actions */}
                          <td style={{ padding: "7px 6px", borderBottom: "1px solid #eadfd9", textAlign: "center" }}>
                            {row.isUserAdded ? (
                              <CustomButton
                                variant="text"
                                onClick={() => handleRemoveRow(row.id)}
                                sx={{ color: "#aa262a", minWidth: 0, p: 0.5 }}
                              >
                                ✕
                              </CustomButton>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>

              {["CO", "EP"].includes(effectiveDecision) && (
                <CustomButton
                  variant="contained"
                  onClick={handleAddEpRow}
                  sx={{
                    mt: 1.5,
                    fontSize: "11px",
                    py: 1,
                    px: 2,
                    background: "#e45f14",
                    "&:hover": { background: "#c94f0d" },
                  }}
                >
                  + Add Row
                </CustomButton>
              )}
            </Box>
          )}

          {/* UW REMARKS - last field before Submit (non-referral decisions) */}
          {dialogDecision !== "REFERRAL" && (
            <Box sx={{ mt: 3 }}>
              <Typography
                component="span"
                sx={{
                  display: "block",
                  marginBottom: "5px",
                  color: "#444",
                  fontSize: "11px",
                }}
              >
                UW Remarks
              </Typography>
              <CustomTextField
                value={dialogRemarks}
                onChange={(e) => setDialogRemarks(e.target.value.slice(0, 10000))}
                placeholder="Enter remarks..."
                multiline
                rows={3}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root.MuiInputBase-multiline": {
                    height: "auto",
                    minHeight: "80px",
                    padding: "8px 14px",
                  },
                }}
              />
              <Typography
                sx={{
                  display: "block",
                  textAlign: "right",
                  fontSize: "10px",
                  color: "#938883",
                  mt: 0.5,
                }}
              >
                {dialogRemarks.length}/10000
              </Typography>
            </Box>
          )}

          {/* BACK (only when opened from UW Guidelines) + SUBMIT BUTTONS */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
            {guidelinesConfirmed && ["APPROVER", "REFERRAL"].includes(dialogDecision) && (
              <CustomButton
                variant="outlined"
                onClick={backToGuidelines}
                sx={{
                  borderColor: "#eadfd9",
                  color: "#7b716c",
                  fontWeight: "bold",
                  px: 4,
                }}
              >
                Back
              </CustomButton>
            )}
            <CustomButton
              variant="contained"
              disabled={validating}
              onClick={handleDialogSubmit}
              sx={{
                background: "#e45f14",
                color: "#fff",
                fontWeight: "bold",
                px: 5,
                py: 1,
                "&:hover": { background: "#c94f0d" },
              }}
            >
              Save
            </CustomButton>
          </Box>
          </>
          )}
        </Box>
      </CustomDialog>

      {/* Validations returned by the validation API (same modal as DVT); Submit stays blocked until it succeeds */}
      <CustomDialog
        open={partyValidationRows.length > 0}
        onClose={() => setPartyValidationRows([])}
        title={
          <Typography component="span" sx={{ fontSize: 16, fontWeight: 700 }}>
            Validations
          </Typography>
        }
        maxWidth="md"
        fullWidth
      >
        <ValidationList rows={partyValidationRows} />
      </CustomDialog>

      {/* Read-only view of the submitted decision */}
      <GuwDecisionDetailsDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        submittedDecision={submittedDecision}
      />

      {/* Snackbar notification */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </Box>
  );
}

/** Read-only view of a submitted Case UW Decision (shared by the DRS panel and the member summary page). */
export function GuwDecisionDetailsDialog({
  open,
  onClose,
  submittedDecision,
}: Readonly<{ open: boolean; onClose: () => void; submittedDecision: SubmittedDecision | null }>) {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Case UW Decision Details"
      maxWidth="lg"
      fullWidth
    >
      {!submittedDecision && (
        <Box sx={{ p: 1 }}>
          <Typography component="p" sx={{ color: "#7b716c", fontSize: "12px", fontWeight: 600 }}>
            No Case UW Decision has been submitted yet.
          </Typography>
        </Box>
      )}
      {submittedDecision && (
        <Box sx={{ p: 1 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: "6px 10px",
            }}
          >
            {submittedDecision.fields.map((field) => (
              <Box key={field.label} sx={field.wide ? { gridColumn: { xs: "auto", sm: "span 2" } } : undefined}>
                <Typography
                  component="span"
                  sx={{ display: "block", marginBottom: "3px", color: "#7b716c", fontSize: "11px", fontWeight: 600 }}
                >
                  {field.label}
                </Typography>
                <Typography
                  component="span"
                  sx={{ display: "block", color: "#302a27", fontSize: "12px", fontWeight: 700, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {field.value}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Reconsideration Details card (DC / POSTP / REJ) */}
          {submittedDecision.reconsiderationFields.length > 0 && (
            <Box
              sx={{
                p: 2,
                mt: 3,
                border: "1px solid #eadfd9",
                borderRadius: "10px",
                background: "#fcfaf9",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                  gap: "6px 10px",
                }}
              >
                {submittedDecision.reconsiderationFields.map((field) => (
                  <Box key={field.label} sx={field.wide ? { gridColumn: { xs: "auto", sm: "span 3" } } : undefined}>
                    <Typography
                      component="span"
                      sx={{ display: "block", marginBottom: "3px", color: "#444", fontSize: "11px" }}
                    >
                      {field.label}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{ display: "block", color: "#302a27", fontSize: "12px", fontWeight: 700, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                      {field.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {submittedDecision.reinsurerRows.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography component="h3" sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mb: 1.5 }}>
                Reinsurer Details
              </Typography>
              <Box sx={{ border: "1px solid #eadfd9", borderRadius: "10px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#ffead7", color: "#5b261c", fontWeight: 800 }}>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Code</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Reinsurer Name - System</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Reinsurer Name - UW</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedDecision.reinsurerRows.map((row) => (
                      <tr key={row.code}>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.code}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.systemName}</td>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9" }}>{row.uwName}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>

              <Typography component="h3" sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mt: 2, mb: 1.5 }}>
                Assign Documents
              </Typography>
              <Box sx={{ border: "1px solid #eadfd9", borderRadius: "10px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#ffead7", color: "#5b261c", fontWeight: 800 }}>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Document name</th>
                      {submittedDecision.reinsurerRows.map((row) => (
                        <th key={row.code} style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "center" }}>
                          {row.uwName || row.systemName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {submittedDecision.documentRows.map((doc) => (
                      <tr key={doc.name}>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{doc.name}</td>
                        {doc.assigned.map((assigned, idx) => (
                          <td key={idx} style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "center" }}>
                            {assigned ? "Yes" : "No"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {submittedDecision.counterOfferRows.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography component="h3" sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mb: 1.5 }}>
                Decision Details
              </Typography>
              <Box sx={{ border: "1px solid #eadfd9", borderRadius: "10px", overflowX: "auto" }}>
                <table style={{ width: "100%", minWidth: "860px", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#ffead7", color: "#5b261c", fontWeight: 800 }}>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Product</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Type</th>
                      {submittedDecision.showBstdColumn && (
                        <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>BSTD Code</th>
                      )}
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>SA</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Changed SA</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>PT</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Changed PT</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Loading Class</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Loading Reason Code</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedDecision.counterOfferRows.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", fontWeight: 700 }}>{row.productName}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.type}</td>
                        {submittedDecision.showBstdColumn && (
                          <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.bstdCode}</td>
                        )}
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.sa}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.changedSa}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.pt}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.changedPt}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.loadingClass}</td>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9" }}>{row.loadingReason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          )}

          {/* UW Remarks - last field, same as the decision dialog */}
          <Box sx={{ mt: 3 }}>
            <Typography
              component="span"
              sx={{ display: "block", marginBottom: "3px", color: "#444", fontSize: "11px" }}
            >
              {submittedDecision.reinsurerRows.length > 0 ? "Remarks" : "UW Remarks"}
            </Typography>
            <Typography
              component="span"
              sx={{ display: "block", color: "#302a27", fontSize: "12px", fontWeight: 700, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {submittedDecision.remarks}
            </Typography>
          </Box>

          {/* Snapshots saved before the validation API keep their static guidelines; new ones show the saved rows */}
          {(submittedDecision.validationRows?.length ?? 0) > 0 || submittedDecision.guidelines.length > 0 ? (
            <Box sx={{ mt: 3 }}>
              <Typography component="h3" sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mb: 1.5 }}>
                UW Guidelines
              </Typography>
              <Box sx={{ border: "1px solid #eadfd9", borderRadius: "10px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#ffead7", color: "#5b261c", fontWeight: 800 }}>
                      <th style={{ ...GUIDELINE_CELL, textAlign: "left" }}>Reason</th>
                      <th style={{ ...GUIDELINE_CELL, textAlign: "left" }}>Remark</th>
                      <th style={{ ...GUIDELINE_CELL, textAlign: "left" }}>System Action</th>
                      <th style={{ ...GUIDELINE_CELL, textAlign: "left" }}>Justification/Checklist</th>
                      <th style={{ ...GUIDELINE_CELL_LAST, textAlign: "left" }}>Justification Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedDecision.validationRows && submittedDecision.validationRows.length > 0
                      ? submittedDecision.validationRows.map((row, rowIndex) => {
                          const savedReason = row.justificationOptions.find(
                            (o) => o.code === row.selectedReasonCode,
                          )?.text;
                          return (
                            <tr key={`${guidelineRowKey(row)}-${rowIndex}`} data-testid={`guw-guideline-${row.validationId}`}>
                              <td style={GUIDELINE_CELL}>
                                <GuidelineCategoryIcon category={row.category} />
                                {row.reason}
                              </td>
                              <td style={GUIDELINE_CELL}>{row.remark}</td>
                              <td style={GUIDELINE_CELL}>{row.systemAction || "—"}</td>
                              <td style={GUIDELINE_CELL}>{savedReason || "—"}</td>
                              <td style={GUIDELINE_CELL_LAST}>{row.justificationRemark || "—"}</td>
                            </tr>
                          );
                        })
                      : submittedDecision.guidelines.map((row) => (
                          <tr key={row.reason}>
                            <td style={GUIDELINE_CELL}>{row.reason}</td>
                            <td style={GUIDELINE_CELL}>{row.remark}</td>
                            <td style={GUIDELINE_CELL}>{row.systemAction || "—"}</td>
                            <td style={GUIDELINE_CELL}>{row.justificationReason || "—"}</td>
                            <td style={GUIDELINE_CELL_LAST}>{row.justificationRemark || "—"}</td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </Box>
            </Box>
          ) : null}
        </Box>
      )}
    </CustomDialog>
  );
}
