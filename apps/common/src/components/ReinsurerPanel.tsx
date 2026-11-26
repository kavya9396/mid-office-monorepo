import { useState } from "react";
import {
  CustomBox,
  CustomButton,
  CustomCheckbox,
  CustomDialog,
  CustomSelect,
  CustomTable,
  CustomTextField,
  CustomTypography,
  type Column,
} from "@insurance-poc/ui";
import type { BannerLine } from "./Header/ApplicantBanner";

/* ------------------------------------------------------------------ */
/* ReinsurerPanel — prototype: reinsurer-screen-prototype.html          */
/* Reinsurer Details table, Assign Documents (read-only), Remarks and   */
/* the Referral Sheet / Back TO CUW / Save & close actions.             */
/* ------------------------------------------------------------------ */

export type ReinsurerOption = { label: string; value: string };

/** One product row of the Reinsurer Details table. */
export type ReinsurerDetailRow = {
  id: string;
  productCode: string;
  reinsurerNameSystem: string;
  reinsurerNameUw: string;
};

/** One row of Assign Documents; `assignedReinsurers` holds the `reinsurerNameSystem` values it is assigned to. */
export type ReinsurerDocumentRow = {
  id: string;
  documentName: string;
  assignedReinsurers: string[];
};

/** What the reinsurer enters for one product row. */
export type ReinsurerDecisionValues = {
  productCode: string;
  remarks: string;
  decision: string;
  decisionId: string;
  decisionMatch: string;
};

export type BackToCuwValues = { reason: string; remark: string };

/** Domain record of the Reinsurer DRS (mapper output). */
export type ReinsurerDrsRecord = {
  applicationNo: string;
  applicantName: string;
  /** Pre-composed banner text lines shown under the applicant name. */
  bannerLines: BannerLine[];
  reinsurerRows: ReinsurerDetailRow[];
  documents: ReinsurerDocumentRow[];
  remarks: string;
};

export const REINSURER_DECISION_OPTIONS: ReinsurerOption[] = [
  { label: "Standard", value: "Standard" },
  { label: "Non Standard", value: "Non Standard" },
  { label: "Decline", value: "Decline" },
  { label: "Postpone", value: "Postpone" },
];

export const REINSURER_MATCH_OPTIONS: ReinsurerOption[] = [
  { label: "Yes", value: "Yes" },
  { label: "No", value: "No" },
];

export const BACK_TO_UW_REASON_OPTIONS: ReinsurerOption[] = [
  { label: "Additional review required", value: "Additional review required" },
  { label: "Clarification required", value: "Clarification required" },
  { label: "Additional documents required", value: "Additional documents required" },
  { label: "Other", value: "Other" },
];

type DecisionFields = Omit<ReinsurerDecisionValues, "productCode">;

type DetailTableRow = ReinsurerDetailRow & DecisionFields;

type AssignTableRow = Record<string, string | boolean>;

export type ReinsurerPanelProps = {
  rows: ReinsurerDetailRow[];
  documents: ReinsurerDocumentRow[];
  /** Read-only remarks text. */
  remarks?: string;
  /** Label of the "back to underwriter" action and dialog (e.g. "Back TO CUW"). */
  backToLabel?: string;
  decisionOptions?: ReinsurerOption[];
  matchOptions?: ReinsurerOption[];
  backReasonOptions?: ReinsurerOption[];
  submitting?: boolean;
  onReferralSheet?: () => void;
  /** Resolve `true` when the back-to-underwriter request succeeded; the dialog then closes. */
  onBackToUw: (values: BackToCuwValues) => Promise<boolean>;
  onSaveClose: (values: ReinsurerDecisionValues[]) => void | Promise<void>;
};

const EMPTY_DECISION: DecisionFields = { remarks: "", decision: "", decisionId: "", decisionMatch: "" };

const ASSIGN_DOCUMENT_KEY = "documentName";

const FIELD_ERROR_REASON = "Please select a reason.";
const FIELD_ERROR_REMARK = "Please enter a remark.";

export function ReinsurerPanel({
  rows,
  documents,
  remarks = "",
  backToLabel = "Back TO CUW",
  decisionOptions = REINSURER_DECISION_OPTIONS,
  matchOptions = REINSURER_MATCH_OPTIONS,
  backReasonOptions = BACK_TO_UW_REASON_OPTIONS,
  submitting = false,
  onReferralSheet,
  onBackToUw,
  onSaveClose,
}: Readonly<ReinsurerPanelProps>) {
  const [valuesById, setValuesById] = useState<Record<string, DecisionFields>>({});
  const [backOpen, setBackOpen] = useState(false);
  const [backReason, setBackReason] = useState("");
  const [backRemark, setBackRemark] = useState("");
  const [backAttempted, setBackAttempted] = useState(false);
  const [backSubmitting, setBackSubmitting] = useState(false);

  const updateRow = (id: string, patch: Partial<DecisionFields>) =>
    setValuesById((previous) => ({
      ...previous,
      [id]: { ...EMPTY_DECISION, ...previous[id], ...patch },
    }));

  const tableRows: DetailTableRow[] = rows.map((row) => ({ ...EMPTY_DECISION, ...valuesById[row.id], ...row }));

  const detailColumns: Column<DetailTableRow>[] = [
    {
      key: "productCode",
      header: "Product Code",
      width: "8%",
      render: (_value, row) => <strong>{row.productCode}</strong>,
    },
    { key: "reinsurerNameSystem", header: "Reinsurer Name - System", width: "13%" },
    {
      key: "reinsurerNameUw",
      header: "Reinsurer Name - UW",
      width: "13%",
      render: (_value, row) => row.reinsurerNameUw || "—",
    },
    {
      key: "remarks",
      header: "Reinsurer Remarks",
      width: "24%",
      render: (_value, row) => (
        <CustomTextField
          fullWidth
          placeholder="Enter remarks"
          value={row.remarks}
          htmlInputProps={{ "aria-label": `Reinsurer Remarks for ${row.productCode}` }}
          onChange={(event) => updateRow(row.id, { remarks: event.target.value })}
        />
      ),
    },
    {
      key: "decision",
      header: "Reinsurer Decision",
      width: "13%",
      render: (_value, row) => (
        <CustomSelect
          options={decisionOptions}
          value={row.decision}
          onChange={(value) => updateRow(row.id, { decision: value })}
        />
      ),
    },
    {
      key: "decisionId",
      header: "Reinsurer Decision ID",
      width: "13%",
      render: (_value, row) => (
        <CustomTextField
          fullWidth
          placeholder="Enter decision ID"
          value={row.decisionId}
          htmlInputProps={{ "aria-label": `Reinsurer Decision ID for ${row.productCode}` }}
          onChange={(event) => updateRow(row.id, { decisionId: event.target.value })}
        />
      ),
    },
    {
      key: "decisionMatch",
      header: "Reinsurer-UW Decision Match",
      width: "16%",
      render: (_value, row) => (
        <CustomSelect
          options={matchOptions}
          value={row.decisionMatch}
          onChange={(value) => updateRow(row.id, { decisionMatch: value })}
        />
      ),
    },
  ];

  // Assign Documents: one column per distinct system reinsurer name.
  const reinsurerNames = Array.from(new Set(rows.map((row) => row.reinsurerNameSystem)));
  const assignRows: AssignTableRow[] = documents.map((doc) => ({
    id: doc.id,
    [ASSIGN_DOCUMENT_KEY]: doc.documentName,
    ...Object.fromEntries(
      reinsurerNames.map((name, index) => [`reinsurer-${index}`, doc.assignedReinsurers.includes(name)]),
    ),
  }));
  const assignColumns: Column<AssignTableRow>[] = [
    { key: ASSIGN_DOCUMENT_KEY, header: "Document name", width: "40%" },
    ...reinsurerNames.map((name, index): Column<AssignTableRow> => {
      const key = `reinsurer-${index}`;
      return {
        key,
        header: name,
        render: (_value, row) => (
          <CustomBox sx={{ display: "flex", justifyContent: "center" }}>
            <CustomCheckbox
              checked={row[key] === true}
              disabled
              inputProps={{
                "aria-label": `${String(row[ASSIGN_DOCUMENT_KEY])} ${row[key] === true ? "assigned to" : "not assigned to"} ${name}`,
              }}
            />
          </CustomBox>
        ),
      };
    }),
  ];

  const openBackDialog = () => {
    setBackReason("");
    setBackRemark("");
    setBackAttempted(false);
    setBackOpen(true);
  };

  const reasonError = backAttempted && backReason === "" ? FIELD_ERROR_REASON : "";
  const remarkError = backAttempted && backRemark.trim() === "" ? FIELD_ERROR_REMARK : "";

  const handleBackSubmit = async () => {
    setBackAttempted(true);
    if (backReason === "" || backRemark.trim() === "" || backSubmitting) return;
    setBackSubmitting(true);
    try {
      const done = await onBackToUw({ reason: backReason, remark: backRemark.trim() });
      if (done) setBackOpen(false);
    } finally {
      setBackSubmitting(false);
    }
  };

  const handleSaveClose = () => {
    void onSaveClose(
      rows.map((row) => ({ productCode: row.productCode, ...EMPTY_DECISION, ...valuesById[row.id] })),
    );
  };

  return (
    <CustomBox sx={{ display: "flex", flexDirection: "column", gap: 2 }} data-testid="reinsurer-panel">
      <CustomTable<DetailTableRow>
        title="Reinsurer Details"
        columns={detailColumns}
        data={tableRows}
        getRowId={(row) => row.id}
      />

      <CustomTable<AssignTableRow>
        title="Assign Documents"
        columns={assignColumns}
        data={assignRows}
        getRowId={(row) => String(row.id)}
      />

      <CustomBox
        sx={{
          p: "12px",
          border: "1px solid #f1d8c8",
          borderRadius: "8px",
          background: "#fff",
        }}
      >
        <CustomTypography sx={{ mb: "8px", color: "#5b261c", fontSize: "12px", fontWeight: 800 }}>
          Remarks
        </CustomTypography>
        <CustomTextField
          fullWidth
          multiline
          minRows={3}
          placeholder="No remarks provided"
          value={remarks}
          slotProps={{ input: { readOnly: true }, htmlInput: { "aria-label": "Remarks", "aria-readonly": true } }}
        />
      </CustomBox>

      <CustomBox
        aria-label="Reinsurer actions"
        sx={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: "12px" }}
      >
        <CustomButton variant="outlined" onClick={onReferralSheet}>
          Referral Sheet
        </CustomButton>
        <CustomButton variant="outlined" onClick={openBackDialog}>
          {backToLabel}
        </CustomButton>
        <CustomButton disabled={submitting} onClick={handleSaveClose}>
          Save &amp; close
        </CustomButton>
      </CustomBox>

      <CustomDialog
        open={backOpen}
        onClose={() => setBackOpen(false)}
        title={backToLabel}
        maxWidth="xs"
        actionsSx={{ justifyContent: "center" }}
        actions={
          <CustomButton disabled={backSubmitting} onClick={() => void handleBackSubmit()}>
            Submit
          </CustomButton>
        }
      >
        <CustomBox sx={{ display: "flex", flexDirection: "column", gap: 1.5, pt: 1 }}>
          <CustomBox>
            <CustomTypography sx={{ mb: "6px", fontSize: "12px", fontWeight: 800 }}>
              Reason <CustomBox component="span" sx={{ color: "#b3262e" }}>*</CustomBox>
            </CustomTypography>
            <CustomSelect
              placeholder="Select reason"
              options={backReasonOptions}
              value={backReason}
              error={reasonError !== ""}
              helperText={reasonError || undefined}
              onChange={setBackReason}
            />
          </CustomBox>
          <CustomTextField
            fullWidth
            labelText="Remark"
            mandatory
            placeholder="Enter remark"
            value={backRemark}
            error={remarkError !== ""}
            helperText={remarkError || undefined}
            onChange={(event) => setBackRemark(event.target.value)}
          />
        </CustomBox>
      </CustomDialog>
    </CustomBox>
  );
}

export default ReinsurerPanel;
