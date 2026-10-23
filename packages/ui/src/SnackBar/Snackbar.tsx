import { Alert, Snackbar as MuiSnackbar } from "@mui/material";

interface CustomSnackbarProps {
  open: boolean;
  message: string;
  severity?: "success" | "error" | "warning" | "info";
  onClose: () => void;
  autoHideDuration?: number;
}

const CustomSnackbar = ({
  open,
  message,
  severity = "success",
  onClose,
  autoHideDuration = 4000,
}: CustomSnackbarProps) => {
  return (
    <MuiSnackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",
        }}
      >
        {message}
      </Alert>
    </MuiSnackbar>
  );
};

export default CustomSnackbar;