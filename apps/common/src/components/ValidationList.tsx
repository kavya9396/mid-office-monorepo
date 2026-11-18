import { CustomBox, CustomButton } from "@insurance-poc/ui";

/* ------------------------------------------------------------------ */
/* ValidationList - read-only table of validation failures             */
/* (member type, reason, remarks); optional Close button.              */
/* Same table styling as UwGuidelines.                                 */
/* ------------------------------------------------------------------ */

export type ValidationRow = {
  memberType: string;
  reason: string;
  remarks: string;
};

export type ValidationListProps = {
  rows: ValidationRow[];
  /** When provided, a Close button is shown below the table. */
  onClose?: () => void;
};

const BORDER = "1px solid #eadfd9";
const cellSx = { padding: "8px 10px", borderRight: BORDER, borderBottom: BORDER } as const;
const lastCellSx = { padding: "8px 10px", borderBottom: BORDER } as const;

export function ValidationList({ rows, onClose }: Readonly<ValidationListProps>) {
  return (
    <CustomBox data-testid="validation-list">
      <CustomBox sx={{ border: BORDER, borderRadius: "10px", overflowX: "auto", mb: 3 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#ffead7", color: "#5b261c", fontWeight: 800 }}>
              <th style={{ ...cellSx, textAlign: "left", width: "180px" }}>Member Type</th>
              <th style={{ ...cellSx, textAlign: "left" }}>Reason</th>
              <th style={{ ...lastCellSx, textAlign: "left" }}>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={`${row.memberType}-${row.reason}-${idx}`}>
                <td style={cellSx}>{row.memberType || "—"}</td>
                <td style={cellSx}>{row.reason || "—"}</td>
                <td style={lastCellSx}>{row.remarks || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CustomBox>

      {onClose && (
        <CustomBox sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CustomButton
            variant="outlined"
            onClick={onClose}
            sx={{ borderColor: "#eadfd9", color: "#7b716c", fontWeight: "bold", px: 4 }}
          >
            Close
          </CustomButton>
        </CustomBox>
      )}
    </CustomBox>
  );
}

export default ValidationList;
