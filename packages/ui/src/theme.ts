import { createTheme } from "@mui/material/styles";

export const appTheme = createTheme({
  palette: {
    primary: {
      main: "#E45F14",
    },
    background: {
      default: "#fff8f3",
    },
  },
  typography: {
    fontFamily: '"Mulish", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
});
