import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  CustomButton,
  CustomDialog,
  CustomSelect,
  CustomTextField,
} from "@insurance-poc/ui";

export interface ReferralDecisionSubmitPayload {
  remarks: string;
  decision: string;
  outliers: string;
}

export interface ReferralDecisionSectionProps {
  /** Role label used in the field labels: "<roleLabel> Remarks" / "<roleLabel> Decision" (HOD, Sr UW). */
  roleLabel: string;
  decisionOptions: string[];
  /** Disables all fields and the Submit button. */
  disabled?: boolean;
  /** Fired after the user confirms the "Confirm Submission" dialog. */
  onSubmit: (payload: ReferralDecisionSubmitPayload) => void;
}

/**
 * Decision card for the HOD and Sr UW DRS — Remarks, Decision, Outliers and Submit (with a
 * "Confirm Submission" dialog). Prototypes: hod-drs-prototype.html, sr-uw-drs-prototype.html.
 */
export function ReferralDecisionSection({
  roleLabel,
  decisionOptions,
  disabled = false,
  onSubmit,
}: Readonly<ReferralDecisionSectionProps>) {
  const [remarks, setRemarks] = useState("");
  const [decision, setDecision] = useState("");
  const [outliers, setOutliers] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleConfirm = () => {
    setConfirmOpen(false);
    onSubmit({ remarks, decision, outliers });
  };

  return (
    <>
      <Box
        component="section"
        aria-label={`${roleLabel} Decision`}
        sx={{
          p: { xs: 1, sm: 1.25 },
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(0, 1fr) 250px 250px auto",
          },
          gap: 1.25,
          alignItems: "center",
          border: "1px solid #D8D8D8",
          borderLeft: "4px solid #E45F14",
          borderRadius: "10px",
          bgcolor: "#FFFFFF",
          boxShadow: "0 2px 7px rgba(60, 42, 35, 0.05)",
        }}
      >
        <CustomTextField
          label={`${roleLabel} Remarks`}
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          multiline
          minRows={1}
          size="small"
          fullWidth
          disabled={disabled}
        />

        <CustomSelect
          placeholder={`${roleLabel} Decision`}
          value={decision}
          onChange={setDecision}
          options={decisionOptions.map((option) => ({ label: option, value: option }))}
          disabled={disabled}
          fullWidth
        />

        <CustomTextField
          label="Outliers"
          value={outliers}
          onChange={(e) => setOutliers(e.target.value)}
          multiline
          minRows={1}
          size="small"
          fullWidth
          disabled={disabled}
        />

        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <CustomButton
            type="button"
            variant="contained"
            onClick={() => setConfirmOpen(true)}
            disabled={disabled}
            sx={{ minWidth: 80, borderRadius: "50px" }}
          >
            Submit
          </CustomButton>
        </Box>
      </Box>

      <CustomDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Confirm Submission"
      >
        <Box sx={{ p: 1 }}>
          <Typography sx={{ fontSize: "14px", color: "#333" }}>
            Do you want to submit the case?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
            <CustomButton variant="outlined" onClick={() => setConfirmOpen(false)}>
              Cancel
            </CustomButton>
            <CustomButton onClick={handleConfirm}>Submit</CustomButton>
          </Box>
        </Box>
      </CustomDialog>
    </>
  );
}

export default ReferralDecisionSection;
