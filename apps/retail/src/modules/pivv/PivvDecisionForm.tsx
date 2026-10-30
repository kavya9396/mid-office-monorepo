import { useState } from "react";
import {
  CustomBox,
  CustomButton,
  CustomDialog,
  CustomSelect,
  CustomTable,
  CustomTextField,
  CustomTypography,
  type Column,
} from "@insurance-poc/ui";
import type { PivvDetails } from "../../services/pivvService";

/* ------------------------------------------------------------------ */
/* PIVV decision — styles/labels copied from pivv-drs-prototype.html    */
/* (components `Rbe` "PIVV Details" table + `zbe` Submit / "Confirm      */
/* Submit" dialog). Local state only; the prototype has no submit call.  */
/* ------------------------------------------------------------------ */

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

type PivvRow = PivvDetails & {
  pivvDecision: string;
  pivvRemark: string;
};

type PivvDecisionFormProps = {
  details: PivvDetails;
  decisionOptions: string[];
};

export function PivvDecisionForm({
  details,
  decisionOptions,
}: Readonly<PivvDecisionFormProps>) {
  const [decision, setDecision] = useState("");
  const [remark, setRemark] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const rows: PivvRow[] = [
    { ...details, pivvDecision: decision, pivvRemark: remark },
  ];

  const columns: Column<PivvRow>[] = [
    { key: "fupCode", header: "FUP Code", width: "9%" },
    { key: "profile", header: "Profile", width: "11%" },
    { key: "raisedDate", header: "Raised Date", width: "12%" },
    { key: "raisedRemark", header: "Raised Remark", width: "20%" },
    {
      key: "pivvDecision",
      header: "PIVV Decision",
      width: "22%",
      render: () => (
        <CustomSelect
          value={decision}
          onChange={setDecision}
          placeholder="Select PIVV decision"
          options={decisionOptions.map((option) => ({
            label: option,
            value: option,
          }))}
        />
      ),
    },
    {
      key: "pivvRemark",
      header: "PIVV Remark",
      width: "26%",
      render: () => (
        <CustomTextField
          fullWidth
          multiline
          minRows={1}
          maxRows={3}
          placeholder="Enter PIVV remark"
          value={remark}
          onChange={(event) => setRemark(event.target.value)}
          sx={{
            "& .MuiInputBase-root": {
              minHeight: 32,
              bgcolor: "#FFFFFF",
              fontSize: "10px",
              borderRadius: "4px",
            },
            "& .MuiInputBase-input": { py: 0.6, fontSize: "10px" },
            "& .MuiOutlinedInput-root": {
              "&:hover fieldset": { borderColor: "rgba(0, 0, 0, 0.87)" },
              "&.Mui-focused fieldset": { borderColor: "primary.main" },
            },
          }}
        />
      ),
    },
  ];

  return (
    <CustomBox data-testid="pivv-decision-form">
      <CustomBox sx={{ mt: 0.75 }}>
        <CustomTable<PivvRow>
          title="PIVV Details"
          columns={columns}
          data={rows}
        />
      </CustomBox>

      <CustomBox
        sx={{
          mt: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CustomButton
          type="button"
          onClick={() => setConfirmOpen(true)}
          sx={{ minWidth: 80, borderRadius: "50px", ...maroonContainedSx }}
        >
          Submit
        </CustomButton>
      </CustomBox>

      <CustomDialog
        open={confirmOpen}
        showCloseIcon
        onClose={() => setConfirmOpen(false)}
        title="Confirm Submit"
        maxWidth="xs"
        fullWidth
      >
        <CustomBox sx={{ p: 1 }}>
          <CustomTypography sx={{ fontSize: "14px", color: "#333" }}>
            Do you want to submit the case?
          </CustomTypography>
          <CustomBox sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 3 }}>
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
          </CustomBox>
        </CustomBox>
      </CustomDialog>
    </CustomBox>
  );
}
