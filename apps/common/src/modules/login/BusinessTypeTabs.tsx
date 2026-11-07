import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { CustomTabs, type CustomTabsSurface, type TabItem } from "@insurance-poc/ui";
import type { SessionBusinessType } from "@insurance-poc/utils";
import { authCompactLaptop, authShortLaptop } from "./AuthShell";

export const BUSINESS_TYPE_TABS: TabItem<SessionBusinessType>[] = [
  { key: "RETAIL", label: "Retail" },
  { key: "GROUP", label: "Group" },
];

const loginBusinessTabsSx: SxProps<Theme> = {
  [authCompactLaptop]: { p: 0.5, gap: 0.5 },
  "& button": {
    [authCompactLaptop]: { py: 0.75 },
    [authShortLaptop]: { py: 0.5 },
  },
};

export type BusinessTypeTabsProps = {
  value: SessionBusinessType;
  onChange: (value: SessionBusinessType) => void;
  showLabel?: boolean;
  /** Use `brandHeader` in the app header gradient; login keeps the default light surface. */
  surface?: CustomTabsSurface;
  sx?: SxProps<Theme>;
};

export function BusinessTypeTabs({
  value,
  onChange,
  showLabel = true,
  surface = "light",
  sx,
}: Readonly<BusinessTypeTabsProps>) {
  return (
    <Box>
      {showLabel ? (
        <Typography sx={{ fontSize: "12px", fontWeight: 600, mb: 0.75 }}>Business type</Typography>
      ) : null}
      <CustomTabs
        tabs={BUSINESS_TYPE_TABS}
        value={value}
        onChange={onChange}
        surface={surface}
        sx={[loginBusinessTabsSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      />
    </Box>
  );
}
