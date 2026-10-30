import { useState, useEffect } from "react";
import {
  CustomBox,
  CustomButton,
  CustomDialog,
  CustomMultiSelect,
  CustomRadioGroup,
  CustomSelect,
  CustomTextField,
  CustomTypography,
  CustomSnackbar,
} from "@insurance-poc/ui";
import { groupPaths, replaceUrl } from "@insurance-poc/routes";
import eyeIconSrc from "../../assets/eye.svg";
import type { GuwSubmittedDecision } from "../../services/guwService";

export interface GuwUwPanelProps {
  breOverallDecision?: string;
  breOverallRemarks?: string;
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
  guidelines: GuidelineRow[];
}

const DECISION_OPTIONS = [
  { value: "STD", label: "Standard" },
  { value: "BOR_STD", label: "Borderline Standard" },
  { value: "REJ", label: "Reject" },
  { value: "DC", label: "Decline" },
  { value: "POSTP", label: "Postpone" },
  { value: "CO", label: "Counter Offer" },
  { value: "EP", label: "Extra Premium" },
];

// Decisions raised from the action buttons below the Case UW Decision dropdown
const ACTION_DECISION_OPTIONS = [
  { value: "REFERRAL", label: "Raise Referral" },
  { value: "HOLD", label: "Hold" },
  { value: "AMR", label: "Raise Requirement" },
  { value: "APPROVER", label: "Counter Sign" },
];

const ALL_DECISION_OPTIONS = [...DECISION_OPTIONS, ...ACTION_DECISION_OPTIONS];

const REFERRAL_TYPE_OPTIONS = [
  { value: "REF_IT", label: "IT" },
  { value: "REF_REINS", label: "Reinsurer" },
  { value: "REF_CMO", label: "HO CMO" },
  { value: "REF_CMO_LOCAL", label: "CMO" },
  { value: "REF_RISK", label: "Risk" },
  { value: "REF_ACU", label: "Accuity" },
  { value: "REF_CUW_CLM", label: "CUW Claim" },
];

const REFERRAL_REASON_OPTIONS: Record<string, string[]> = {
  REF_IT: ["System issue", "Data correction", "Other"],
  REF_REINS: ["High sum assured", "Medical risk", "Other"],
  REF_CMO: ["Medical review", "Specialist opinion", "Other"],
  REF_CMO_LOCAL: ["Medical review", "Specialist opinion", "Other"],
  REF_RISK: ["Risk assessment", "Policy exception", "Other"],
  REF_ACU: ["Screening review", "Match review", "Other"],
  REF_CUW_CLM: ["Claim history", "Investigation", "Other"],
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

export function GuwUwPanel({
  breOverallDecision,
  breOverallRemarks,
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
  const [dialogDecision, setDialogDecision] = useState<string>("");
  const [dialogRemarks, setDialogRemarks] = useState<string>("");

  // Dialog multi-step & guidelines states
  const [dialogStep, setDialogStep] = useState<number>(1);
  const [guidelines, setGuidelines] = useState<GuidelineRow[]>([]);

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
  const [referralTarget, setReferralTarget] = useState<string>("");
  const [smokerFlag, setSmokerFlag] = useState<string>("");
  const [subStdReason, setSubStdReason] = useState<string[]>([]);
  const [postponementPeriod, setPostponementPeriod] = useState<string>("");
  const [holdReason, setHoldReason] = useState<string>("");

  // Approver states
  const [approverPurpose, setApproverPurpose] = useState<"counterSign" | "opinion">("counterSign");
  const [approverTarget, setApproverTarget] = useState<string>(""); // HOD or Sr UW
  const [approverReason, setApproverReason] = useState<string>("");
  const [approverFirstDecision, setApproverFirstDecision] = useState<string>("");
  const [approverFirstDecisionReason, setApproverFirstDecisionReason] = useState<string>("");
  const [approverFirstPostponementPeriod, setApproverFirstPostponementPeriod] = useState<string>("");

  // Referral states
  const [referralReason, setReferralReason] = useState<string>("");
  const [referralFirstDecision, setReferralFirstDecision] = useState<string>("");
  const [referralFirstReason, setReferralFirstReason] = useState<string>("");
  const [referralPostponementPeriod, setReferralPostponementPeriod] = useState<string>("");

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

  const effectiveDecision =
    dialogDecision === "REFERRAL" && referralTarget ? referralTarget : dialogDecision;

  // Initialize Counter Offer rows when dialog decision turns to CO, BOR_STD, or EP
  useEffect(() => {
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

  const isActionDecision = ACTION_DECISION_OPTIONS.some((o) => o.value === dialogDecision);

  // Keep a previously submitted action decision visible in the dropdown (not selectable)
  const mainSelectOptions =
    selectedDecision && !DECISION_OPTIONS.some((o) => o.value === selectedDecision)
      ? [...DECISION_OPTIONS, { value: selectedDecision, label: decisionLabel(selectedDecision), disabled: true }]
      : DECISION_OPTIONS;

  const buildSubmittedDecision = (): SubmittedDecision => {
    const fields: SubmittedField[] = [
      { label: "Case UW Decision", value: decisionLabel(dialogDecision) },
    ];
    const add = (label: string, value: string, wide?: boolean) => {
      fields.push({ label, value, wide });
    };

    if (dialogDecision === "REFERRAL") {
      add("Refer To", REFERRAL_TYPE_OPTIONS.find((o) => o.value === referralTarget)?.label ?? referralTarget);
    }
    if (effectiveDecision) {
      add("Decision Code", effectiveDecision);
    }
    if (effectiveDecision && !["CO", "EP"].includes(effectiveDecision)) {
      add("Smoker Flag", smokerFlag);
    }
    if (
      effectiveDecision &&
      !["STD", "HOLD", "APPROVER", "REFERRAL", "AMR"].includes(effectiveDecision) &&
      !effectiveDecision.startsWith("REF_")
    ) {
      add("Reasons", subStdReason.join(", "), true);
    }
    if (effectiveDecision === "POSTP") add("Postponement Period", postponementPeriod);
    if (effectiveDecision === "HOLD") add("Hold Reasons", holdReason);
    if (REFERRAL_REASON_OPTIONS[effectiveDecision]) add("Referral Reason", referralReason);

    if (["REF_REINS", "REF_CMO", "REF_CMO_LOCAL", "REF_RISK", "REF_ACU"].includes(effectiveDecision)) {
      add("1st UW Decision", decisionLabel(referralFirstDecision));
      if (referralFirstDecision) add("1st UW Decision Code", referralFirstDecision);
      if (referralFirstDecision) add(referralFirstDecision === "POSTP" ? "Postpone Reason" : "1st UW Decision Reason", referralFirstReason);
      if (referralFirstDecision === "POSTP") add("Postponement Period", referralPostponementPeriod);
    }

    if (effectiveDecision === "APPROVER") {
      add("Referral purpose", approverPurpose === "opinion" ? "Opinion" : "Counter Sign", true);
      add("Refer To", approverTarget);
      add(approverTarget === "Sr UW" ? "Sr UW Reasons" : "HOD Reasons", approverReason);
      add("1st UW Decision", decisionLabel(approverFirstDecision));
      if (approverFirstDecision) add("1st UW Decision Code", approverFirstDecision);
      if (approverFirstDecision) add(approverFirstDecision === "POSTP" ? "Postpone Reason" : "1st UW Decision Reason", approverFirstDecisionReason);
      if (approverFirstDecision === "POSTP") add("Postponement Period", approverFirstPostponementPeriod);
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

    return {
      fields,
      reconsiderationFields,
      remarks: dialogRemarks,
      counterOfferRows: counterOfferRows.map((r) => ({ ...r })),
      showBstdColumn: isBstdColumnVisible,
      reinsurerRows:
        effectiveDecision === "REF_REINS"
          ? reinsurerRows.map((r) => ({ code: r.code, systemName: r.systemName, uwName: r.uwName }))
          : [],
      documentRows:
        effectiveDecision === "REF_REINS"
          ? REFERRAL_DOCUMENTS.map((name, rowIndex) => ({
              name,
              assigned: reinsurerRows.map((_, colIndex) => reinsurerDocChecks[rowIndex][colIndex]),
            }))
          : [],
      guidelines: guidelines.map((g) => ({ ...g })),
    };
  };

  const openDecisionDialog = (code: string) => {
    setDialogDecision(code);
    setDialogRemarks(remarks);
    setDialogStep(1);
    setGuidelines(INITIAL_GUIDELINES.map((g) => ({ ...g })));
    setDialogOpen(true);
  };

  const handleMainSelectChange = (value: string) => {
    if (!value) return;
    if (value === "CLEAR") {
      setSelectedDecision("");
      setSubmittedDecision(null);
      setRemarks("");
      onDecisionSubmit("", "");
      return;
    }
    openDecisionDialog(value);
  };

  const handleDialogSubmit = () => {
    // Step 1 Validation
    const isReinsurerReferral = dialogDecision === "REFERRAL" && referralTarget === "REF_REINS";
    if (!isReinsurerReferral && !dialogRemarks.trim()) {
      notify("Please enter UW Remarks", "error");
      return;
    }

    if (effectiveDecision === "APPROVER") {
      if (!approverTarget) {
        notify("Please select Refer To", "error");
        return;
      }
      if (!approverReason) {
        notify(`Please select ${approverTarget === "Sr UW" ? "Sr UW" : "HOD"} Reasons`, "error");
        return;
      }
      if (!approverFirstDecision) {
        notify("Please select 1st UW Decision", "error");
        return;
      }
    }

    if (dialogDecision === "REFERRAL" && !referralTarget) {
      notify("Please select a referral type", "error");
      return;
    }

    // Advance to Step 2 (Guidelines checklist)
    setDialogStep(2);
  };

  const handleGuidelinesConfirm = () => {
    const incomplete = guidelines.some(
      (row) => Boolean(row.justificationReason) !== Boolean(row.justificationRemark.trim())
    );

    if (incomplete) {
      notify("Please complete both justification fields for each applicable guideline", "error");
      return;
    }

    // Success - Final commit
    setSubmittedDecision(buildSubmittedDecision());
    setSelectedDecision(dialogDecision);
    setRemarks(dialogRemarks);
    onDecisionSubmit(dialogDecision, dialogRemarks);
    setDialogOpen(false);
    notify("Decision submitted successfully", "success");

    // Redirect to inbox after 700ms delay
    setTimeout(() => {
      replaceUrl(groupPaths.inbox);
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
        {/* Read-only BRE overall */}
        <CustomBox
          sx={{
            display: "grid",
            gridTemplateColumns: "25% 1fr",
            background: "#fcfaf9",
            border: "1px solid #eadfd9",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <CustomBox sx={{ padding: "5px 12px", minWidth: 0 }}>
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
              BRE Overall Decision
            </CustomTypography>
            <CustomTypography
              component="span"
              sx={{
                color: "#302a27",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              {breOverallDecision || "-"}
            </CustomTypography>
          </CustomBox>

          <CustomBox
            sx={{
              padding: "5px 12px",
              borderLeft: "1px solid #eadfd9",
              minWidth: 0,
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
              BRE Overall Remarks
            </CustomTypography>
            <CustomTypography
              component="span"
              sx={{
                color: "#302a27",
                fontSize: "13px",
                fontWeight: 800,
              }}
            >
              {breOverallRemarks || "-"}
            </CustomTypography>
          </CustomBox>
        </CustomBox>

        {/* Case UW Decision Dropdown */}
        <CustomBox component="label" sx={{ display: "block", pr: "70px" }}>
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
                  borderColor: "#e45f14 !important",
                  borderWidth: "2px !important",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#e45f14 !important",
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
              />
            </CustomBox>
            {submittedDecision && (
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

        {/* Action buttons + Submit */}
        <CustomBox sx={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "flex-end", gap: "8px", pr: "70px" }}>
          {ACTION_DECISION_OPTIONS.map((opt) => (
            <CustomButton
              key={opt.value}
              variant="outlined"
              onClick={() => openDecisionDialog(opt.value)}
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
      >
        <CustomBox sx={{ p: 1 }}>
          {dialogStep === 2 ? (
            /* STEP 2: UW GUIDELINES VIEW */
            <CustomBox>
              <CustomTypography
                component="p"
                sx={{
                  color: "#302a27",
                  fontSize: "12px",
                  lineHeight: 1.5,
                  mb: 2,
                }}
              >
                Select a justification reason to enable its remarks field. Remarks are mandatory for every selected reason.
              </CustomTypography>

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
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left", width: "220px" }}>Justification Reason</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9", textAlign: "left", width: "240px" }}>Justification Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guidelines.map((row, idx) => {
                      const reasons = [
                        "",
                        "Requirement waived",
                        "Document pending",
                        "Financial assessment",
                        "Medical assessment",
                        "Counter signing",
                        "Other",
                      ];
                      const isEnabled = Boolean(row.justificationReason);

                      return (
                        <tr key={idx}>
                          <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.reason}</td>
                          <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.remark}</td>
                          <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.systemAction || "—"}</td>
                          <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>
                            <CustomSelect
                              value={row.justificationReason}
                              onChange={(val) => {
                                setGuidelines((prev) =>
                                  prev.map((r, i) =>
                                    i === idx
                                      ? {
                                          ...r,
                                          justificationReason: val,
                                          justificationRemark: val ? r.justificationRemark : "",
                                        }
                                      : r
                                  )
                                );
                              }}
                              options={reasons.map((r) => ({ value: r, label: r || "Select reason" }))}
                              placeholder="Select reason"
                              fullWidth
                            />
                          </td>
                          <td style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9" }}>
                            <CustomTextField
                              value={row.justificationRemark}
                              onChange={(e) => {
                                setGuidelines((prev) =>
                                  prev.map((r, i) =>
                                    i === idx ? { ...r, justificationRemark: e.target.value } : r
                                  )
                                );
                              }}
                              placeholder={isEnabled ? "Add remarks (required)" : "Select a reason first"}
                              disabled={!isEnabled}
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
                  sx={{
                    background: "#e45f14",
                    color: "#fff",
                    fontWeight: "bold",
                    px: 4,
                    "&:hover": { background: "#c94f0d" },
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
            {/* Dialog Decision select - hidden for Reinsurer Referral and for Raise Referral / Hold / Raise Requirement */}
            {effectiveDecision !== "REF_REINS" && !["REFERRAL", "HOLD", "AMR"].includes(dialogDecision) && (
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
                <CustomSelect
                  value={dialogDecision}
                  onChange={(val) => setDialogDecision(val)}
                  options={isActionDecision ? ACTION_DECISION_OPTIONS : DECISION_OPTIONS}
                  disabled={isActionDecision}
                  placeholder="Select"
                  fullWidth
                />
              </CustomBox>
            )}

            {/* REFER TO - REFERRAL TYPE */}
            {dialogDecision === "REFERRAL" && (
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
                  value={referralTarget}
                  onChange={(val) => setReferralTarget(val)}
                  options={REFERRAL_TYPE_OPTIONS}
                  placeholder="Select referral type"
                  fullWidth
                />
              </CustomBox>
            )}

            {/* DECISION CODE - terminal decisions */}
            {["STD", "BOR_STD", "REJ", "DC", "POSTP", "CO", "EP", "REF_IT", "REF_REINS", "REF_CMO", "REF_CMO_LOCAL", "REF_RISK", "REF_ACU", "REF_CUW_CLM"].includes(effectiveDecision) && (
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

            {/* SMOKER FLAG */}
            {effectiveDecision && !["CO", "EP"].includes(effectiveDecision) && (
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
                  options={[
                    { value: "Smoker", label: "Smoker" },
                    { value: "Non Smoker", label: "Non Smoker" },
                  ]}
                  placeholder="Select"
                  fullWidth
                />
              </CustomBox>
            )}

            {/* REASONS - SUBSTANDARD & REJECT */}
            {effectiveDecision && !["STD", "HOLD", "APPROVER", "REFERRAL", "AMR"].includes(effectiveDecision) && !effectiveDecision.startsWith("REF_") && (
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

            {/* REFERRAL REASONS (IT, CMO, etc.) */}
            {REFERRAL_REASON_OPTIONS[effectiveDecision] && (
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

            {/* FIRST UW DECISION for Reinsurer, HO CMO, CMO, Risk, Accuity */}
            {["REF_REINS", "REF_CMO", "REF_CMO_LOCAL", "REF_RISK", "REF_ACU"].includes(effectiveDecision) && (
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
                    1st UW Decision
                  </CustomTypography>
                  <CustomSelect
                    value={referralFirstDecision}
                    onChange={(val) => {
                      setReferralFirstDecision(val);
                      setReferralFirstReason("");
                      setReferralPostponementPeriod("");
                    }}
                    options={[
                      { value: "STD", label: "Standard" },
                      { value: "BOR_STD", label: "Borderline Standard" },
                      { value: "REJ", label: "Reject" },
                      { value: "DC", label: "Decline" },
                      { value: "POSTP", label: "Postpone" },
                      { value: "CO", label: "Counter Offer" },
                      { value: "EP", label: "Extra Premium" },
                    ]}
                    placeholder="Select"
                    fullWidth
                  />
                </CustomBox>

                {referralFirstDecision && (
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
                    <CustomTextField value={referralFirstDecision} disabled fullWidth />
                  </CustomBox>
                )}

                {["REJ", "BOR_STD", "DC", "CO"].includes(referralFirstDecision) && (
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
                      1st UW Decision Reason
                    </CustomTypography>
                    <CustomSelect
                      value={referralFirstReason}
                      onChange={(val) => setReferralFirstReason(val)}
                      options={[
                        { value: "Medical", label: "Medical" },
                        { value: "Financial", label: "Financial" },
                        { value: "Non-medical", label: "Non-medical" },
                        { value: "Other", label: "Other" },
                      ]}
                      placeholder="Select"
                      fullWidth
                    />
                  </CustomBox>
                )}

                {referralFirstDecision === "POSTP" && (
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
                        Postpone Reason
                      </CustomTypography>
                      <CustomSelect
                        value={referralFirstReason}
                        onChange={(val) => setReferralFirstReason(val)}
                        options={[
                          { value: "Medical", label: "Medical" },
                          { value: "Financial", label: "Financial" },
                          { value: "Non-medical", label: "Non-medical" },
                          { value: "Other", label: "Other" },
                        ]}
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
                        Postponement Period
                      </CustomTypography>
                      <CustomSelect
                        value={referralPostponementPeriod}
                        onChange={(val) => setReferralPostponementPeriod(val)}
                        options={[
                          { value: "3 months", label: "3 months" },
                          { value: "6 months", label: "6 months" },
                          { value: "12 months", label: "12 months" },
                        ]}
                        placeholder="Select"
                        fullWidth
                      />
                    </CustomBox>
                  </>
                )}
              </>
            )}

            {/* APPROVER FIELDS (FOR REFER TO APPROVER) */}
            {effectiveDecision === "APPROVER" && (
              <>
                <CustomBox sx={{ gridColumn: "span 2" }}>
                  <CustomRadioGroup
                    label="Referral purpose"
                    row
                    value={approverPurpose}
                    onChange={(e) => {
                      setApproverPurpose(e.target.value as "counterSign" | "opinion");
                      setApproverReason("");
                    }}
                    options={[
                      { label: "Counter Sign", value: "counterSign" },
                      { label: "Opinion", value: "opinion" },
                    ]}
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
                    onChange={(val) => {
                      setApproverTarget(val);
                      setApproverReason("");
                      setApproverFirstDecision("");
                    }}
                    options={[
                      { value: "HOD", label: "HOD" },
                      { value: "Sr UW", label: "Sr UW" },
                    ]}
                    placeholder="Select HOD or Sr UW"
                    fullWidth
                  />
                </CustomBox>

                {approverTarget && (
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
                        {approverTarget === "Sr UW" ? "Sr UW Reasons" : "HOD Reasons"}
                      </CustomTypography>
                      <CustomSelect
                        value={approverReason}
                        onChange={(val) => setApproverReason(val)}
                        options={(approverPurpose === "opinion"
                          ? ["Medical opinion", "Financial opinion", "Other"]
                          : ["Counter signing", "Medical assessment", "Financial assessment", "Other"]
                        ).map((v) => ({ value: v, label: v }))}
                        placeholder={`Select ${approverTarget === "Sr UW" ? "Sr UW" : "HOD"} Reasons`}
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
                        1st UW Decision
                      </CustomTypography>
                      <CustomSelect
                        value={approverFirstDecision}
                        onChange={(val) => {
                          setApproverFirstDecision(val);
                          setApproverFirstDecisionReason("");
                          setApproverFirstPostponementPeriod("");
                        }}
                        options={[
                          { value: "STD", label: "Standard" },
                          { value: "BOR_STD", label: "Borderline Standard" },
                          { value: "REJ", label: "Reject" },
                          { value: "DC", label: "Decline" },
                          { value: "POSTP", label: "Postpone" },
                          { value: "CO", label: "Counter Offer" },
                          { value: "EP", label: "Extra Premium" },
                        ]}
                        placeholder="Select"
                        fullWidth
                      />
                    </CustomBox>
                  </>
                )}

                {approverFirstDecision && (
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
                    <CustomTextField value={approverFirstDecision} disabled fullWidth />
                  </CustomBox>
                )}

                {["REJ", "BOR_STD", "DC", "CO"].includes(approverFirstDecision) && (
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
                      1st UW Decision Reason
                    </CustomTypography>
                    <CustomSelect
                      value={approverFirstDecisionReason}
                      onChange={(val) => setApproverFirstDecisionReason(val)}
                      options={[
                        { value: "Medical", label: "Medical" },
                        { value: "Financial", label: "Financial" },
                        { value: "Non-medical", label: "Non-medical" },
                        { value: "Other", label: "Other" },
                      ]}
                      placeholder="Select"
                      fullWidth
                    />
                  </CustomBox>
                )}

                {approverFirstDecision === "POSTP" && (
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
                        Postpone Reason
                      </CustomTypography>
                      <CustomSelect
                        value={approverFirstDecisionReason}
                        onChange={(val) => setApproverFirstDecisionReason(val)}
                        options={[
                          { value: "Medical", label: "Medical" },
                          { value: "Financial", label: "Financial" },
                          { value: "Non-medical", label: "Non-medical" },
                          { value: "Other", label: "Other" },
                        ]}
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
                        Postponement Period
                      </CustomTypography>
                      <CustomSelect
                        value={approverFirstPostponementPeriod}
                        onChange={(val) => setApproverFirstPostponementPeriod(val)}
                        options={[
                          { value: "3 months", label: "3 months" },
                          { value: "6 months", label: "6 months" },
                          { value: "12 months", label: "12 months" },
                        ]}
                        placeholder="Select"
                        fullWidth
                      />
                    </CustomBox>
                  </>
                )}
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

          {/* REINSURER DETAILS SECTION (FOR REF_REINS REFERRAL) */}
          {effectiveDecision === "REF_REINS" && (
            <CustomBox
              sx={{
                p: 2,
                mt: 2,
                borderTop: "1px solid #eadfd9",
                pt: "14px",
              }}
            >
              <CustomBox
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1.2fr 1.8fr" },
                  gap: "24px",
                }}
              >
                {/* Reinsurer selects */}
                <CustomBox
                  sx={{
                    background: "#f5f5f5",
                    p: 2,
                    borderRadius: "12px",
                  }}
                >
                  <CustomTypography
                    component="h3"
                    sx={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#302a27",
                      mb: 1.5,
                    }}
                  >
                    Reinsurer Details
                  </CustomTypography>

                  {/* Table mimicking prototype table */}
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
                          <th style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800 }}>Code</th>
                          <th style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800 }}>Reinsurer Name - System</th>
                          <th style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800 }}>Reinsurer Name - UW</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reinsurerRows.map((row, index) => {
                          const options = REINSURER_UW_OPTIONS.filter(
                            (name) => name.toLowerCase() !== row.systemName.toLowerCase()
                          );
                          return (
                            <tr key={row.code}>
                              <td style={{ padding: "8px 12px", border: "1px solid #ded9d6" }}>{row.code}</td>
                              <td style={{ padding: "8px 12px", border: "1px solid #ded9d6" }}>{row.systemName}</td>
                              <td style={{ padding: "8px 12px", border: "1px solid #ded9d6" }}>
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

                {/* Document assignment */}
                <CustomBox
                  sx={{
                    border: "1px solid #eadfd9",
                    borderRadius: "12px",
                    p: 2,
                    background: "#fff",
                  }}
                >
                  <CustomTypography
                    component="div"
                    sx={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "#5b261c",
                      mb: 1.5,
                    }}
                  >
                    Assign Documents
                  </CustomTypography>

                  <CustomBox sx={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                      <thead>
                        <tr style={{ background: "#ffead7", color: "#5b261c" }}>
                          <th style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "left", fontWeight: 800 }}>Document name</th>
                          {reinsurerRows.map((row, index) => (
                            <th
                              key={row.code}
                              style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "center", fontWeight: 800 }}
                            >
                              <CustomTypography sx={{ fontSize: "11px", fontWeight: "bold", display: "block" }}>
                                {getEffectiveReinsurerName(index)}
                              </CustomTypography>
                              <CustomButton
                                onClick={() => handleSelectAllDocs(index)}
                                variant="text"
                                sx={{ fontSize: "9px", p: 0, textTransform: "none", color: "#e45f14" }}
                              >
                                (Select All)
                              </CustomButton>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {REFERRAL_DOCUMENTS.map((docName, rowIndex) => (
                          <tr key={docName}>
                            <td style={{ padding: "8px 12px", border: "1px solid #ded9d6" }}>{docName}</td>
                            {reinsurerRows.map((_, colIndex) => (
                              <td
                                key={colIndex}
                                style={{ padding: "8px 12px", border: "1px solid #ded9d6", textAlign: "center" }}
                              >
                                <input
                                  type="checkbox"
                                  checked={reinsurerDocChecks[rowIndex][colIndex]}
                                  onChange={(e) =>
                                    handleDocCheckChange(rowIndex, colIndex, e.target.checked)
                                  }
                                  style={{ cursor: "pointer", transform: "scale(1.1)" }}
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

              {/* Remarks input for reinsurer */}
              <CustomBox sx={{ mt: 3, display: "block" }}>
                <CustomTypography
                  component="span"
                  sx={{
                    display: "block",
                    marginBottom: "5px",
                    color: "#444",
                    fontSize: "11px",
                  }}
                >
                  Remarks
                </CustomTypography>
                <CustomTextField
                  value={dialogRemarks}
                  onChange={(e) => setDialogRemarks(e.target.value)}
                  placeholder="Add remarks..."
                  multiline
                  rows={4}
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root.MuiInputBase-multiline": {
                      height: "auto",
                      minHeight: "72px",
                      padding: "8px 14px",
                    },
                  }}
                />
              </CustomBox>

              {/* Generate Referral Sheet trigger */}
              <CustomBox sx={{ display: "flex", gap: "22px", mt: "18px" }}>
                <CustomButton
                  variant="outlined"
                  onClick={() => alert("Referral sheet generated successfully")}
                  sx={{
                    borderColor: "#aa262a",
                    color: "#aa262a",
                    px: 4,
                    py: 1.5,
                    borderRadius: "28px",
                    fontWeight: "bold",
                    textTransform: "none",
                  }}
                >
                  Generate Referral Sheet
                </CustomButton>
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

              {effectiveDecision === "EP" && (
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

          {/* UW REMARKS - last field before Submit (Reinsurer Referral has its own Remarks above) */}
          {effectiveDecision !== "REF_REINS" && (
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

          {/* SUBMIT BUTTON */}
          <CustomBox sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
            <CustomButton
              variant="contained"
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
      <CustomDialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        title="Case UW Decision Details"
        maxWidth="lg"
        fullWidth
      >
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

            <CustomBox sx={{ mt: 3 }}>
              <CustomTypography component="h3" sx={{ color: "#5b261c", fontSize: "14px", fontWeight: 800, mb: 1.5 }}>
                UW Guidelines
              </CustomTypography>
              <CustomBox sx={{ border: "1px solid #eadfd9", borderRadius: "10px", overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                  <thead>
                    <tr style={{ background: "#ffead7", color: "#5b261c", fontWeight: 800 }}>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Reason</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Remark</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>System Action</th>
                      <th style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Justification Reason</th>
                      <th style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9", textAlign: "left" }}>Justification Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submittedDecision.guidelines.map((row) => (
                      <tr key={row.reason}>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.reason}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.remark}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.systemAction || "—"}</td>
                        <td style={{ padding: "8px 10px", borderRight: "1px solid #eadfd9", borderBottom: "1px solid #eadfd9" }}>{row.justificationReason || "—"}</td>
                        <td style={{ padding: "8px 10px", borderBottom: "1px solid #eadfd9" }}>{row.justificationRemark || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CustomBox>
            </CustomBox>
          </CustomBox>
        )}
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
