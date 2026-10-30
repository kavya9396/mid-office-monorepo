import { useState } from "react";
import { Box, MenuItem, Typography } from "@mui/material";
import { CustomButton, CustomDialog, CustomTextField } from "@insurance-poc/ui";

/* ------------------------------------------------------------------ */
/* MAS decision form — styles/labels copied from mas-drs-prototype.html */
/* (component `oSe`, form block + "Confirm Submit" dialog).             */
/* The prototype uses default MUI TextField styling (4px radius, 16px   */
/* text) and maroon `hY` buttons, so those are applied via `sx` below.  */
/* ------------------------------------------------------------------ */

const MAS_DECISIONS = [
  "Accept",
  "Reject",
  "Raise Requirement",
  "Refer to IT",
] as const;

const fieldSx = {
  "& .MuiInputBase-input": { fontSize: "16px" },
  "& .MuiOutlinedInput-root": {
    borderRadius: "4px",
    "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.87)" },
    "&.Mui-focused fieldset": { borderColor: "primary.main" },
  },
};

const maroonContainedSx = {
  bgcolor: "#9A2529",
  "&:hover": { bgcolor: "#8f2026" },
};

const maroonOutlinedSx = {
  borderColor: "#9A2529",
  color: "#9A2529",
  "&:hover": {
    borderColor: "#8f2026",
    color: "#9A2529",
    bgcolor: "rgba(176,42,48,0.08)",
  },
};

export function MasDecisionForm() {
  const [dateOfPremiumDebit, setDateOfPremiumDebit] = useState("");
  const [dateOfEmailReceived, setDateOfEmailReceived] = useState("");
  const [eopsReferenceNumber, setEopsReferenceNumber] = useState("");
  const [masDecision, setMasDecision] = useState("");
  const [remarks, setRemarks] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <Box data-testid="mas-decision-form">
      <Box
        sx={{
          mt: 0.75,
          p: { xs: 1, sm: 1.25 },
          display: "grid",
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
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
        <Box>
          <Typography>Date of Premium Debit</Typography>
          <CustomTextField
            type="date"
            value={dateOfPremiumDebit}
            onChange={(event) => setDateOfPremiumDebit(event.target.value)}
            fullWidth
            sx={fieldSx}
          />
        </Box>

        <Box>
          <Typography>Date of Email received from Frontline</Typography>
          <CustomTextField
            type="date"
            value={dateOfEmailReceived}
            onChange={(event) => setDateOfEmailReceived(event.target.value)}
            fullWidth
            sx={fieldSx}
          />
        </Box>

        <Box>
          <Typography>Eops Reference number</Typography>
          <CustomTextField
            value={eopsReferenceNumber}
            onChange={(event) => setEopsReferenceNumber(event.target.value)}
            fullWidth
            sx={fieldSx}
          />
        </Box>

        <Box>
          <Typography>MAS Decision</Typography>
          <CustomTextField
            select
            value={masDecision}
            onChange={(event) => setMasDecision(event.target.value)}
            fullWidth
            sx={fieldSx}
          >
            {MAS_DECISIONS.map((decision) => (
              <MenuItem key={decision} value={decision}>
                {decision}
              </MenuItem>
            ))}
          </CustomTextField>
        </Box>

        <Box>
          <Typography>Remarks</Typography>
          <CustomTextField
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            fullWidth
            sx={fieldSx}
          />
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          mt: 1,
        }}
      >
        <CustomButton
          type="button"
          onClick={() => setConfirmOpen(true)}
          sx={{ minWidth: 80, borderRadius: "50px", ...maroonContainedSx }}
        >
          Submit
        </CustomButton>
      </Box>

      <CustomDialog
        open={confirmOpen}
        showCloseIcon
        onClose={() => setConfirmOpen(false)}
        title="Confirm Submit"
        maxWidth="xs"
        fullWidth
      >
        <Box sx={{ p: 1 }}>
          <Typography sx={{ fontSize: "14px", color: "#333" }}>
            Do you want to submit the case?
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
            <CustomButton
              variant="outlined"
              onClick={() => setConfirmOpen(false)}
              sx={maroonOutlinedSx}
            >
              Cancel
            </CustomButton>
            <CustomButton
              onClick={() => setConfirmOpen(false)}
              sx={maroonContainedSx}
            >
              Submit
            </CustomButton>
          </Box>
        </Box>
      </CustomDialog>
    </Box>
  );
}
