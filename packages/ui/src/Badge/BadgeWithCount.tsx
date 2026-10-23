import Chip from "@mui/material/Chip";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactElement } from "react";

export type RequirementBadgeVariant =
  | "All"
  | "Pending"
  | "Received"
  | "Accept"
  | "Cancelled"
  | "Reject"
  | "Waived";

type BadgeWithCountProps = {
  label: string;
  count: number;
  variant?: RequirementBadgeVariant;
  icon?: ReactElement;
  size?: "small" | "medium";
  sx?: SxProps<Theme>;
};

const variantColors: Record<
  RequirementBadgeVariant,
  { bg: string; color: string; border?: string }
> = {
  All: {
    bg: "#FFFFFF",
    color: "#063E6F",
    border: "1px solid #C6C6C6",
  },
  Pending: {
    bg: "#FFF4DB",
    color: "#EA7617",
  },
  Received: {
    bg: "#E7F7ED",
    color: "#218311",
  },
  Accept: {
    bg: "#E7F7ED",
    color: "#218311",
  },
  Cancelled: {
    bg: "#FDE8E8",
    color: "#9A2529",
  },
  Reject: {
    bg: "#FDE8E8",
    color: "#9A2529",
  },
  Waived: {
    bg: "#FFFFFF",
    color: "#063E6F",
    border: "1px solid #C6C6C6",
  },
};

export default function BadgeWithCount({
  label,
  count,
  variant = "All",
  icon,
  size = "small",
  sx,
}: BadgeWithCountProps) {
  const v = variantColors[variant];

  return (
    <Chip
      icon={icon}
      label={
        <span>
          {label} ({count})
        </span>
      }
      size={size}
      sx={[
        {
          backgroundColor: v.bg,
          color: v.color,
          border: v.border ?? "none",
          "& .MuiChip-icon": {
            color: "inherit",
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
}
