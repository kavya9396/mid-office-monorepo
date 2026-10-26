import type { ReactNode } from "react";
import { Box, Button, Typography } from "@mui/material";
import { CustomTable, RefreshIcon, type Column } from "@insurance-poc/ui";

/* ------------------------------------------------------------------ */
/* Decision bar: title | Initial chip | Final chip | refresh | detail   */
/* ------------------------------------------------------------------ */

export type DecisionBarItem = {
  label: string;
  value: ReactNode;
  /** "success" renders the value chip green; default is the neutral grey chip. */
  tone?: "neutral" | "success";
};

export type DecisionBarProps = {
  title: string;
  items: DecisionBarItem[];
  /** Shows the refresh icon button when provided. */
  onRefresh?: () => void;
  refreshLabel?: string;
  /** Shows the outlined text button when provided. */
  onViewDetail?: () => void;
  viewDetailLabel?: string;
};

export function DecisionBar({
  title,
  items,
  onRefresh,
  refreshLabel = "Refresh",
  onViewDetail,
  viewDetailLabel = "View Detail",
}: Readonly<DecisionBarProps>) {
  return (
    <Box
      component="section"
      aria-label={title}
      sx={{
        display: "flex",
        alignItems: "center",
        minHeight: 46,
        px: 1.5,
        py: 0.75,
        gap: 2,
        border: "1px solid #E7DDD7",
        borderRadius: 1.5,
        flexWrap: "wrap",
        backgroundColor: "#fff"
      }}
    >
      <Typography
        sx={{
          pr: 2,
          fontSize: 13,
          fontWeight: 700,
          color: (theme) => `${theme.palette.primary.main}`,
          borderRight: "1px solid #E7DDD7",
        }}
      >
        {title}
      </Typography>

      {items.map((item) => {
        const success = item.tone === "success";
        return (
          <Box
            key={item.label}
            sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
          >
            <Typography sx={{ fontSize: 11, color: "#756D69" }}>
              {item.label}
            </Typography>
            <Typography
              sx={{
                px: 1.1,
                py: 0.35,
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 1,
                bgcolor: success ? "#EEF8F1" : "#F4F3F2",
                border: `1px solid ${success ? "#B8DCC0" : "#DED9D6"}`,
                color: success ? "#28743C" : "#4E4743",
              }}
            >
              {item.value}
            </Typography>
          </Box>
        );
      })}

      <Box sx={{ flex: 1 }} />

      {onRefresh && (
        <Button
          size="small"
          variant="outlined"
          aria-label={refreshLabel}
          title={refreshLabel}
          startIcon={<RefreshIcon width={16} />}
          onClick={onRefresh}
          sx={{
            minWidth: 28,
            width: 28,
            height: 26,
            p: 0,
            borderColor: "primary.main",
            color: "primary.main",
            "& .MuiButton-startIcon": { m: 0 },
          }}
        />
      )}

      {onViewDetail && (
        <Button
          size="small"
          variant="outlined"
          onClick={onViewDetail}
          sx={{
            borderColor: "primary.main",
            color: "primary.main",
            textTransform: "none",
          }}
        >
          {viewDetailLabel}
        </Button>
      )}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Comparison table: label | initial | final, with changed-value marks  */
/* ------------------------------------------------------------------ */

const HIGHLIGHT = "#FFEAD7";

export type ComparisonRow = {
  label: string;
  initial: string;
  final: string;
  /**
   * "value":  highlight the cell when initial and final differ.
   * "tokens": values are "#"-separated lists; highlight tokens missing on the other side.
   * omitted:  plain text.
   */
  diff?: "value" | "tokens";
};

export type DecisionComparisonTableProps = {
  rows: ComparisonRow[];
  headers: { label: string; initial: string; final: string };
};

const splitTokens = (value: string) =>
  value
    .split("#")
    .map((token) => token.trim())
    .filter(Boolean);

const renderTokens = (value: string, other: string) => {
  const otherSet = new Set(splitTokens(other).map((token) => token.toUpperCase()));
  return (
    <Box sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>
      {splitTokens(value).map((token, index) => (
        <Box component="span" key={`${token}-${index}`}>
          {index > 0 && "#"}
          <Box
            component="span"
            sx={{
              backgroundColor: otherSet.has(token.toUpperCase())
                ? "transparent"
                : HIGHLIGHT,
            }}
          >
            {token}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const renderCell = (value: string, other: string, diff?: ComparisonRow["diff"]) => {
  if (diff === "tokens") return renderTokens(value, other);
  if (diff === "value") {
    const changed = value !== other;
    return (
      <Box
        component="span"
        sx={{
          backgroundColor: changed ? HIGHLIGHT : "transparent",
          px: changed ? "2px" : 0,
        }}
      >
        {value}
      </Box>
    );
  }
  return value;
};

export function DecisionComparisonTable({
  rows,
  headers,
}: Readonly<DecisionComparisonTableProps>) {
  const columns: Column<ComparisonRow>[] = [
    { key: "label", header: headers.label, width: "8%" },
    {
      key: "initial",
      header: headers.initial,
      render: (_value, row) => renderCell(row.initial, row.final, row.diff),
    },
    {
      key: "final",
      header: headers.final,
      render: (_value, row) => renderCell(row.final, row.initial, row.diff),
    },
  ];

  return (
    <CustomTable<ComparisonRow>
      title=""
      columns={columns}
      data={rows}
      getRowId={(row) => row.label}
    />
  );
}

export default DecisionBar;
