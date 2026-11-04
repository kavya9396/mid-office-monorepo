import { Box, ButtonBase, Typography } from "@mui/material";
import { RefreshIcon } from "@insurance-poc/ui";

export type BreStatusTone =
  | "default"
  | "pending"
  | "received"
  | "accept"
  | "reject"
  | "cancelled"
  | "waived";

export type BreStatusChip = {
  key: string;
  label: string;
  count: number;
  tone?: BreStatusTone;
};

export type BreCardProps = {
  /** Latest BRE decision code, e.g. "ST". */
  decision: string;
  /** Discrepancy codes of the initial BRE. */
  initialDiscrepancies: string[];
  /** Discrepancy codes that appear only in the final BRE. */
  finalDiscrepancies: string[];
  /** Number of initial codes shown before collapsing into "+N". */
  maxVisible?: number;
  statusChips?: BreStatusChip[];
  statusHeading?: string;
  onViewDetail?: () => void;
  onRefresh?: () => void;
  refreshLabel?: string;
  /** Makes the status chips clickable. */
  onStatusClick?: (chip: BreStatusChip) => void;
};

const CHIP_TONES: Record<BreStatusTone, { bg: string; border: string; color: string; badge: string }> = {
  default: { bg: "#f5f3f2", border: "#d8d1cd", color: "#514a46", badge: "#697780" },
  pending: { bg: "#fff3e8", border: "#f3c7a6", color: "#b54a00", badge: "#e45f14" },
  received: { bg: "#eef6ff", border: "#bed6ee", color: "#2f668f", badge: "#46799f" },
  accept: { bg: "#eef8f1", border: "#b8dcc0", color: "#28743c", badge: "#28743c" },
  reject: { bg: "#fdebec", border: "#f2c4c7", color: "#b3262e", badge: "#b3262e" },
  cancelled: { bg: "#f3f1f0", border: "#d8d1cd", color: "#706763", badge: "#706763" },
  waived: { bg: "#f3eeff", border: "#d8c8f2", color: "#6c4aa0", badge: "#6c4aa0" },
};

const TinyHeading = ({ children }: Readonly<{ children: string }>) => (
  <Typography sx={{ fontSize: 8, fontWeight: 900, color: "#8b7c73" }}>{children}</Typography>
);

const CodePill = ({ code }: Readonly<{ code: string }>) => (
  <Box
    component="em"
    sx={{
      display: "inline-block",
      m: "1px",
      px: "4px",
      py: "2px",
      borderRadius: "12px",
      background: "#fff0e0",
      color: "#8b4e1b",
      fontSize: 7,
      fontStyle: "normal",
      fontWeight: 900,
    }}
  >
    {code}
  </Box>
);

const outlinePillSx = {
  fontFamily: "inherit",
  border: "1px solid",
  borderColor: "primary.main",
  borderRadius: "16px",
  background: "#fff8f3",
  color: "primary.main",
  fontSize: 9,
  fontWeight: 900,
  "&:hover": { color: "#fff", backgroundColor: "primary.main" },
} as const;

export function BreCard({
  decision,
  initialDiscrepancies,
  finalDiscrepancies,
  maxVisible = 3,
  statusChips = [],
  statusHeading = "Requirement Management",
  onViewDetail,
  onRefresh,
  refreshLabel = "BRE Retrigger",
  onStatusClick,
}: Readonly<BreCardProps>) {
  const visibleInitial = initialDiscrepancies.slice(0, maxVisible);
  const hiddenCount = initialDiscrepancies.length - visibleInitial.length;

  return (
    <Box
      component="section"
      aria-label="BRE Decision"
      sx={{
        minWidth: 0,
        p: 1,
        border: "1px solid #ded8d5",
        borderRadius: "12px",
        background: "linear-gradient(180deg, #fff, #fcfaf9)",
        boxShadow: "0 2px 7px rgba(60, 42, 35, .07)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography component="strong" sx={{ fontSize: 18, fontWeight: 900, color: "#237a3b" }}>
          {decision || "-"}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {onViewDetail && (
            <ButtonBase onClick={onViewDetail} sx={{ ...outlinePillSx, px: "9px", py: "4px" }}>
              View Detail
            </ButtonBase>
          )}
          {onRefresh && (
            <ButtonBase
              onClick={onRefresh}
              title={refreshLabel}
              aria-label={refreshLabel}
              sx={{
                ...outlinePillSx,
                px: "8px",
                py: "3px",
                borderColor: "#a92129",
                background: "#fff",
                color: "#a92129",
                "&:hover": { borderColor: "#a92129", background: "#a92129", color: "#fff" },
              }}
            >
              <RefreshIcon width={12} height={12} />
            </ButtonBase>
          )}
        </Box>
      </Box>

      <Box
        sx={{
          mt: "7px",
          p: "6px",
          border: "1px solid #f0e0d2",
          borderRadius: "7px",
          background: "#fff9f4",
        }}
      >
        <TinyHeading>BRE Discrepancy Change</TinyHeading>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", mt: "5px" }}>
          <Box sx={{ p: "5px", border: "1px solid #e8ded7", borderRadius: "5px", background: "#fff", fontSize: 9 }}>
            <Box component="b" sx={{ display: "block", mb: "3px", color: "#80746e", fontSize: 8 }}>
              Initial
            </Box>
            {visibleInitial.map((code) => (
              <CodePill key={code} code={code} />
            ))}
            {hiddenCount > 0 && (
              <ButtonBase
                onClick={onViewDetail}
                sx={{ p: 0, color: "#8b4e1b", fontSize: 7.5, fontWeight: 900 }}
              >
                +{hiddenCount}
              </ButtonBase>
            )}
          </Box>
          <Box sx={{ p: "5px", border: "1px solid #d9e8dd", borderRadius: "5px", background: "#f6fbf7", fontSize: 9 }}>
            <Box component="b" sx={{ display: "block", mb: "3px", color: "#28743c", fontSize: 8 }}>
              Final
            </Box>
            {finalDiscrepancies.map((code) => (
              <CodePill key={code} code={code} />
            ))}
          </Box>
        </Box>
      </Box>

      {statusChips.length > 0 && (
        <Box sx={{ mt: 1, p: "6px", border: "1px solid #e8e1de", borderRadius: "8px", background: "#fff" }}>
          <Box sx={{ mb: "6px" }}>
            <TinyHeading>{statusHeading}</TinyHeading>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
            {statusChips.map((chip) => {
              const tone = CHIP_TONES[chip.tone ?? "default"];
              return (
                <ButtonBase
                  key={chip.key}
                  disabled={!onStatusClick}
                  onClick={() => onStatusClick?.(chip)}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    minHeight: 24,
                    px: "7px",
                    py: "3px",
                    border: `1px solid ${tone.border}`,
                    borderRadius: "12px",
                    background: tone.bg,
                    color: tone.color,
                    fontFamily: "inherit",
                    fontSize: 9,
                    fontWeight: 800,
                    "&.Mui-disabled": { color: tone.color },
                    "&:hover:not(.Mui-disabled)": {
                      borderColor: "primary.main",
                      transform: "translateY(-1px)",
                      boxShadow: "0 3px 8px rgba(55, 42, 35, .12)",
                    },
                  }}
                >
                  {chip.label}
                  <Box
                    component="i"
                    sx={{
                      minWidth: 17,
                      height: 17,
                      px: "3px",
                      borderRadius: "9px",
                      background: tone.badge,
                      color: "#fff",
                      fontStyle: "normal",
                      lineHeight: "17px",
                    }}
                  >
                    {chip.count}
                  </Box>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default BreCard;
