import { useEffect, useMemo, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import {
  CustomButton,
  CustomCheckbox,
  CustomDialog,
  CustomTextField,
  DangerIcon,
  FilterIcon,
  KeyDownArrowIcon,
  KeyLeftArrowIcon,
  KeyRightArrowIcon,
  KeyUpArrowIcon,
  SearchIcon,
  SettingsIcon,
  TickIcon,
  TimeIcon,
} from "@insurance-poc/ui";
import type { InboxCase, InboxFieldValue } from "./inboxApi";
import {
  columnsForPool,
  defaultVisibleColumns,
  formatColumnName,
  HIDDEN_COLUMNS,
  isApplicationColumn,
  MAX_VISIBLE_COLUMNS,
} from "./inboxFormat";

type SortDirection = "asc" | "desc";
type TimingStatus = "overdue" | "atRisk" | "normal";

type InboxTableProps = {
  title: string;
  cases: InboxCase[];
  poolKey?: string;
  onOpen: (item: InboxCase) => void;
  onLoadColumns?: (poolKey: string) => Promise<string[]>;
  onSaveColumns?: (poolKey: string, selectedFields: string[]) => Promise<string[]>;
  onColumnNotice?: (message: string) => void;
};

const PAGE_SIZES = [10, 25, 50, 100];

const referenceOutlinedSx = {
  borderColor: "#9A2529",
  color: "#9A2529",
  borderRadius: "4px",
  "&:hover": {
    borderColor: "#8f2026",
    color: "#9A2529",
    backgroundColor: "rgba(176,42,48,0.08)",
  },
} as const;

const referenceContainedSx = {
  backgroundColor: "#9A2529",
  color: "#ffffff",
  borderRadius: "4px",
  "&:hover": { backgroundColor: "#8f2026" },
} as const;

function cellText(value: InboxFieldValue | undefined): string {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toString();
  if (value.includes("T") && value.length >= 19) {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date.toLocaleDateString("en-GB");
  }
  return value;
}

function fieldTime(value: InboxFieldValue | undefined): number | null {
  if (typeof value !== "string" || value.trim().length === 0) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function timingStatus(item: InboxCase, now: number): TimingStatus {
  const due = fieldTime(item.fields.dueDate ?? item.fields.due_date);
  if (due !== null && due < now) return "overdue";
  const risk = fieldTime(item.fields.atRiskTime ?? item.fields.at_risk_time);
  if (risk !== null && risk < now) return "atRisk";
  return "normal";
}

function priorityRank(status: TimingStatus): number {
  if (status === "overdue") return 0;
  if (status === "atRisk") return 1;
  return 2;
}

function columnKeys(cases: InboxCase[]): string[] {
  const keys = new Set<string>();
  for (const item of cases) {
    for (const key of Object.keys(item.fields)) {
      if (!HIDDEN_COLUMNS.has(key)) keys.add(key);
    }
  }
  return [...keys];
}

function columnError(reason: unknown): string {
  return reason instanceof Error ? reason.message : "Unable to update the column configuration.";
}

function compareText(left: string, right: string, direction: SortDirection): number {
  const result = left.localeCompare(right, undefined, { numeric: true });
  return direction === "asc" ? result : -result;
}

function downloadCsv(title: string, columns: string[], rows: InboxCase[]): void {
  const header = columns.map(formatColumnName).join(",");
  const body = rows
    .map((row) => columns.map((column) => `"${cellText(row.fields[column]).split('"').join('""')}"`).join(","))
    .join("\n");
  const blob = new Blob([`${header}\n${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.split(" ").join("_")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function PriorityLegend({
  cases,
  active,
  onSelect,
}: Readonly<{
  cases: InboxCase[];
  active: TimingStatus | null;
  onSelect: (status: TimingStatus) => void;
}>) {
  const now = Date.now();
  let highPriority = 0;
  let atRisk = 0;
  let normal = 0;
  for (const item of cases) {
    const status = timingStatus(item, now);
    if (status === "overdue") highPriority += 1;
    if (status === "atRisk") atRisk += 1;
    if (status === "normal") normal += 1;
  }

  const items = [
    { status: "overdue" as const, label: "High Priority", color: "#D32F2F", count: highPriority, icon: <DangerIcon width={14} height={14} /> },
    { status: "atRisk" as const, label: "At Risk", color: "#ED8A00", count: atRisk, icon: <TimeIcon width={14} height={14} /> },
    { status: "normal" as const, label: "Normal", color: "#155a87", count: normal, icon: <TickIcon width={14} height={14} /> },
  ];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, whiteSpace: "nowrap" }}>
      {items.map((item) => (
        <Box
          key={item.label}
          role="button"
          tabIndex={0}
          aria-pressed={active === item.status}
          onClick={() => onSelect(item.status)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            onSelect(item.status);
          }}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            cursor: "pointer",
            borderRadius: "12px",
            px: 0.75,
            py: 0.25,
            backgroundColor: active === item.status ? `${item.color}14` : "transparent",
            outline: active === item.status ? `1px solid ${item.color}` : "none",
          }}
        >
          <Box
            sx={{
              width: "14px",
              height: "14px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              color: item.color,
            }}
          >
            {item.icon}
          </Box>
          <Typography component="span" sx={{ fontSize: "10px", lineHeight: 1, color: "#4b5055" }}>
            {item.label}
          </Typography>
          <Box
            component="span"
            sx={{
              minWidth: "16px",
              height: "16px",
              px: 0.5,
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${item.color}14`,
              color: item.color,
              fontSize: "10px",
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {item.count}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function InboxTable({
  title,
  cases,
  poolKey,
  onOpen,
  onLoadColumns,
  onSaveColumns,
  onColumnNotice,
}: Readonly<InboxTableProps>) {
  const catalog = useMemo(
    () => columnsForPool(columnKeys(cases), poolKey),
    [cases, poolKey],
  );
  const [visible, setVisible] = useState<string[]>([]);
  const [draftSelected, setDraftSelected] = useState<string[]>([]);
  const [draftAvailable, setDraftAvailable] = useState<string[]>([]);
  const [pickedAvailable, setPickedAvailable] = useState<string[]>([]);
  const [pickedSelected, setPickedSelected] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [draftFilters, setDraftFilters] = useState<Record<string, string[]>>({});
  const [activeFilter, setActiveFilter] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortColumn, setSortColumn] = useState("");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [priorityFilter, setPriorityFilter] = useState<TimingStatus | null>(null);
  const [savingColumns, setSavingColumns] = useState(false);

  useEffect(() => {
    const defaults = defaultVisibleColumns(catalog, poolKey);
    setVisible(defaults);
    setFilters({});
    setPage(0);
    setPriorityFilter(null);
    if (!poolKey || !onLoadColumns) return;
    let current = true;
    onLoadColumns(poolKey)
      .then((fields) => {
        if (!current) return;
        const next = fields.filter((field) => catalog.includes(field)).slice(0, MAX_VISIBLE_COLUMNS);
        if (next.length > 0) setVisible(next);
      })
      .catch((reason: unknown) => {
        if (current) onColumnNotice?.(columnError(reason));
      });
    return () => {
      current = false;
    };
  }, [catalog, onColumnNotice, onLoadColumns, poolKey]);

  const defaultColumns = defaultVisibleColumns(catalog, poolKey);
  const applicationColumn = defaultColumns[0] ?? "applicationNo";
  const columns = visible.length > 0
    ? [
      applicationColumn,
      ...visible.filter((column) => column !== applicationColumn),
    ].slice(0, MAX_VISIBLE_COLUMNS)
    : defaultColumns;
  const query = searchText.trim().toLowerCase();

  const filtered = cases.filter((item) => {
    const matchesPriority = priorityFilter === null || timingStatus(item, Date.now()) === priorityFilter;
    const matchesSearch =
      query.length === 0 ||
      columns.some((column) => cellText(item.fields[column]).toLowerCase().includes(query));
    const matchesFilters = Object.entries(filters).every(([column, selected]) => {
      if (selected.length === 0) return true;
      return selected.includes(cellText(item.fields[column]));
    });
    return matchesPriority && matchesSearch && matchesFilters;
  });
  const now = Date.now();

  const sorted = [...filtered].sort((left, right) => {
    const priorityDifference =
      priorityRank(timingStatus(left, now)) - priorityRank(timingStatus(right, now));
    if (priorityDifference !== 0) return priorityDifference;
    if (sortColumn.length === 0) return 0;
    return compareText(cellText(left.fields[sortColumn]), cellText(right.fields[sortColumn]), sortDirection);
  });
  const pageRows = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  function toggleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection("asc");
  }

  function openSettings() {
    setDraftSelected(columns);
    setDraftAvailable(catalog.filter((column) => !columns.includes(column) && !isApplicationColumn(column)));
    setPickedAvailable([]);
    setPickedSelected([]);
    setSettingsOpen(true);
  }

  function togglePicked(column: string, selected: boolean) {
    const update = selected ? setPickedSelected : setPickedAvailable;
    update((current) =>
      current.includes(column) ? current.filter((item) => item !== column) : [...current, column],
    );
  }

  function movePickedToSelected() {
    const remaining = MAX_VISIBLE_COLUMNS - draftSelected.length;
    if (remaining <= 0 || pickedAvailable.length === 0) return;
    const moving = pickedAvailable.slice(0, remaining);
    setDraftSelected((current) => [...current, ...moving]);
    setDraftAvailable((current) => current.filter((column) => !moving.includes(column)));
    setPickedAvailable([]);
  }

  function movePickedToAvailable() {
    const moving = pickedSelected.filter((column) => !isApplicationColumn(column));
    if (moving.length === 0) return;
    setDraftSelected((current) => current.filter((column) => !moving.includes(column)));
    setDraftAvailable((current) => [...current, ...moving.filter((column) => !current.includes(column))]);
    setPickedSelected([]);
  }

  function applyDraft(nextSelected: string[]) {
    const selected = nextSelected.slice(0, MAX_VISIBLE_COLUMNS);
    setDraftSelected(selected);
    setDraftAvailable(catalog.filter((column) => !selected.includes(column) && !isApplicationColumn(column)));
    setPickedAvailable([]);
    setPickedSelected([]);
    setVisible(selected);
  }

  async function resetColumns() {
    if (!poolKey || !onSaveColumns) {
      applyDraft(defaultColumns);
      return;
    }
    setSavingColumns(true);
    try {
      const saved = await onSaveColumns(poolKey, defaultColumns);
      const next = saved.filter((field) => catalog.includes(field));
      applyDraft(next.length > 0 ? next : defaultColumns);
    } catch (reason: unknown) {
      onColumnNotice?.(columnError(reason));
    } finally {
      setSavingColumns(false);
    }
  }

  async function saveColumns() {
    const next = draftSelected.slice(0, MAX_VISIBLE_COLUMNS);
    if (next.length === 0) return;
    if (!poolKey || !onSaveColumns) {
      setVisible(next);
      setSettingsOpen(false);
      return;
    }
    setSavingColumns(true);
    try {
      const saved = await onSaveColumns(poolKey, next);
      const applied = saved.filter((field) => catalog.includes(field)).slice(0, MAX_VISIBLE_COLUMNS);
      setVisible(applied.length > 0 ? applied : next);
      setSettingsOpen(false);
    } catch (reason: unknown) {
      onColumnNotice?.(columnError(reason));
    } finally {
      setSavingColumns(false);
    }
  }

  function moveDraft(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draftSelected.length) return;
    setDraftSelected((current) => {
      const next = [...current];
      const currentColumn = next[index];
      const swapColumn = next[nextIndex];
      if (!currentColumn || !swapColumn) return current;
      if (isApplicationColumn(currentColumn) || isApplicationColumn(swapColumn)) return current;
      next[index] = swapColumn;
      next[nextIndex] = currentColumn;
      return next;
    });
  }

  const filterColumn = columns.includes(activeFilter) ? activeFilter : (columns[0] ?? "");
  const filterOptions = [...new Set(cases.map((item) => cellText(item.fields[filterColumn])))].filter(
    (value) => value !== "-",
  );

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: 5,
        borderRadius: "10px",
        backgroundColor: "#ffffff",
      }}
    >
      <Box
        sx={{
          height: "38px",
          minHeight: "38px",
          flexShrink: 0,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#E45F14",
          color: "#fff",
          boxSizing: "border-box",
          borderRadius: "10px 10px 0 0",
        }}
      >
        <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>{title}</Typography>
      </Box>

      <Box
        sx={{
          height: "36px",
          minHeight: "36px",
          flexShrink: 0,
          px: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#fff",
          borderBottom: "1px solid #e3e6e8",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <CustomButton
            size="small"
            variant="outlined"
            onClick={() => downloadCsv(title, columns, sorted)}
            sx={{ ...referenceOutlinedSx, fontSize: "10px", flexShrink: 0 }}
          >
            Download Excel
          </CustomButton>
          <PriorityLegend
            cases={cases}
            active={priorityFilter}
            onSelect={(status) => {
              setPriorityFilter((current) => (current === status ? null : status));
              setPage(0);
            }}
          />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {searchOpen ? (
            <CustomTextField
              size="small"
              value={searchText}
              placeholder="Search..."
              onChange={(event) => {
                setSearchText(event.target.value);
                setPage(0);
              }}
              sx={{
                width: "200px",
                "& .MuiInputBase-root": { height: "28px", fontSize: "11px", borderRadius: "5px" },
                "& .MuiOutlinedInput-input": { padding: "5px 8px" },
              }}
            />
          ) : null}
          <Box aria-label="Search cases" onClick={() => setSearchOpen((open) => !open)} sx={{ cursor: "pointer", mt: 0.5 }}>
            <SearchIcon width={32} height={32} />
          </Box>
          <Box
            aria-label="Filter cases"
            onClick={() => { setDraftFilters(filters); setFilterOpen(true); }}
            sx={{ cursor: "pointer", mt: 0.5 }}
          >
            <FilterIcon width={32} />
          </Box>
          {poolKey ? (
            <Box aria-label="Configure columns" onClick={openSettings} sx={{ cursor: "pointer", mt: 0.5 }}>
              <SettingsIcon width={32} />
            </Box>
          ) : null}
        </Box>
      </Box>

      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          overflowX: "hidden",
          overflowY: "auto",
          boxSizing: "border-box",
          "&::-webkit-scrollbar": { width: "6px", height: "6px" },
          "&::-webkit-scrollbar-thumb": { backgroundColor: "#c7cdd3", borderRadius: "10px" },
          "&::-webkit-scrollbar-track": { backgroundColor: "#f7f8f9" },
        }}
      >
        <Table
          stickyHeader
          size="small"
          sx={{ width: "100%", tableLayout: "fixed", "& .MuiTableCell-root": { boxSizing: "border-box" } }}
        >
          <TableHead>
            <TableRow>
              {columns.map((column) => {
                const applicationColumn = isApplicationColumn(column);
                const label = formatColumnName(column);
                return (
                  <TableCell
                    key={column}
                    onClick={() => toggleSort(column)}
                    sx={{
                      width: applicationColumn ? "16%" : undefined,
                      height: "30px",
                      padding: applicationColumn ? "0 10px 0 28px" : "0 10px",
                      backgroundColor: "#eef1f4",
                      color: "#20252a",
                      fontSize: "11px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      borderBottom: "1px solid #d9dde1",
                      cursor: "pointer",
                      userSelect: "none",
                      "&:hover": { backgroundColor: "#e7ebee" },
                    }}
                  >
                    <Tooltip title={label} placement="top" arrow enterDelay={300}>
                      <TableSortLabel
                        active={sortColumn === column}
                        direction={sortColumn === column ? sortDirection : "asc"}
                        sx={{
                          maxWidth: "100%",
                          minWidth: 0,
                          color: "#20252a",
                          "&:hover": { color: "#20252a" },
                          "&.Mui-active": { color: "#0D4C7D" },
                          "& .MuiTableSortLabel-icon": {
                            width: "14px",
                            height: "14px",
                            marginLeft: "3px",
                            color: "#8a8f94 !important",
                            opacity: 0.65,
                            flexShrink: 0,
                          },
                          "&.Mui-active .MuiTableSortLabel-icon": { color: "#0D4C7D !important", opacity: 1 },
                        }}
                      >
                        <Typography
                          component="span"
                          sx={{
                            minWidth: 0,
                            fontSize: "11px",
                            fontWeight: 600,
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {label}
                        </Typography>
                      </TableSortLabel>
                    </Tooltip>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(columns.length, 1)}
                  align="center"
                  sx={{ height: "80px", color: "#8a8f94", fontSize: "11px", borderBottom: 0 }}
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const status = timingStatus(row, now);
                const warningColor = status === "overdue" ? "#D32F2F" : "#C05600";
                return (
                  <TableRow
                    key={row.rowId}
                    hover
                    sx={{
                      height: "30px",
                      "&:nth-of-type(even)": { backgroundColor: "#fafafa" },
                      "&:hover": { backgroundColor: "#f3f7fa" },
                      "&:last-child td": { borderBottom: 0 },
                    }}
                  >
                    {columns.map((column) => {
                      const value = cellText(row.fields[column]);
                      const applicationColumn = isApplicationColumn(column);
                      const color = status === "normal" ? "#155a87" : warningColor;
                      return (
                        <TableCell
                          key={column}
                          title={value}
                          sx={{
                            height: "30px",
                            padding: "0 10px",
                            fontSize: "11px",
                            lineHeight: 1.1,
                            color: applicationColumn ? color : "#4b5055",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            borderBottom: "1px solid #eeeeee",
                          }}
                        >
                          {applicationColumn ? (
                            <Box
                              component="button"
                              type="button"
                              onClick={() => onOpen(row)}
                              sx={{
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                maxWidth: "100%",
                                p: 0,
                                border: 0,
                                background: "transparent",
                                color,
                                font: "inherit",
                                fontSize: "11px",
                                fontWeight: 500,
                                lineHeight: 1.1,
                                textDecoration: "underline",
                                textUnderlineOffset: "2px",
                                "&:hover": { color: status === "normal" ? "#9A2529" : warningColor },
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  width: "14px",
                                  height: "14px",
                                  flexShrink: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                {status === "normal" ? null : <DangerIcon width={14} height={14} />}
                              </Box>
                              <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {value}
                              </Box>
                            </Box>
                          ) : (
                            value
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={sorted.length}
        page={page}
        onPageChange={(_event, nextPage) => setPage(nextPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(Number(event.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={PAGE_SIZES}
        labelRowsPerPage="Show"
        sx={{
          minHeight: "34px",
          height: "34px",
          maxHeight: "34px",
          flexShrink: 0,
          overflow: "hidden",
          boxSizing: "border-box",
          backgroundColor: "#fff",
          borderTop: "1px solid #e3e6e8",
          borderRadius: "0 0 10px 10px",
          "& .MuiTablePagination-toolbar": { minHeight: "34px", height: "34px", padding: "0 8px 0 16px" },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": { fontSize: "11px", color: "#555" },
          "& .MuiTablePagination-select": { fontSize: "11px" },
          "& .MuiTablePagination-actions": { marginLeft: "8px" },
          "& .MuiIconButton-root": { padding: "3px" },
        }}
      />

      <CustomDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="FILTER"
        maxWidth="md"
        fullWidth
        contentSx={{ p: 2 }}
        actionsSx={{ justifyContent: "center", gap: 2, pb: 3 }}
        actions={
          <>
            <CustomButton variant="outlined" onClick={() => setDraftFilters({})} sx={{ ...referenceOutlinedSx, borderRadius: "50px", px: 4 }}>
              Clear All
            </CustomButton>
            <CustomButton
              variant="contained"
              onClick={() => { setFilters(draftFilters); setPage(0); setFilterOpen(false); }}
              sx={{ ...referenceContainedSx, borderRadius: "50px", px: 4 }}
            >
              Apply
            </CustomButton>
          </>
        }
      >
        <Box sx={{ display: "flex", height: 420, width: "100%" }}>
          <Box sx={{ width: "40%", borderRight: "1px solid #eee", overflowY: "auto" }}>
            {columns.map((column) => (
              <Box
                key={column}
                onClick={() => setActiveFilter(column)}
                sx={{
                  padding: "12px",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "#333333",
                  backgroundColor: filterColumn === column ? "#f0f3f8" : "transparent",
                  borderLeft: filterColumn === column ? "4px solid #004A80" : "4px solid transparent",
                }}
              >
                {formatColumnName(column)}
              </Box>
            ))}
            {columns.length === 0 ? (
              <Box sx={{ padding: "12px", color: "#666" }}>No visible columns to filter</Box>
            ) : null}
          </Box>
          <Box sx={{ width: "60%", p: 2, overflowY: "auto" }}>
            {filterOptions.map((option) => (
              <Box key={option} sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CustomCheckbox
                  label={option}
                  checked={(draftFilters[filterColumn] ?? []).includes(option)}
                  onChange={() => {
                    setDraftFilters((current) => {
                      const selected = current[filterColumn] ?? [];
                      const next = selected.includes(option)
                        ? selected.filter((value) => value !== option)
                        : [...selected, option];
                      return { ...current, [filterColumn]: next };
                    });
                  }}
                />
              </Box>
            ))}
            {filterColumn.length > 0 && filterOptions.length === 0 ? (
              <Box sx={{ color: "#666", fontSize: "14px" }}>No values available for this column</Box>
            ) : null}
          </Box>
        </Box>
      </CustomDialog>

      <CustomDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Configure Columns"
        maxWidth="md"
        fullWidth
        actionsSx={{ justifyContent: "center", pb: 2 }}
        actions={
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, width: "100%" }}>
            <CustomButton size="small" variant="outlined" disabled={savingColumns} onClick={() => { void resetColumns(); }} sx={{ ...referenceOutlinedSx, fontSize: "12px", borderRadius: "8px", px: 2 }}>
              {savingColumns ? "Saving..." : "Reset"}
            </CustomButton>
            <CustomButton
              size="small"
              variant="contained"
              disabled={draftSelected.length === 0 || savingColumns}
              onClick={() => { void saveColumns(); }}
              sx={{ ...referenceContainedSx, fontSize: "12px", borderRadius: "8px", px: 2 }}
            >
              {savingColumns ? "Saving..." : "Save"}
            </CustomButton>
          </Box>
        }
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%", mt: 2 }}>
          <ColumnPickerPane
            title="Available Columns"
            countLabel={`${draftAvailable.length} columns`}
            columns={draftAvailable}
            emptyLabel="No available columns"
            renderItem={(column) => {
              const full = draftSelected.length >= MAX_VISIBLE_COLUMNS;
              return (
                <ListItemButton disabled={full && !pickedAvailable.includes(column)} sx={{ minHeight: "32px", py: 0, px: 1 }}>
                  <ListItemIcon sx={{ minWidth: "30px" }}>
                    <CustomCheckbox
                      edge="start"
                      checked={pickedAvailable.includes(column)}
                      disabled={full && !pickedAvailable.includes(column)}
                      onChange={() => togglePicked(column, false)}
                      onClick={(event) => event.stopPropagation()}
                      tabIndex={-1}
                    />
                  </ListItemIcon>
                  <ListItemText primary={<Typography sx={{ fontSize: "11px", color: "#444" }}>{formatColumnName(column)}</Typography>} />
                </ListItemButton>
              );
            }}
          />

          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
            <CustomButton
              sx={{ ...referenceOutlinedSx, my: 1 }}
              variant="outlined"
              size="small"
              aria-label="Move checked columns to selected"
              onClick={movePickedToSelected}
              disabled={pickedAvailable.length === 0 || draftSelected.length >= MAX_VISIBLE_COLUMNS}
            >
              <KeyRightArrowIcon />
            </CustomButton>
            <CustomButton
              sx={{ ...referenceOutlinedSx, my: 1 }}
              variant="outlined"
              size="small"
              aria-label="Move checked columns to available"
              onClick={movePickedToAvailable}
              disabled={pickedSelected.length === 0}
            >
              <KeyLeftArrowIcon />
            </CustomButton>
          </Box>

          <ColumnPickerPane
            title="Selected Columns"
            countLabel={`${draftSelected.length} / ${MAX_VISIBLE_COLUMNS}`}
            countColor={draftSelected.length >= MAX_VISIBLE_COLUMNS ? "#9A2529" : "#777"}
            columns={draftSelected}
            emptyLabel="Select columns from the left"
            renderItem={(column, index) => {
              const locked = isApplicationColumn(column);
              return (
                <ListItemButton sx={{ minHeight: "32px", py: 0, px: 1, pr: 0.5, cursor: locked ? "default" : "pointer" }}>
                  <ListItemIcon sx={{ minWidth: "30px" }}>
                    <CustomCheckbox
                      edge="start"
                      checked={locked || pickedSelected.includes(column)}
                      disabled={locked}
                      onChange={() => togglePicked(column, true)}
                      onClick={(event) => event.stopPropagation()}
                      tabIndex={-1}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: "11px", color: "#333", fontWeight: 500 }}>
                        {formatColumnName(column)}
                      </Typography>
                    }
                  />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, ml: 1 }}>
                    <Button
                      aria-label="Move column up"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveDraft(index, -1);
                      }}
                      disabled={index === 0 || locked}
                      sx={reorderButtonSx}
                    >
                      <KeyUpArrowIcon />
                    </Button>
                    <Button
                      aria-label="Move column down"
                      onClick={(event) => {
                        event.stopPropagation();
                        moveDraft(index, 1);
                      }}
                      disabled={locked || index === draftSelected.length - 1}
                      sx={reorderButtonSx}
                    >
                      <KeyDownArrowIcon />
                    </Button>
                  </Box>
                </ListItemButton>
              );
            }}
          />
        </Box>
      </CustomDialog>
    </Box>
  );
}

const reorderButtonSx = {
  minWidth: "24px",
  width: "24px",
  height: "24px",
  padding: 0,
  border: "1px solid #e1e4e7",
  borderRadius: "4px",
  color: "#555",
  fontSize: "13px",
} as const;

function ColumnPickerPane({
  title,
  countLabel,
  countColor = "#777",
  columns,
  emptyLabel,
  renderItem,
}: Readonly<{
  title: string;
  countLabel: string;
  countColor?: string;
  columns: string[];
  emptyLabel: string;
  renderItem: (column: string, index: number) => ReactNode;
}>) {
  return (
    <Box sx={{ flex: 1, backgroundColor: "#fff", border: "1px solid #dfe3e8", borderRadius: "8px", overflow: "hidden" }}>
      <Box sx={{ px: 1.5, py: 1, borderBottom: "1px solid #e5e7eb", backgroundColor: "#f3f5f7" }}>
        <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>{title}</Typography>
        <Typography sx={{ fontSize: "10px", color: countColor, mt: 0.2 }}>{countLabel}</Typography>
      </Box>
      <List dense sx={{ height: "300px", overflowY: "auto", p: 1 }}>
        {columns.map((column, index) => (
          <ListItem key={column} disablePadding>
            {renderItem(column, index)}
          </ListItem>
        ))}
        {columns.length === 0 ? (
          <Box sx={{ py: 5, textAlign: "center" }}>
            <Typography sx={{ fontSize: "11px", color: "#999" }}>{emptyLabel}</Typography>
          </Box>
        ) : null}
      </List>
    </Box>
  );
}
