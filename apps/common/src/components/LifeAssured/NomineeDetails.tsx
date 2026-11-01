import { useState } from "react";
import dayjs from "dayjs";
import { Box, Typography } from "@mui/material";
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

export type NomineeEditRow = {
  firstName: string;
  lastName: string;
  /** YYYY-MM-DD */
  dob: string;
  gender: string;
  proposerNomineeRelation: string;
  percentage: string;
  accountNumber: string;
  ifsc: string;
};

type NomineeField = keyof NomineeEditRow;

type NomineeTableRow = NomineeEditRow & { actions: string };

export type NomineeDetailsProps = {
  nominees: NomineeEditRow[];
  onChange: (nominees: NomineeEditRow[]) => void;
  /** Reports validation messages (shown as a snackbar by the parent). */
  onNotify: (message: string) => void;
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

// Prototype nominee gender list
const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

export const isNomineeBlank = (nominee: NomineeEditRow) =>
  NOMINEE_FIELDS.some((field) => !nominee[field].trim());

export const iconButtonSx = { minWidth: 32, p: 0.5 };
export const dangerButtonSx = {
  ...iconButtonSx,
  borderColor: colors.danger,
  color: colors.danger,
  "&:hover": { backgroundColor: colors.danger, color: colors.white },
};

export function NomineeDetails({ nominees, onChange, onNotify }: Readonly<NomineeDetailsProps>) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<NomineeEditRow>(EMPTY_NOMINEE);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({ ...nominees[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraft(EMPTY_NOMINEE);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    if (isNomineeBlank(draft)) {
      onNotify("Please fill all nominee fields before saving");
      return;
    }
    onChange(nominees.map((nominee, index) => (index === editingIndex ? { ...draft } : nominee)));
    cancelEdit();
  };

  const deleteNominee = (index: number) => {
    onChange(nominees.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit();
  };

  const addNominee = () => {
    onChange([...nominees, { ...EMPTY_NOMINEE }]);
    setEditingIndex(nominees.length);
    setDraft({ ...EMPTY_NOMINEE });
  };

  const changeDraft = (field: NomineeField, value: string) => setDraft((prev) => ({ ...prev, [field]: value }));

  const renderEditor = (field: NomineeField) => {
    if (field === "dob") {
      return (
        <Calendar
          value={draft.dob ? dayjs(draft.dob) : null}
          onChange={(date) => changeDraft("dob", date?.isValid() ? date.format("YYYY-MM-DD") : "")}
          disableTodayAndFuture={false}
          maxDate={dayjs()}
        />
      );
    }
    if (field === "gender") {
      return <CustomSelect value={draft.gender} onChange={(value) => changeDraft("gender", value)} options={GENDER_OPTIONS} />;
    }
    return (
      <CustomTextField
        value={draft[field]}
        onChange={(e) => changeDraft(field, e.target.value)}
        fullWidth
      />
    );
  };

  const displayText = (field: NomineeField, value: string) => {
    if (!value) return "-";
    return field === "dob" ? dayjs(value).format("DD/MM/YYYY") : value;
  };

  const fieldColumn = (field: NomineeField, header: string, width: string): Column<NomineeTableRow> => ({
    key: field,
    header,
    width,
    render: (value, _row, rowIndex) =>
      editingIndex === rowIndex ? (
        renderEditor(field)
      ) : (
        <Typography sx={{ fontSize: "11px", whiteSpace: "nowrap" }}>{displayText(field, String(value))}</Typography>
      ),
  });

  const columns: Column<NomineeTableRow>[] = [
    {
      key: "actions",
      header: "Actions",
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
              sx={dangerButtonSx}
            >
              <DeleteIcon width={16} height={16} />
            </CustomButton>
          </Box>
        ),
    },
    fieldColumn("firstName", "First Name", "130px"),
    fieldColumn("lastName", "Last Name", "130px"),
    fieldColumn("dob", "DOB", "150px"),
    fieldColumn("gender", "Gender", "120px"),
    fieldColumn("proposerNomineeRelation", "Relationship", "140px"),
    fieldColumn("percentage", "Share %", "100px"),
    fieldColumn("accountNumber", "Account No.", "150px"),
    fieldColumn("ifsc", "IFSC", "130px"),
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
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 1180 }}>
            <CustomTable columns={columns} data={tableData} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default NomineeDetails;
