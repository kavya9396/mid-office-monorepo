import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

export type TabItem<T extends string> = {
  key: T;
  label: string;
};

type CustomTabsProps<T extends string> = {
  tabs: TabItem<T>[];
  value: T;
  onChange: (val: T) => void;
  sx?: SxProps<Theme>;
};

const containerStyles: SxProps<Theme> = {
  p: 1,
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 1,
  borderRadius: "50px",
  border: "1px solid #E3E3E3",
  width: "fit-content",
};

const getTabStyles = (isActive: boolean): SxProps<Theme> => ({
  border: "none",
  cursor: "pointer",
  borderRadius: "999px",
  px: 1,
  py: 1,
  fontSize: "12px",
  fontWeight: isActive ? 700 : 500,
  color: isActive ? "#FFFFFF" : "#7A7A7A",
  backgroundColor: isActive ? "#E45F14" : "transparent",
  transition: "all 0.2s ease",

  "&:hover": {
    backgroundColor: isActive ? "#E45F14" : "#F5F5F5",
  },
});

export default function CustomTabs<T extends string>({
  tabs,
  value,
  onChange,
  sx,
}: CustomTabsProps<T>) {
  return (
    <Box sx={[containerStyles, ...(Array.isArray(sx) ? sx : [sx])]}>
      {tabs.map((tab) => {
        const isActive = value === tab.key;

        return (
          <Box
            key={tab.key}
            component="button"
            type="button"
            data-drs-readonly-nav="true"
            onClick={() => onChange(tab.key)}
            sx={getTabStyles(isActive)}
          >
            {tab.label}
          </Box>
        );
      })}
    </Box>
  );
}
