import { useState } from "react";
import {
  CustomBox,
  CustomButton,
  CustomDialog,
  CustomSelect,
  CustomTextField,
} from "@insurance-poc/ui";

import { ADDITIONAL_REPORT_OPTION, SPECIAL_MEDICAL_OPTIONS } from "./types";

type MedicalReportDraft = {
  medicalTest: string;
  testDate: string;
  findings: string;
  examineeName: string;
  examineeAge: string;
  diagnosticCentreName: string;
  doctorName: string;
  doctorRegistrationNo: string;
  remarks: string;
};

type AddMedicalReportDialogProps = Readonly<{
  open: boolean;
  onClose: () => void;
  onSave: (draft: MedicalReportDraft) => void;
}>;

const EMPTY_DRAFT: MedicalReportDraft = {
  medicalTest: "",
  testDate: "",
  findings: "",
  examineeName: "",
  examineeAge: "",
  diagnosticCentreName: "",
  doctorName: "",
  doctorRegistrationNo: "",
  remarks: "",
};

const dialogTitle = (medicalTest: string) => {
  if (!medicalTest) return "Add Medical Report";
  if (medicalTest === ADDITIONAL_REPORT_OPTION) return "Add Additional Report";
  return `Add Special Medical Test - ${medicalTest}`;
};

const AddMedicalReportDialog = ({ open, onClose, onSave }: AddMedicalReportDialogProps) => {
  const [specialMedical, setSpecialMedical] = useState("");
  const [additionalReport, setAdditionalReport] = useState("");
  const [draft, setDraft] = useState(EMPTY_DRAFT);

  const medicalTest = specialMedical || additionalReport;

  const reset = () => {
    setSpecialMedical("");
    setAdditionalReport("");
    setDraft(EMPTY_DRAFT);
  };

  const close = () => {
    reset();
    onClose();
  };

  const update = (key: keyof MedicalReportDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  return (
    <CustomDialog
      open={open}
      onClose={close}
      title={dialogTitle(medicalTest)}
      maxWidth="md"
      actions={
        medicalTest ? (
          <CustomButton
            variant="contained"
            sx={{ minWidth: 82, borderRadius: "18px" }}
            onClick={() => {
              onSave({ ...draft, medicalTest });
              reset();
            }}
          >
            Save
          </CustomButton>
        ) : null
      }
    >
      <CustomBox
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
        }}
      >
        <CustomSelect
          label="Special Medical (Optional)"
          placeholder="Select"
          fullWidth
          value={specialMedical}
          options={SPECIAL_MEDICAL_OPTIONS.map((option) => ({
            label: option,
            value: option,
          }))}
          onChange={(value) => {
            setSpecialMedical(value);
            setAdditionalReport("");
          }}
        />
        <CustomSelect
          label="Additional Report (Optional)"
          placeholder="Select"
          fullWidth
          value={additionalReport}
          options={[{ label: ADDITIONAL_REPORT_OPTION, value: ADDITIONAL_REPORT_OPTION }]}
          onChange={(value) => {
            setAdditionalReport(value);
            setSpecialMedical("");
          }}
        />
      </CustomBox>

      {medicalTest ? (
        <CustomBox
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            mt: 2,
          }}
        >
          <CustomTextField
            labelText="Test date"
            type="date"
            fullWidth
            value={draft.testDate}
            onChange={(event) => update("testDate", event.target.value)}
          />
          <CustomTextField
            labelText="Findings"
            fullWidth
            value={draft.findings}
            onChange={(event) => update("findings", event.target.value)}
          />
          <CustomTextField
            labelText="Examinee name"
            fullWidth
            value={draft.examineeName}
            onChange={(event) => update("examineeName", event.target.value)}
          />
          <CustomTextField
            labelText="Examinee age"
            fullWidth
            value={draft.examineeAge}
            onChange={(event) => update("examineeAge", event.target.value)}
          />
          <CustomTextField
            labelText="Diagnostic centre"
            fullWidth
            value={draft.diagnosticCentreName}
            onChange={(event) => update("diagnosticCentreName", event.target.value)}
          />
          <CustomTextField
            labelText="Doctor name"
            fullWidth
            value={draft.doctorName}
            onChange={(event) => update("doctorName", event.target.value)}
          />
          <CustomTextField
            labelText="Doctor registration no."
            fullWidth
            value={draft.doctorRegistrationNo}
            onChange={(event) => update("doctorRegistrationNo", event.target.value)}
          />
          <CustomTextField
            labelText="Remarks"
            fullWidth
            value={draft.remarks}
            onChange={(event) => update("remarks", event.target.value)}
          />
        </CustomBox>
      ) : null}
    </CustomDialog>
  );
};

export default AddMedicalReportDialog;
export type { MedicalReportDraft };
