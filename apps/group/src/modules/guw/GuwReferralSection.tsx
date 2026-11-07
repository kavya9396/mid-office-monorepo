import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import {
  CustomBox,
  CustomButton,
  CustomCheckbox,
  CustomSelect,
  CustomTable,
  CustomTextField,
  CustomTooltip,
  CustomTypography,
  EditIcon,
  type Column,
} from "@insurance-poc/ui";

/* ------------------------------------------------------------------
 * GuwReferralSection — "Raise Referral" table + reinsurer data entry.
 * Built only from @insurance-poc/ui components (CustomTable etc.).
 * ------------------------------------------------------------------ */

export interface ReferralRow {
  target: string;
  label: string;
  selected: boolean;
  reason: string;
  remarks: string;
  assignedTo: string;
}

export interface ReinsurerRow {
  code: string;
  systemName: string;
  uwName: string;
}

interface DocRow {
  name: string;
  reinsurer0: boolean;
  reinsurer1: boolean;
}

const DOC_KEYS = ["reinsurer0", "reinsurer1"] as const;

const REINSURER_TARGET = "REF_REINS";

// Selecting any of these clears (and locks) every other referral row
const EXCLUSIVE_TARGETS = [REINSURER_TARGET, "REF_SR_UW", "REF_HOD"];
// Tele MER / Video MER are mutually exclusive and excluded from select-all
const MER_TARGETS = ["REF_TELE_MER", "REF_VIDEO_MER"];

interface GuwReferralSectionProps {
  rows: ReferralRow[];
  setRows: Dispatch<SetStateAction<ReferralRow[]>>;
  reasonOptions: Record<string, string[]>;
  assigneeOptions: { value: string; label: string }[];
  /** Referral targets for which "Assigned To" is enabled */
  assignableTargets: string[];
  reinsurerEditOpen: boolean;
  setReinsurerEditOpen: Dispatch<SetStateAction<boolean>>;
  reinsurerRows: ReinsurerRow[];
  reinsurerUwOptions: string[];
  onReinsurerUwChange: (index: number, value: string) => void;
  documents: string[];
  docChecks: boolean[][];
  onSelectAllDocs: (colIndex: number) => void;
  onDocCheckChange: (rowIndex: number, colIndex: number, checked: boolean) => void;
  getReinsurerName: (index: number) => string;
  onGenerateSheet: () => void;
}

// Compact 30px controls inside table cells (shared Custom* controls default to 40px).
const compactFieldSx = {
  "& .MuiOutlinedInput-root": { height: "30px", minHeight: "30px", borderRadius: "8px" },
  "& .MuiOutlinedInput-root .MuiInputBase-input": { py: "4px", px: 1 },
  "& .MuiOutlinedInput-root .MuiSelect-select": { px: 1 },
};

const sectionTitleSx = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#5b261c",
  mb: "6px",
};

export function GuwReferralSection({
  rows,
  setRows,
  reasonOptions,
  assigneeOptions,
  assignableTargets,
  reinsurerEditOpen,
  setReinsurerEditOpen,
  reinsurerRows,
  reinsurerUwOptions,
  onReinsurerUwChange,
  documents,
  docChecks,
  onSelectAllDocs,
  onDocCheckChange,
  getReinsurerName,
  onGenerateSheet,
}: Readonly<GuwReferralSectionProps>) {
  const reinsurerSectionRef = useRef<HTMLDivElement | null>(null);
  const isReinsurerSelected = rows.some((r) => r.target === REINSURER_TARGET && r.selected);
  const isExclusiveSelected = rows.some((r) => EXCLUSIVE_TARGETS.includes(r.target) && r.selected);
  const isHoCmoSelected = rows.some((r) => r.target === "REF_CMO" && r.selected);
  const isTeleMerSelected = rows.some((r) => r.target === "REF_TELE_MER" && r.selected);
  const isVideoMerSelected = rows.some((r) => r.target === "REF_VIDEO_MER" && r.selected);

  // Bring the reinsurer data entry into view when it is opened
  useEffect(() => {
    if (reinsurerEditOpen) {
      reinsurerSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [reinsurerEditOpen]);

  const isRowDisabled = (row: ReferralRow) =>
    (isExclusiveSelected && !row.selected) ||
    (row.target === "REF_CMO_LOCAL" && isHoCmoSelected) ||
    (row.target === "REF_VIDEO_MER" && isTeleMerSelected) ||
    (row.target === "REF_TELE_MER" && isVideoMerSelected);

  const updateRow = (target: string, patch: Partial<ReferralRow>) =>
    setRows((prev) => prev.map((r) => (r.target === target ? { ...r, ...patch } : r)));

  const handleToggle = (row: ReferralRow, checked: boolean) => {
    setRows((prev) => {
      if (EXCLUSIVE_TARGETS.includes(row.target) && checked) {
        return prev.map((r) => ({ ...r, selected: r.target === row.target }));
      }
      if (row.target === "REF_CMO" && checked) {
        return prev.map((r) => {
          if (r.target === "REF_CMO_LOCAL") return { ...r, selected: false };
          if (r.target === "REF_CMO") return { ...r, selected: true };
          return r;
        });
      }
      return prev.map((r) => (r.target === row.target ? { ...r, selected: checked } : r));
    });
    // Deselecting Reinsurer, or switching to another exclusive row, closes the reinsurer data entry
    if (
      (row.target === REINSURER_TARGET && !checked) ||
      (checked && EXCLUSIVE_TARGETS.includes(row.target) && row.target !== REINSURER_TARGET)
    ) {
      setReinsurerEditOpen(false);
    }
  };

  const allSelected =
    rows.length > 0 &&
    !isExclusiveSelected &&
    rows
      .filter((r) => !EXCLUSIVE_TARGETS.includes(r.target) && !MER_TARGETS.includes(r.target))
      .every((r) => r.selected);

  const referralColumns: Column<ReferralRow>[] = [
    {
      key: "selected",
      width: "34px",
      headerRender: () => (
        <CustomCheckbox
          checked={allSelected}
          disabled={isExclusiveSelected}
          onChange={(e) => {
            const checked = e.target.checked;
            setRows((prev) =>
              prev.map((r) => ({
                ...r,
                selected: EXCLUSIVE_TARGETS.includes(r.target)
                  ? false
                  : MER_TARGETS.includes(r.target)
                    ? r.selected
                    : checked,
              })),
            );
          }}
          inputProps={{ "aria-label": "Select all referrals" }}
        />
      ),
      render: (_value, row) => (
        <CustomCheckbox
          checked={row.selected}
          disabled={isRowDisabled(row)}
          onChange={(e) => handleToggle(row, e.target.checked)}
          inputProps={{ "aria-label": `Select ${row.label}` }}
        />
      ),
    },
    {
      key: "label",
      header: "Refer To",
      width: "20%",
      render: (_value, row) => (
        <CustomTypography
          component="span"
          sx={{ fontSize: "11px", fontWeight: 700, color: isRowDisabled(row) ? "#9a9390" : "#302a27" }}
        >
          {row.label}
        </CustomTypography>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      width: "30%",
      render: (_value, row) => (
        <CustomBox sx={compactFieldSx}>
          <CustomSelect
            value={row.reason}
            onChange={(val) => updateRow(row.target, { reason: val })}
            options={(reasonOptions[row.target] ?? []).map((opt) => ({ value: opt, label: opt }))}
            disabled={!row.selected || isRowDisabled(row)}
            placeholder="Select reason"
            fullWidth
          />
        </CustomBox>
      ),
    },
    {
      key: "remarks",
      header: "UW Remarks",
      render: (_value, row) => (
        <CustomBox sx={compactFieldSx}>
          <CustomTextField
            value={row.remarks}
            onChange={(e) => updateRow(row.target, { remarks: e.target.value })}
            disabled={!row.selected || isRowDisabled(row)}
            placeholder="Enter remarks"
            fullWidth
          />
        </CustomBox>
      ),
    },
    {
      key: "assignedTo",
      header: "Assigned To",
      width: "16%",
      render: (_value, row) => (
        <CustomBox sx={compactFieldSx}>
          <CustomSelect
            value={row.assignedTo}
            onChange={(val) => updateRow(row.target, { assignedTo: val })}
            options={assigneeOptions}
            disabled={!assignableTargets.includes(row.target) || !row.selected || isRowDisabled(row)}
            placeholder="Select User ID"
            fullWidth
          />
        </CustomBox>
      ),
    },
    {
      key: "target",
      header: "Action",
      width: "52px",
      render: (_value, row) =>
        row.target === REINSURER_TARGET ? (
          <CustomTooltip
            title={
              row.selected
                ? reinsurerEditOpen
                  ? "Hide reinsurer details"
                  : "Edit reinsurer details"
                : "Select row to edit details"
            }
          >
            <CustomBox component="span" sx={{ display: "inline-flex" }}>
              <CustomButton
                variant={reinsurerEditOpen ? "contained" : "outlined"}
                disabled={!row.selected}
                aria-label={reinsurerEditOpen ? "Hide reinsurer details" : "Edit reinsurer details"}
                onClick={() => setReinsurerEditOpen((prev) => !prev)}
                sx={{
                  width: 28,
                  minWidth: 28,
                  height: 28,
                  p: 0,
                  borderRadius: "6px",
                  ...(reinsurerEditOpen
                    ? {
                        background: "#e45f14",
                        color: "#fff",
                        borderColor: "#e45f14",
                        "&:hover": { background: "#c94f0d", borderColor: "#c94f0d" },
                      }
                    : {
                        color: row.selected ? "#e45f14" : "#aaa",
                        borderColor: row.selected ? "#e45f14" : "#ddd",
                      }),
                }}
              >
                <EditIcon width={16} height={16} />
              </CustomButton>
            </CustomBox>
          </CustomTooltip>
        ) : null,
    },
  ];

  const reinsurerColumns: Column<ReinsurerRow>[] = [
    { key: "code", header: "Code", width: "18%" },
    { key: "systemName", header: "Reinsurer Name - System", width: "34%" },
    {
      key: "uwName",
      header: "Reinsurer Name - UW",
      render: (_value, row, rowIndex) => (
        <CustomBox sx={compactFieldSx}>
          <CustomSelect
            value={row.uwName}
            onChange={(val) => onReinsurerUwChange(rowIndex, val)}
            options={reinsurerUwOptions
              .filter((name) => name.toLowerCase() !== row.systemName.toLowerCase())
              .map((opt) => ({ value: opt, label: opt }))}
            placeholder="Select"
            fullWidth
          />
        </CustomBox>
      ),
    },
  ];

  const docRows: DocRow[] = documents.map((name, rowIndex) => ({
    name,
    reinsurer0: docChecks[rowIndex]?.[0] ?? false,
    reinsurer1: docChecks[rowIndex]?.[1] ?? false,
  }));

  const docColumns: Column<DocRow>[] = [
    { key: "name", header: "Document name", width: "40%" },
    ...reinsurerRows.map<Column<DocRow>>((_reinsurer, colIndex) => ({
      key: DOC_KEYS[colIndex],
      headerRender: () => (
        <CustomBox sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <CustomTypography component="span" sx={{ fontSize: "11px", fontWeight: 700 }}>
            {getReinsurerName(colIndex)}
          </CustomTypography>
          <CustomButton
            variant="text"
            onClick={() => onSelectAllDocs(colIndex)}
            sx={{ fontSize: "10px", p: 0, textDecoration: "underline" }}
          >
            (Select All)
          </CustomButton>
        </CustomBox>
      ),
      render: (_value, _row, rowIndex) => (
        <CustomCheckbox
          checked={docChecks[rowIndex]?.[colIndex] ?? false}
          onChange={(e) => onDocCheckChange(rowIndex, colIndex, e.target.checked)}
          inputProps={{ "aria-label": `${documents[rowIndex]} - ${getReinsurerName(colIndex)}` }}
        />
      ),
    })),
  ];

  return (
    <CustomBox sx={{ gridColumn: { xs: "auto", sm: "span 3" } }}>
      <CustomTable<ReferralRow> columns={referralColumns} data={rows} getRowId={(row) => row.target} />

      {/* Reinsurer data entry — opens from the Action icon on the Reinsurer row */}
      {reinsurerEditOpen && isReinsurerSelected && (
        <CustomBox
          ref={reinsurerSectionRef}
          sx={{
            mt: "8px",
            p: "8px",
            border: "1px solid #eadfd9",
            borderRadius: "8px",
            background: "#fffaf6",
          }}
        >
          <CustomTypography component="h3" sx={{ ...sectionTitleSx, fontSize: "13px" }}>
            Reinsurer Additional Data Entry
          </CustomTypography>

          <CustomBox
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: "8px",
            }}
          >
            <CustomBox>
              <CustomTypography component="h4" sx={sectionTitleSx}>
                Reinsurer Details
              </CustomTypography>
              <CustomTable<ReinsurerRow>
                columns={reinsurerColumns}
                data={reinsurerRows}
                getRowId={(row) => row.code}
              />
            </CustomBox>

            <CustomBox>
              <CustomTypography component="h4" sx={sectionTitleSx}>
                Assign Documents
              </CustomTypography>
              <CustomTable<DocRow> columns={docColumns} data={docRows} getRowId={(row) => row.name} />
            </CustomBox>
          </CustomBox>

          <CustomBox sx={{ display: "flex", mt: "8px" }}>
            <CustomButton
              variant="outlined"
              onClick={onGenerateSheet}
              sx={{
                borderColor: "#aa262a",
                color: "#aa262a",
                px: 2,
                fontWeight: "bold",
                fontSize: "11px",
              }}
            >
              Generate Referral Sheet
            </CustomButton>
          </CustomBox>
        </CustomBox>
      )}
    </CustomBox>
  );
}
