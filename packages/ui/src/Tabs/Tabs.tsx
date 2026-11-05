import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type TabItem<T extends string> = {
  key: T;
  label: string;
};

export type CustomTabsSurface = "light" | "brandHeader";

type CustomTabsProps<T extends string> = {
  tabs: TabItem<T>[];
  value: T;
  onChange: (val: T) => void;
  /** `brandHeader` — white inactive labels for gradient app headers. */
  surface?: CustomTabsSurface;
  sx?: SxProps<Theme>;
};

const containerStyles: SxProps<Theme> = {
  p: "3px",
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "3px",
  borderRadius: "50px",
  border: "1px solid #E3E3E3",
  width: "fit-content",
  backgroundColor: "#fff",
};

const BRAND_ACTIVE_TAB_BG = "#9A2529";
const LIGHT_ACTIVE_TAB_BG = "#E45F14";

function getTabStyles(isActive: boolean, surface: CustomTabsSurface): SxProps<Theme> {
  const onBrandHeader = surface === "brandHeader";
  const activeBackground = onBrandHeader ? BRAND_ACTIVE_TAB_BG : LIGHT_ACTIVE_TAB_BG;

  return {
    border: "none",
    cursor: "pointer",
    borderRadius: "999px",
    px: "10px",
    py: "4px",
    fontSize: "11px",
    fontWeight: isActive ? 700 : 500,
    color: isActive ? "#FFFFFF" : onBrandHeader ? "#FFFFFF" : "#7A7A7A",
    backgroundColor: isActive ? activeBackground : "transparent",
    transition: "all 0.2s ease",
    lineHeight: 1.4,

    "&:hover": {
      backgroundColor: isActive
        ? activeBackground
        : onBrandHeader
          ? "rgba(255,255,255,0.18)"
          : "#F5F5F5",
    },
  };
}

export default function CustomTabs<T extends string>({
  tabs,
  value,
  onChange,
  surface = "light",
  sx,
}: Readonly<CustomTabsProps<T>>) {
  const containerSx =
    surface === "brandHeader"
      ? [
          containerStyles,
          {
            borderColor: "rgba(255,255,255,0.35)",
            backgroundColor: "rgba(255,255,255,0.08)",
          },
          ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
        ]
      : [containerStyles, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])];

  return (
    <Box sx={containerSx}>
      {tabs.map((tab) => {
        const isActive = value === tab.key;

        return (
          <Box
            key={tab.key}
            component="button"
            type="button"
            data-drs-readonly-nav="true"
            onClick={() => onChange(tab.key)}
            sx={getTabStyles(isActive, surface)}
          >
            {tab.label}
          </Box>
        );
      })}
    </Box>
  );
}
