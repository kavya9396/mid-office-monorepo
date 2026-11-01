import type { ReactNode } from "react";
import { Box, Pagination, Typography } from "@mui/material";
import {
  Badge,
  colors,
  CustomButton,
  CustomCheckbox,
  CustomDialog,
  CustomTooltip,
  FilterIcon,
  type RequirementBadgeVariant,
} from "@insurance-poc/ui";
import type {
  Filters,
  RequirementAddButtonConfig,
  RequirementColumnKey,
  RequirementFilterField,
  RequirementLabels,
} from "./types";

/* ------------------------------------------------------------------ */
/* Header strip                                                         */
/* ------------------------------------------------------------------ */

type HeaderProps = {
  title: ReactNode;
  headerActions?: ReactNode;
  /** Already resolved against read-only mode. */
  addButton?: RequirementAddButtonConfig;
};

export function RequirementHeader({ title, headerActions, addButton }: Readonly<HeaderProps>) {
  const hasActions = Boolean(headerActions || addButton);
  return (
    <Box
      sx={{
        minHeight: 42,
        px: 1.5,
        py: 0.7,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        borderBottom: `1px solid ${colors.borderBrand}`,
        bgcolor: colors.background,
      }}
    >
      {typeof title === "string" ? (
        <Typography sx={{ fontSize: 13, fontWeight: 800, color: colors.primary }}>{title}</Typography>
      ) : (
        title
      )}

      {hasActions && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {headerActions}
          {addButton && (
            <CustomButton
              size="small"
              variant="outlined"
              startIcon={addButton.icon}
              disabled={addButton.disabled}
              onClick={addButton.onClick}
            >
              {addButton.label ?? "+ Add Requirement"}
            </CustomButton>
          )}
        </Box>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Status pills + filter button                                         */
/* ------------------------------------------------------------------ */

type FilterBarProps = {
  labels: RequirementLabels;
  showStatusPills: boolean;
  showFilterButton: boolean;
  statusCounts: [string, number][];
  statusVariants: Record<string, RequirementBadgeVariant>;
  selectedStatuses: string[];
  hasActiveFilters: boolean;
  onToggleStatus: (status: string) => void;
  onClear: () => void;
  onOpenFilter: () => void;
};

export function RequirementFilterBar({
  labels,
  showStatusPills,
  showFilterButton,
  statusCounts,
  statusVariants,
  selectedStatuses,
  hasActiveFilters,
  onToggleStatus,
  onClear,
  onOpenFilter,
}: Readonly<FilterBarProps>) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 0.6,
        minHeight: 36,
        px: 0.75,
        py: 0.3,
        mb: 0.75,
        boxSizing: "border-box",
        bgcolor: colors.surfaceMuted,
        border: `1px solid ${colors.borderTable}`,
        borderRadius: "10px",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0.5, mr: "auto" }}>
        {showStatusPills &&
          statusCounts.map(([status, count]) => (
            <Badge
              key={status}
              label={status}
              count={count}
              variant={statusVariants[status] ?? "All"}
              selected={selectedStatuses.includes(status)}
              onClick={() => onToggleStatus(status)}
            />
          ))}
      </Box>

      {hasActiveFilters && (
        <CustomButton
          size="small"
          variant="outlined"
          onClick={onClear}
          sx={{
            minWidth: 0,
            height: 28,
            px: 1,
            py: 0,
            borderRadius: "7px",
            borderColor: colors.danger,
            color: colors.danger,
            bgcolor: colors.white,
            fontSize: "10.5px",
            fontWeight: 600,
            lineHeight: 1,
            "&:hover": {
              borderColor: colors.dangerHover,
              color: colors.danger,
              bgcolor: colors.dangerSurface,
            },
          }}
        >
          {labels.clearFilters}
        </CustomButton>
      )}

      {showFilterButton && (
        <CustomTooltip title={labels.filterTooltip} placement="left">
          <CustomButton
            variant="text"
            aria-label={labels.filterTooltip}
            onClick={onOpenFilter}
            sx={{
              width: 30,
              height: 28,
              minWidth: 30,
              p: 0,
              borderRadius: "7px",
              bgcolor: hasActiveFilters ? colors.surfaceSelected : "transparent",
              "&:hover": { bgcolor: colors.surfaceSelectedSoft },
            }}
          >
            <FilterIcon width={30} height={28} />
          </CustomButton>
        </CustomTooltip>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state                                                          */
/* ------------------------------------------------------------------ */

export function RequirementEmptyState({ message }: Readonly<{ message: string }>) {
  return (
    <Box
      sx={{
        py: 5,
        textAlign: "center",
        border: `1px solid ${colors.borderTable}`,
        borderRadius: "10px",
      }}
    >
      <Typography sx={{ fontSize: 14, color: colors.textEmpty }}>{message}</Typography>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Footer: pagination | save                                            */
/* ------------------------------------------------------------------ */

type FooterProps = {
  labels: RequirementLabels;
  showPager: boolean;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  showSave: boolean;
  saveDisabled: boolean;
  saving: boolean;
  onSave: () => void;
};

const paginationSx = {
  "& .MuiPagination-ul": { flexWrap: "nowrap" },
  "& .MuiPaginationItem-root": {
    color: colors.textNeutral,
    minWidth: 26,
    height: 26,
    mx: "1px",
    fontSize: "11px",
    borderRadius: "5px",
  },
  "& .MuiPaginationItem-icon": { fontSize: "17px" },
  "& .MuiPaginationItem-root.Mui-selected": {
    color: colors.white,
    bgcolor: colors.primary,
    "&:hover": { bgcolor: colors.primary },
  },
};

export function RequirementFooter({
  labels,
  showPager,
  page,
  pageCount,
  onPageChange,
  showSave,
  saveDisabled,
  saving,
  onSave,
}: Readonly<FooterProps>) {
  return (
    <Box
      sx={{
        mt: 0.75,
        mb: 0.25,
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 1,
        minHeight: 30,
        width: "100%",
      }}
    >
      <Box />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 0 }}>
        {showPager && (
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_event, value) => onPageChange(value)}
            shape="rounded"
            size="small"
            siblingCount={0}
            boundaryCount={1}
            sx={paginationSx}
          />
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          justifySelf: "end",
          gap: 0.75,
          flexShrink: 0,
        }}
      >
        {showSave && (
          <CustomButton onClick={onSave} variant="contained" disabled={saveDisabled}>
            {saving ? labels.saving : labels.save}
          </CustomButton>
        )}
      </Box>
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Value dialog (dialog columns)                                        */
/* ------------------------------------------------------------------ */

type ValueDialogProps = {
  value: { title: string; value: string } | null;
  onClose: () => void;
};

export function RequirementValueDialog({ value, onClose }: Readonly<ValueDialogProps>) {
  return (
    <CustomDialog
      open={Boolean(value)}
      onClose={onClose}
      title={
        <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>
          {value?.title}
        </Typography>
      }
    >
      <Typography
        sx={{ fontSize: 14, lineHeight: 1.6, color: colors.textBody, overflowWrap: "anywhere" }}
      >
        {value?.value}
      </Typography>
    </CustomDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Filter dialog                                                        */
/* ------------------------------------------------------------------ */

type FilterDialogProps = {
  open: boolean;
  labels: RequirementLabels;
  fields: RequirementFilterField[];
  activeField?: RequirementColumnKey;
  draftFilters: Filters;
  filterValues: Filters;
  onClose: () => void;
  onSelectField: (field: RequirementColumnKey) => void;
  onToggleValue: (field: RequirementColumnKey, value: string) => void;
  onClearAll: () => void;
  onApply: () => void;
};

function FilterFieldButton({
  label,
  active,
  count,
  onClick,
}: Readonly<{ label: string; active: boolean; count: number; onClick: () => void }>) {
  return (
    <CustomButton
      variant="text"
      fullWidth
      onClick={onClick}
      sx={{
        minHeight: 54,
        justifyContent: "space-between",
        px: 1.5,
        borderRadius: 0,
        borderBottom: `1px solid ${colors.borderSoft}`,
        borderLeft: `4px solid ${active ? colors.primary : "transparent"}`,
        bgcolor: active ? colors.surfaceSelectedSoft : colors.white,
        color: active ? colors.primary : colors.textBody,
        fontSize: "13px",
        fontWeight: active ? 700 : 500,
        "&:hover": { bgcolor: colors.background },
      }}
    >
      <span>{label}</span>
      {count > 0 && (
        <Box
          component="span"
          sx={{
            minWidth: 20,
            height: 20,
            px: 0.5,
            borderRadius: "10px",
            bgcolor: colors.primary,
            color: colors.white,
            fontSize: "10px",
            lineHeight: "20px",
          }}
        >
          {count}
        </Box>
      )}
    </CustomButton>
  );
}

function FilterValueList({
  values,
  selected,
  emptyText,
  onToggle,
}: Readonly<{
  values: string[];
  selected: string[];
  emptyText: string;
  onToggle: (value: string) => void;
}>) {
  if (values.length === 0) {
    return (
      <Typography sx={{ py: 2, textAlign: "center", fontSize: 13, color: colors.textMuted }}>
        {emptyText}
      </Typography>
    );
  }

  return (
    <>
      {values.map((value) => (
        <Box
          key={value}
          sx={{ display: "flex", alignItems: "center", minHeight: 40, px: 0.5, borderRadius: "6px" }}
        >
          <CustomCheckbox
            label={value}
            checked={selected.includes(value)}
            onChange={() => onToggle(value)}
          />
        </Box>
      ))}
    </>
  );
}

export function RequirementFilterDialog({
  open,
  labels,
  fields,
  activeField,
  draftFilters,
  filterValues,
  onClose,
  onSelectField,
  onToggleValue,
  onClearAll,
  onApply,
}: Readonly<FilterDialogProps>) {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title={
        <Typography component="span" sx={{ fontSize: 12, fontWeight: 800 }}>
          {labels.filterDialogTitle}
        </Typography>
      }
      paperSx={{ width: 620, maxWidth: "calc(100% - 24px)", minHeight: 430, overflow: "hidden" }}
      contentSx={{ m: 0, display: "flex", minHeight: 290 }}
      actionsSx={{
        m: 0,
        justifyContent: "center",
        gap: 1.5,
        minHeight: 78,
        px: 2,
        py: 1.25,
        borderTop: `1px solid ${colors.borderSoft}`,
      }}
      actions={
        <>
          <CustomButton variant="outlined" onClick={onClearAll} sx={{ minWidth: 90 }}>
            {labels.clearAll}
          </CustomButton>
          <CustomButton variant="contained" onClick={onApply} sx={{ minWidth: 90 }}>
            {labels.apply}
          </CustomButton>
        </>
      }
    >
      <Box
        sx={{
          width: "35%",
          flexShrink: 0,
          borderRight: `1px solid ${colors.borderSoft}`,
          bgcolor: colors.white,
        }}
      >
        {fields.map(({ field, label }) => (
          <FilterFieldButton
            key={field}
            label={label}
            active={activeField === field}
            count={draftFilters[field]?.length ?? 0}
            onClick={() => onSelectField(field)}
          />
        ))}
      </Box>

      <Box sx={{ flex: 1, p: 1.75, overflowY: "auto", maxHeight: 290 }}>
        <FilterValueList
          values={(activeField && filterValues[activeField]) || []}
          selected={(activeField && draftFilters[activeField]) || []}
          emptyText={labels.noFilterValues}
          onToggle={(value) => activeField && onToggleValue(activeField, value)}
        />
      </Box>
    </CustomDialog>
  );
}
