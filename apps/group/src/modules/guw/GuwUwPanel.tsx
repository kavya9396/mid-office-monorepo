import { useState, useEffect, useRef, type ReactElement } from "react";
import {
  CustomBox,
  CustomButton,
  CustomDialog,
  CustomMultiSelect,
  CustomRadioGroup,
  CustomSelect,
  CustomTextField,
  CustomTooltip,
  CustomTypography,
  CustomSnackbar,
  EditIcon,
  DangerIcon,
  InfoIcon,
  InfomationIcon,
  NoteIcon,
  TaskIcon,
} from "@insurance-poc/ui";
import { groupPaths, replaceUrl } from "@insurance-poc/routes";
import { getMasterList } from "@insurance-poc/utils";
import eyeIconSrc from "../../assets/eye.svg";
import {
  clearGuwSubmittedDecision,
  saveGuwSubmittedDecision,
  toGuwValidationRequest,
  validateGuwDecision,
  type GuwGuidelineCategory,
  type GuwSavedValidationRow,
  type GuwSubmittedDecision,
  type GuwValidationResult,
  type GuwValidationRow,
} from "../../services/guwService";

export interface GuwUwSummaryField {
  label: string;
  value?: string;
}

export interface GuwUwPanelProps {
  /** Used to hold the submitted decision (and UW guidelines) in the browser session. */
  applicationNo?: string;
  /** Session key for the held decision; defaults to applicationNo (the summary page uses its own). */
  storageKey?: string;
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
}

// Case UW Decision options come from master data (misc / GUW_TERM_DESC). Three master codes differ from the
// codes used by the decision rules, validation and saved decisions, so they are translated to those codes here.
const DECISION_CODE_BY_MASTER_CODE: Record<string, string | undefined> = {
  BSD_STD: "BOR_STD",
  DEC: "DC",
  POS_PON: "POSTP",
};

const DECISION_OPTIONS = getMasterList("misc", "GUW_TERM_DESC").map((entry) => ({
  value: DECISION_CODE_BY_MASTER_CODE[entry.code] ?? entry.code,
  label: entry.value ?? entry.description,
}));

const SMOKER_FLAG_OPTIONS = getMasterList("misc", "GUW_STD_SMOK").map((entry) => ({
  value: entry.value ?? entry.description,
  label: entry.value ?? entry.description,
}));

// Decisions raised from the action buttons below the Case UW Decision dropdown
const ACTION_DECISION_OPTIONS = [
  { value: "REFERRAL", label: "Raise Referral" },
  { value: "HOLD", label: "Hold" },
  { value: "APPROVER", label: "Counter Sign" },
];

const ALL_DECISION_OPTIONS = [
  ...DECISION_OPTIONS,
  ...ACTION_DECISION_OPTIONS,
  { value: "AMR", label: "Raise Requirement" },
];

// Placeholder assignee list (mock login user ids) until a user-lookup API is specified
const APPROVER_ASSIGNEE_OPTIONS = ["UW001", "UW002", "UW003"].map((id) => ({
  value: id,
  label: id,
}));

const REFERRAL_TYPE_OPTIONS = [
  { value: "REF_IT", label: "IT" },
  { value: "REF_REINS", label: "Reinsurer" },
  { value: "REF_SR_UW", label: "Sr UW Opinion" },
  { value: "REF_HOD", label: "HOD Opinion" },
  { value: "REF_CMO", label: "HO CMO" },
  { value: "REF_CMO_LOCAL", label: "CMO" },
  { value: "REF_RISK", label: "Risk" },
  { value: "REF_ACU", label: "Accuity" },
  { value: "REF_CUW_CLM", label: "CUW Claim" },
  { value: "REF_TELE_MER", label: "Tele MER" },
  { value: "REF_VIDEO_MER", label: "Video MER" },
];

// Assigned To is enabled only for these referral rows
const ASSIGNABLE_REFERRALS = ["REF_SR_UW", "REF_HOD"];

const REFERRAL_REASON_OPTIONS: Record<string, string[]> = {
  REF_IT: ["System issue", "Data correction", "Other"],
  REF_REINS: ["High sum assured", "Medical risk", "Other"],
  REF_SR_UW: ["Medical opinion", "Financial opinion", "High SA", "Policy exception", "Other"],
  REF_HOD: ["Medical opinion", "Financial opinion", "High SA", "Policy exception", "Counter signing", "Other"],
  REF_CMO: ["Medical review", "Specialist opinion", "Other"],
  REF_CMO_LOCAL: ["Medical review", "Specialist opinion", "Other"],
  REF_RISK: ["Risk assessment", "Policy exception", "Other"],
  REF_ACU: ["Screening review", "Match review", "Other"],
  REF_CUW_CLM: ["Claim history", "Investigation", "Other"],
  REF_TELE_MER: ["Medical review", "Other"],
  REF_VIDEO_MER: ["Medical review", "Other"],
};

const LOADING_CLASS_OPTIONS: Record<string, string[]> = {
  "Medical Loading": ["ML001 - Substandard", "ML002 - Rated Up", "ML003 - Extra Mortality", "ML004 - Occupational Hazard"],
  "FE Loading": ["FE001 - Financial Extra", "FE002 - Income Mismatch", "FE003 - High SA"],
  "Smoker Loading": ["SL001 - Smoker", "SL002 - Tobacco User", "SL003 - Ex-Smoker"],
};

const LOADING_REASON_OPTIONS: Record<string, string[]> = {
  "Medical Loading": ["Medical history", "BMI deviation", "Pre-existing condition", "Hazardous occupation"],
  "FE Loading": ["Income proof inadequate", "SA exceeds eligibility", "Financial inconsistency"],
  "Smoker Loading": ["Active smoker", "Tobacco chewer", "Recent cessation"],
};

const REINSURER_UW_OPTIONS = ["Swiss Re", "Munich Re", "Scor Re", "Gen Re", "RGA Re", "Hannover Re"];
const REFERRAL_DOCUMENTS = ["Application Form", "PhotoId Proof", "Address Proof"];

const DEFAULT_PRODUCTS = [
  { name: "iProtect Smart", sa: "₹50,00,000", pt: "20", isRider: false },
  { name: "Accidental Death Rider", sa: "₹10,00,000", pt: "20", isRider: true },
  { name: "WOP Rider", sa: "₹15,00,000", pt: "20", isRider: true },
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

// Exclusive referral rows, in pre-selection priority order after CMO / other rows (priority 0)
const EXCLUSIVE_REFERRALS = [
  { key: "sr uw", row: "REF_SR_UW", priority: 1 },
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
  let best: { priority: number; row: string } | null = null;
  for (const target of targets) {
    const key = target.toLowerCase();
    const exclusive = EXCLUSIVE_REFERRALS.find((e) => e.key === key);
    const option = exclusive
      ? undefined
      : REFERRAL_TYPE_OPTIONS.find((o) => o.label.toLowerCase() === key);
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
    <CustomBox
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
    </CustomBox>
  );
}

export function GuwUwPanel({
  applicationNo = "",
  storageKey,
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
  const [validationRows, setValidationRows] = useState<GuwSavedValidationRow[]>([]);
  const [validating, setValidating] = useState<boolean>(false);
  const [successOpen, setSuccessOpen] = useState<boolean>(false);

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
  const [subStdReason, setSubStdReason] = useState<string[]>([]);
  const [postponementPeriod, setPostponementPeriod] = useState<string>("");
  const [holdReason, setHoldReason] = useState<string>("");

  // Approver states
  const [approverTarget, setApproverTarget] = useState<string>(""); // HOD or Sr UW
  const [approverReason, setApproverReason] = useState<string>("");
  const [approverAssignedTo, setApproverAssignedTo] = useState<string>("");

  // Referral states
  const [referralReason, setReferralReason] = useState<string>("");
  const [referralRows, setReferralRows] = useState<{
    target: string;
    label: string;
    selected: boolean;
    reason: string;
    remarks: string;
    assignedTo: string;
  }[]>(() =>
    REFERRAL_TYPE_OPTIONS.map((opt) => ({
      target: opt.value,
      label: opt.label,
      selected: false,
      reason: "",
      remarks: "",
      assignedTo: "",
    }))
  );
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

  // Initialize Counter Offer rows when dialog decision turns to CO, BOR_STD, or EP
  useEffect(() => {
    if (keepCounterOfferRowsRef.current) {
      keepCounterOfferRowsRef.current = false;
      return;
    }
    if (["CO", "BOR_STD", "EP"].includes(effectiveDecision)) {
      setCounterOfferRows(
        DEFAULT_PRODUCTS.map((prod, idx) => ({
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
      add("Decision Code", effectiveDecision);
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
    if (dialogDecision !== "REFERRAL" && REFERRAL_REASON_OPTIONS[effectiveDecision]) {
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
        if (reconsiderReqType === "Other") {
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
    };
  };

  const openDecisionDialog = (code: string) => {
    setDialogDecision(code);
    setApproverBaseDecision("");
    setGuidelinesConfirmed(false);
    setDialogRemarks(remarks);
    setDialogStep(1);
    const prevSmoker = submittedDecision?.fields.find((f) => f.label === "Smoker Flag")?.value;
    if (prevSmoker) {
      setSmokerFlag(prevSmoker);
    }
    // UW Guidelines are fetched again on Submit; earlier saved justifications are restored then
    setValidation(null);
    setValidationRows([]);
    setSuccessOpen(false);
    if (code === "REFERRAL") {
      setReinsurerEditOpen(false);
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
    } else {
      if (!dialogRemarks.trim()) {
        notify("Please enter UW Remarks", "error");
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

    // Opened from UW Guidelines (validation already done): Counter Sign / Raise Referral is the final step
    if (guidelinesConfirmed && ["APPROVER", "REFERRAL"].includes(effectiveDecision)) {
      finalizeSubmit();
      return;
    }

    setValidating(true);
    try {
      const result = await validateGuwDecision(toGuwValidationRequest(applicationNo), caseDecision);
      setValidation(result);

      if (result.success) {
        // Save point: decision details are held and linked to the main Case UW Decision
        setValidationRows([]);
        saveDraft([]);
        setDialogOpen(false);
        setSuccessOpen(true);
        return;
      }

      // Rows start empty unless the user saved justifications for the same rows earlier
      const rows = mergeSavedRows(result.rows, submittedDecision?.validationRows);
      setValidationRows(rows);
      saveDraft(rows);
      setDialogStep(2);
    } catch {
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

  // Open Counter Sign / Raise Referral from UW Guidelines, keeping the guideline entries
  const switchToActionDecision = (code: "APPROVER" | "REFERRAL") => {
    decisionBeforeActionRef.current = dialogDecision;
    if (!isActionDecision) setApproverBaseDecision(dialogDecision);
    keepCounterOfferRowsRef.current = true;
    setDialogDecision(code);
    if (code === "REFERRAL") {
      // Only one referral row is pre-selected (CMO / other, then Sr UW, HOD, Reinsurer)
      const picked = pickReferralRow(referralTargetsOf(validationRows));
      setReferralRows((prev) => prev.map((r) => ({ ...r, selected: r.target === picked })));
      setReinsurerEditOpen(picked === "REF_REINS");
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
    const nextAction = validation?.referralRequired
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

    finalizeSubmit();
  };

  // Success popup closed: continue with the final submit
  const handleSuccessClose = () => {
    setSuccessOpen(false);
    finalizeSubmit();
  };

  const finalizeSubmit = () => {
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

    // Redirect (inbox, or member summary page for multi-life) after 700ms delay
    setTimeout(() => {
      replaceUrl(redirectUrl);
    }, 700);
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
          const defaultProd = DEFAULT_PRODUCTS.find((p) => p.name === value);
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

  // Reasons options for MultiSelect
  const rejectReasonOptions = [
    { label: "Previous policy found as repudiated / Death claim", value: "Previous policy found as repudiated / Death claim" },
    { label: "Financially Not Eligible", value: "Financially Not Eligible" },
  ];

  const allReasonOptions = [
    { label: "Medical conditions that affect mood", value: "Medical conditions that affect mood" },
    { label: "Financially Not Eligible", value: "Financially Not Eligible" },
    { label: "Defects in body posture", value: "Defects in body posture" },
    { label: "Previous policy found as repudiated / Death claim", value: "Previous policy found as repudiated / Death claim" },
    { label: "Asthma", value: "Asthma" },
  ];

  const isBstdColumnVisible = counterOfferRows.some((r) => r.type === "Borderline Standard");

  const summaryItems: GuwUwSummaryField[] =
    summaryFields && summaryFields.length > 0
      ? summaryFields
      : [
          { label: "BRE Overall Decision", value: breOverallDecision },
          { label: "BRE Overall Remarks", value: breOverallRemarks },
        ];

  return (
    <CustomBox
      sx={{
        margin: 0,
        padding: "4px 12px",
        background: "transparent",
        border: 0,
        borderRadius: 0,
      }}
    >
      <CustomBox
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" },
          gap: "6px",
        }}
      >
        {/* Read-only Summary (BRE overall or custom summary fields) */}
        <CustomBox
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
            <CustomBox
              key={field.label}
              sx={{
                padding: "5px 12px",
                minWidth: 0,
                borderLeft: idx > 0 ? "1px solid #eadfd9" : "none",
              }}
            >
              <CustomTypography
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
              </CustomTypography>
              <CustomTypography
                component="span"
                sx={{
                  color: "#302a27",
                  fontSize: "13px",
                  fontWeight: 800,
                }}
              >
                {field.value || "-"}
              </CustomTypography>
            </CustomBox>
          ))}
        </CustomBox>

        {/* Case UW Decision Dropdown (+ read-only Decision Code beside it when the decision is derived) */}
        <CustomBox sx={{ display: "flex", alignItems: "flex-start", gap: "8px", pr: "70px" }}>
        <CustomBox component="label" sx={{ display: "block", flex: 1, minWidth: 0 }}>
          <CustomTypography
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
          </CustomTypography>
          <CustomBox sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <CustomBox
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
            </CustomBox>
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
                  <img
                    src={eyeIconSrc}
                    alt=""
                    width={20}
                    height={20}
                    style={{ display: "block" }}
                  />
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
          </CustomBox>
        </CustomBox>
        {decisionReadOnly && (
          <CustomBox component="label" sx={{ display: "block", width: 160, flexShrink: 0 }}>
            <CustomTypography
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
            </CustomTypography>
            <CustomTextField
              value={selectedDecision}
              fullWidth
              htmlInputProps={{ readOnly: true, "aria-label": "Decision Code" }}
            />
          </CustomBox>
        )}
        </CustomBox>

        {/* Action buttons + Submit */}
        <CustomBox sx={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "8px", pr: "70px" }}>
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
        </CustomBox>
      </CustomBox>

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
        <CustomBox sx={{ p: 1 }}>
          {dialogStep === 2 ? (
            /* STEP 2: UW GUIDELINES VIEW */
            <CustomBox>
              <CustomBox
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
                        <CustomBox component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          Justification/Checklist
                          <CustomTooltip title="Select a reason for each justification and checklist item. A remark is mandatory when the justification reason is Other Reason.">
                            <span
                              role="img"
                              aria-label="Justification instructions"
                              style={{ display: "inline-flex", cursor: "help" }}
                            >
                              <CustomBox
                                component="span"
                                sx={{
                                  display: "inline-flex",
                                  color: "#9a2529",
                                  "& svg": { width: "14px", height: "14px" },
                                }}
                              >
                                <InfoIcon />
                              </CustomBox>
                            </span>
                          </CustomTooltip>
                        </CustomBox>
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
              </CustomBox>

              {routingMessage && (
                <CustomTypography
                  component="p"
                  role="alert"
                  sx={{ color: "#9a2529", fontSize: "12px", fontWeight: 700, lineHeight: 1.5, mb: 1 }}
                >
                  {routingMessage}
                </CustomTypography>
              )}

              <CustomBox sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
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
                  Confirm & Submit
                </CustomButton>
              </CustomBox>
            </CustomBox>
          ) : (
            /* STEP 1: CASE UW DECISION FIELDS VIEW */
            <>
              {/* Custom circular Close button matching prototype */}
              <CustomBox
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
              </CustomBox>

              {/* DECISION + DEPENDENT FIELDS GRID - Case UW Decision leads, UW Remarks is last */}
          <CustomBox
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: "6px 10px",
              mt: "6px",
            }}
          >
            {/* Dialog Decision select - hidden for Reinsurer Referral and for Raise Referral / Hold */}
            {effectiveDecision !== "REF_REINS" && !["REFERRAL", "HOLD"].includes(dialogDecision) && (
              <CustomBox>
                <CustomTypography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Case UW Decision
                </CustomTypography>
                <CustomBox sx={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CustomBox sx={{ flex: 1, minWidth: 0 }}>
                    <CustomSelect
                      value={
                        dialogDecision === "APPROVER"
                          ? approverBaseDecision || selectedDecision
                          : dialogDecision
                      }
                      onChange={(val) => setDialogDecision(val)}
                      options={
                        dialogDecision === "APPROVER"
                          ? mainSelectOptions
                          : isActionDecision
                            ? ACTION_DECISION_OPTIONS
                            : DECISION_OPTIONS
                      }
                      disabled={isActionDecision}
                      placeholder="Select"
                      fullWidth
                    />
                  </CustomBox>
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
                      <img
                        src={eyeIconSrc}
                        alt=""
                        width={20}
                        height={20}
                        style={{ display: "block" }}
                      />
                    </CustomButton>
                  )}
                </CustomBox>
              </CustomBox>
            )}

            {/* REFERRAL MULTISELECT TABLE */}
            {dialogDecision === "REFERRAL" && (
              <CustomBox sx={{ gridColumn: { xs: "auto", sm: "span 3" }, mt: 0.5 }}>
                <CustomBox sx={{ overflowX: "auto" }}>
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
                            disabled={referralRows.some((r) => ["REF_REINS", "REF_SR_UW", "REF_HOD"].includes(r.target) && r.selected)}
                            checked={
                              referralRows.length > 0 &&
                              !referralRows.some((r) => ["REF_REINS", "REF_SR_UW", "REF_HOD"].includes(r.target) && r.selected) &&
                              referralRows
                                .filter((r) => !["REF_REINS", "REF_SR_UW", "REF_HOD", "REF_TELE_MER", "REF_VIDEO_MER"].includes(r.target))
                                .every((r) => r.selected)
                            }
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setReferralRows((prev) =>
                                prev.map((r) => ({
                                  ...r,
                                  // Tele MER / Video MER are mutually exclusive, so select-all leaves them unchanged
                                  selected: ["REF_REINS", "REF_SR_UW", "REF_HOD"].includes(r.target)
                                    ? false
                                    : ["REF_TELE_MER", "REF_VIDEO_MER"].includes(r.target)
                                    ? r.selected
                                    : checked,
                                }))
                              );
                            }}
                            style={{
                              cursor: referralRows.some((r) => ["REF_REINS", "REF_SR_UW", "REF_HOD"].includes(r.target) && r.selected)
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
                        const isExclusive = ["REF_REINS", "REF_SR_UW", "REF_HOD"].includes(row.target);
                        const isExclusiveSelected = referralRows.some(
                          (r) => ["REF_REINS", "REF_SR_UW", "REF_HOD"].includes(r.target) && r.selected
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
                        const canAssign = ASSIGNABLE_REFERRALS.includes(row.target);
                        const reasonOptions = (REFERRAL_REASON_OPTIONS[row.target] ?? []).map((opt) => ({
                          value: opt,
                          label: opt,
                        }));

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
                                value={row.reason}
                                onChange={(val) => {
                                  setReferralRows((prev) => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], reason: val };
                                    return copy;
                                  });
                                }}
                                options={reasonOptions}
                                disabled={!row.selected || isRowDisabled}
                                placeholder="Select reason"
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
                                options={APPROVER_ASSIGNEE_OPTIONS}
                                disabled={!canAssign || !row.selected || isRowDisabled}
                                placeholder="Select User ID"
                                fullWidth
                              />
                            </td>
                            <td style={{ padding: "6px 8px", border: "1px solid #ded9d6", textAlign: "center" }}>
                              <CustomButton
                                variant={reinsurerEditOpen && isReinsurer ? "contained" : "outlined"}
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
                                {isReinsurer && reinsurerEditOpen ? "Hide" : "Edit"}
                              </CustomButton>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CustomBox>

                {/* REINSURER EDIT SECTION (OPENS AFTER REFERRAL TABLE) */}
                {reinsurerEditOpen && referralRows.find((r) => r.target === "REF_REINS")?.selected && (
                  <CustomBox
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
                    <CustomTypography
                      component="h3"
                      sx={{
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "#5b261c",
                        mb: 2,
                      }}
                    >
                      Reinsurer Referral Sheet
                    </CustomTypography>

                    <CustomBox
                      sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", md: "1.1fr 1.9fr" },
                        gap: "24px",
                        alignItems: "start",
                      }}
                    >
                      {/* Reinsurer selects panel */}
                      <CustomBox
                        sx={{
                          background: "#fff",
                          p: 2,
                          borderRadius: "14px",
                          border: "1px solid #ddd5d0",
                        }}
                      >
                        <CustomTypography
                          component="h4"
                          sx={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "#302a27",
                            mb: 1.5,
                          }}
                        >
                          Reinsurer Details
                        </CustomTypography>

                        <CustomBox sx={{ overflowX: "auto" }}>
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
                        </CustomBox>
                      </CustomBox>

                      {/* Document assignment card */}
                      <CustomBox
                        sx={{
                          border: "1px solid #ddd5d0",
                          borderRadius: "14px",
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        <CustomBox
                          sx={{
                            padding: "12px 24px",
                            background: "#e95d08",
                            color: "#fff",
                            fontSize: "14px",
                            fontWeight: 800,
                          }}
                        >
                          Assign Documents
                        </CustomBox>

                        <CustomBox sx={{ overflowX: "auto" }}>
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
                                    <CustomTypography sx={{ fontSize: "12px", fontWeight: "bold", display: "block" }}>
                                      {getEffectiveReinsurerName(index)}
                                    </CustomTypography>
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
                        </CustomBox>
                      </CustomBox>
                    </CustomBox>

                    {/* Generate Referral Sheet action trigger */}
                    <CustomBox sx={{ display: "flex", gap: "20px", mt: 2.5 }}>
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
                    </CustomBox>
                  </CustomBox>
                )}
              </CustomBox>
            )}

            {/* DECISION CODE - terminal decisions */}
            {dialogDecision !== "REFERRAL" && ["STD", "BOR_STD", "REJ", "DC", "POSTP", "CO", "EP"].includes(effectiveDecision) && (
              <CustomBox>
                <CustomTypography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Decision Code
                </CustomTypography>
                <CustomTextField value={effectiveDecision} disabled fullWidth />
              </CustomBox>
            )}

            {/* SMOKER FLAG - Standard decision only */}
            {effectiveDecision === "STD" && (
              <CustomBox>
                <CustomTypography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Smoker Flag
                </CustomTypography>
                <CustomSelect
                  value={smokerFlag}
                  onChange={(val) => setSmokerFlag(val)}
                  options={SMOKER_FLAG_OPTIONS}
                  placeholder="Select"
                  fullWidth
                />
              </CustomBox>
            )}

            {/* REASONS - SUBSTANDARD & REJECT */}
            {effectiveDecision && !["STD", "HOLD", "APPROVER", "REFERRAL"].includes(effectiveDecision) && !effectiveDecision.startsWith("REF_") && (
              <CustomBox sx={{ gridColumn: "span 2" }}>
                <CustomMultiSelect
                  label="Reasons"
                  value={subStdReason}
                  onChange={(val) => setSubStdReason(val)}
                  options={effectiveDecision === "REJ" ? rejectReasonOptions : allReasonOptions}
                  placeholder="Select reasons"
                  showSelectAll
                />
              </CustomBox>
            )}

            {/* POSTPONEMENT PERIOD */}
            {effectiveDecision === "POSTP" && (
              <CustomBox>
                <CustomTypography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Postponement Period
                </CustomTypography>
                <CustomSelect
                  value={postponementPeriod}
                  onChange={(val) => setPostponementPeriod(val)}
                  options={[
                    { value: "3 months", label: "3 months" },
                    { value: "6 months", label: "6 months" },
                    { value: "12 months", label: "12 months" },
                  ]}
                  placeholder="Select"
                  fullWidth
                />
              </CustomBox>
            )}

            {/* HOLD REASON */}
            {effectiveDecision === "HOLD" && (
              <CustomBox>
                <CustomTypography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Hold Reasons
                </CustomTypography>
                <CustomSelect
                  value={holdReason}
                  onChange={(val) => setHoldReason(val)}
                  options={[
                    { value: "Medical", label: "Medical" },
                    { value: "Financial", label: "Financial" },
                    { value: "Other", label: "Other" },
                  ]}
                  placeholder="Select"
                  fullWidth
                />
              </CustomBox>
            )}

            {/* REFERRAL REASONS (non-referral modal decisions) */}
            {dialogDecision !== "REFERRAL" && REFERRAL_REASON_OPTIONS[effectiveDecision] && (
              <CustomBox>
                <CustomTypography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Referral Reason
                </CustomTypography>
                <CustomSelect
                  value={referralReason}
                  onChange={(val) => setReferralReason(val)}
                  options={REFERRAL_REASON_OPTIONS[effectiveDecision].map((opt) => ({
                    value: opt,
                    label: opt,
                  }))}
                  placeholder="Select reason"
                  fullWidth
                />
              </CustomBox>
            )}


            {/* APPROVER FIELDS (FOR REFER TO APPROVER) */}
            {effectiveDecision === "APPROVER" && (
              <>
                <CustomBox>
                  <CustomTypography
                    component="span"
                    sx={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#444",
                      fontSize: "11px",
                    }}
                  >
                    Reason
                  </CustomTypography>
                  <CustomSelect
                    value={approverReason}
                    onChange={(val) => setApproverReason(val)}
                    options={["Counter signing", "Medical assessment", "Financial assessment", "Other"].map(
                      (v) => ({ value: v, label: v })
                    )}
                    placeholder="Select Reason"
                    fullWidth
                  />
                </CustomBox>

                <CustomBox>
                  <CustomTypography
                    component="span"
                    sx={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#444",
                      fontSize: "11px",
                    }}
                  >
                    Refer To
                  </CustomTypography>
                  <CustomSelect
                    value={approverTarget}
                    onChange={(val) => setApproverTarget(val)}
                    options={[
                      { value: "HOD", label: "HOD" },
                      { value: "Sr UW", label: "Sr UW" },
                    ]}
                    placeholder="Select HOD or Sr UW"
                    fullWidth
                  />
                </CustomBox>

                <CustomBox>
                  <CustomTypography
                    component="span"
                    sx={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#444",
                      fontSize: "11px",
                    }}
                  >
                    Assigned To
                  </CustomTypography>
                  <CustomSelect
                    value={approverAssignedTo}
                    onChange={(val) => setApproverAssignedTo(val)}
                    options={APPROVER_ASSIGNEE_OPTIONS}
                    placeholder="Select User ID"
                    fullWidth
                  />
                </CustomBox>
              </>
            )}
          </CustomBox>

          {/* RECONSIDERATION CARD FOR DC, POSTP, REJ */}
          {["DC", "POSTP", "REJ"].includes(effectiveDecision) && (
            <CustomBox
              sx={{
                p: 2,
                mt: 3,
                border: "1px solid #eadfd9",
                borderRadius: "10px",
                background: "#fcfaf9",
              }}
            >
              <CustomBox
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                  gap: "6px 10px",
                }}
              >
                <CustomBox
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
                </CustomBox>

                <CustomBox sx={{ gridColumn: { xs: "auto", sm: "span 3" } }}>
                  <CustomTypography
                    component="span"
                    sx={{
                      display: "block",
                      marginBottom: "5px",
                      color: "#444",
                      fontSize: "11px",
                    }}
                  >
                    Requirement Details
                  </CustomTypography>
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
                  <CustomTypography
                    sx={{
                      display: "block",
                      textAlign: "right",
                      fontSize: "10px",
                      color: "#938883",
                      mt: 0.5,
                    }}
                  >
                    {reconsiderReqDetails.length}/4000
                  </CustomTypography>
                </CustomBox>

                {reconsiderPossible === "Yes" && (
                  <>
                    <CustomBox>
                      <CustomTypography
                        component="span"
                        sx={{
                          display: "block",
                          marginBottom: "5px",
                          color: "#444",
                          fontSize: "11px",
                        }}
                      >
                        Reconsider After
                      </CustomTypography>
                      <CustomSelect
                        value={reconsiderAfter}
                        onChange={(val) => setReconsiderAfter(val)}
                        options={[
                          "Immediately",
                          "15 days",
                          "1 Month",
                          "2 Months",
                          "3 Months",
                          "4 Months",
                          "5 Months",
                          "6 Months",
                          "7 Months",
                          "8 Months",
                          "9 Months",
                          "10 Months",
                          "11 Months",
                          "1 Year",
                        ].map((v) => ({ value: v, label: v }))}
                        placeholder="Select"
                        fullWidth
                      />
                    </CustomBox>

                    <CustomBox>
                      <CustomTypography
                        component="span"
                        sx={{
                          display: "block",
                          marginBottom: "5px",
                          color: "#444",
                          fontSize: "11px",
                        }}
                      >
                        Requirement Type
                      </CustomTypography>
                      <CustomSelect
                        value={reconsiderReqType}
                        onChange={(val) => {
                          setReconsiderReqType(val);
                          if (val !== "Other") setReconsiderReqTypeOther("");
                        }}
                        options={[
                          "Repeat Medical",
                          "Specific Test",
                          "Doctor Report",
                          "Documents",
                          "Investigation Reports",
                          "Additional Surrogate Income",
                          "Other",
                        ].map((v) => ({ value: v, label: v }))}
                        placeholder="Select"
                        fullWidth
                      />
                    </CustomBox>

                    {reconsiderReqType === "Other" && (
                      <CustomBox>
                        <CustomTypography
                          component="span"
                          sx={{
                            display: "block",
                            marginBottom: "5px",
                            color: "#444",
                            fontSize: "11px",
                          }}
                        >
                          Other Requirement Type
                        </CustomTypography>
                        <CustomTextField
                          value={reconsiderReqTypeOther}
                          onChange={(e) => setReconsiderReqTypeOther(e.target.value)}
                          placeholder="Enter requirement type"
                          fullWidth
                        />
                      </CustomBox>
                    )}
                  </>
                )}

              </CustomBox>
            </CustomBox>
          )}


          {/* COUNTER OFFER DETAILS TABLE FOR CO / BOR_STD / EP */}
          {["CO", "BOR_STD", "EP"].includes(effectiveDecision) && (
            <CustomBox className="counter-offer-layout" sx={{ mt: 3 }}>
              <CustomTypography
                component="h3"
                className="counter-offer-title"
                sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mb: 1.5 }}
              >
                Decision Details
              </CustomTypography>

              <CustomBox
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
                      // Determine type dropdown options based on effective decision
                      let typeOpts: string[] = [];
                      if (effectiveDecision === "BOR_STD") {
                        typeOpts = ["Standard", "Borderline Standard"];
                      } else if (effectiveDecision === "CO") {
                        typeOpts = ["Standard", "Borderline Standard", "Reduce Cover", "Reduce PT"];
                        if (row.isRider) typeOpts.push("Deny Rider");
                      } else {
                        // EP
                        typeOpts = [
                          "Standard",
                          "Borderline Standard",
                          "Reduce Cover",
                          "Reduce PT",
                          "Medical Loading",
                          "FE Loading",
                          "Smoker Loading",
                        ];
                        if (row.isRider) typeOpts.push("Deny Rider");
                      }

                      const isLoadingType = ["Medical Loading", "FE Loading", "Smoker Loading"].includes(row.type);

                      return (
                        <tr key={row.id}>
                          {/* Product */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            {row.isUserAdded ? (
                              <CustomSelect
                                value={row.productName}
                                onChange={(val) => handleRowFieldChange(row.id, "productName", val)}
                                options={DEFAULT_PRODUCTS.map((dp) => ({ value: dp.name, label: dp.name }))}
                                placeholder="Select product"
                                fullWidth
                              />
                            ) : (
                              <CustomTypography sx={{ fontSize: "10px", fontWeight: "bold", whiteSpace: "nowrap" }}>
                                {row.productName}
                              </CustomTypography>
                            )}
                          </td>

                          {/* Type */}
                          <td style={{ padding: "7px 6px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            <CustomSelect
                              value={row.type}
                              onChange={(val) => handleRowFieldChange(row.id, "type", val)}
                              options={typeOpts.map((v) => ({ value: v, label: v }))}
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
                                options={["BS", "BS1", "BS2", "BS3", "BS4", "SS", "PMS"].map((v) => ({
                                  value: v,
                                  label: v,
                                }))}
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
                              options={(isLoadingType ? LOADING_CLASS_OPTIONS[row.type] || [] : []).map(
                                (v) => ({ value: v, label: v })
                              )}
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
                              options={(isLoadingType ? LOADING_REASON_OPTIONS[row.type] || [] : []).map(
                                (v) => ({ value: v, label: v })
                              )}
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
              </CustomBox>

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
            </CustomBox>
          )}

          {/* UW REMARKS - last field before Submit (non-referral decisions) */}
          {dialogDecision !== "REFERRAL" && (
            <CustomBox sx={{ mt: 3 }}>
              <CustomTypography
                component="span"
                sx={{
                  display: "block",
                  marginBottom: "5px",
                  color: "#444",
                  fontSize: "11px",
                }}
              >
                UW Remarks
              </CustomTypography>
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
              <CustomTypography
                sx={{
                  display: "block",
                  textAlign: "right",
                  fontSize: "10px",
                  color: "#938883",
                  mt: 0.5,
                }}
              >
                {dialogRemarks.length}/10000
              </CustomTypography>
            </CustomBox>
          )}

          {/* BACK (only when opened from UW Guidelines) + SUBMIT BUTTONS */}
          <CustomBox sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 4 }}>
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
              Submit
            </CustomButton>
          </CustomBox>
          </>
          )}
        </CustomBox>
      </CustomDialog>

      {/* Read-only view of the submitted decision */}
      <GuwDecisionDetailsDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        submittedDecision={submittedDecision}
      />

      {/* Success popup: validation passed, shows the selected decision */}
      <CustomDialog
        open={successOpen}
        onClose={handleSuccessClose}
        title="Decision validated successfully"
        maxWidth="xs"
        fullWidth
        showCloseIcon={false}
      >
        <CustomBox sx={{ p: 1 }}>
          <CustomTypography
            component="p"
            sx={{ color: "#302a27", fontSize: "13px", fontWeight: 700, mb: 2 }}
          >
            Selected decision: {decisionLabel(caseDecision)}
          </CustomTypography>
          <CustomBox sx={{ display: "flex", justifyContent: "flex-end" }}>
            <CustomButton
              variant="contained"
              onClick={handleSuccessClose}
              sx={{
                background: "#e45f14",
                color: "#fff",
                fontWeight: "bold",
                px: 4,
                "&:hover": { background: "#c94f0d" },
              }}
            >
              OK
            </CustomButton>
          </CustomBox>
        </CustomBox>
      </CustomDialog>

      {/* Snackbar notification */}
      <CustomSnackbar
        open={snackbarOpen}
        message={snackbarMessage}
        severity={snackbarSeverity}
        onClose={() => setSnackbarOpen(false)}
      />
    </CustomBox>
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
        <CustomBox sx={{ p: 1 }}>
          <CustomTypography component="p" sx={{ color: "#7b716c", fontSize: "12px", fontWeight: 600 }}>
            No Case UW Decision has been submitted yet.
          </CustomTypography>
        </CustomBox>
      )}
      {submittedDecision && (
        <CustomBox sx={{ p: 1 }}>
          <CustomBox
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
              gap: "6px 10px",
            }}
          >
            {submittedDecision.fields.map((field) => (
              <CustomBox key={field.label} sx={field.wide ? { gridColumn: { xs: "auto", sm: "span 2" } } : undefined}>
                <CustomTypography
                  component="span"
                  sx={{ display: "block", marginBottom: "3px", color: "#7b716c", fontSize: "11px", fontWeight: 600 }}
                >
                  {field.label}
                </CustomTypography>
                <CustomTypography
                  component="span"
                  sx={{ display: "block", color: "#302a27", fontSize: "12px", fontWeight: 700, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {field.value || "-"}
                </CustomTypography>
              </CustomBox>
            ))}
          </CustomBox>

          {/* Reconsideration Details card (DC / POSTP / REJ) */}
          {submittedDecision.reconsiderationFields.length > 0 && (
            <CustomBox
              sx={{
                p: 2,
                mt: 3,
                border: "1px solid #eadfd9",
                borderRadius: "10px",
                background: "#fcfaf9",
              }}
            >
              <CustomBox
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(4, 1fr)" },
                  gap: "6px 10px",
                }}
              >
                {submittedDecision.reconsiderationFields.map((field) => (
                  <CustomBox key={field.label} sx={field.wide ? { gridColumn: { xs: "auto", sm: "span 3" } } : undefined}>
                    <CustomTypography
                      component="span"
                      sx={{ display: "block", marginBottom: "3px", color: "#444", fontSize: "11px" }}
                    >
                      {field.label}
                    </CustomTypography>
                    <CustomTypography
                      component="span"
                      sx={{ display: "block", color: "#302a27", fontSize: "12px", fontWeight: 700, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                    >
                      {field.value || "-"}
                    </CustomTypography>
                  </CustomBox>
                ))}
              </CustomBox>
            </CustomBox>
          )}

          {submittedDecision.reinsurerRows.length > 0 && (
            <CustomBox sx={{ mt: 3 }}>
              <CustomTypography component="h3" sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mb: 1.5 }}>
                Reinsurer Details
              </CustomTypography>
              <CustomBox sx={{ border: "1px solid #eadfd9", borderRadius: "10px", overflowX: "auto" }}>
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
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9" }}>{row.uwName || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CustomBox>

              <CustomTypography component="h3" sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mt: 2, mb: 1.5 }}>
                Assign Documents
              </CustomTypography>
              <CustomBox sx={{ border: "1px solid #eadfd9", borderRadius: "10px", overflowX: "auto" }}>
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
              </CustomBox>
            </CustomBox>
          )}

          {submittedDecision.counterOfferRows.length > 0 && (
            <CustomBox sx={{ mt: 3 }}>
              <CustomTypography component="h3" sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mb: 1.5 }}>
                Decision Details
              </CustomTypography>
              <CustomBox sx={{ border: "1px solid #eadfd9", borderRadius: "10px", overflowX: "auto" }}>
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
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", fontWeight: 700 }}>{row.productName || "-"}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.type || "-"}</td>
                        {submittedDecision.showBstdColumn && (
                          <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.bstdCode || "-"}</td>
                        )}
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.sa || "-"}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.changedSa || "-"}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.pt || "-"}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.changedPt || "-"}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.loadingClass || "-"}</td>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9" }}>{row.loadingReason || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CustomBox>
            </CustomBox>
          )}

          {/* UW Remarks - last field, same as the decision dialog */}
          <CustomBox sx={{ mt: 3 }}>
            <CustomTypography
              component="span"
              sx={{ display: "block", marginBottom: "3px", color: "#444", fontSize: "11px" }}
            >
              {submittedDecision.reinsurerRows.length > 0 ? "Remarks" : "UW Remarks"}
            </CustomTypography>
            <CustomTypography
              component="span"
              sx={{ display: "block", color: "#302a27", fontSize: "12px", fontWeight: 700, whiteSpace: "pre-wrap", wordBreak: "break-word" }}
            >
              {submittedDecision.remarks || "-"}
            </CustomTypography>
          </CustomBox>

          {/* Snapshots saved before the validation API keep their static guidelines; new ones show the saved rows */}
          {(submittedDecision.validationRows?.length ?? 0) > 0 || submittedDecision.guidelines.length > 0 ? (
            <CustomBox sx={{ mt: 3 }}>
              <CustomTypography component="h3" sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mb: 1.5 }}>
                UW Guidelines
              </CustomTypography>
              <CustomBox sx={{ border: "1px solid #eadfd9", borderRadius: "10px", overflowX: "auto" }}>
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
              </CustomBox>
            </CustomBox>
          ) : null}
        </CustomBox>
      )}
    </CustomDialog>
  );
}
