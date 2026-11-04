import { CustomBox, CustomSelect, CustomTypography } from "@insurance-poc/ui";

export type CaseUwDecisionOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type CaseUwDecisionProps = {
  /** Read-only Financial Decision value; empty renders "-" */
  financialDecision?: string;
  /** Read-only Medical Decision value; empty renders "-" */
  medicalDecision?: string;
  /** Options of the Case UW Decision dropdown */
  options: CaseUwDecisionOption[];
  /** Controlled Case UW Decision value */
  value: string;
  onChange: (value: string) => void;
  financialLabel?: string;
  medicalLabel?: string;
  decisionLabel?: string;
  placeholder?: string;
  disabled?: boolean;
};

const fieldCellSx = {
  minWidth: 0,
  p: "10px 16px",
};

function AssessmentField({
  label,
  value,
  borderLeft,
}: Readonly<{ label: string; value?: string; borderLeft?: boolean }>) {
  return (
    <CustomBox
      sx={{
        ...fieldCellSx,
        borderLeft: borderLeft ? "1px solid #e5e0dd" : "none",
      }}
    >
      <CustomTypography
        component="dt"
        sx={{
          mb: "6px",
          color: "#938883",
          fontSize: "12px",
          lineHeight: 1.4,
          fontWeight: 700,
          letterSpacing: ".3px",
        }}
      >
        {label}
      </CustomTypography>
      <CustomTypography
        component="dd"
        sx={{
          m: 0,
          color: "#37312e",
          fontSize: "12px",
          lineHeight: 1.4,
          fontWeight: 600,
          overflowWrap: "anywhere",
        }}
      >
        {value || "-"}
      </CustomTypography>
    </CustomBox>
  );
}

/**
 * Financial Decision + Medical Decision (read-only) and Case UW Decision (select)
 * on one row. Presentational: data and handlers come from the screen.
 */
export function CaseUwDecision({
  financialDecision,
  medicalDecision,
  options,
  value,
  onChange,
  financialLabel = "Financial Decision",
  medicalLabel = "Medical Decision",
  decisionLabel = "Case UW Decision",
  placeholder = "Select",
  disabled = false,
}: Readonly<CaseUwDecisionProps>) {
  return (
    <CustomBox
      component="section"
      aria-label={decisionLabel}
      sx={{ m: "8px 4px 0", p: "0 8px 8px" }}
    >
      <CustomBox
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
          gap: "8px",
          p: "8px",
        }}
      >
        <CustomBox
          component="dl"
          sx={{
            gridColumn: { xs: "1", md: "span 2" },
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            m: 0,
            borderBottom: "1px solid #e5e0dd",
            background: "#fcfaf9",
          }}
        >
          <AssessmentField label={financialLabel} value={financialDecision} />
          <AssessmentField label={medicalLabel} value={medicalDecision} borderLeft />
        </CustomBox>

        <CustomBox sx={{ minWidth: 0 }}>
          <CustomTypography
            component="span"
            sx={{
              display: "block",
              mb: "8px",
              color: "#444",
              fontSize: "11px",
              lineHeight: 1.2,
              fontWeight: 400,
            }}
          >
            {decisionLabel}
          </CustomTypography>
          <CustomSelect
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            fullWidth
          />
        </CustomBox>
      </CustomBox>
    </CustomBox>
  );
}

export default CaseUwDecision;
