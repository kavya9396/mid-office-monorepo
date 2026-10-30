import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { RefreshIcon } from "@insurance-poc/ui";

/* ------------------------------------------------------------------
 * BreCard — compact card showing:
 *   • BRE code badge + "View Detail" pill + retrigger icon
 *   • "BRE Discrepancy Change" — Initial chips vs Final chips (2-col)
 *   • "Requirement Management" — status filter chips with counts
 *
 * Prototype: guw-drs-screen-prototype.html `.bre-card` section (~L2984)
 * ------------------------------------------------------------------ */

export type BreStatusChip = {
  /** Display label, e.g. "All", "Pending", "Accept" */
  label: string;
  /** Count badge displayed inside the chip */
  count: number;
  /** Whether this chip is currently active/selected */
  active?: boolean;
};

export type BreCardProps = {
  /** Current BRE decision code, e.g. "ST", "DC" */
  breCode: string;
  /** Discrepancy tokens for the initial BRE run, e.g. ["ACR","OCD","PAN"] */
  initialDiscrepancy: string[];
  /** Discrepancy tokens for the final BRE run */
  finalDiscrepancy: string[];
  /** Max chips to show per column before showing a "+N" overflow button */
  maxVisible?: number;
  /** Status chips for the Requirement Management strip */
  statusChips: BreStatusChip[];
  /** Active status filter label — chip with this label is highlighted */
  activeStatus?: string;
  /** Called when a status chip is clicked */
  onStatusFilter?: (label: string) => void;
  /** Called when View Detail is clicked */
  onViewDetail?: () => void;
  /** Called when BRE Retrigger is clicked */
  onRetrigger?: () => void;
};

/* ---- colour map for status chips (matches prototype CSS) ---- */
const STATUS_COLORS: Record<
  string,
  { bg: string; border: string; color: string; badgeBg: string }
> = {
  pending: {
    bg: "#fff3e8",
    border: "#f3c7a6",
    color: "#b54a00",
    badgeBg: "#e45f14",
  },
  received: {
    bg: "#eef6ff",
    border: "#bed6ee",
    color: "#2f668f",
    badgeBg: "#46799f",
  },
  accept: {
    bg: "#eef8f1",
    border: "#b8dcc0",
    color: "#28743c",
    badgeBg: "#28743c",
  },
  reject: {
    bg: "#fdebec",
    border: "#f2c4c7",
    color: "#b3262e",
    badgeBg: "#b3262e",
  },
  cancelled: {
    bg: "#f3f1f0",
    border: "#d8d1cd",
    color: "#706763",
    badgeBg: "#706763",
  },
  waived: {
    bg: "#f3eeff",
    border: "#d8c8f2",
    color: "#6c4aa0",
    badgeBg: "#6c4aa0",
  },
};

const DEFAULT_CHIP = {
  bg: "#f5f3f2",
  border: "#d8d1cd",
  color: "#514a46",
  badgeBg: "#697780",
};

function chipColors(label: string) {
  return STATUS_COLORS[label.toLowerCase()] ?? DEFAULT_CHIP;
}

/* ---- small helpers ---- */

function TinyHeading({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        color: "#8b7c73",
        fontSize: "8px",
        fontWeight: 900,
        lineHeight: 1.2,
      }}
    >
      {children}
    </Typography>
  );
}

function DiscrepancyColumn({
  label,
  tokens,
  maxVisible = 3,
  isFinal,
  onMore,
}: {
  label: string;
  tokens: string[];
  maxVisible?: number;
  isFinal?: boolean;
  onMore?: () => void;
}) {
  const visible = tokens.slice(0, maxVisible);
  const overflow = tokens.length - maxVisible;

  return (
    <Box
      sx={{
        padding: "5px",
        border: `1px solid ${isFinal ? "#d9e8dd" : "#e8ded7"}`,
        borderRadius: "5px",
        background: isFinal ? "#f6fbf7" : "#fff",
        fontSize: "9px",
        minWidth: 0,
      }}
    >
      <Box
        component="b"
        sx={{
          display: "block",
          mb: "3px",
          color: isFinal ? "#28743c" : "#80746e",
          fontSize: "8px",
          fontWeight: 700,
        }}
      >
        {label}
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
        {visible.map((token) => (
          <Box
            key={token}
            component="span"
            sx={{
              display: "inline-block",
              padding: "2px 4px",
              borderRadius: "12px",
              background: "#fff0e0",
              color: "#8b4e1b",
              fontSize: "7px",
              fontWeight: 900,
            }}
          >
            {token}
          </Box>
        ))}
        {overflow > 0 && (
          <Box
            component="button"
            type="button"
            onClick={onMore}
            sx={{
              padding: 0,
              border: 0,
              background: "transparent",
              color: "#8b4e1b",
              fontSize: "7.5px",
              fontWeight: 900,
              cursor: "pointer",
            }}
          >
            +{overflow}
          </Box>
        )}
      </Box>
    </Box>
  );
}

/* ---- main component ---- */

export function BreCard({
  breCode,
  initialDiscrepancy,
  finalDiscrepancy,
  maxVisible = 3,
  statusChips,
  activeStatus,
  onStatusFilter,
  onViewDetail,
  onRetrigger,
}: Readonly<BreCardProps>) {
  return (
    <Box
      component="section"
      aria-label="BRE Card"
      sx={{
        minWidth: 0,
        padding: "6px",
        background: "linear-gradient(180deg, #fff, #fcfaf9)",
        border: "1px solid #ded8d5",
        borderRadius: "12px",
        boxShadow: "0 2px 7px rgba(60,42,35,.07)",
      }}
    >
      {/* top row: code + buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Typography
          component="strong"
          sx={{ color: "#237a3b", fontSize: "18px", fontWeight: 900 }}
        >
          {breCode || "-"}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: "3px" }}>
          {onViewDetail && (
            <Box
              component="button"
              type="button"
              onClick={onViewDetail}
              sx={{
                padding: "3px 8px",
                border: "1px solid #e45f14",
                borderRadius: "16px",
                background: "#fff8f3",
                color: "#e45f14",
                fontSize: "9px",
                fontWeight: 900,
                cursor: "pointer",
                "&:hover": { color: "#fff", background: "#e45f14" },
              }}
            >
              View Detail
            </Box>
          )}
          {onRetrigger && (
            <IconButton
              size="small"
              onClick={onRetrigger}
              aria-label="BRE Retrigger"
              title="BRE Retrigger"
              sx={{
                padding: "2px 6px",
                borderRadius: "16px",
                border: "1px solid #a92129",
                background: "#fff",
                color: "#a92129",
                "&:hover": { background: "#a92129", color: "#fff" },
              }}
            >
              <RefreshIcon width={12} height={12} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* discrepancy change */}
      <Box
        sx={{
          mt: "5px",
          padding: "5px",
          border: "1px solid #f0e0d2",
          borderRadius: "7px",
          background: "#fff9f4",
        }}
      >
        <TinyHeading>BRE Discrepancy Change</TinyHeading>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
            mt: "4px",
          }}
        >
          <DiscrepancyColumn
            label="Initial"
            tokens={initialDiscrepancy}
            maxVisible={maxVisible}
            onMore={onViewDetail}
          />
          <DiscrepancyColumn
            label="Final"
            tokens={finalDiscrepancy}
            maxVisible={maxVisible}
            isFinal
            onMore={onViewDetail}
          />
        </Box>
      </Box>

      {/* requirement management status chips */}
      <Box
        sx={{
          mt: "5px",
          padding: "5px",
          border: "1px solid #e8e1de",
          borderRadius: "8px",
          background: "#fff",
        }}
      >
        <TinyHeading>Requirement Management</TinyHeading>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: "3px",
            mt: "4px",
          }}
        >
          {statusChips.map((chip) => {
            const isActive =
              activeStatus?.toLowerCase() === chip.label.toLowerCase();
            const c = chipColors(chip.label);
            return (
              <Box
                key={chip.label}
                component="button"
                type="button"
                aria-pressed={isActive}
                onClick={() => onStatusFilter?.(chip.label)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "3px",
                  minHeight: "20px",
                  padding: "2px 5px",
                  border: `1px solid ${isActive ? "#e45f14" : c.border}`,
                  borderRadius: "10px",
                  background: c.bg,
                  color: c.color,
                  fontSize: "8.5px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: isActive
                    ? "0 3px 8px rgba(55,42,35,.12)"
                    : "none",
                  transform: isActive ? "translateY(-1px)" : "none",
                  "&:hover": {
                    borderColor: "#e45f14",
                    transform: "translateY(-1px)",
                    boxShadow: "0 3px 8px rgba(55,42,35,.12)",
                  },
                }}
              >
                {chip.label}
                <Box
                  component="span"
                  sx={{
                    minWidth: "14px",
                    height: "14px",
                    padding: "1px 2px",
                    borderRadius: "7px",
                    background: c.badgeBg,
                    color: "#fff",
                    fontSize: "7px",
                    fontStyle: "normal",
                    lineHeight: "12px",
                    textAlign: "center",
                  }}
                >
                  {chip.count}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
}

export default BreCard;
