import { createTheme } from "@mui/material/styles";

export const colors = {
  primary: "#E45F14",
  background: "#FFF8F3",
  white: "#FFFFFF",
  brandRed: "#AD252A",
  brandRedHover: "#941F24",

  textStrong: "#111111",
  textLabel: "#333333",
  textBody: "#4F4F4F",
  textNeutral: "#555555",
  textMuted: "#666666",
  textSubtle: "#756D69",
  // titleAccent: "#8D232A",
  info: "#075184",
  danger: "#C73434",
  dangerHover: "#A52227",
  filterAction: "#BD292F",
  filterActionHover: "#A52227",

  borderBrand: "#E7DDD7",
  borderAccent: "#F1D8C8",
  borderPhoto: "#E8BEA1",
  borderLight: "#E5E5E5",
  borderTable: "#D5DBE1",
  borderInput: "#CFD8E1",
  borderRow: "#E0E0E0",
  borderControl: "#DFE3E7",
  borderAction: "#D9E2EA",
  iconMuted: "#78909C",
  dangerStrong: "#D32F2F",
  infoBorder: "#B9D1E0",
  infoSurface: "#EDF5FA",
  iconDisabled: "#B8C0C5",
  dangerSurface: "#FFF5F5",
  textEmpty: "#757575",
  borderSoft: "#E1E4E7",
  divider: "#AFAFAF",

  surfaceMuted: "#FAFBFC",
  surfaceHover: "#F3F7FA",
  surfaceTint: "#FFF8F2",
  surfaceAccent: "#FFF2E7",
  surfaceSelected: "#FFF1E6",
  surfaceSelectedSoft: "#FFF5EE",
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
