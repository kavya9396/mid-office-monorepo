import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Controller, useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Box, Typography } from "@mui/material";
import { Calendar, CustomButton, CustomDialog, CustomSelect, CustomSnackbar, CustomTextField } from "@insurance-poc/ui";
import { isNomineeBlank, NomineeDetails, type NomineeEditRow } from "./NomineeDetails";
import { isRiderBlank, RiderDetails, type RiderEditRow } from "./RiderDetails";
import { EMPTY_LOAN, LoanDetails, loanSchema, type LoanEditValues } from "./LoanDetails";

export type { NomineeEditRow, RiderEditRow, LoanEditValues };

const required = (label: string) => z.string().trim().min(1, `${label} is required`);

// Required rules / messages copied from the DVT branch of the prototype validator (vhe)
const editApplicantSchema = z.object({
  dobDocument: required("DOB Document"),
  genderDocument: required("Gender Document"),
  pincodeDocument: required("Pincode Document"),
  dob: required("Birthdate"),
  gender: required("Gender"),
  zipCode: required("Zip Code"),
  mobileNo: required("Mobile No"),
  immigrationStatus: required("Immigration Status"),
  panNumber: required("PAN No"),
  isPanValid: required("Is PAN Valid"),
  aadharSeedingStatus: required("Aadhar Seeding Status"),
  nsdlNameMatching: required("Is NSDL Name Matching"),
  nsdlDobMatching: required("Is NSDL DOB Matching"),
  nsdlTab: z.string(),
  // All Edit Profile fields are mandatory
  emailId: required("Email ID"),
  height: required("Height"),
  weight: required("Weight"),
  lifestyleHabits: required("Lifestyle Habits"),
  annualIncome: required("Annual Income"),
  applicantStatus: required("Applicant Status"),
});

// Base & Loan Details live in the same form under `loan`
const editFormSchema = editApplicantSchema.extend({ loan: loanSchema });

export type EditApplicantValues = z.infer<typeof editApplicantSchema>;
type EditFormValues = z.infer<typeof editFormSchema>;

export type EditSelectOption = { label: string; value: string };

/** Dropdown sources. In the prototype these come from the masterData API (gender, id_proof_type, resident_status). */
export type EditApplicantOptions = {
  gender: EditSelectOption[];
  idProofType: EditSelectOption[];
  residentStatus: EditSelectOption[];
};

export type EditApplicantDialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  initialValues?: Partial<EditApplicantValues>;
  initialNominees?: NomineeEditRow[];
  initialRiders?: RiderEditRow[];
  initialLoan?: LoanEditValues;
  options?: Partial<EditApplicantOptions>;
  onSave: (
    values: EditApplicantValues,
    nominees: NomineeEditRow[],
    riders: RiderEditRow[],
    loan: LoanEditValues,
  ) => void;
};

type FieldName = keyof EditApplicantValues;

type FieldConfig = {
  name: FieldName;
  label: string;
  select?: "gender" | "idProofType" | "residentStatus" | "yesNo";
  type?: "date";
  maxLength?: number;
  numeric?: boolean;
};

// Prototype C$ list: codes YES / NO
const YES_NO_OPTIONS: EditSelectOption[] = [
  { label: "Yes", value: "YES" },
  { label: "No", value: "NO" },
];

const EMPTY_VALUES: EditFormValues = {
  dobDocument: "",
  genderDocument: "",
  pincodeDocument: "",
  dob: "",
  gender: "",
  zipCode: "",
  mobileNo: "",
  immigrationStatus: "",
  panNumber: "",
  isPanValid: "",
  aadharSeedingStatus: "",
  nsdlNameMatching: "",
  nsdlDobMatching: "",
  nsdlTab: "",
  emailId: "",
  height: "",
  weight: "",
  lifestyleHabits: "",
  annualIncome: "",
  applicantStatus: "",
  loan: EMPTY_LOAN,
};

// Same order as the prototype's "Audit Fields" grid (the NSDL button follows nsdlDobMatching)
const AUDIT_FIELDS: FieldConfig[] = [
  { name: "dobDocument", label: "DOB Document", select: "idProofType" },
  { name: "genderDocument", label: "Gender Document", select: "idProofType" },
  { name: "pincodeDocument", label: "Pincode Document", select: "idProofType" },
  { name: "dob", label: "Birthdate", type: "date" },
  { name: "gender", label: "Gender", select: "gender" },
  { name: "zipCode", label: "Zip Code", maxLength: 6, numeric: true },
  { name: "mobileNo", label: "Mobile No", maxLength: 10, numeric: true },
  { name: "immigrationStatus", label: "Immigration Status", select: "residentStatus" },
  { name: "panNumber", label: "PAN No", maxLength: 10 },
  { name: "isPanValid", label: "Is PAN Valid?", select: "yesNo" },
  { name: "aadharSeedingStatus", label: "Aadhar Seeding Status?", select: "yesNo" },
  { name: "nsdlNameMatching", label: "Is NSDL Name Matching?", select: "yesNo" },
  { name: "nsdlDobMatching", label: "Is NSDL DOB Matching?", select: "yesNo" },
];

const PROFILE_FIELDS: FieldConfig[] = [
  { name: "emailId", label: "Email ID" },
  { name: "height", label: "Height" },
  { name: "weight", label: "Weight" },
  { name: "lifestyleHabits", label: "Lifestyle Habits" },
  { name: "annualIncome", label: "Annual Income" },
  { name: "applicantStatus", label: "Applicant Status" },
];

// Prototype input sanitising (T handler)
const sanitize = (field: FieldConfig, value: string) => {
  if (field.name === "panNumber") return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  if (field.numeric) return value.replace(/\D/g, "").slice(0, field.maxLength);
  return value;
};

const sectionTitleSx = { color: "#444", fontSize: "14px", fontWeight: 700, mb: 1 };
const gridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
  gap: 1,
};

export function EditApplicantDialog({
  open,
  onClose,
  title = "EDIT MEMBER PROFILE",
  initialValues,
  initialNominees,
  initialRiders,
  initialLoan,
  options,
  onSave,
}: Readonly<EditApplicantDialogProps>) {
  const [nominees, setNominees] = useState<NomineeEditRow[]>([]);
  const [riders, setRiders] = useState<RiderEditRow[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      reset({ ...EMPTY_VALUES, ...initialValues, loan: initialLoan ?? EMPTY_LOAN });
      setNominees(initialNominees ?? []);
      setRiders(initialRiders ?? []);
    }
  }, [open, initialValues, initialNominees, initialRiders, initialLoan, reset]);

  const handleSave = handleSubmit(({ loan, ...values }) => {
    if (nominees.some((nominee) => isNomineeBlank(nominee))) {
      setNotice("Blank nominee values cannot be added. Please complete or delete the nominee row.");
      return;
    }
    if (riders.some((rider) => isRiderBlank(rider))) {
      setNotice("Blank rider values cannot be added. Please complete or delete the rider row.");
      return;
    }
    onSave(values, nominees, riders, loan);
  });

  const optionsFor = (select: NonNullable<FieldConfig["select"]>) => {
    switch (select) {
      case "gender":
        return options?.gender ?? [];
      case "idProofType":
        return options?.idProofType ?? [];
      case "residentStatus":
        return options?.residentStatus ?? [];
      case "yesNo":
        return YES_NO_OPTIONS;
    }
  };

  const renderControl = (field: FieldConfig, controlled: ControllerRenderProps<EditFormValues, FieldName>) => {
    const error = !!errors[field.name];
    const helperText = errors[field.name]?.message;

    if (field.type === "date") {
      return (
        <Calendar
          label={field.label}
          value={controlled.value ? dayjs(controlled.value) : null}
          onChange={(date) => controlled.onChange(date?.isValid() ? date.format("YYYY-MM-DD") : "")}
          disableTodayAndFuture={false}
          maxDate={dayjs()}
          error={error}
          helperText={helperText}
        />
      );
    }

    if (field.select) {
      return (
        <CustomSelect
          label={field.label}
          value={controlled.value}
          onChange={controlled.onChange}
          options={optionsFor(field.select)}
          error={error}
          helperText={helperText}
        />
      );
    }

    return (
      <CustomTextField
        labelText={field.label}
        value={controlled.value}
        onChange={(e) => controlled.onChange(sanitize(field, e.target.value))}
        onBlur={controlled.onBlur}
        error={error}
        helperText={helperText}
        htmlInputProps={{
          id: field.name,
          ...(field.maxLength ? { maxLength: field.maxLength } : {}),
          ...(field.numeric ? { inputMode: "numeric" as const } : {}),
        }}
        fullWidth
      />
    );
  };

  const renderField = (field: FieldConfig) => (
    <Controller
      key={field.name}
      name={field.name}
      control={control}
      render={({ field: controlled }) => renderControl(field, controlled)}
    />
  );

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      title={
        <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
          {title}
        </Typography>
      }
      actionsSx={{ justifyContent: "center" }}
      actions={
        <CustomButton onClick={handleSave} sx={{ px: 4, borderRadius: "50px" }}>
          Save
        </CustomButton>
      }
    >
      <Box sx={{ backgroundColor: "#F6F6F6", borderRadius: 2, p: 2 }}>
        <Typography sx={sectionTitleSx}>Audit Fields</Typography>
        <Box sx={gridSx}>
          {AUDIT_FIELDS.map(renderField)}
          <Box sx={{ display: "flex", alignItems: "end" }}>
            <CustomButton
              type="button"
              variant="outlined"
              onClick={() => setValue("nsdlTab", "Y")}
              // sx={{ minWidth: 64, height: 36 }}
            >
              NSDL
            </CustomButton>
          </Box>
        </Box>

        <Box sx={{ my: 2, borderTop: "1px solid rgba(0, 0, 0, 0.12)" }} />

        <Typography sx={sectionTitleSx}>Edit Profile</Typography>
        <Box sx={gridSx}>{PROFILE_FIELDS.map(renderField)}</Box>

        <Box sx={{ my: 2, borderTop: "1px solid rgba(0, 0, 0, 0.12)" }} />

        <NomineeDetails nominees={nominees} onChange={setNominees} onNotify={setNotice} />

        <Box sx={{ my: 2, borderTop: "1px solid rgba(0, 0, 0, 0.12)" }} />

        <RiderDetails riders={riders} onChange={setRiders} onNotify={setNotice} />

        <Box sx={{ my: 2, borderTop: "1px solid rgba(0, 0, 0, 0.12)" }} />

        <Controller
          name="loan"
          control={control}
          render={({ field }) => <LoanDetails values={field.value} onChange={field.onChange} errors={errors.loan} />}
        />
      </Box>

      <CustomSnackbar
        open={Boolean(notice)}
        message={notice ?? ""}
        severity="error"
        onClose={() => setNotice(null)}
      />
    </CustomDialog>
  );
}

export default EditApplicantDialog;
