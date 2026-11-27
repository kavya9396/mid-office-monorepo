import { useState } from "react";
import dayjs from "dayjs";
import { z } from "zod";
import type { FieldErrors } from "react-hook-form";
import { Box, Typography } from "@mui/material";
import { getMasterList } from "@insurance-poc/utils";
import {
  Calendar,
  CloseIcon,
  colors,
  CustomButton,
  CustomSelect,
  CustomTable,
  CustomTextField,
  DeleteIcon,
  EditIcon,
  TickIcon,
  type Column,
} from "@insurance-poc/ui";
import { FILL_ALL_NOMINEE_FIELDS_MESSAGE, requiredMessage } from "./editApplicant.messages";
import { requiredFormat } from "./fieldFormat";

const required = (label: string) => z.string().trim().min(1, requiredMessage(label));

// All Nominee fields are mandatory
export const nomineeSchema = z.object({
  firstName: requiredFormat("First Name", "alphabets"),
  lastName: requiredFormat("Last Name", "alphabets"),
  /** YYYY-MM-DD */
  dob: required("DOB"),
  gender: required("Gender"),
  proposerNomineeRelation: requiredFormat("Relationship", "alphabets"),
  percentage: requiredFormat("Share %", "numeric"),
  accountNumber: requiredFormat("Account No.", "numeric"),
  ifsc: requiredFormat("IFSC", "ifsc"),
});

export type NomineeEditRow = z.infer<typeof nomineeSchema>;

type NomineeField = keyof NomineeEditRow;

type NomineeTableRow = NomineeEditRow & { actions: string };

type NomineeErrors = Partial<Record<NomineeField, string>>;

export type NomineeFormErrors = NonNullable<FieldErrors<{ nominees: NomineeEditRow[] }>["nominees"]>;

export type NomineeDetailsProps = {
  nominees: NomineeEditRow[];
  onChange: (nominees: NomineeEditRow[]) => void;
  /** Reports validation messages (shown as a snackbar by the parent). */
  onNotify: (message: string) => void;
  /** Row-level error messages from form validation */
  errors?: NomineeFormErrors;
};

const NOMINEE_FIELDS: NomineeField[] = [
  "firstName",
  "lastName",
  "dob",
  "gender",
  "proposerNomineeRelation",
  "percentage",
  "accountNumber",
  "ifsc",
];

const EMPTY_NOMINEE: NomineeEditRow = {
  firstName: "",
  lastName: "",
  dob: "",
  gender: "",
  proposerNomineeRelation: "",
  percentage: "",
  accountNumber: "",
  ifsc: "",
};

// Gender options come from the `gender` master list (post-login master data); the select value is the master code
const getGenderOptions = () =>
  getMasterList("gender")
    .filter((entry) => entry.isActive === "Y")
    .map((entry) => ({ label: entry.description, value: entry.code }));

export const isNomineeBlank = (nominee: NomineeEditRow) => !nomineeSchema.safeParse(nominee).success;

export const isNomineeEmpty = (nominee: Partial<NomineeEditRow>) =>
  NOMINEE_FIELDS.every((field) => !nominee[field]?.trim());

export const iconButtonSx = { minWidth: 32, p: 0.5 };
export const dangerButtonSx = {
  ...iconButtonSx,
  borderColor: colors.danger,
  color: colors.danger,
  "&:hover": { backgroundColor: colors.danger, color: colors.white },
};

export function NomineeDetails({ nominees, onChange, onNotify, errors }: Readonly<NomineeDetailsProps>) {
  const genderOptions = getGenderOptions();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<NomineeEditRow>(EMPTY_NOMINEE);
  const [localErrors, setLocalErrors] = useState<NomineeErrors>({});

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({ ...nominees[index] });
    setLocalErrors({});
  };

  const cancelEdit = () => {
    if (editingIndex !== null && editingIndex < nominees.length && isNomineeEmpty(nominees[editingIndex])) {
      onChange(nominees.filter((_, i) => i !== editingIndex));
    }
    setEditingIndex(null);
    setDraft(EMPTY_NOMINEE);
    setLocalErrors({});
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const result = nomineeSchema.safeParse(draft);
    if (!result.success) {
      const fieldErrors: NomineeErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as NomineeField;
        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setLocalErrors(fieldErrors);
      onNotify(FILL_ALL_NOMINEE_FIELDS_MESSAGE);
      return;
    }
    setLocalErrors({});
    onChange(nominees.map((nominee, index) => (index === editingIndex ? { ...draft } : nominee)));
    setEditingIndex(null);
    setDraft(EMPTY_NOMINEE);
  };

  const deleteNominee = (index: number) => {
    onChange(nominees.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit();
  };

  const addNominee = () => {
    onChange([...nominees, { ...EMPTY_NOMINEE }]);
    setEditingIndex(nominees.length);
    setDraft({ ...EMPTY_NOMINEE });
    setLocalErrors({});
  };

  const changeDraft = (field: NomineeField, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (localErrors[field]) {
      setLocalErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const renderEditor = (field: NomineeField) => {
    const rowErrors = editingIndex !== null && Array.isArray(errors) ? errors[editingIndex] : undefined;
    const fieldError =
      localErrors[field] ??
      (rowErrors && typeof rowErrors === "object" && field in rowErrors ? rowErrors[field]?.message : undefined);
    const hasError = Boolean(fieldError);
    const helperText = fieldError;

    if (field === "dob") {
      return (
        <Calendar
          value={draft.dob ? dayjs(draft.dob) : null}
          onChange={(date) => changeDraft("dob", date?.isValid() ? date.format("YYYY-MM-DD") : "")}
          disableTodayAndFuture={false}
          maxDate={dayjs()}
          error={hasError}
          helperText={helperText}
        />
      );
    }
    if (field === "gender") {
      return (
        <CustomSelect
          value={draft.gender}
          onChange={(value) => changeDraft("gender", value)}
          options={genderOptions}
          error={hasError}
          helperText={helperText}
        />
      );
    }
    return (
      <CustomTextField
        value={draft[field]}
        onChange={(e) => changeDraft(field, e.target.value)}
        error={hasError}
        helperText={helperText}
        fullWidth
      />
    );
  };

  const displayText = (field: NomineeField, value: string) => {
    if (!value) return "";
    if (field === "gender") return genderOptions.find((opt) => opt.value === value)?.label ?? value;
    return field === "dob" ? dayjs(value).format("DD/MM/YYYY") : value;
  };

  const fieldColumn = (field: NomineeField, header: string, width: string): Column<NomineeTableRow> => ({
    key: field,
    header,
    width,
    render: (value, _row, rowIndex) => {
      if (editingIndex === rowIndex) {
        return renderEditor(field);
      }
      const rawValue = String(value ?? "").trim();
      const rowErrors = Array.isArray(errors) ? errors[rowIndex] : undefined;
      const fieldError =
        rowErrors && typeof rowErrors === "object" && field in rowErrors ? rowErrors[field]?.message : undefined;
      if (fieldError) {
        return (
          <Box>
            {rawValue ? (
              <Typography sx={{ fontSize: "11px", whiteSpace: "nowrap" }}>
                {displayText(field, rawValue)}
              </Typography>
            ) : null}
            <Typography sx={{ fontSize: "11px", color: "#d32f2f", whiteSpace: "nowrap", lineHeight: 1.2 }}>
              {fieldError}
            </Typography>
          </Box>
        );
      }
      return (
        <Typography sx={{ fontSize: "11px", whiteSpace: "nowrap" }}>{displayText(field, rawValue)}</Typography>
      );
    },
  });

  const columns: Column<NomineeTableRow>[] = [
    {
      key: "actions",
      header: "Actions",
      width: "80px",
      render: (_value, _row, rowIndex) =>
        editingIndex === rowIndex ? (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <CustomButton
              type="button"
              size="small"
              aria-label="Save nominee"
              onClick={saveEdit}
              sx={iconButtonSx}
            >
              <TickIcon width={16} height={16} />
            </CustomButton>
            <CustomButton
              type="button"
              variant="outlined"
              size="small"
              aria-label="Cancel editing nominee"
              onClick={cancelEdit}
              sx={iconButtonSx}
            >
              <CloseIcon width={16} height={16} />
            </CustomButton>
          </Box>
        ) : (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <CustomButton
              type="button"
              variant="outlined"
              size="small"
              aria-label="Edit nominee"
              onClick={() => startEdit(rowIndex)}
              disabled={editingIndex !== null}
              sx={iconButtonSx}
            >
              <EditIcon width={16} height={16} />
            </CustomButton>
            <CustomButton
              type="button"
              variant="outlined"
              size="small"
              aria-label="Delete nominee"
              onClick={() => deleteNominee(rowIndex)}
              disabled={nominees.length <= 1 || editingIndex !== null}
              sx={dangerButtonSx}
            >
              <DeleteIcon width={16} height={16} />
            </CustomButton>
          </Box>
        ),
    },
    fieldColumn("firstName", "First Name", "80px"),
    fieldColumn("lastName", "Last Name", "80px"),
    fieldColumn("dob", "DOB", "80px"),
    fieldColumn("gender", "Gender", "60px"),
    fieldColumn("proposerNomineeRelation", "Relationship", "90px"),
    fieldColumn("percentage", "Share %", "70px"),
    fieldColumn("accountNumber", "Account No.", "120px"),
    fieldColumn("ifsc", "IFSC", "80px"),
  ];

  const tableData: NomineeTableRow[] = nominees.map((nominee) => ({ ...nominee, actions: "" }));

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ color: "#444", fontSize: "14px", fontWeight: 700 }}>Nominee Details</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* <Typography sx={{ color: "#777", fontSize: "11px" }}>Changes will update the Nominee tab after Save</Typography> */}
          <CustomButton
            type="button"
            variant="outlined"
            size="small"
            onClick={addNominee}
            disabled={editingIndex !== null}
            sx={{ minWidth: 62 }}
          >
            + Add
          </CustomButton>
        </Box>
      </Box>

      {nominees.length === 0 ? (
        <Box sx={{ p: 2, border: "1px dashed #CFC7C3", borderRadius: 1, bgcolor: "#FFFFFF", textAlign: "center" }}>
          <Typography sx={{ fontSize: "12px", color: "#777" }}>No nominee details available</Typography>
        </Box>
      ) : (
        <CustomTable columns={columns} data={tableData} />
      )}
    </Box>
  );
}

export default NomineeDetails;
