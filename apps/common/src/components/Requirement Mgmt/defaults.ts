import type {
  RequirementAddButtonConfig,
  RequirementColumnConfig,
  RequirementFilterConfig,
  RequirementFilterField,
  RequirementLabels,
  RequirementRowAction,
} from "./types";

export const defaultRequirementColumns: RequirementColumnConfig[] = [
  { key: "status", header: "Status", weight: 125, type: "select" },
  { key: "ocrStatus", header: "OCR Status", weight: 95 },
  { key: "team", header: "Team", weight: 85 },
  { key: "profile", header: "Profile", weight: 95 },
  { key: "category", header: "Category", weight: 105 },
  { key: "subCategory", header: "Sub Category", weight: 115 },
  { key: "document", header: "Document", weight: 120 },
  { key: "reason", header: "Reason", weight: 145 },
  { key: "fupCode", header: "FUP Code", weight: 85 },
  {
    key: "extraRemarks",
    header: "Extra Remarks",
    weight: 170,
    type: "input",
    placeholder: "Optional remarks",
  },
  { key: "description", header: "Description", weight: 85, type: "dialog" },
];

export const defaultRequirementFilterFields: RequirementFilterField[] = [
  { field: "category", label: "Category" },
  { field: "subCategory", label: "Sub Category" },
  { field: "profile", label: "Profile" },
  { field: "fupCode", label: "FUP Code" },
  { field: "status", label: "Status" },
];

export const DEFAULT_LABELS: RequirementLabels = {
  emptyMessage: "No requirements available",
  filterTooltip: "Filter requirements",
  filterDialogTitle: "FILTER",
  clearFilters: "Clear filters",
  clearAll: "Clear All",
  apply: "Apply",
  noFilterValues: "No filter values available",
  save: "Save",
  saving: "Saving...",
  noDescription: "No description available",
};

export const DEFAULT_COLUMN_WEIGHT = 100;
export const DEFAULT_ACTIONS_WEIGHT = 60;

export const NO_STATUS_ORDER: string[] = [];

export type ResolvedFilterConfig = {
  fields: RequirementFilterField[];
  showStatusPills: boolean;
  /** Filter button + dialog. */
  showFilterButton: boolean;
  /** The whole bar above the table. */
  showBar: boolean;
};

type VisibilityInput = {
  readOnly: boolean;
  addButton?: RequirementAddButtonConfig;
  rowActions: RequirementRowAction[];
  hasSave: boolean;
  showPagination: boolean;
  hasMultiplePages: boolean;
};

/** Which optional parts of the section are shown, given read-only mode and the config. */
export function resolveVisibility({
  readOnly,
  addButton,
  rowActions,
  hasSave,
  showPagination,
  hasMultiplePages,
}: VisibilityInput) {
  const keep = (allowReadOnly?: boolean) => !readOnly || Boolean(allowReadOnly);
  const showSave = !readOnly && hasSave;
  const showPager = showPagination && hasMultiplePages;

  return {
    addButton: addButton && keep(addButton.allowReadOnly) ? addButton : undefined,
    rowActions: rowActions.filter((action) => keep(action.allowReadOnly)),
    showSave,
    showPager,
    showFooter: showPager || showSave,
  };
}

export function resolveFilterConfig(
  filter: RequirementFilterConfig | undefined,
  readOnly: boolean,
): ResolvedFilterConfig {
  const fields = filter?.fields ?? defaultRequirementFilterFields;
  const showStatusPills = filter?.showStatusPills ?? true;
  const showFilterButton = (filter?.showFilterDialog ?? true) && fields.length > 0;
  const enabled = filter?.enabled ?? !readOnly;

  return {
    fields,
    showStatusPills,
    showFilterButton,
    showBar: enabled && (showStatusPills || showFilterButton),
  };
}
