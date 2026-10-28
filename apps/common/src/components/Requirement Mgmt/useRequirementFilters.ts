import { useMemo, useState } from "react";
import { usePagination } from "./usePagination";
import type {
  Filters,
  RequirementColumnKey,
  RequirementFilterField,
  RequirementItem,
} from "./types";

type Options = {
  rows: RequirementItem[];
  filterFields: RequirementFilterField[];
  statusOrder: string[];
  pageSize: number;
};

const statusRank = (order: string[], status: string) => {
  const index = order.indexOf(status);
  return index === -1 ? order.length : index;
};

const matchesFilters = (row: RequirementItem, filters: Filters) =>
  (Object.keys(filters) as RequirementColumnKey[]).every((field) => {
    const selected = filters[field] ?? [];
    const current = row[field].trim().toUpperCase();
    return selected.length === 0 || selected.some((value) => value.toUpperCase() === current);
  });

const countStatuses = (rows: RequirementItem[], order: string[]) => {
  const counts = new Map<string, number>();
  rows.forEach((row) => counts.set(row.status, (counts.get(row.status) ?? 0) + 1));
  return Array.from(counts.entries()).sort(
    ([a], [b]) => statusRank(order, a) - statusRank(order, b) || a.localeCompare(b),
  );
};

const collectFilterValues = (rows: RequirementItem[], fields: RequirementFilterField[]) => {
  const values: Filters = {};
  fields.forEach(({ field }) => {
    values[field] = Array.from(new Set(rows.map((row) => row[field].trim()).filter(Boolean))).sort(
      (a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  });
  return values;
};

const toggleValue = (selected: string[], value: string) =>
  selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value];

/** Filtering, status counts and paging of the requirement rows. */
export function useRequirementFilters({ rows, filterFields, statusOrder, pageSize }: Options) {
  const [filters, setFilters] = useState<Filters>({});
  const [draftFilters, setDraftFilters] = useState<Filters>({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeField, setActiveField] = useState<RequirementColumnKey | undefined>(
    filterFields[0]?.field,
  );

  const statusCounts = useMemo(() => countStatuses(rows, statusOrder), [rows, statusOrder]);

  const filteredRows = useMemo(
    () =>
      rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => matchesFilters(row, filters))
        .sort(
          (a, b) =>
            statusRank(statusOrder, a.row.status) - statusRank(statusOrder, b.row.status) ||
            a.index - b.index,
        )
        .map(({ row }) => row),
    [rows, filters, statusOrder],
  );

  const pagination = usePagination(filteredRows, pageSize);

  const filterValues = useMemo(() => collectFilterValues(rows, filterFields), [rows, filterFields]);

  const applyFilters = (next: Filters) => {
    setFilters(next);
    pagination.resetPage();
  };

  const toggleStatusFilter = (status: string) =>
    applyFilters({ ...filters, status: filters.status?.includes(status) ? [] : [status] });

  const openFilterDialog = () => {
    setDraftFilters({ ...filters });
    setFilterOpen(true);
  };

  const toggleDraftValue = (field: RequirementColumnKey, value: string) =>
    setDraftFilters((current) => ({ ...current, [field]: toggleValue(current[field] ?? [], value) }));

  const applyDraftFilters = () => {
    applyFilters({ ...draftFilters });
    setFilterOpen(false);
  };

  return {
    filters,
    draftFilters,
    filterOpen,
    activeField,
    statusCounts,
    filterValues,
    pagination,
    selectedStatuses: filters.status ?? [],
    hasActiveFilters: Object.values(filters).some((values) => (values?.length ?? 0) > 0),
    setActiveField,
    toggleStatusFilter,
    toggleDraftValue,
    openFilterDialog,
    closeFilterDialog: () => setFilterOpen(false),
    clearFilters: () => applyFilters({}),
    clearDraftFilters: () => setDraftFilters({}),
    applyDraftFilters,
  };
}
