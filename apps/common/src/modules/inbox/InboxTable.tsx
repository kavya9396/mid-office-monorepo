import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
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
  defaultVisibleColumns,
  formatColumnName,
  HIDDEN_COLUMNS,
  isApplicationColumn,
} from "./inboxFormat";

type SortDirection = "asc" | "desc";
type TimingStatus = "overdue" | "atRisk" | "normal";

type InboxTableProps = {
  title: string;
  cases: InboxCase[];
  onOpen: (item: InboxCase) => void;
};

const PAGE_SIZES = [10, 25, 50, 100];
const MAX_VISIBLE_COLUMNS = 9;

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

function columnKeys(cases: InboxCase[]): string[] {
  const keys = new Set<string>();
  for (const item of cases) {
    for (const key of Object.keys(item.fields)) {
      if (!HIDDEN_COLUMNS.has(key)) keys.add(key);
    }
  }
  return [...keys];
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

function PriorityLegend({ cases }: Readonly<{ cases: InboxCase[] }>) {
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
    { label: "High Priority", color: "#D32F2F", count: highPriority, icon: <DangerIcon width={14} height={14} /> },
    { label: "At Risk", color: "#ED8A00", count: atRisk, icon: <TimeIcon width={14} height={14} /> },
    { label: "Normal", color: "#155a87", count: normal, icon: <TickIcon width={14} height={14} /> },
  ];

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      {items.map((item) => (
        <Box key={item.label} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, color: item.color }}>
          {item.icon}
          <Typography sx={{ fontSize: "10px", color: "#4b5055" }}>{item.label}</Typography>
          <Box
            sx={{
              minWidth: 16,
              height: 16,
              px: 0.5,
              borderRadius: "8px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${item.color}14`,
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            {item.count}
          </Box>
        </Box>
      ))}
    </Box>
  );
}

export function InboxTable({ title, cases, onOpen }: Readonly<InboxTableProps>) {
  const available = useMemo(() => columnKeys(cases), [cases]);
  const [visible, setVisible] = useState<string[]>([]);
  const [draftVisible, setDraftVisible] = useState<string[]>([]);
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

  useEffect(() => {
    setVisible(defaultVisibleColumns(available));
    setFilters({});
    setPage(0);
  }, [available]);

  const columns = visible.length > 0 ? visible : defaultVisibleColumns(available);
  const query = searchText.trim().toLowerCase();

  const filtered = cases.filter((item) => {
    const matchesSearch =
      query.length === 0 ||
      columns.some((column) => cellText(item.fields[column]).toLowerCase().includes(query));
    const matchesFilters = Object.entries(filters).every(([column, selected]) => {
      if (selected.length === 0) return true;
      return selected.includes(cellText(item.fields[column]));
    });
    return matchesSearch && matchesFilters;
  });

  const sorted = [...filtered].sort((left, right) => {
    if (sortColumn.length === 0) return 0;
    return compareText(cellText(left.fields[sortColumn]), cellText(right.fields[sortColumn]), sortDirection);
  });
  const pageRows = sorted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const now = Date.now();

  function toggleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortColumn(column);
    setSortDirection("asc");
  }

  function openSettings() {
    setDraftVisible(columns);
    setSettingsOpen(true);
  }

  function moveToSelected(column: string) {
    if (draftVisible.includes(column) || draftVisible.length >= MAX_VISIBLE_COLUMNS) return;
    setDraftVisible((current) => [...current, column]);
  }

  function moveToAvailable(column: string) {
    if (isApplicationColumn(column)) return;
    setDraftVisible((current) => current.filter((item) => item !== column));
  }

  function moveDraft(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draftVisible.length) return;
    setDraftVisible((current) => {
      const next = [...current];
      const currentColumn = next[index];
      const swapColumn = next[nextIndex];
      if (!currentColumn || !swapColumn) return current;
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
    <Box sx={{ m: 2, display: "flex", flexDirection: "column", boxShadow: 5, borderRadius: "10px", minWidth: 0 }}>
      <Box
        sx={{
          height: 38,
          px: 1.5,
          display: "flex",
          alignItems: "center",
          backgroundColor: "#E45F14",
          color: "#fff",
          borderRadius: "10px 10px 0 0",
        }}
      >
        <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>{title}</Typography>
      </Box>

      <Box
        sx={{
          minHeight: 36,
          px: 1,
          py: 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
          borderBottom: "1px solid #e3e6e8",
          backgroundColor: "#fff",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0, flexWrap: "wrap" }}>
          <CustomButton size="small" variant="outlined" onClick={() => downloadCsv(title, columns, sorted)} sx={{ fontSize: "10px", whiteSpace: "nowrap" }}>
            Download Excel
          </CustomButton>
          <PriorityLegend cases={filtered} />
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
              sx={{ width: 200, "& .MuiInputBase-root": { height: 28, fontSize: "11px" } }}
            />
          ) : null}
          <CustomButton variant="text" type="button" aria-label="Search cases" onClick={() => setSearchOpen((open) => !open)} sx={{ minWidth: 0, borderRadius: 0, bgcolor: "transparent", p: 0 }}>
            <SearchIcon width={32} height={32} />
          </CustomButton>
          <CustomButton variant="text" type="button" aria-label="Filter cases" onClick={() => { setDraftFilters(filters); setFilterOpen(true); }} sx={{ minWidth: 0, borderRadius: 0, bgcolor: "transparent", p: 0 }}>
            <FilterIcon width={32} />
          </CustomButton>
          <CustomButton variant="text" type="button" aria-label="Configure columns" onClick={openSettings} sx={{ minWidth: 0, borderRadius: 0, bgcolor: "transparent", p: 0 }}>
            <SettingsIcon width={32} />
          </CustomButton>
        </Box>
      </Box>

      <TableContainer sx={{ height: "calc(100dvh - 220px)", overflow: "auto" }}>
        <Table stickyHeader size="small" sx={{ tableLayout: "fixed", minWidth: columns.length * 140 }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column} sx={{ height: 30, backgroundColor: "#eef1f4", fontSize: "11px", fontWeight: 600 }}>
                  <TableSortLabel
                    active={sortColumn === column}
                    direction={sortColumn === column ? sortDirection : "asc"}
                    onClick={() => toggleSort(column)}
                  >
                    {formatColumnName(column)}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(columns.length, 1)} align="center" sx={{ height: 80, color: "#8a8f94", fontSize: "11px" }}>
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              pageRows.map((row) => {
                const status = timingStatus(row, now);
                const warningColor = status === "overdue" ? "#D32F2F" : "#C05600";
                return (
                  <TableRow key={row.rowId} hover sx={{ "&:nth-of-type(even)": { backgroundColor: "#fafafa" } }}>
                    {columns.map((column) => {
                      const value = cellText(row.fields[column]);
                      if (!isApplicationColumn(column)) {
                        return (
                          <TableCell key={column} sx={{ fontSize: "11px", color: "#4b5055", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {value}
                          </TableCell>
                        );
                      }
                      const color = status === "normal" ? "#155a87" : warningColor;
                      return (
                        <TableCell key={column} sx={{ fontSize: "11px" }}>
                          <CustomButton
                            variant="text"
                            type="button"
                            onClick={() => onOpen(row)}
                            sx={{ p: 0, borderRadius: 0, bgcolor: "transparent", color, font: "inherit", fontWeight: 500, textDecoration: "underline" }}
                          >
                            {value}
                          </CustomButton>
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
      />

      <CustomDialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="FILTER"
        maxWidth="md"
        fullWidth
        actions={
          <>
            <CustomButton variant="outlined" onClick={() => setDraftFilters({})}>Clear All</CustomButton>
            <CustomButton variant="contained" onClick={() => { setFilters(draftFilters); setPage(0); setFilterOpen(false); }}>Apply</CustomButton>
          </>
        }
      >
        <Box sx={{ display: "flex", minHeight: 320 }}>
          <Box sx={{ width: "40%", borderRight: "1px solid #eee" }}>
            {columns.map((column) => (
              <CustomButton
                key={column}
                variant="text"
                type="button"
                onClick={() => setActiveFilter(column)}
                sx={{
                  display: "block",
                  width: "100%",
                  border: 0,
                  borderLeft: filterColumn === column ? "4px solid #004A80" : "4px solid transparent",
                  bgcolor: filterColumn === column ? "#f0f3f8" : "transparent",
                  textAlign: "left",
                  p: 1.5,
                  borderRadius: 0,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {formatColumnName(column)}
              </CustomButton>
            ))}
          </Box>
          <Box sx={{ width: "60%", p: 2 }}>
            {filterOptions.map((option) => (
              <CustomCheckbox
                key={option}
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
            ))}
          </Box>
        </Box>
      </CustomDialog>

      <CustomDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Configure Columns"
        maxWidth="md"
        fullWidth
        actions={
          <>
            <CustomButton variant="outlined" onClick={() => setDraftVisible(defaultVisibleColumns(available))}>Reset</CustomButton>
            <CustomButton variant="contained" disabled={draftVisible.length === 0} onClick={() => { setVisible(draftVisible); setSettingsOpen(false); }}>Save</CustomButton>
          </>
        }
      >
        <Box sx={{ display: "flex", gap: 1.5, mt: 2 }}>
          <ColumnList
            title="Available Columns"
            columns={available.filter((column) => !draftVisible.includes(column))}
            onChoose={moveToSelected}
          />
          <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <CustomButton variant="outlined" size="small" aria-label="Add selected columns"><KeyRightArrowIcon /></CustomButton>
            <CustomButton variant="outlined" size="small" aria-label="Remove selected columns"><KeyLeftArrowIcon /></CustomButton>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>
              Selected Columns {draftVisible.length} / {MAX_VISIBLE_COLUMNS}
            </Typography>
            {draftVisible.map((column, index) => (
              <Box key={column} sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
                <CustomButton size="small" variant="text" onClick={() => moveToAvailable(column)} disabled={isApplicationColumn(column)}>
                  {formatColumnName(column)}
                </CustomButton>
                <CustomButton variant="text" type="button" aria-label="Move column up" disabled={index === 0} onClick={() => moveDraft(index, -1)} sx={{ minWidth: 0, p: 0, border: "1px solid #e1e4e7", borderRadius: 0, bgcolor: "#fff" }}>
                  <KeyUpArrowIcon />
                </CustomButton>
                <CustomButton variant="text" type="button" aria-label="Move column down" disabled={index === draftVisible.length - 1} onClick={() => moveDraft(index, 1)} sx={{ minWidth: 0, p: 0, border: "1px solid #e1e4e7", borderRadius: 0, bgcolor: "#fff" }}>
                  <KeyDownArrowIcon />
                </CustomButton>
              </Box>
            ))}
          </Box>
        </Box>
      </CustomDialog>
    </Box>
  );
}

function ColumnList({
  title,
  columns,
  onChoose,
}: Readonly<{ title: string; columns: string[]; onChoose: (column: string) => void }>) {
  return (
    <Box sx={{ flex: 1, border: "1px solid #dfe3e8", borderRadius: "8px", p: 1 }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, mb: 1 }}>{title}</Typography>
      {columns.map((column) => (
        <CustomButton key={column} size="small" variant="text" onClick={() => onChoose(column)}>
          {formatColumnName(column)}
        </CustomButton>
      ))}
    </Box>
  );
}
