import { Box, Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

const REQUIREMENT_STATUSES = [
  "All", "Pending", "Received", "Accept", "Cancelled", "Reject", "Waived",
] as const;

export type RequirementBadgeVariant = (typeof REQUIREMENT_STATUSES)[number];
export type LegacyBadgeVariant = "Low" | "Medium" | "High" | "Neutral";
export type BadgeVariant = LegacyBadgeVariant | RequirementBadgeVariant;

export interface BadgeProps extends Omit<ChipProps, "label" | "variant"> {
  label?: string;
  variant?: BadgeVariant;
  count?: number;
  selected?: boolean;
  countSx?: SxProps<Theme>;
}

const variantColors: Record<BadgeVariant, {
  bg: string;
  color: string;
  border?: string;
  countBg: string;
}> = {
  Low: { bg: "#E7F7ED", color: "#218311", countBg: "#218311" },
  Medium: { bg: "#FFF4DB", color: "#EA7617", countBg: "#EA7617" },
  High: { bg: "#FDEBEC", color: "#9A2529", countBg: "#9A2529" },
  Neutral: { bg: "#FFFFFF", color: "#063E6F", border: "#C6C6C6", countBg: "#063E6F" },
  All: { bg: "#F5F3F2", color: "#514A46", border: "#D8D1CD", countBg: "#697780" },
  Pending: { bg: "#FFF3E8", color: "#EA7617", border: "#F3C7A6", countBg: "#EA7617" },
  Received: { bg: "#EEF6FF", color: "#2F668F", border: "#BED6EE", countBg: "#46799F" },
  Accept: { bg: "#EEF8F1", color: "#218311", border: "#B8DCC0", countBg: "#218311" },
  Cancelled: { bg: "#F3F1F0", color: "#706763", border: "#D8D1CD", countBg: "#706763" },
  Reject: { bg: "#FDEBEC", color: "#9A2529", border: "#F2C4C7", countBg: "#9A2529" },
  Waived: { bg: "#F3EEFF", color: "#6C4AA0", border: "#D8C8F2", countBg: "#6C4AA0" },
};

export default function Badge({
  label,
  variant = "Neutral",
  count,
  selected = false,
  size = "small",
  sx = [],
  countSx = [],
  onClick,
  clickable,
  ...chipProps
}: BadgeProps) {
  const colors = variantColors[variant];
  const displayLabel = label ?? variant;
  const interactive = clickable ?? Boolean(onClick);
  const hasCount = count !== undefined;
  const isRequirementVariant = REQUIREMENT_STATUSES.some((status) => status === variant);

  const requirementStyles: SxProps<Theme> = {
    height: "auto",
    minHeight: "24px",
    padding: "3px 7px",
    gap: "4px",
    boxSizing: "border-box",
    border: `1px solid ${selected ? "#E45F14" : colors.border}`,
    borderRadius: "12px",
    backgroundColor: colors.bg,
    color: colors.color,
    fontFamily: "inherit",
    fontSize: "9px",
    fontWeight: 800,
    transform: selected ? "translateY(-1px)" : "none",
    boxShadow: selected ? "0 3px 8px rgba(55, 42, 35, .12)" : "none",
    "& .MuiChip-label": { display: "inline-flex", padding: 0 },
    "& .MuiChip-icon": { color: "inherit", margin: 0, fontSize: "14px" },
    "&:hover:not(.Mui-disabled), &.Mui-focusVisible": {
      backgroundColor: colors.bg,
      borderColor: "#E45F14",
      transform: "translateY(-1px)",
      boxShadow: "0 3px 8px rgba(55, 42, 35, .12)",
    },
    "&.Mui-focusVisible": { outline: "2px solid #E45F14", outlineOffset: "2px" },
    "& .MuiChip-deleteIcon": { color: "inherit" },
  };

  return (
    <Chip
      aria-label={hasCount ? `${displayLabel}: ${count}` : displayLabel}
      aria-pressed={interactive ? selected : undefined}
      {...chipProps}
      size={size}
      onClick={onClick}
      clickable={interactive}
      label={hasCount ? (
        <Box
          component="span"
          sx={{
            display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer",
          }}
        >
          <Box component="span">{displayLabel}</Box>
          <Box
            component="span"
            sx={[
              {
                display: "inline-flex",
                justifyContent: "center",
                alignItems: "center",
                boxSizing: "border-box",
                minWidth: "17px",
                height: "17px",
                padding: "2px 3px",
                borderRadius: "9px",
                backgroundColor: colors.countBg,
                color: "#FFFFFF",
                fontSize: "inherit",
                fontWeight: "inherit",
                lineHeight: "13px",
              },
              ...(Array.isArray(countSx) ? countSx : [countSx]),
            ]}
          >
            {count}
          </Box>
        </Box>
      ) : displayLabel}
      sx={[
        {
          backgroundColor: colors.bg,
          color: colors.color,
          fontSize: 9,
          fontWeight: 700,
          border: colors.border ? `1px solid ${colors.border}` : "none",
          "& .MuiChip-icon": { color: "inherit" },
        },
        ...(isRequirementVariant ? [requirementStyles] : []),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    />
  );
}
