import { createTheme } from "@mui/material/styles";

export const colors = {
  primary: "#E45F14",
  background: "#FFF8F3",
  white: "#FFFFFF",

  textStrong: "#111111",
  textLabel: "#333333",
  textMuted: "#666666",
  textSubtle: "#756D69",

  borderBrand: "#E7DDD7",
  borderAccent: "#F1D8C8",
  borderPhoto: "#E8BEA1",
  borderLight: "#E5E5E5",
  divider: "#AFAFAF",

  surfaceTint: "#FFF8F2",
  surfaceAccent: "#FFF2E7",
  highlight: "#FFEAD7",

  chipNeutralBg: "#F4F3F2",
  chipNeutralBorder: "#DED9D6",
  chipNeutralText: "#4E4743",
  chipSuccessBg: "#EEF8F1",
  chipSuccessBorder: "#B8DCC0",
  chipSuccessText: "#28743C",

  shadowNeutral: "rgba(0,0,0,0.08)",
  shadowBrand: "rgba(169,33,41,.06)",
} as const;

export const appTheme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
    },
    background: {
      default: colors.background,
    },
  },
  typography: {
    fontFamily: '"Mulish", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});
