import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { Controller, useForm, type ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Typography } from "@mui/material";
import { Calendar, CustomButton, CustomDialog, CustomSelect, CustomSnackbar, CustomTextField } from "@insurance-poc/ui";
import { isNomineeBlank, NomineeDetails, type NomineeEditRow } from "./NomineeDetails";
import { isRiderBlank, RiderDetails, type RiderEditRow } from "./RiderDetails";
import { EMPTY_LOAN, LoanDetails, type LoanEditValues } from "./LoanDetails";
import {
  buildNsdlNotice,
  editFormSchema,
  isPanValidated,
  PAN_VALID_YES,
  panFlagFromValidation,
  nsdlSelectValues,
  resetPanFlagOnChange,
  type EditApplicantValues,
  type EditFormValues,
  type PanStatus,
  type PanValidationInput,
  type PanValidationResult,
} from "./editApplicant.validation";
import {
  BLANK_NOMINEE_MESSAGE,
  BLANK_RIDER_MESSAGE,
  PAN_NOT_VALIDATED_MESSAGE,
  PAN_VALIDATION_FAILED_MESSAGE,
} from "./editApplicant.messages";

export type { NomineeEditRow, RiderEditRow, LoanEditValues, EditApplicantValues };

export type EditSelectOption = { label: string; value: string };

/**
 * Dropdown sources from the masterData API: gender, resident_status and the `misc` list filtered by
 * type (AGE -> DOB Document, IDENTITY -> Gender Document, ADDRESS -> Pincode Document, YESNO -> Yes/No fields).
 */
export type EditApplicantOptions = {
  gender: EditSelectOption[];
  yesNo: EditSelectOption[];
  dobDocument: EditSelectOption[];
  genderDocument: EditSelectOption[];
  pincodeDocument: EditSelectOption[];
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
  /**
   * Validates the PAN with NSDL. When given, the NSDL button calls it, "Is PAN Valid?" is set only by its
   * result, and Save is refused until the PAN is validated. It must not reject: report failures in the result.
   */
  onValidatePan?: (input: PanValidationInput) => Promise<PanValidationResult>;
  /**
   * PAN, Birthdate and flag remembered by the app from the last NSDL validation. Applied each time the dialog
   * opens, so the state survives closing and reopening. Changing it while the dialog is open does not reset the form.
   */
  panStatus?: PanStatus;
  /** Fires when the PAN flag changes (NSDL result, or PAN No / Birthdate edited after a successful validation). */
  onPanStatusChange?: (status: PanStatus) => void;
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
  select?: "gender" | "dobDocument" | "genderDocument" | "pincodeDocument" | "residentStatus" | "yesNo";
  type?: "date";
  maxLength?: number;
  numeric?: boolean;
};

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
  { name: "dobDocument", label: "DOB Document", select: "dobDocument" },
  { name: "genderDocument", label: "Gender Document", select: "genderDocument" },
  { name: "pincodeDocument", label: "Pincode Document", select: "pincodeDocument" },
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

// Filled only from the NSDL API response; disabled once the app supplies onValidatePan
const READ_ONLY_API_FIELDS: ReadonlyArray<string> = [
  "isPanValid",
  "aadharSeedingStatus",
  "nsdlNameMatching",
  "nsdlDobMatching",
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
  onValidatePan,
  panStatus,
  onPanStatusChange,
  onSave,
}: Readonly<EditApplicantDialogProps>) {
  const panStatusRef = useRef(panStatus);
  panStatusRef.current = panStatus;
  const onValidatePanRef = useRef(onValidatePan);
  onValidatePanRef.current = onValidatePan;
  const [nominees, setNominees] = useState<NomineeEditRow[]>([]);
  const [riders, setRiders] = useState<RiderEditRow[]>([]);
  const [notice, setNotice] = useState<{ message: string; severity: "error" | "success" } | null>(null);
  const [validatingPan, setValidatingPan] = useState(false);
  const notifyError = (message: string) => setNotice({ message, severity: "error" });
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: EMPTY_VALUES,
  });

  useEffect(() => {
    if (open) {
      const status = panStatusRef.current;
      reset({
        ...EMPTY_VALUES,
        ...initialValues,
        ...(onValidatePanRef.current
          ? {
              // Only the last NSDL response may fill these; values from initialValues are dropped.
              nsdlNameMatching: status?.nsdlNameMatching ?? "",
              nsdlDobMatching: status?.nsdlDobMatching ?? "",
              aadharSeedingStatus: status?.aadharSeedingStatus ?? "",
            }
          : {}),
        ...status,
        loan: initialLoan ?? EMPTY_LOAN,
      });
      setNominees(initialNominees ?? []);
      setRiders(initialRiders ?? []);
    }
  }, [open, initialValues, initialNominees, initialRiders, initialLoan, reset]);

  const submit = handleSubmit(({ loan, ...values }) => {
    if (nominees.some((nominee) => isNomineeBlank(nominee))) {
      notifyError(BLANK_NOMINEE_MESSAGE);
      return;
    }
    if (riders.some((rider) => isRiderBlank(rider))) {
      notifyError(BLANK_RIDER_MESSAGE);
      return;
    }
    onSave(values, nominees, riders, loan);
  });

  const handleSave = () => {
    if (onValidatePan && !isPanValidated(getValues("isPanValid"))) {
      notifyError(PAN_NOT_VALIDATED_MESSAGE);
      return;
    }
    return submit();
  };

  // Editing PAN No or Birthdate after a successful validation sends the flag back to NO (nsdl-pan-validate.md, Q10).
  // The app is told about every such edit once it holds a status, so it can drop a "PAN invalid" block.
  const resetPanFlagIfEdited = (next: { panNumber: string; dob: string }) => {
    if (!onValidatePan) return;
    const current = getValues();
    const flag = current.isPanValid === PAN_VALID_YES ? resetPanFlagOnChange(current, next) : current.isPanValid;
    if (flag !== current.isPanValid) setValue("isPanValid", flag);
    const known = panStatusRef.current;
    if (known && (known.panNumber !== next.panNumber || known.dob !== next.dob)) {
      onPanStatusChange?.({
        ...next,
        isPanValid: flag,
        nsdlNameMatching: current.nsdlNameMatching,
        nsdlDobMatching: current.nsdlDobMatching,
        aadharSeedingStatus: current.aadharSeedingStatus,
      });
    }
  };

  const handleNsdl = async () => {
    if (!onValidatePan) {
      setValue("nsdlTab", "Y");
      return;
    }
    if (!(await trigger(["panNumber", "dob"]))) return;
    const { panNumber, dob } = getValues();
    setValidatingPan(true);
    try {
      const result = await onValidatePan({ panNumber, dob });
      // The three NSDL selects follow the response; data that is not available gives NO (add-on #17).
      const matched = nsdlSelectValues(result.matches);
      setValue("nsdlNameMatching", matched.nsdlNameMatching);
      setValue("nsdlDobMatching", matched.nsdlDobMatching);
      setValue("aadharSeedingStatus", matched.aadharSeedingStatus);
      if (result.panValid !== undefined) {
        const flag = panFlagFromValidation(result.panValid);
        setValue("isPanValid", flag);
        onPanStatusChange?.({ panNumber, dob, isPanValid: flag, ...matched });
      }
      const apiMessage = result.message.trim() || (result.panValid === true ? "" : PAN_VALIDATION_FAILED_MESSAGE);
      const text = buildNsdlNotice(apiMessage, result.raisePendcode);
      if (text) setNotice({ message: text, severity: result.panValid === true ? "success" : "error" });
    } finally {
      setValidatingPan(false);
    }
  };

  const optionsFor = (select: NonNullable<FieldConfig["select"]>) => {
    switch (select) {
      case "gender":
        return options?.gender ?? [];
      case "dobDocument":
        return options?.dobDocument ?? [];
      case "genderDocument":
        return options?.genderDocument ?? [];
      case "pincodeDocument":
        return options?.pincodeDocument ?? [];
      case "residentStatus":
        return options?.residentStatus ?? [];
      case "yesNo":
        return options?.yesNo ?? [];
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
          onChange={(date) => {
            const value = date?.isValid() ? date.format("YYYY-MM-DD") : "";
            if (field.name === "dob") resetPanFlagIfEdited({ panNumber: getValues("panNumber"), dob: value });
            controlled.onChange(value);
          }}
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
          disabled={Boolean(onValidatePan) && READ_ONLY_API_FIELDS.includes(field.name)}
          error={error}
          helperText={helperText}
        />
      );
    }

    return (
      <CustomTextField
        labelText={field.label}
        value={controlled.value}
        onChange={(e) => {
          const value = sanitize(field, e.target.value);
          if (field.name === "panNumber") resetPanFlagIfEdited({ panNumber: value, dob: getValues("dob") });
          controlled.onChange(value);
        }}
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
              onClick={handleNsdl}
              disabled={validatingPan}
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

        <NomineeDetails nominees={nominees} onChange={setNominees} onNotify={notifyError} />

        <Box sx={{ my: 2, borderTop: "1px solid rgba(0, 0, 0, 0.12)" }} />

        <RiderDetails riders={riders} onChange={setRiders} onNotify={notifyError} />

        <Box sx={{ my: 2, borderTop: "1px solid rgba(0, 0, 0, 0.12)" }} />

        <Controller
          name="loan"
          control={control}
          render={({ field }) => <LoanDetails values={field.value} onChange={field.onChange} errors={errors.loan} />}
        />
      </Box>

      <CustomSnackbar
        open={Boolean(notice)}
        message={notice?.message ?? ""}
        severity={notice?.severity ?? "error"}
        onClose={() => setNotice(null)}
      />
    </CustomDialog>
  );
}

export default EditApplicantDialog;
