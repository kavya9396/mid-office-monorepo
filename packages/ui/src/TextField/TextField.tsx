import { Box, TextField, Typography, type TextFieldProps } from "@mui/material";

type CustomTextFieldProps = TextFieldProps & {
  htmlInputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  labelText?: string;
  mandatory?: boolean;
};

const inputStyles: TextFieldProps["sx"] = {
  "& .MuiInputBase-input": {
    fontSize: "12px",
  },

  "& .MuiOutlinedInput-root": {
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
  },
};

const CustomTextField = ({
  sx,
  size = "small",
  variant = "outlined",
  htmlInputProps,
  labelText,
  mandatory = false,
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
          htmlInput: htmlInputProps,
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