import { Box, TextField, Typography, type TextFieldProps } from "@mui/material";

type CustomTextFieldProps = TextFieldProps & {
  htmlInputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  labelText?: string;
  mandatory?: boolean;
};

const inputStyles: TextFieldProps["sx"] = {
  "& .MuiInputBase-input": {
    fontSize: "12px",
    boxSizing: "border-box",

    "&::placeholder": {
      fontSize: "12px",
      opacity: 1,
    },
  },

  "& .MuiOutlinedInput-root": {
    height: "40px",
    minHeight: "40px",
    boxSizing: "border-box",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",

    "&:hover fieldset": {
      borderColor: "#EA7617",
    },

    "&.Mui-focused fieldset": {
      borderColor: "#EA7617",
    },

    "& input[type='date']": {
      fontStyle: "normal",
      fontSize: "14px",
      cursor: "pointer",
    },

    "& input[type='date']::-webkit-calendar-picker-indicator": {
      cursor: "pointer",
      opacity: 0.7,
      transition: "opacity 0.2s",
    },

    "& input[type='date']::-webkit-calendar-picker-indicator:hover": {
      opacity: 1,
    },

    // Keep multiline fields at the same height
    "&.MuiInputBase-multiline": {
      height: "40px",
      padding: "0 14px",
    },

    "& .MuiInputBase-inputMultiline": {
      height: "auto",
      padding: "0",
      overflow: "auto",
      fontSize: "12px",
      boxSizing: "border-box",

      "&::placeholder": {
        fontSize: "12px",
        opacity: 1,
      },
    },
  },
};

const CustomTextField = ({
  sx,
  size = "small",
  variant = "outlined",
  htmlInputProps,
  labelText,
  mandatory = false,
  slotProps,
  ...props
}: CustomTextFieldProps) => {
  return (
    <Box>
      {labelText && (
        <Typography
          sx={{
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {labelText}
          {mandatory && (
            <Box
              component="span"
              sx={{
                color: "#9A2529",
                ml: 0.25,
              }}
            >
              *
            </Box>
          )}
        </Typography>
      )}

      <TextField
        {...props}
        size={size}
        variant={variant}
        slotProps={{
          ...slotProps,
          htmlInput: htmlInputProps ?? slotProps?.htmlInput,
        }}
        sx={{
          ...inputStyles,
          ...sx,
        }}
      />
    </Box>
  );
};

export default CustomTextField;