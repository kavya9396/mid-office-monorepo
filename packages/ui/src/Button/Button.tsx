import { Button, type ButtonProps } from "@mui/material";

type Variant = ButtonProps["variant"];

const getButtonStyles = (variant: Variant) => {
  switch (variant) {
    case "contained":
      return {
        backgroundColor: "#E45F14",
        "&:hover": {
          backgroundColor: "#CC5412",
        },
      };

    case "outlined":
      return {
        borderColor: "#E45F14",
        color: "#E45F14",
        "&:hover": {
          color: "#FFF",
          backgroundColor: "#E45F14",
        },
      };

    case "text":
      return {
        color: "#E45F14",
        "&:hover": {
          backgroundColor: "rgba(228,95,20,0.08)",
        },
      };

    default:
      return {};
  }
};

type CustomButtonProps = ButtonProps;

const CustomButton = ({ variant = "contained", sx, ...props }: CustomButtonProps) => {
  return (
    <Button
      variant={variant}
      disableElevation
      sx={{
        textTransform: "none",
        minWidth: "auto",
        minHeight: "auto",
        px: 1.25,
        py: 0.5,
        borderRadius: "28px",
        lineHeight: 1.2,
        ...getButtonStyles(variant),
        ...sx,
      }}
      {...props}
    />
  );
};

export default CustomButton;
