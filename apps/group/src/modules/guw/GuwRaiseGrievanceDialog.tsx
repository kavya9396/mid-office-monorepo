import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import {
  CustomButton,
  CustomCheckbox,
  CustomDialog,
  CustomTable,
  CustomTextField,
  type Column,
} from "@insurance-poc/ui";
import type { GrievanceHistoryRow } from "@insurance-poc/common/grievance-history";
import type { RequirementItem } from "@insurance-poc/common/requirement-mgmt";
import { readApiErrorMessage } from "@insurance-poc/utils";
import {
  useLazyGetMmtGrievancesQuery,
  useSaveMmtGrievancesMutation,
} from "../../services/mmtGrievanceApi";
import type { MmtGrievanceMemberContext } from "../../services/mmtGrievanceService";
import type { RaiseGrievanceData, RaiseGrievanceRow } from "../drs/quickLinksData";

export type GuwRaiseGrievanceDialogProps = {
  open: boolean;
  onClose: () => void;
  /** `subSections[raiseGrievance]` of the member; only its title / column headers are used. */
  data?: RaiseGrievanceData;
  /** applicationNo / partyId / lifeNumber / transactionId sent with the save request. */
  context: MmtGrievanceMemberContext;
  /** DRS `commonSection[requirementManagement]` rows; those with category "Medicals" are merged into the table. */
  requirements?: readonly RequirementItem[];
  notify: (message: string) => void;
};

const REMARKS_REQUIRED_MESSAGE = "Remarks By User is mandatory for every selected requirement.";
const MEDICALS_CATEGORY = "medicals";

const rowKey = (fupCode: string, profile: string) =>
  `${fupCode.trim().toLowerCase()}|${profile.trim().toLowerCase()}`;

/**
 * Quick Links -> Raise Grievance (guw-drs-screen-prototype.html `openRaiseGrievance`).
 * On open it calls the MMT grievance fetch API (`VITE_MMT_GRIEVANCE_FETCH_API`, same request as the
 * MMT screen) and lists the returned `openGrievances` rows. Title and column headers come from
 * `subSections[raiseGrievance]`. The Raise Grievance button validates and then calls the MMT
 * grievance save API (`useSaveMmtGrievancesMutation`); each selected row goes out as
 * `{ fupCode, profile, userRemarks }`.
 */
export function GuwRaiseGrievanceDialog({
  open,
  onClose,
  data,
  context,
  requirements,
  notify,
}: Readonly<GuwRaiseGrievanceDialogProps>) {
  const [saveGrievances, saveState] = useSaveMmtGrievancesMutation();
  const [fetchGrievances, fetchState] = useLazyGetMmtGrievancesQuery();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [remarks, setRemarks] = useState<Readonly<Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const apiRows: RaiseGrievanceRow[] = (fetchState.data?.openGrievances ?? []).map(
    (row, index) => ({
      id: `grievance-${index + 1}`,
      fupCode: row.fupCode,
      profile: row.profile,
      remarks: row.grievanceRemarks,
    }),
  );
  // Merge: Medicals requirements (fupCode + profile) not already returned by the fetch API.
  const knownKeys = new Set(apiRows.map((row) => rowKey(row.fupCode, row.profile)));
  const medicalRows: RaiseGrievanceRow[] = [];
  (requirements ?? []).forEach((item, index) => {
    if (item.category?.trim().toLowerCase() !== MEDICALS_CATEGORY || !item.fupCode?.trim()) return;
    const key = rowKey(item.fupCode, item.profile ?? "");
    if (knownKeys.has(key)) return;
    knownKeys.add(key);
    medicalRows.push({
      id: `medical-${index + 1}`,
      fupCode: item.fupCode,
      profile: item.profile ?? "",
      remarks: "",
    });
  });
  const fetchedRows: RaiseGrievanceRow[] = [...apiRows, ...medicalRows];
  const rows: RaiseGrievanceRow[] = fetchedRows.map((row) => ({
    ...row,
    remarks: remarks[row.id] ?? row.remarks,
  }));
  const isLoadingRows = fetchState.isFetching || fetchState.isUninitialized;
  const loadError = fetchState.isError
    ? readApiErrorMessage(fetchState.error, "Unable to load grievances.")
    : "";
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const isMissingRemarks = (row: RaiseGrievanceRow) => selected.has(row.id) && !row.remarks.trim();

  const toggleRow = (id: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  const toggleAll = (checked: boolean) =>
    setSelected(checked ? new Set(rows.map((row) => row.id)) : new Set());

  const resetForm = () => {
    setSelected(new Set());
    setRemarks({});
    setSubmitted(false);
    setError("");
  };

  useEffect(() => {
    if (!open) return;
    resetForm();
    void fetchGrievances(context);
  }, [open, context.applicationNo, context.partyId, context.lifeNumber]);

  const handleRaise = async () => {
    const chosen = rows.filter((row) => selected.has(row.id));
    if (chosen.length === 0) {
      setError("Please select at least one requirement.");
      return;
    }
    setSubmitted(true);
    if (chosen.some((row) => !row.remarks.trim())) {
      setError(REMARKS_REQUIRED_MESSAGE);
      return;
    }
    setError("");

    // The save request reads `userRemarks` from `tpaRemark` (see `buildMmtGrievanceSaveRequest`).
    const payloadRows: GrievanceHistoryRow[] = chosen.map((row) => ({
      userName: "",
      fupCode: row.fupCode,
      profile: row.profile,
      grievanceRemarks: "",
      tpaRemark: row.remarks.trim(),
      raisedDate: "",
      updatedDate: "",
      raisedBy: "",
      updatedBy: "",
    }));
    try {
      await saveGrievances({ context, rows: payloadRows }).unwrap();
      resetForm();
      onClose();
      notify("Grievance raised successfully.");
    } catch (reason: unknown) {
      setError(readApiErrorMessage(reason, "Unable to raise grievance."));
    }
  };

  const columns: Column<RaiseGrievanceRow>[] = [
    {
      key: "id",
      width: "6%",
      headerRender: () => (
        <CustomCheckbox
          checked={allSelected}
          disabled={rows.length === 0}
          onChange={(event) => toggleAll(event.target.checked)}
          slotProps={{ input: { "aria-label": "Select all requirements" } }}
        />
      ),
      render: (_value, row) => (
        <CustomCheckbox
          checked={selected.has(row.id)}
          onChange={(event) => toggleRow(row.id, event.target.checked)}
          slotProps={{ input: { "aria-label": `Select requirement ${row.fupCode || row.id}` } }}
        />
      ),
    },
    { key: "fupCode", header: data?.fupCodeHeader ?? "FUP Code", width: "22%" },
    { key: "profile", header: data?.profileHeader ?? "Profile", width: "22%" },
    {
      key: "remarks",
      header: `${data?.remarksHeader ?? "Remarks By User"} *`,
      width: "50%",
      render: (_value, row) => (
        <CustomTextField
          fullWidth
          placeholder="Enter remarks..."
          value={row.remarks}
          error={submitted && isMissingRemarks(row)}
          helperText={submitted && isMissingRemarks(row) ? "Remarks are mandatory." : undefined}
          htmlInputProps={{ maxLength: 1000 }}
          onChange={(event) => {
            const value = event.target.value;
            setRemarks((current) => ({ ...current, [row.id]: value }));
          }}
        />
      ),
    },
  ];

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={
        <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>
          {data?.title ?? "Raise Grievance"}
        </Typography>
      }
      maxWidth="md"
      fullWidth
      contentSx={{ p: 0 }}
    >
      <Box sx={{ width: "100%", minWidth: 0, p: 1 }}>
        <CustomTable<RaiseGrievanceRow>
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
        />
        <Typography
          role="alert"
          sx={{ minHeight: 18, mt: "8px", color: "#d32f2f", textAlign: "center", fontSize: "12px" }}
        >
          {error || loadError}
        </Typography>
        {isLoadingRows && !loadError ? (
          <Typography sx={{ textAlign: "center", fontSize: "12px", color: "#7b716c" }}>
            Loading grievances...
          </Typography>
        ) : null}
        <Box sx={{ display: "flex", justifyContent: "center", mt: "10px" }}>
          <CustomButton
            type="button"
            disabled={rows.length === 0 || isLoadingRows || saveState.isLoading}
            onClick={() => void handleRaise()}
            sx={{ minWidth: 180, borderRadius: "50px" }}
          >
            Raise Grievance
          </CustomButton>
        </Box>
      </Box>
    </CustomDialog>
  );
}

export default GuwRaiseGrievanceDialog;
