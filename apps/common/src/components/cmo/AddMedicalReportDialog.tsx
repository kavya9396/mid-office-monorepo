import { useMemo, useState } from "react";
import {
  CustomBox,
  CustomButton,
  CustomDialog,
  CustomSelect,
  CustomTextField,
} from "@insurance-poc/ui";

import { SpecialMedicalField, specialMedicalFieldErrors } from "./SpecialMedicalField";
import {
  ADDITIONAL_REPORT_FIELDS,
  EMPTY_ADDITIONAL_REPORT,
  getAdditionalReportOptions,
  type AdditionalReportValues,
} from "./additionalReportOptions";
import { draftFromSpecialMedical, findSpecialMedicalSection } from "./specialMedicalForm";
import { getSpecialMedicalOptions, SPECIAL_MEDICAL_FIELDS_MISSING_MESSAGE, SPECIAL_MEDICAL_MASTER_EMPTY_MESSAGE } from "./specialMedicalOptions";

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
  /** Every field from the matched Special Medical section, keyed by its label. */
  values?: Readonly<Record<string, string>>;
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

const dialogTitle = (specialMedical: string, additionalReport: string) => {
  if (additionalReport) return `Add Additional Report - ${additionalReport}`;
  if (specialMedical) return `Add Special Medical Test - ${specialMedical}`;
  return "Add Medical Report";
};

const AddMedicalReportDialog = ({ open, onClose, onSave }: AddMedicalReportDialogProps) => {
  const [specialMedical, setSpecialMedical] = useState("");
  const [additionalReport, setAdditionalReport] = useState("");
  const [additionalValues, setAdditionalValues] = useState<AdditionalReportValues>(EMPTY_ADDITIONAL_REPORT);
  const [additionalErrors, setAdditionalErrors] = useState<Partial<AdditionalReportValues>>({});
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const specialMedicalOptions = useMemo(() => (open ? getSpecialMedicalOptions() : []), [open]);
  const additionalReportOptions = useMemo(() => (open ? getAdditionalReportOptions() : []), [open]);
  const specialSection = useMemo(
    () => findSpecialMedicalSection(specialMedical),
    [specialMedical],
  );

  const medicalTest = specialMedical || additionalReport;
  const missingMasterData = open && specialMedicalOptions.length === 0;
  const missingAdditionalMaster = open && additionalReportOptions.length === 0;
  const missingMedicalFields = specialMedical.length > 0 && !specialSection;
  const specialMedicalMessage = missingMasterData
    ? SPECIAL_MEDICAL_MASTER_EMPTY_MESSAGE
    : missingMedicalFields
      ? SPECIAL_MEDICAL_FIELDS_MISSING_MESSAGE
      : undefined;

  const reset = () => {
    setSpecialMedical("");
    setAdditionalReport("");
    setAdditionalValues(EMPTY_ADDITIONAL_REPORT);
    setAdditionalErrors({});
    setFieldValues({});
    setFieldErrors({});
  };

  const close = () => {
    reset();
    onClose();
  };

  const saveAdditionalReport = () => {
    if (additionalValues.reportName.trim().length === 0) {
      setAdditionalErrors({ reportName: "Report Name is required" });
      return;
    }
    onSave({
      ...EMPTY_DRAFT,
      medicalTest: additionalReport,
      testDate: additionalValues.reportDate,
      findings: additionalValues.findings,
      remarks: additionalValues.remarks,
      values: {
        "Report Name": additionalValues.reportName,
        "Report Date": additionalValues.reportDate,
        Findings: additionalValues.findings,
        Remarks: additionalValues.remarks,
      },
    });
    reset();
  };

  return (
    <CustomDialog
      open={open}
      onClose={close}
      title={dialogTitle(specialMedical, additionalReport)}
      maxWidth="md"
      actions={
        (specialSection || additionalReport) ? (
          <CustomButton
            variant="contained"
            sx={{ minWidth: 82, borderRadius: "18px" }}
            onClick={() => {
              if (specialSection) {
                const errors = specialMedicalFieldErrors(specialSection, fieldValues);
                setFieldErrors(errors);
                if (Object.keys(errors).length > 0) return;
                onSave(draftFromSpecialMedical(medicalTest, fieldValues));
                reset();
                return;
              }
              saveAdditionalReport();
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
          placeholder={missingMasterData ? SPECIAL_MEDICAL_MASTER_EMPTY_MESSAGE : "Select"}
          fullWidth
          disabled={missingMasterData}
          error={Boolean(specialMedicalMessage)}
          helperText={specialMedicalMessage}
          value={specialMedical}
          options={specialMedicalOptions}
          onChange={(value) => {
            setSpecialMedical(value);
            setAdditionalReport("");
            setAdditionalValues(EMPTY_ADDITIONAL_REPORT);
            setAdditionalErrors({});
            setFieldValues({});
            setFieldErrors({});
          }}
        />
        <CustomSelect
          label="Additional Report (Optional)"
          placeholder={missingAdditionalMaster ? SPECIAL_MEDICAL_MASTER_EMPTY_MESSAGE : "Select"}
          fullWidth
          disabled={missingAdditionalMaster}
          error={missingAdditionalMaster}
          helperText={missingAdditionalMaster ? SPECIAL_MEDICAL_MASTER_EMPTY_MESSAGE : undefined}
          value={additionalReport}
          options={additionalReportOptions}
          onChange={(value) => {
            setAdditionalReport(value);
            setSpecialMedical("");
            setAdditionalValues(EMPTY_ADDITIONAL_REPORT);
            setAdditionalErrors({});
            setFieldValues({});
            setFieldErrors({});
          }}
        />
      </CustomBox>

      {specialSection ? (
        <CustomBox
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: `repeat(${specialSection.cols}, minmax(0, 1fr))` },
            gap: 2,
            mt: 2,
          }}
        >
          {specialSection.fields.map(([label, , required]) => (
            <SpecialMedicalField
              key={`${specialSection.key}-${label}`}
              section={specialSection}
              label={label}
              configRequired={Boolean(required)}
              value={fieldValues[label] ?? ""}
              error={fieldErrors[label]}
              onChange={(next) => {
                setFieldValues((current) => ({ ...current, [label]: next }));
                setFieldErrors((current) => {
                  if (!current[label]) return current;
                  const next = { ...current };
                  delete next[label];
                  return next;
                });
              }}
            />
          ))}
        </CustomBox>
      ) : null}

      {additionalReport ? (
        <CustomBox
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            mt: 2,
          }}
        >
          {ADDITIONAL_REPORT_FIELDS.map((field) => (
            <CustomTextField
              key={field.key}
              labelText={field.required ? `${field.label} *` : field.label}
              type={field.type}
              fullWidth
              value={additionalValues[field.key]}
              error={Boolean(additionalErrors[field.key])}
              helperText={additionalErrors[field.key]}
              onChange={(event) => {
                const next = event.target.value;
                setAdditionalValues((current) => ({ ...current, [field.key]: next }));
                setAdditionalErrors((current) => ({ ...current, [field.key]: undefined }));
              }}
            />
          ))}
        </CustomBox>
      ) : null}
    </CustomDialog>
  );
};

export default AddMedicalReportDialog;
export type { MedicalReportDraft };
