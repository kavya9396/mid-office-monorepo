import { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  Calendar,
  CustomBox,
  CustomButton,
  CustomDialog,
  CustomSelect,
  CustomSnackbar,
  CustomTextField,
  CustomTypography,
} from "@insurance-poc/ui";
import { getMasterList, RegexPatterns } from "@insurance-poc/utils";

export type CvtEditApplicantValues = {
  dob: string;
  gender: string;
  residentialStatus: string;
  panNumber: string;
  panFlag: string;
  pranNumber: string;
  identityProof: string;
  ageProof: string;
  addressProof: string;
  communicationPincode: string;
  permanentPincode: string;
};

export type CvtSelectOption = { label: string; value: string };

/** Dropdown sources from session masterData: `gender`, `resident_status`, `misc` (IDENTITY / AGE / ADDRESS). */
export type CvtEditApplicantOptions = {
  gender: CvtSelectOption[];
  residentStatus: CvtSelectOption[];
  identityProof: CvtSelectOption[];
  ageProof: CvtSelectOption[];
  addressProof: CvtSelectOption[];
};

export type CvtEditApplicantDialogProps = {
  onClose: () => void;
  initialValues: CvtEditApplicantValues;
  onSave: (values: CvtEditApplicantValues) => void;
};

const MISC_PROOF_TYPE = {
  IDENTITY: "IDENTITY",
  AGE: "AGE",
  ADDRESS: "ADDRESS",
} as const;

const toActiveOptions = (masterType: string, type?: string): CvtSelectOption[] =>
  getMasterList(masterType, type)
    .filter((entry) => entry.isActive === "Y")
    .map((entry) => ({ label: entry.description, value: entry.code }));

type FieldKey = keyof CvtEditApplicantValues;
type FieldErrors = Partial<Record<FieldKey, string>>;

type FieldDef = {
  key: FieldKey;
  label: string;
  select?: keyof CvtEditApplicantOptions;
  type?: "date";
  maxLength?: number;
  numeric?: boolean;
  disabled?: boolean;
};
  
const PERSONAL_KYC_FIELDS: FieldDef[] = [
  { key: "dob", label: "DOB", type: "date" },
  { key: "gender", label: "Gender", select: "gender" },
  { key: "residentialStatus", label: "Residential Status", select: "residentStatus" },
  { key: "panNumber", label: "PAN Number", maxLength: 10 },
  { key: "panFlag", label: "PAN Flag", disabled: true },
  { key: "pranNumber", label: "PRAN Number", maxLength: 12, numeric: true },
  { key: "identityProof", label: "Identity Proof", select: "identityProof" },
  { key: "ageProof", label: "Age Proof", select: "ageProof" },
];

const CONTACT_ADDRESS_FIELDS: FieldDef[] = [
  { key: "addressProof", label: "Address Proof", select: "addressProof" },
  { key: "communicationPincode", label: "Comm. Pincode", maxLength: 6, numeric: true },
  { key: "permanentPincode", label: "Perm. Pincode", maxLength: 6, numeric: true },
];

const LABELS: Record<FieldKey, string> = {
  dob: "DOB",
  gender: "Gender",
  residentialStatus: "Residential Status",
  panNumber: "PAN Number",
  panFlag: "PAN Flag",
  pranNumber: "PRAN Number",
  identityProof: "Identity Proof",
  ageProof: "Age Proof",
  addressProof: "Address Proof",
  communicationPincode: "Comm. Pincode",
  permanentPincode: "Perm. Pincode",
};

const REQUIRED_KEYS: FieldKey[] = [
  "dob",
  "gender",
  "residentialStatus",
  "panNumber",
  "identityProof",
  "ageProof",
  "addressProof",
  "communicationPincode",
  "permanentPincode",
];

const SELECT_KEYS: FieldKey[] = ["gender", "residentialStatus", "identityProof", "ageProof", "addressProof"];

const labelSx = { fontSize: "14px", fontWeight: 400, color: "#444", mb: 1 };
const sectionTitleSx = { color: "#444", fontSize: "14px", fontWeight: 700, mb: 1 };
const errorSx = { color: "#d32f2f", fontSize: "12px", mt: 0.5 };
const gridSx = (gap: number) => ({
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
  gap,
});

const DATE_VALUE_FORMAT = "YYYY-MM-DD";

const sanitize = (key: FieldKey, value: string): string => {
  if (key === "panNumber") return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  if (key === "pranNumber") return value.replace(/\D/g, "").slice(0, 12);
  if (key === "communicationPincode" || key === "permanentPincode") return value.replace(/\D/g, "").slice(0, 6);
  return value;
};

const validate = (values: CvtEditApplicantValues): FieldErrors => {
  const errors: FieldErrors = {};

  REQUIRED_KEYS.forEach((key) => {
    if (!values[key].trim()) errors[key] = `${LABELS[key]} is required`;
  });
  SELECT_KEYS.forEach((key) => {
    if (!values[key].trim()) errors[key] = `Please select ${LABELS[key]}`;
  });

  if (values.dob) {
    const dob = new Date(values.dob);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(dob.getTime())) errors.dob = "Enter a valid DOB";
    else if (dob > today) errors.dob = "DOB cannot be in the future";
  }

  const pan = values.panNumber.trim().toUpperCase();
  if (pan) {
    if (pan.length !== 10) errors.panNumber = "PAN Number must be exactly 10 characters";
    else if (!RegexPatterns.pan.test(pan)) errors.panNumber = "Enter a valid PAN Number";
  }

  const pran = values.pranNumber.trim();
  if (pran && !/^\d{12}$/.test(pran)) errors.pranNumber = "PRAN Number must be exactly 12 digits";

  const commPincode = values.communicationPincode.trim();
  if (commPincode && !/^\d{6}$/.test(commPincode)) errors.communicationPincode = "Comm. Pincode must be exactly 6 digits";

  const permPincode = values.permanentPincode.trim();
  if (permPincode && !/^\d{6}$/.test(permPincode)) errors.permanentPincode = "Perm. Pincode must be exactly 6 digits";

  return errors;
};

type Notice = { message: string; severity: "success" | "error" | "warning" | "info" };

/**
 * Edit dialog of the Retail CVT DRS (fields from `cvt-drs-prototype.html`): Personal & KYC and
 * Contact & Address. Plugged into `LifeAssured` through `renderEditDialog`. UI only: Save hands the
 * values to `onSave`; the API call is integrated later.
 */
export function CvtEditApplicantDialog({
  onClose,
  initialValues,
  onSave,
}: Readonly<CvtEditApplicantDialogProps>) {
  const options = useMemo<CvtEditApplicantOptions>(
    () => ({
      gender: toActiveOptions("gender"),
      residentStatus: toActiveOptions("resident_status"),
      identityProof: toActiveOptions("misc", MISC_PROOF_TYPE.IDENTITY),
      ageProof: toActiveOptions("misc", MISC_PROOF_TYPE.AGE),
      addressProof: toActiveOptions("misc", MISC_PROOF_TYPE.ADDRESS),
    }),
    [],
  );
  const [values, setValues] = useState<CvtEditApplicantValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const clearError = (key: FieldKey) =>
    setErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });

  const changeValue = (key: FieldKey, rawValue: string) => {
    if (key === "panFlag") return;
    const value = sanitize(key, rawValue);
    setValues((current) => {
      const next = { ...current, [key]: value };
      // Editing PAN Number or DOB makes the stored PAN flag stale
      if (key === "panNumber" || key === "dob") {
        const changed =
          next.panNumber.trim().toUpperCase() !== initialValues.panNumber.trim().toUpperCase() ||
          next.dob !== initialValues.dob;
        next.panFlag = changed ? "Non-Verified" : initialValues.panFlag;
      }
      return next;
    });
    clearError(key);
  };

  const panUnchangedAndVerified =
    values.panFlag === "Verified" &&
    values.panNumber.trim().toUpperCase() === initialValues.panNumber.trim().toUpperCase() &&
    values.dob === initialValues.dob;

  const handleRevalidatePan = () => {
    const pan = values.panNumber.trim().toUpperCase();
    if (!pan) {
      setErrors((current) => ({ ...current, panNumber: "PAN Number is required" }));
      setNotice({ message: "Please enter PAN Number before revalidation", severity: "warning" });
      return;
    }
    if (!RegexPatterns.pan.test(pan)) {
      setErrors((current) => ({ ...current, panNumber: "Enter a valid PAN Number" }));
      setNotice({ message: "Please enter a valid PAN Number", severity: "warning" });
      return;
    }
    clearError("panNumber");
    setNotice({ message: "PAN is ready for revalidation", severity: "info" });
  };

  const handleSave = () => {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    onSave({ ...values, panNumber: values.panNumber.trim().toUpperCase() });
  };

  const renderField = (field: FieldDef) => {
    const error = errors[field.key];

    if (field.type === "date") {
      return (
        <CustomBox key={field.key}>
          <CustomTypography sx={labelSx}>{field.label}</CustomTypography>
          <Calendar
            value={values[field.key] ? dayjs(values[field.key]) : null}
            onChange={(date) => changeValue(field.key, date?.isValid() ? date.format(DATE_VALUE_FORMAT) : "")}
            disableTodayAndFuture={false}
            maxDate={dayjs()}
            error={Boolean(error)}
          />
          {error && <CustomTypography sx={errorSx}>{error}</CustomTypography>}
        </CustomBox>
      );
    }

    return (
      <CustomBox key={field.key}>
        <CustomTypography sx={labelSx}>{field.label}</CustomTypography>
        {field.select ? (
          <CustomSelect
            value={values[field.key]}
            onChange={(value) => changeValue(field.key, value)}
            options={options[field.select]}
            error={Boolean(error)}
          />
        ) : (
          <CustomTextField
            value={values[field.key]}
            onChange={(event) => changeValue(field.key, event.target.value)}
            disabled={field.disabled}
            error={Boolean(error)}
            htmlInputProps={{
              ...(field.maxLength ? { maxLength: field.maxLength } : {}),
              ...(field.numeric ? { inputMode: "numeric" as const } : {}),
            }}
            fullWidth
          />
        )}
        {error && <CustomTypography sx={errorSx}>{error}</CustomTypography>}
      </CustomBox>
    );
  };

  return (
    <>
      <CustomDialog
        open
        onClose={onClose}
        maxWidth="md"
        title={
          <CustomTypography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
            EDIT APPLICANT PROFILE
          </CustomTypography>
        }
        actionsSx={{ justifyContent: "center", pb: 2 }}
        actions={
          <>
            <CustomButton
              type="button"
              variant="outlined"
              onClick={handleRevalidatePan}
              disabled={panUnchangedAndVerified}
              sx={{ px: 4, borderRadius: "50px" }}
            >
              Revalidate PAN
            </CustomButton>
            <CustomButton onClick={handleSave} sx={{ px: 4, borderRadius: "50px" }}>
              Save
            </CustomButton>
          </>
        }
      >
        <CustomBox sx={{ backgroundColor: "#F6F6F6", borderRadius: 2, p: 2 }}>
          <CustomBox>
            <CustomTypography sx={sectionTitleSx}>Personal & KYC</CustomTypography>
            <CustomBox sx={gridSx(1)}>{PERSONAL_KYC_FIELDS.map(renderField)}</CustomBox>
          </CustomBox>

          <CustomBox sx={{ my: 2, borderTop: "1px solid rgba(0, 0, 0, 0.12)" }} />

          <CustomBox>
            <CustomTypography sx={sectionTitleSx}>Contact & Address</CustomTypography>
            <CustomBox sx={gridSx(2)}>{CONTACT_ADDRESS_FIELDS.map(renderField)}</CustomBox>
          </CustomBox>
        </CustomBox>
      </CustomDialog>

      <CustomSnackbar
        open={Boolean(notice)}
        message={notice?.message ?? ""}
        severity={notice?.severity ?? "info"}
        onClose={() => setNotice(null)}
      />
    </>
  );
}

export default CvtEditApplicantDialog;
