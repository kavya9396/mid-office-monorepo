import { CustomBox, CustomTypography } from "@insurance-poc/ui";
import type { GuwSdtRow as GuwSdtRowData } from "../../services/guwService";

/* ------------------------------------------------------------------
 * GuwSdtRow — Financial Decision / Medical Decision read-only labels
 * + Claim Audit / UW Guidelines / Special Remarks action buttons.
 *
 * Prototype: .sdt-row — 3-column strip below the risk/BRE cards.
 * ------------------------------------------------------------------ */

type GuwSdtRowProps = {
  data: GuwSdtRowData;
  onGrievanceHistory?: () => void;
  onClaimAudit?: () => void;
  onUwGuidelines?: () => void;
  onSpecialRemarks?: () => void;
};

function DecisionCell({
  label,
  value,
  borderLeft,
}: {
  label: string;
  value: string;
  borderLeft?: boolean;
}) {
  return (
    <CustomBox
      sx={{
        padding: "4px 10px",
        borderLeft: borderLeft ? "1px solid #e8e1de" : "none",
        minWidth: 0,
      }}
    >
      <CustomTypography
        component="span"
        sx={{
          display: "block",
          mb: "1px",
          color: "#8b807b",
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: ".45px",
          textTransform: "uppercase",
        }}
      >
        {label}
      </CustomTypography>
      <CustomTypography
        component="strong"
        sx={{ color: "#302a27", fontSize: "11px", fontWeight: 800 }}
      >
        {value || "-"}
      </CustomTypography>
    </CustomBox>
  );
}

function ActionButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <CustomBox
      component="button"
      onClick={onClick}
      sx={{
        minHeight: "24px",
        padding: "2px 10px",
        border: 0,
        borderRadius: "6px",
        background: "#e45f14",
        color: "#fff",
        fontSize: "11px",
        fontWeight: 700,
        cursor: "pointer",
        whiteSpace: "nowrap",
        "&:hover": { background: "#c94f0d" },
      }}
    >
      {label}
    </CustomBox>
  );
}

export function GuwSdtRow({
  data,
  onGrievanceHistory,
  onClaimAudit,
  onUwGuidelines,
  onSpecialRemarks,
}: Readonly<GuwSdtRowProps>) {
  return (
    <CustomBox
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(130px, .65fr) minmax(0, 2fr) auto",
        background: "#fcfaf9",
        border: "1px solid #e4dedb",
        borderLeft: "4px solid #e45f14",
        borderRadius: "8px",
        boxShadow: "0 2px 7px rgba(60,42,35,.04)",
        overflow: "hidden",
      }}
    >
      <DecisionCell label="Financial Decision" value={data.financialDecision} />
      <DecisionCell label="Medical Decision" value={data.medicalDecision} borderLeft />

      {/* action buttons */}
      <CustomBox
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: "6px",
          padding: "4px 10px",
          borderLeft: "1px solid #e8e1de",
        }}
      >
        <ActionButton
          label={`Grievance History (${data.grievanceHistoryCount})`}
          onClick={onGrievanceHistory}
        />
        <ActionButton
          label={`Claim Audit (${data.claimAuditCount})`}
          onClick={onClaimAudit}
        />
        <ActionButton
          label={`UW Guidelines (${data.uwGuidelinesCount})`}
          onClick={onUwGuidelines}
        />
        <ActionButton label="Special Remarks" onClick={onSpecialRemarks} />
      </CustomBox>
    </CustomBox>
  );
}
