import type { ReactNode } from "react";
import type { RequirementBadgeVariant } from "@insurance-poc/ui";

export type RequirementItem = {
  id: string | number;
  status: string;
  ocrStatus: string;
  team: string;
  profile: string;
  category: string;
  subCategory: string;
  document: string;
  reason: string;
  fupCode: string;
  extraRemarks: string;
  description: string;
};

export type RequirementColumnKey = Exclude<keyof RequirementItem, "id">;

export type RequirementStatusOption = { label: string; value: string };

/**
 * How a column renders its cell.
 * - text:   read-only text with ellipsis + tooltip
 * - select: dropdown (options from `options`, or `statusOptions` for the status column)
 * - input:  free-text field
 * - dialog: eye button that opens the value in a dialog
 * Editable types fall back to `text` when the table or the column is read-only.
 */
export type RequirementColumnType = "text" | "select" | "input" | "dialog";

export type RequirementColumnConfig = {
  key: RequirementColumnKey;
  header: string;
  /** Relative width; columns share the table width in proportion to their weight. */
  weight?: number;
  type?: RequirementColumnType;
  /** Forces this column to be read-only even when the table is editable. */
  readOnly?: boolean;
  /** Options for `type: "select"`. */
  options?: RequirementStatusOption[];
  /** Placeholder for `type: "input"`. */
  placeholder?: string;
  /** Replaces the default cell content entirely. */
  render?: (row: RequirementItem) => ReactNode;
};

export type RequirementRowActionTone = "primary" | "danger" | "info";

export type RequirementRowActionHelpers = {
  /** Removes the row from the table (local state only). */
  removeRow: () => void;
};

export type RequirementRowAction = {
  key: string;
  /** Used as tooltip and aria-label. */
  label: string;
  icon: ReactNode;
  /** Hover colour. Defaults to "primary". */
  tone?: RequirementRowActionTone;
  onClick: (row: RequirementItem, helpers: RequirementRowActionHelpers) => void;
  /** Per-row visibility, e.g. hide Delete for accepted rows. */
  hidden?: (row: RequirementItem) => boolean;
  disabled?: (row: RequirementItem) => boolean;
  /** Keep this action when the table is `readOnly`. */
  allowReadOnly?: boolean;
};

export type RequirementActionsColumnConfig = {
  header?: string;
  weight?: number;
  position?: "start" | "end";
};

export type RequirementAddButtonConfig = {
  label?: string;
  icon?: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Keep the button when the table is `readOnly`. */
  allowReadOnly?: boolean;
};

export type RequirementFilterField = {
  field: RequirementColumnKey;
  label: string;
};

export type RequirementFilterConfig = {
  /** Shows the status pills / filter bar. Defaults to `!readOnly`. */
  enabled?: boolean;
  /** Pills with counts on the left of the filter bar. Default true. */
  showStatusPills?: boolean;
  /** Filter button + dialog on the right of the filter bar. Default true. */
  showFilterDialog?: boolean;
  /** Fields listed in the filter dialog. */
  fields?: RequirementFilterField[];
};

export type RequirementLabels = {
  emptyMessage: string;
  filterTooltip: string;
  filterDialogTitle: string;
  clearFilters: string;
  clearAll: string;
  apply: string;
  noFilterValues: string;
  save: string;
  saving: string;
  noDescription: string;
};

export type RequirementMgmtProps = {
  requirements: RequirementItem[];

  /* Header */
  /** Set false to drop the whole header strip. */
  showHeader?: boolean;
  title?: ReactNode;
  /** Extra header content rendered before the Add button. */
  headerActions?: ReactNode;
  addButton?: RequirementAddButtonConfig;

  /* Table */
  /** Column definitions, in order. Defaults to `defaultRequirementColumns`. */
  columns?: RequirementColumnConfig[];
  /** Per-row buttons. Omit (or pass an empty list) to hide the Actions column. */
  rowActions?: RequirementRowAction[];
  actionsColumn?: RequirementActionsColumnConfig;
  /** Disables every editor and hides editing controls. */
  readOnly?: boolean;
  /** Rows per page. */
  pageSize?: number;
  /** Set false to hide the pager. Default true. */
  showPagination?: boolean;

  /* Status handling */
  /** Options of the status select. Defaults to the statuses found in `requirements`. */
  statusOptions?: RequirementStatusOption[];
  /** Status order used for sorting rows and the filter pills (first = top). */
  statusOrder?: string[];
  /** Badge variant used for the filter pill of each status. */
  statusVariants?: Record<string, RequirementBadgeVariant>;

  filter?: RequirementFilterConfig;
  /** Overrides any of the built-in texts. */
  labels?: Partial<RequirementLabels>;

  /** Shows the Save button in the footer when provided. */
  onSave?: (requirements: RequirementItem[]) => void | Promise<void>;
};

/** Selected values per column. */
export type Filters = Partial<Record<RequirementColumnKey, string[]>>;
