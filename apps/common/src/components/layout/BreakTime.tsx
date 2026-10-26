import Typography from "@mui/material/Typography";
import { CustomDialog } from "@insurance-poc/ui";

type BreakTimeProps = {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
};

export function BreakTime({
  dialogOpen,
  setDialogOpen,
}: Readonly<BreakTimeProps>) {
  return (
    <CustomDialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      title="Breaktime"
    >
      <Typography sx={{ color: "#323232", fontSize: 14 }}>
        Breaktime is set for 30 mins.
      </Typography>
    </CustomDialog>
  );
}
