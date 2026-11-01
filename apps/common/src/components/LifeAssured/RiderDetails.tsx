import { useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  CloseIcon,
  CustomButton,
  CustomTable,
  CustomTextField,
  DeleteIcon,
  EditIcon,
  TickIcon,
  type Column,
} from "@insurance-poc/ui";
import { dangerButtonSx, iconButtonSx } from "./NomineeDetails";

export type RiderEditRow = {
  riderName: string;
  sumAssured: string;
  riderTerm: string;
};

type RiderField = keyof RiderEditRow;

type RiderTableRow = RiderEditRow & { actions: string };

export type RiderDetailsProps = {
  riders: RiderEditRow[];
  onChange: (riders: RiderEditRow[]) => void;
  /** Reports validation messages (shown as a snackbar by the parent). */
  onNotify: (message: string) => void;
};

const EMPTY_RIDER: RiderEditRow = { riderName: "", sumAssured: "", riderTerm: "" };

// Prototype only requires Rider Sum Assured and Rider Term
const REQUIRED_FIELDS: RiderField[] = ["sumAssured", "riderTerm"];

export const isRiderBlank = (rider: RiderEditRow) =>
  REQUIRED_FIELDS.some((field) => !rider[field].trim());

export function RiderDetails({ riders, onChange, onNotify }: Readonly<RiderDetailsProps>) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<RiderEditRow>(EMPTY_RIDER);

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({ ...riders[index] });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setDraft(EMPTY_RIDER);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    if (isRiderBlank(draft)) {
      onNotify("Please fill all rider fields before saving");
      return;
    }
    onChange(riders.map((rider, index) => (index === editingIndex ? { ...draft } : rider)));
    cancelEdit();
  };

  const deleteRider = (index: number) => {
    onChange(riders.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit();
  };

  const addRider = () => {
    onChange([...riders, { ...EMPTY_RIDER }]);
    setEditingIndex(riders.length);
    setDraft({ ...EMPTY_RIDER });
  };

  const fieldColumn = (field: RiderField, header: string): Column<RiderTableRow> => ({
    key: field,
    header,
    render: (value, _row, rowIndex) =>
      editingIndex === rowIndex ? (
        <CustomTextField
          value={draft[field]}
          onChange={(e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))}
          fullWidth
        />
      ) : (
        <Typography sx={{ fontSize: "11px" }}>{String(value) || "-"}</Typography>
      ),
  });

  const columns: Column<RiderTableRow>[] = [
    {
      key: "actions",
      header: "Actions",
      width: "130px",
      render: (_value, _row, rowIndex) =>
        editingIndex === rowIndex ? (
          <Box sx={{ display: "flex", gap: 0.5 }}>
            <CustomButton
              type="button"
              size="small"
              aria-label="Save rider"
              onClick={saveEdit}
              sx={iconButtonSx}
            >
              <TickIcon width={16} height={16} />
            </CustomButton>
            <CustomButton
              type="button"
              variant="outlined"
              size="small"
              aria-label="Cancel editing rider"
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
              aria-label="Edit rider"
              onClick={() => startEdit(rowIndex)}
              sx={iconButtonSx}
            >
              <EditIcon width={16} height={16} />
            </CustomButton>
            <CustomButton
              type="button"
              variant="outlined"
              size="small"
              aria-label="Delete rider"
              onClick={() => deleteRider(rowIndex)}
              sx={dangerButtonSx}
            >
              <DeleteIcon width={16} height={16} />
            </CustomButton>
          </Box>
        ),
    },
    fieldColumn("riderName", "Rider Name"),
    fieldColumn("sumAssured", "Rider Sum Assured"),
    fieldColumn("riderTerm", "Rider Term"),
  ];

  const tableData: RiderTableRow[] = riders.map((rider) => ({ ...rider, actions: "" }));

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography sx={{ color: "#444", fontSize: "14px", fontWeight: 700 }}>Rider Details</Typography>
        <CustomButton
          type="button"
          variant="outlined"
          size="small"
          onClick={addRider}
          disabled={editingIndex !== null}
          sx={{ minWidth: 62 }}
        >
          + Add
        </CustomButton>
      </Box>

      {riders.length === 0 ? (
        <Box sx={{ p: 2, border: "1px dashed #CFC7C3", borderRadius: 1, bgcolor: "#FFFFFF", textAlign: "center" }}>
          <Typography sx={{ fontSize: "12px", color: "#777" }}>No rider details available</Typography>
        </Box>
      ) : (
        <CustomTable columns={columns} data={tableData} />
      )}
    </Box>
  );
}

export default RiderDetails;
