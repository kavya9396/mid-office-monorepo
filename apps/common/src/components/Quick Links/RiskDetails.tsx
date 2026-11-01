import { type ChangeEvent, type ReactNode, useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  CustomButton,
  CustomSelect,
  CustomSnackbar,
  CustomTextField,
} from "@insurance-poc/ui";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface RiskDetailField {
  label: string;
  value: string;
}

export interface RiskAssessmentField {
  id: string;
  label: string;
  value: string;
}

export interface RiskMember {
  id?: string;
  name: string;
  details: RiskDetailField[];
  assessment: RiskAssessmentField[];
  remark: string;
  decision: string;
}

export interface RiskDetailsProps {
  members?: RiskMember[];
  title?: string;
  showTitle?: boolean;
  decisionOptions?: string[];
  onSaveAssessment?: (member: RiskMember) => void;
  onSubmitDecision?: (member: RiskMember) => void;
}

/* -------------------------------------------------------------------------- */
/* Static / Default Mock Data (copied from risk-details.html prototype)       */
/* -------------------------------------------------------------------------- */

const BASE_ASSESSMENT: RiskAssessmentField[] = (
  [
    ["Name, address & stay confirmed", "Yes"],
    ["Standard of living", "Good"],
    ["Life assured existence", "Yes"],
    ["Educational qualification", "Graduate"],
    ["Contactability established", "Yes"],
    ["Occupation category", "Salaried"],
    ["Computer applied for policy", "Yes"],
    ["Annual income", "Between Rs 5 Lacs and 10 Lacs"],
    ["Met with whom", "Self"],
    ["Availability of LC at current address", "Yes"],
    ["Hobbies", "Non-smoker and non-alcoholic"],
    ["Physical features", "Healthy"],
    ["Previous medical history", "No"],
    ["Photo availability of life assured", "Yes"],
    ["Vitality check", "Positive"],
    ["Geo tagging", "Yes"],
    ["Type of house", "Owned"],
    ["Face match", "Yes"],
    ["Have Life Insurance", "Yes"],
    ["Investigation score", "90"],
    ["FE remarks", "Investigation remarks to be mentioned here."],
  ] as const
).map(([label, value], index) => ({ id: `f${index}`, label, value }));

export const DEFAULT_DECISION_OPTIONS = ["STD", "NON STD"];

export const DEFAULT_RISK_MEMBERS: RiskMember[] = [
  {
    id: "life-assured-1",
    name: "Life Assured 1",
    details: [
      { label: "KRN No", value: "1316367" },
      { label: "Application No", value: "NB000021" },
      { label: "Customer Name", value: "Ravinder Ravinder" },
      { label: "Vendor Name", value: "The Credentials" },
      { label: "Report Revised Date", value: "2024-09-07 11:36:09" },
    ],
    assessment: BASE_ASSESSMENT,
    remark: "",
    decision: "STD",
  },
  {
    id: "life-assured-2",
    name: "Life Assured 2",
    details: [
      { label: "KRN No", value: "1316368" },
      { label: "Application No", value: "NB000022" },
      { label: "Customer Name", value: "Amit Sharma" },
      { label: "Vendor Name", value: "The Credentials" },
      { label: "Report Revised Date", value: "2024-09-08 09:15:42" },
    ],
    assessment: BASE_ASSESSMENT,
    remark: "",
    decision: "NON STD",
  },
  {
    id: "proposer",
    name: "Proposer",
    details: [
      { label: "KRN No", value: "1316369" },
      { label: "Application No", value: "NB000023" },
      { label: "Customer Name", value: "Priya Singh" },
      { label: "Vendor Name", value: "The Credentials" },
      { label: "Report Revised Date", value: "2024-09-09 12:42:18" },
    ],
    assessment: BASE_ASSESSMENT,
    remark: "",
    decision: "STD",
  },
];

/* -------------------------------------------------------------------------- */
/* Internal helpers                                                           */
/* -------------------------------------------------------------------------- */

const GRID_COLUMNS = {
  display: "grid",
  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
  "@media (max-width:1100px)": {
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
} as const;

function SectionHead({
  children,
  actions,
}: Readonly<{ children: string; actions?: ReactNode }>) {
  return (
    <Box
      sx={{
        minHeight: 34,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: "12px",
        bgcolor: "#FFF1E6",
        borderBottom: "1px solid #F1D4BF",
        fontSize: "12.5px",
        fontWeight: 700,
        color: "#263238",
      }}
    >
      <Typography component="span" sx={{ fontSize: "12.5px", fontWeight: 700 }}>
        {children}
      </Typography>
      {actions && <Box sx={{ display: "flex", gap: "6px", py: "3px" }}>{actions}</Box>}
    </Box>
  );
}

/* -------------------------------------------------------------------------- */
/* RiskDetails Component                                                      */
/* -------------------------------------------------------------------------- */

export function RiskDetails({
  members = DEFAULT_RISK_MEMBERS,
  title = "Risk Details",
  showTitle = true,
  decisionOptions = DEFAULT_DECISION_OPTIONS,
  onSaveAssessment,
  onSubmitDecision,
}: Readonly<RiskDetailsProps>) {
  const [data, setData] = useState<RiskMember[]>(members);
  const [activeIndex, setActiveIndex] = useState(0);
  const [editing, setEditing] = useState(false);
  const [snapshot, setSnapshot] = useState<RiskAssessmentField[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const member = data[activeIndex];

  if (!member) {
    return (
      <Box sx={{ p: 2, fontSize: "12px", color: "#68717A" }} data-testid="risk-details-empty">
        No risk details found.
      </Box>
    );
  }

  const updateMember = (patch: Partial<RiskMember>) =>
    setData((prev) => prev.map((m, i) => (i === activeIndex ? { ...m, ...patch } : m)));

  const switchMember = (index: number) => {
    setActiveIndex(index);
    setEditing(false);
    setSnapshot(null);
  };

  const startEdit = () => {
    setSnapshot(member.assessment);
    setEditing(true);
  };

  const updateAssessment = (index: number, value: string) =>
    updateMember({
      assessment: member.assessment.map((field, i) =>
        i === index ? { ...field, value } : field
      ),
    });

  const resetAssessment = () => {
    if (snapshot) updateMember({ assessment: snapshot });
    setEditing(false);
    setSnapshot(null);
    setMessage("Assessment reset successfully.");
  };

  const saveAssessment = () => {
    setEditing(false);
    setSnapshot(null);
    onSaveAssessment?.(member);
    setMessage("Assessment saved successfully.");
  };

  const submitDecision = () => {
    onSubmitDecision?.(member);
    setMessage(`${member.name} risk decision submitted.`);
  };

  return (
    <Box
      data-testid="risk-details"
      sx={{
        width: "100%",
        bgcolor: "#FFFFFF",
        border: "1px solid #D8D8D8",
        borderRadius: "10px",
        boxShadow: "0 5px 18px rgba(0, 0, 0, .06)",
        overflow: "hidden",
        color: "#263238",
      }}
    >
      {showTitle && (
        <Box
          sx={{
            height: 44,
            display: "flex",
            alignItems: "center",
            px: 2,
            bgcolor: "primary.main",
            color: "#FFFFFF",
          }}
        >
          <Typography component="h1" sx={{ m: 0, fontSize: "18px", fontWeight: 700 }}>
            {title}
          </Typography>
        </Box>
      )}

      <Box
        role="tablist"
        aria-label="Members"
        sx={{
          display: "flex",
          alignItems: "flex-end",
          gap: "4px",
          px: "14px",
          borderBottom: "1px solid #E3E3E3",
        }}
      >
        {data.map((m, index) => {
          const isActive = index === activeIndex;
          return (
            <Box
              key={m.id ?? m.name}
              component="button"
              type="button"
              role="tab"
              aria-selected={isActive}
              data-testid={`risk-tab-${index}`}
              onClick={() => switchMember(index)}
              sx={{
                height: 41,
                px: 2,
                border: "none",
                borderBottom: "3px solid",
                borderBottomColor: isActive ? "primary.main" : "transparent",
                bgcolor: "transparent",
                color: isActive ? "primary.main" : "#4f575e",
                fontFamily: "inherit",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main" },
              }}
            >
              {m.name}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ borderBottom: "1px solid #E3E3E3" }}>
        <SectionHead>Member Details</SectionHead>
        <Box sx={{ ...GRID_COLUMNS, gap: "18px", px: "14px", py: "10px" }}>
          {member.details.map((field) => (
            <Box key={field.label} sx={{ minWidth: 0, overflow: "hidden", px: "2px" }}>
              <Typography
                sx={{
                  mb: "5px",
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "#8B817C",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {field.label}
              </Typography>
              <Typography
                title={field.value}
                sx={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#303030",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {field.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <Box sx={{ borderBottom: "1px solid #E3E3E3" }}>
        <SectionHead
          actions={
            editing ? (
              <>
                <CustomButton
                  variant="outlined"
                  data-testid="risk-reset"
                  onClick={resetAssessment}
                  sx={{
                    px: "14px",
                    py: "7px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#555555",
                    borderColor: "#d8d8d8",
                    bgcolor: "#FFFFFF",
                    "&:hover": { color: "#555555", bgcolor: "#F5F5F5", borderColor: "#d8d8d8" },
                  }}
                >
                  Reset
                </CustomButton>
                <CustomButton
                  data-testid="risk-save"
                  onClick={saveAssessment}
                  sx={{ px: "14px", py: "7px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}
                >
                  Save
                </CustomButton>
              </>
            ) : (
              <CustomButton
                data-testid="risk-edit"
                onClick={startEdit}
                sx={{ px: "14px", py: "7px", borderRadius: "6px", fontSize: "11px", fontWeight: 700 }}
              >
                Edit
              </CustomButton>
            )
          }
        >
          Risk Assessment
        </SectionHead>
        <Box sx={{ ...GRID_COLUMNS, columnGap: "22px", rowGap: "6px", px: "14px", py: "10px" }}>
          {member.assessment.map((field, index) => (
            <Box key={field.id} sx={{ minWidth: 0, overflow: "hidden", px: "2px", pt: "2px", pb: "4px" }}>
              <Typography
                title={field.label}
                sx={{
                  mb: "5px",
                  fontSize: "10px",
                  fontWeight: 500,
                  color: "#8B817C",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {field.label}
              </Typography>
              {editing ? (
                <Box
                  component="input"
                  type="text"
                  aria-label={field.label}
                  data-testid={`risk-assessment-${field.id}`}
                  value={field.value}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    updateAssessment(index, e.target.value)
                  }
                  sx={{
                    width: "100%",
                    minHeight: 22,
                    px: 0,
                    pt: "1px",
                    pb: "3px",
                    outline: "none",
                    border: "none",
                    borderBottom: "1px solid #D7D0CC",
                    bgcolor: "transparent",
                    fontFamily: "inherit",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#303030",
                    textOverflow: "ellipsis",
                    "&:focus": {
                      borderBottomWidth: "2px",
                      borderBottomColor: "primary.main",
                      pb: "2px",
                    },
                  }}
                />
              ) : (
                <Typography
                  title={field.value}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: 22,
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "#303030",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {field.value}
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      </Box>

      <Box>
        <Box
          sx={{
            minHeight: 30,
            display: "flex",
            alignItems: "center",
            px: "12px",
            bgcolor: "#FFF1E6",
            borderBottom: "1px solid #F1D4BF",
          }}
        >
          <Typography component="span" sx={{ fontSize: "12.5px", fontWeight: 700, color: "#263238" }}>
            Risk Decision
          </Typography>
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 180px 110px",
            gap: "8px",
            alignItems: "stretch",
            px: "10px",
            py: "8px",
          }}
        >
          <CustomTextField
            multiline
            rows={2}
            fullWidth
            placeholder="Risk Remark"
            value={member.remark}
            onChange={(e) => updateMember({ remark: e.target.value })}
            htmlInputProps={{ "aria-label": "Risk Remark" }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: "7px" } }}
          />
          <CustomSelect
            value={member.decision}
            options={decisionOptions.map((option) => ({ label: option, value: option }))}
            onChange={(value) => updateMember({ decision: value })}
          />
          <CustomButton
            data-testid="risk-submit"
            onClick={submitDecision}
            sx={{ borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}
          >
            Submit
          </CustomButton>
        </Box>
      </Box>

      <CustomSnackbar
        open={Boolean(message)}
        message={message ?? ""}
        onClose={() => setMessage(null)}
      />
    </Box>
  );
}

export default RiskDetails;
