import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import { colors, CustomTable } from "@insurance-poc/ui";
import { getMasterList } from "@insurance-poc/utils";
import { buildTableColumns } from "./buildTableColumns";
import {
  DEFAULT_LABELS,
  NO_STATUS_ORDER,
  resolveFilterConfig,
  resolveVisibility,
  defaultRequirementColumns,
} from "./defaults";
import {
  RequirementEmptyState,
  RequirementFilterBar,
  RequirementFilterDialog,
  RequirementFooter,
  RequirementHeader,
  RequirementValueDialog,
} from "./RequirementParts";
import { useRequirementFilters } from "./useRequirementFilters";
import { createEmptyRequirement, isNewRequirement, useRequirementRows } from "./useRequirementRows";
import { ensureRequirementMstApplicationKey, removeRequirementMstRowSession } from "./requirementMstSession";
import { useRequirementMstCascade } from "./useRequirementMstCascade";

export { clearRequirementMstContext } from "./requirementMstSession";

const CASCADE_FIELD_KEYS = new Set([
  "team",
  "category",
  "subCategory",
  "document",
  "reason",
  "fupCode",
]);
import type {
  RequirementColumnKey,
  RequirementItem,
  RequirementLabels,
  RequirementMgmtProps,
  RequirementStatusOption,
} from "./types";

export * from "./types";
export { defaultRequirementColumns, defaultRequirementFilterFields } from "./defaults";
export { createEmptyRequirement, isNewRequirement, useRequirementRows };

const EMPTY_BADGE_VARIANTS = {};

/** Status options from the post-login master data (`misc` list, type `REQT_ST`). */
const readMasterStatusOptions = (): RequirementStatusOption[] =>
  getMasterList("misc", "REQT_ST")
    .filter((entry) => entry.isActive === "Y")
    .map((entry) => ({ label: entry.description, value: entry.code }));

/** Team options from the post-login master data (`requirement_mst`). */
const readMasterTeamOptions = (): RequirementStatusOption[] => {
  const list = getMasterList("requirement_mst", "team");
  const fallbackList = list.length > 0 ? list : getMasterList("requirement_mst");
  return fallbackList
    .filter((entry) => entry.isActive.toUpperCase() !== "N")
    .map((entry) => ({
      label: entry.description || entry.code,
      value: entry.code || entry.description,
    }));
};

const uniqueStatusOptions = (rows: RequirementItem[]): RequirementStatusOption[] =>
  Array.from(new Set(rows.map((row) => row.status).filter(Boolean))).map((value) => ({
    label: value,
    value,
  }));

export function RequirementMgmt({
  requirements,
  showHeader = true,
  title = "Requirement Management",
  headerActions,
  addButton,
  columns: columnConfigs = defaultRequirementColumns,
  rowActions = [],
  actionsColumn: actionsColumnConfig,
  readOnly = false,
  pageSize = 5,
  showPagination = true,
  statusOptions,
  fieldOptions,
  statusOrder = NO_STATUS_ORDER,
  statusVariants = EMPTY_BADGE_VARIANTS,
  filter,
  labels: labelOverrides,
  onSave,
  applicationKey,
}: Readonly<RequirementMgmtProps>) {
  const labels: RequirementLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const masterStatusOptions = readMasterStatusOptions();
  const masterTeamOptions = readMasterTeamOptions();
  const filterConfig = resolveFilterConfig(filter, readOnly);

  const { rows, saving, addRow, updateRow, patchRow, removeRow, save } = useRequirementRows(
    requirements,
    onSave,
  );
  const cascade = useRequirementMstCascade(patchRow);
  const [dialogValue, setDialogValue] = useState<{ title: string; value: string } | null>(null);

  useEffect(() => {
    if (applicationKey && applicationKey.trim().length > 0) {
      ensureRequirementMstApplicationKey(applicationKey);
    }
  }, [applicationKey]);

  const filtering = useRequirementFilters({
    rows,
    filterFields: filterConfig.fields,
    statusOrder,
    pageSize,
  });
  const { pagination } = filtering;

  const visibility = resolveVisibility({
    readOnly,
    addButton,
    rowActions,
    hasSave: Boolean(onSave),
    showPagination,
    hasMultiplePages: pagination.hasMultiplePages,
  });

  const handleAddRequirement = () => {
    addRow();
    pagination.resetPage();
    addButton?.onClick?.();
  };

  const handleRemoveRow = (id: RequirementItem["id"]) => {
    removeRequirementMstRowSession(String(id));
    removeRow(id);
  };

  const handleValueChange = (row: RequirementItem, key: RequirementColumnKey, value: string) => {
    if (isNewRequirement(row) && CASCADE_FIELD_KEYS.has(key)) {
      void cascade.onCascadeFieldChange(row, key, value);
    } else {
      updateRow(row, key, value);
    }
    if (key === "status") pagination.resetPage();
  };

  const tableColumns = buildTableColumns({
    columnConfigs,
    visibleActions: visibility.rowActions,
    actionsColumnConfig,
    readOnly,
    onRemoveRow: handleRemoveRow,
    cellContext: {
      statusOptions:
        statusOptions ?? (masterStatusOptions.length > 0 ? masterStatusOptions : uniqueStatusOptions(rows)),
      fieldOptions: {
        team: fieldOptions?.team ?? (masterTeamOptions.length > 0 ? masterTeamOptions : undefined),
        ...fieldOptions,
      },
      resolveRowFieldOptions: cascade.resolveRowFieldOptions,
      isRowFieldDisabled: cascade.isRowFieldDisabled,
      rows,
      labels,
      onValueChange: handleValueChange,
      onOpenDialog: (dialogTitle, value) => setDialogValue({ title: dialogTitle, value }),
    },
  });

  return (
    <Box
      component="section"
      aria-label={typeof title === "string" ? title : undefined}
      sx={{
        border: `1px solid ${colors.borderBrand}`,
        borderRadius: 1.5,
        overflow: "hidden",
        bgcolor: colors.white,
      }}
    >
      {showHeader && (
        <RequirementHeader
          title={title}
          headerActions={headerActions}
          addButton={
            visibility.addButton
              ? {
                  ...visibility.addButton,
                  onClick: handleAddRequirement,
                }
              : undefined
          }
        />
      )}

      <Box sx={{ p: 1, minWidth: 0 }}>
        {filterConfig.showBar && (
          <RequirementFilterBar
            labels={labels}
            showStatusPills={filterConfig.showStatusPills}
            showFilterButton={filterConfig.showFilterButton}
            statusCounts={filtering.statusCounts}
            statusVariants={statusVariants}
            selectedStatuses={filtering.selectedStatuses}
            hasActiveFilters={filtering.hasActiveFilters}
            onToggleStatus={filtering.toggleStatusFilter}
            onClear={filtering.clearFilters}
            onOpenFilter={filtering.openFilterDialog}
          />
        )}

        {pagination.pageItems.length > 0 ? (
          <CustomTable
            columns={tableColumns}
            data={pagination.pageItems}
            getRowId={(row) => row.id}
          />
        ) : (
          <RequirementEmptyState message={labels.emptyMessage} />
        )}

        {visibility.showFooter && (
          <RequirementFooter
            labels={labels}
            showPager={visibility.showPager}
            page={pagination.page}
            pageCount={pagination.pageCount}
            onPageChange={pagination.setPage}
            showSave={visibility.showSave}
            saveDisabled={rows.length === 0 || saving}
            saving={saving}
            onSave={save}
          />
        )}
      </Box>

      <RequirementValueDialog value={dialogValue} onClose={() => setDialogValue(null)} />

      {filterConfig.showFilterButton && (
        <RequirementFilterDialog
          open={filtering.filterOpen}
          labels={labels}
          fields={filterConfig.fields}
          activeField={filtering.activeField}
          draftFilters={filtering.draftFilters}
          filterValues={filtering.filterValues}
          onClose={filtering.closeFilterDialog}
          onSelectField={filtering.setActiveField}
          onToggleValue={filtering.toggleDraftValue}
          onClearAll={filtering.clearDraftFilters}
          onApply={filtering.applyDraftFilters}
        />
      )}
    </Box>
  );
}

export default RequirementMgmt;
