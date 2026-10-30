import { useState } from "react";
import {
  CustomBox,
  CustomButton,
  CustomSelect,
  CustomTextField,
  CustomTypography,
} from "@insurance-poc/ui";

/* ------------------------------------------------------------------ */
/* UwGuidelines - common guidelines checklist, reused across screens.  */
/*  - variant "readonly": shows recorded justification as text.         */
/*  - variant "editable": justification reason / remarks can be edited; */
/*    both are required together before submit.                         */
/* ------------------------------------------------------------------ */

export type UwGuidelinesVariant = "readonly" | "editable";

export type UwGuidelineRow = {
  reason: string;
  remark: string;
  systemAction: string;
  justificationReason: string;
  justificationRemark: string;
};

export type UwGuidelinesProps = {
  rows: UwGuidelineRow[];
  variant?: UwGuidelinesVariant;
  /** Called with the edited rows once validation passes (editable only). */
  onSubmit?: (rows: UwGuidelineRow[]) => void;
  /** Back / Close button. */
  onClose: () => void;
  /** Called with the message when validation fails (editable only). */
  onValidationError?: (message: string) => void;
};

const JUSTIFICATION_REASONS = [
  "",
  "Requirement waived",
  "Document pending",
  "Financial assessment",
  "Medical assessment",
  "Counter signing",
  "Other",
];

const BORDER = "1px solid #eadfd9";
const cellSx = { padding: "8px 10px", borderRight: BORDER, borderBottom: BORDER } as const;
const lastCellSx = { padding: "8px 10px", borderBottom: BORDER } as const;

export function UwGuidelines({
  rows,
  variant = "readonly",
  onSubmit,
  onClose,
  onValidationError,
}: Readonly<UwGuidelinesProps>) {
  const editable = variant === "editable";
  const [draft, setDraft] = useState<UwGuidelineRow[]>(() => rows.map((r) => ({ ...r })));
  const visibleRows = editable ? draft : rows;

  const updateRow = (idx: number, patch: Partial<UwGuidelineRow>) => {
    setDraft((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleSubmit = () => {
    const incomplete = draft.some(
      (row) => Boolean(row.justificationReason) !== Boolean(row.justificationRemark.trim()),
    );
    if (incomplete) {
      onValidationError?.("Please complete both justification fields for each applicable guideline");
      return;
    }
    onSubmit?.(draft);
  };

  return (
    <CustomBox data-testid="uw-guidelines">
      {editable && (
        <CustomTypography
          component="p"
          sx={{ color: "#302a27", fontSize: "12px", lineHeight: 1.5, mb: 2 }}
        >
          Select a justification reason to enable its remarks field. Remarks are mandatory for every
          selected reason.
        </CustomTypography>
      )}

      <CustomBox sx={{ border: BORDER, borderRadius: "10px", overflowX: "auto", mb: 3 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#ffead7", color: "#5b261c", fontWeight: 800 }}>
              <th style={{ ...cellSx, textAlign: "left" }}>Reason</th>
              <th style={{ ...cellSx, textAlign: "left" }}>Remark</th>
              <th style={{ ...cellSx, textAlign: "left" }}>System Action</th>
              <th style={{ ...cellSx, textAlign: "left", width: "220px" }}>Justification Reason</th>
              <th style={{ ...lastCellSx, textAlign: "left", width: "240px" }}>
                Justification Remarks
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, idx) => (
              <tr key={row.reason}>
                <td style={cellSx}>{row.reason}</td>
                <td style={cellSx}>{row.remark}</td>
                <td style={cellSx}>{row.systemAction || "—"}</td>
                <td style={cellSx}>
                  {editable ? (
                    <CustomSelect
                      value={row.justificationReason}
                      onChange={(val) =>
                        updateRow(idx, {
                          justificationReason: val,
                          justificationRemark: val ? row.justificationRemark : "",
                        })
                      }
                      options={JUSTIFICATION_REASONS.map((r) => ({
                        value: r,
                        label: r || "Select reason",
                      }))}
                      placeholder="Select reason"
                      fullWidth
                    />
                  ) : (
                    row.justificationReason || "—"
                  )}
                </td>
                <td style={lastCellSx}>
                  {editable ? (
                    <CustomTextField
                      value={row.justificationRemark}
                      onChange={(e) => updateRow(idx, { justificationRemark: e.target.value })}
                      placeholder={
                        row.justificationReason ? "Add remarks (required)" : "Select a reason first"
                      }
                      disabled={!row.justificationReason}
                      fullWidth
                      size="small"
                    />
                  ) : (
                    row.justificationRemark || "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CustomBox>

      <CustomBox sx={{ display: "flex", justifyContent: "center", gap: 2, mt: 2 }}>
        <CustomButton
          variant="outlined"
          onClick={onClose}
          sx={{ borderColor: "#eadfd9", color: "#7b716c", fontWeight: "bold", px: 4 }}
        >
          {editable ? "Back" : "Close"}
        </CustomButton>
        {editable && (
          <CustomButton
            variant="contained"
            onClick={handleSubmit}
            sx={{ fontWeight: "bold", px: 4 }}
          >
            Confirm & Submit
          </CustomButton>
        )}
      </CustomBox>
    </CustomBox>
  );
}

export default UwGuidelines;
