
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

export type AppSnackbarProps = {
  open: boolean;
  message: string;
  severity?: "success" | "info" | "warning" | "error";
  onClose: () => void;
};

export function AppSnackbar({
  open,
  message,
  severity = "error",
  onClose,
}: Readonly<AppSnackbarProps>) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={onClose}
      anchorOrigin={{
        vertical: "top",
        horizontal: "center",
      }}
    >
      <Alert
        severity={severity}
        variant="filled"
        onClose={onClose}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}
