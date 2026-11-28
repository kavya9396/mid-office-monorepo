import { useState, type CSSProperties, type ReactNode } from "react";
import { CustomBox, CustomButton, CustomDialog, CustomTextField, CustomTypography } from "@insurance-poc/ui";
import type { ReferralSheetForm, ReferralSheetPolicyRow } from "./referralSheet";

/* ------------------------------------------------------------------ */
/* ReferralSheetDialog - the Reinsurer Referral Sheet laid out like the */
/* printed sheet (bordered label / value rows), every field editable.   */
/* "Save" hands the whole form to `onSave`; the dialog stays open when  */
/* `onSave` resolves to false.                                          */
/* ------------------------------------------------------------------ */

export type ReferralSheetDialogProps = {
  open: boolean;
  onClose: () => void;
  initialForm: ReferralSheetForm;
  onSave: (form: ReferralSheetForm) => Promise<boolean>;
};

type TextFieldKey =
  | "uwName"
  | "product"
  | "reinsuranceRefNo"
  | "currentApplicationSa"
  | "currentPremium"
  | "totalSumAssured"
  | "reasonForReferral"
  | "natureOfDuty"
  | "applicationType"
  | "socialCheck"
  | "financials"
  | "medical"
  | "caseFacts"
  | "ourRecommendation";

const BORDER = "1px solid #302a27";
const labelStyle: CSSProperties = {
  padding: "6px 8px",
  border: BORDER,
  fontWeight: 700,
  fontSize: "12px",
  color: "#302a27",
  verticalAlign: "top",
  background: "#fff8f3",
  width: "24%",
};
const valueStyle: CSSProperties = { padding: "4px 6px", border: BORDER, verticalAlign: "top" };
const headStyle: CSSProperties = {
  padding: "6px 8px",
  border: BORDER,
  fontWeight: 700,
  fontSize: "11px",
  color: "#302a27",
  background: "#ffead7",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const compactInputSx = {
  "& .MuiOutlinedInput-root": { height: "32px", minHeight: "32px", borderRadius: "4px" },
  "& .MuiOutlinedInput-root.MuiInputBase-multiline": { height: "auto", minHeight: "32px", padding: "6px 8px" },
} as const;

const POLICY_COLUMNS: { key: keyof ReferralSheetPolicyRow; label: string }[] = [
  { key: "policyOrApplicationId", label: "Application No." },
  { key: "name", label: "Name" },
  { key: "product", label: "Product" },
  { key: "sumAssured", label: "Sum Assured" },
  { key: "premium", label: "Premium" },
  { key: "proposalStatus", label: "Proposal Status" },
  { key: "fundValue", label: "Fund Value" },
  { key: "rcd", label: "RCD" },
  { key: "paidToDate", label: "Paid To Date" },
];

function SheetRow({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <tr>
      <td style={labelStyle}>{label}</td>
      <td style={valueStyle}>{children}</td>
    </tr>
  );
}

export function ReferralSheetDialog({ open, onClose, initialForm, onSave }: Readonly<ReferralSheetDialogProps>) {
  const [form, setForm] = useState<ReferralSheetForm>(initialForm);
  const [saving, setSaving] = useState<boolean>(false);

  const setField = (key: TextFieldKey, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const textInput = (key: TextFieldKey, multiline = false) => (
    <CustomTextField
      value={form[key]}
      onChange={(e) => setField(key, e.target.value)}
      multiline={multiline}
      minRows={multiline ? 3 : undefined}
      fullWidth
      sx={compactInputSx}
      data-testid={`referral-sheet-${key}`}
    />
  );

  const setPolicyField = (rowIndex: number, key: keyof ReferralSheetPolicyRow, value: string) =>
    setForm((prev) => ({
      ...prev,
      previousPolicies: prev.previousPolicies.map((row, idx) => (idx === rowIndex ? { ...row, [key]: value } : row)),
    }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Referral Sheet"
      maxWidth="lg"
      fullWidth
      actions={
        <>
          <CustomButton variant="outlined" onClick={onClose} disabled={saving}>
            Cancel
          </CustomButton>
          <CustomButton variant="contained" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </CustomButton>
        </>
      }
    >
      <CustomBox data-testid="referral-sheet" sx={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <tbody>
            <tr>
              <td
                colSpan={2}
                style={{ padding: "6px 8px", border: BORDER, background: "#4472c4", textAlign: "center" }}
              >
                <CustomTextField
                  value={form.uwName}
                  onChange={(e) => setField("uwName", e.target.value)}
                  fullWidth
                  placeholder="UW name"
                  sx={{
                    ...compactInputSx,
                    "& .MuiInputBase-input": { textAlign: "center", fontWeight: 700, fontSize: "13px" },
                  }}
                  data-testid="referral-sheet-uwName"
                />
              </td>
            </tr>
            <SheetRow label="Application No">
              <CustomTypography sx={{ fontSize: "12px", fontWeight: 600, py: "6px" }}>
                {form.applicationNumber}
              </CustomTypography>
            </SheetRow>
            <SheetRow label="Product Code">{textInput("product")}</SheetRow>
            <SheetRow label="Reinsurance ref No (If any)">{textInput("reinsuranceRefNo")}</SheetRow>
            <SheetRow label="Current Application SA">{textInput("currentApplicationSa")}</SheetRow>
            <SheetRow label="Current Premium amount">{textInput("currentPremium")}</SheetRow>
            <SheetRow label="Total Sum Assured">{textInput("totalSumAssured")}</SheetRow>

            <tr>
              <td style={labelStyle}>Existing policy details</td>
              <td style={{ ...valueStyle, padding: 0 }}>
                <CustomBox sx={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        {POLICY_COLUMNS.map((column) => (
                          <th key={column.key} style={headStyle}>
                            {column.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {form.previousPolicies.length === 0 && (
                        <tr>
                          <td colSpan={POLICY_COLUMNS.length} style={{ ...valueStyle, color: "#7b716c" }}>
                            No existing policies.
                          </td>
                        </tr>
                      )}
                      {form.previousPolicies.map((row, rowIndex) => (
                        <tr key={`${row.policyOrApplicationId}-${rowIndex}`}>
                          {POLICY_COLUMNS.map((column) => (
                            <td key={column.key} style={{ ...valueStyle, minWidth: "110px" }}>
                              <CustomTextField
                                value={row[column.key]}
                                onChange={(e) => setPolicyField(rowIndex, column.key, e.target.value)}
                                fullWidth
                                sx={compactInputSx}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CustomBox>
              </td>
            </tr>

            <SheetRow label="Reason for referral">{textInput("reasonForReferral")}</SheetRow>

            <SheetRow label="LA details">
              <CustomBox sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <CustomTextField
                  labelText="Name of LA"
                  value={form.lifeAssured.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, lifeAssured: { ...prev.lifeAssured, name: e.target.value } }))
                  }
                  fullWidth
                  sx={compactInputSx}
                />
                <CustomTextField
                  labelText="Name of Proposer"
                  value={form.proposer.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, proposer: { ...prev.proposer, name: e.target.value } }))
                  }
                  fullWidth
                  sx={compactInputSx}
                />
                <CustomTextField
                  labelText="Nature of duty"
                  value={form.natureOfDuty}
                  onChange={(e) => setField("natureOfDuty", e.target.value)}
                  fullWidth
                  sx={compactInputSx}
                />
                <CustomTextField
                  labelText="Application type"
                  value={form.applicationType}
                  onChange={(e) => setField("applicationType", e.target.value)}
                  fullWidth
                  sx={compactInputSx}
                />
              </CustomBox>
            </SheetRow>

            <SheetRow label="Social check">{textInput("socialCheck", true)}</SheetRow>
            <SheetRow label="Financials">{textInput("financials", true)}</SheetRow>
            <SheetRow label="Medical">{textInput("medical", true)}</SheetRow>
            <SheetRow label="Case Facts">{textInput("caseFacts", true)}</SheetRow>
            <SheetRow label="Our recommendation">{textInput("ourRecommendation", true)}</SheetRow>
          </tbody>
        </table>
      </CustomBox>
    </CustomDialog>
  );
}
