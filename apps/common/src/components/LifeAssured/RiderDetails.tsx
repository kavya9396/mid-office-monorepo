import { useState } from "react";
import { z } from "zod";
import { Box, Typography } from "@mui/material";
import { getMasterList } from "@insurance-poc/utils";
import {
  CloseIcon,
  CustomButton,
  CustomSelect,
  CustomTable,
  CustomTextField,
  DeleteIcon,
  EditIcon,
  TickIcon,
  type Column,
} from "@insurance-poc/ui";
import { dangerButtonSx, iconButtonSx } from "./NomineeDetails";
import { FILL_ALL_RIDER_FIELDS_MESSAGE, requiredMessage } from "./editApplicant.messages";
import { requiredFormat } from "./fieldFormat";

const required = (label: string) => z.string().trim().min(1, requiredMessage(label));

// All Rider fields are mandatory (same as Nominee)
export const riderSchema = z.object({
  riderName: required("Rider Name"),
  sumAssured: requiredFormat("Rider Sum Assured", "numeric"),
  riderTerm: requiredFormat("Rider Term", "numeric"),
});

export type RiderEditRow = z.infer<typeof riderSchema>;

type RiderField = keyof RiderEditRow;

type RiderTableRow = RiderEditRow & { actions: string };

type RiderErrors = Partial<Record<RiderField, string>>;

/** Field messages of one rider row; the first message wins per field. */
export const getRiderErrors = (rider: RiderEditRow): RiderErrors => {
  const result = riderSchema.safeParse(rider);
  const fieldErrors: RiderErrors = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as RiderField;
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
    }
  }
  return fieldErrors;
};

/** Row-level error messages keyed by row index (from the dialog's Save validation). */
export type RiderFormErrors = Record<number, RiderErrors>;

export type RiderOption = { label: string; value: string };

export type RiderDetailsProps = {
  riders: RiderEditRow[];
  onChange: (riders: RiderEditRow[]) => void;
  /** Reports validation messages (shown as a snackbar by the parent). */
  onNotify: (message: string) => void;
  /** Dropdown options for riderName; defaults to getMasterList("rider") */
  options?: RiderOption[];
  /** Row-level error messages from the dialog's Save validation */
  errors?: RiderFormErrors;
};

const EMPTY_RIDER: RiderEditRow = { riderName: "", sumAssured: "", riderTerm: "" };

export const isRiderBlank = (rider: RiderEditRow) => !riderSchema.safeParse(rider).success;

export const isRiderEmpty = (rider: Partial<RiderEditRow>) =>
  !(rider.riderName?.trim() || rider.sumAssured?.trim() || rider.riderTerm?.trim());

export function RiderDetails({ riders, onChange, onNotify, options, errors }: Readonly<RiderDetailsProps>) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<RiderEditRow>(EMPTY_RIDER);
  const [localErrors, setLocalErrors] = useState<RiderErrors>({});

  const riderOptions: RiderOption[] =
    options && options.length > 0
      ? options
      : getMasterList("rider")
          .filter((entry) => entry.isActive === "Y")
          .map((entry) => ({ label: entry.description, value: entry.code }));

  const toRiderCode = (nameOrCode: string) => {
    const trimmed = nameOrCode.trim();
    if (!trimmed) return "";
    const match = riderOptions.find(
      (opt) =>
        opt.value === trimmed ||
        opt.label.toLowerCase() === trimmed.toLowerCase() ||
        opt.value.toLowerCase() === trimmed.toLowerCase(),
    );
    return match ? match.value : trimmed;
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setDraft({
      ...riders[index],
      riderName: toRiderCode(riders[index].riderName),
    });
    setLocalErrors({});
  };

  const cancelEdit = () => {
    if (editingIndex !== null && editingIndex < riders.length && isRiderEmpty(riders[editingIndex])) {
      onChange(riders.filter((_, i) => i !== editingIndex));
    }
    setEditingIndex(null);
    setDraft(EMPTY_RIDER);
    setLocalErrors({});
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const finalDraft = { ...draft, riderName: toRiderCode(draft.riderName) };
    const fieldErrors = getRiderErrors(finalDraft);
    if (Object.keys(fieldErrors).length > 0) {
      setLocalErrors(fieldErrors);
      onNotify(FILL_ALL_RIDER_FIELDS_MESSAGE);
      return;
    }
    setLocalErrors({});
    onChange(riders.map((rider, index) => (index === editingIndex ? finalDraft : rider)));
    setEditingIndex(null);
    setDraft(EMPTY_RIDER);
  };

  const changeDraft = (field: RiderField, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    if (localErrors[field]) {
      setLocalErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const deleteRider = (index: number) => {
    onChange(riders.filter((_, i) => i !== index));
    if (editingIndex === index) cancelEdit();
  };

  const addRider = () => {
    onChange([...riders, { ...EMPTY_RIDER }]);
    setEditingIndex(riders.length);
    setDraft({ ...EMPTY_RIDER });
    setLocalErrors({});
  };

  const fieldColumn = (field: RiderField, header: string, width?: string): Column<RiderTableRow> => ({
    key: field,
    header,
    width,
    render: (value, _row, rowIndex) => {
      if (editingIndex === rowIndex) {
        const editError = localErrors[field];
        if (field === "riderName") {
          return (
            <CustomSelect
              value={draft.riderName}
              onChange={(val) => changeDraft("riderName", val)}
              options={riderOptions}
              error={Boolean(editError)}
              helperText={editError}
            />
          );
        }
        return (
          <CustomTextField
            value={draft[field]}
            onChange={(e) => changeDraft(field, e.target.value)}
            error={Boolean(editError)}
            helperText={editError}
            fullWidth
          />
        );
      }
      const raw = String(value ?? "");
      const displayVal =
        field === "riderName"
          ? (riderOptions.find((opt) => opt.value === raw || opt.label.toLowerCase() === raw.toLowerCase())?.label ?? raw)
          : raw;
      const fieldError = errors?.[rowIndex]?.[field];
      if (fieldError) {
        return (
          <Box>
            {displayVal ? <Typography sx={{ fontSize: "11px", whiteSpace: "nowrap" }}>{displayVal}</Typography> : null}
            <Typography sx={{ fontSize: "11px", color: "#d32f2f", whiteSpace: "nowrap", lineHeight: 1.2 }}>
              {fieldError}
            </Typography>
          </Box>
        );
      }
      return <Typography sx={{ fontSize: "11px" }}>{displayVal}</Typography>;
    },
  });

  const columns: Column<RiderTableRow>[] = [
    {
      key: "actions",
      header: "Actions",
      width: "70px",
      render: (_value, row, rowIndex) => {
        if (editingIndex === rowIndex) {
          return (
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
          );
        }

        if (isRiderEmpty(row)) {
          return null;
        }

        return (
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
        );
      },
    },
    fieldColumn("riderName", "Rider Name", "280px"),
    fieldColumn("sumAssured", "Rider Sum Assured", "160px"),
    fieldColumn("riderTerm", "Rider Term", "140px"),
  ];

  const tableData: RiderTableRow[] = riders.map((rider) => ({ ...rider, actions: "" }));
  const hasVisibleRiders = riders.length > 0 && (editingIndex !== null || riders.some((r) => !isRiderEmpty(r)));

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

      {!hasVisibleRiders ? (
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
