import Button, { type ButtonProps } from "@mui/material/Button";

const containedOrange = {
  backgroundColor: "#e65100",
  color: "#ffffff",
  textTransform: "none",
  fontWeight: 600,
  "&:hover": {
    backgroundColor: "#bf360c",
  },
  "&.Mui-disabled": {
    backgroundColor: "#ffcc80",
    color: "rgba(255, 255, 255, 0.92)",
  },
};

const outlinedOrange = {
  color: "#e65100",
  borderColor: "#e65100",
  textTransform: "none",
  fontWeight: 600,
  "&:hover": {
    borderColor: "#bf360c",
    backgroundColor: "rgba(230, 81, 0, 0.08)",
  },
};

export function CustomButton({
  variant = "contained",
  sx,
  ...props
}: ButtonProps) {
  return (
    <Button
      variant={variant}
      sx={[
        variant === "contained" ? containedOrange : outlinedOrange,
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    />
  );
}
