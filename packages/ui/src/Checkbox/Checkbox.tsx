import { Checkbox, FormControlLabel, Typography } from "@mui/material";
import type { CheckboxProps } from "@mui/material";

type CustomCheckboxProps = Omit<CheckboxProps, "onChange"> & {
  label?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function CustomCheckbox({
  label,
  checked,
  onChange,
  disabled,
  ...checkboxProps
}: CustomCheckboxProps) {
  const checkbox = (
    <Checkbox
      {...checkboxProps}
      size="small"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      disableRipple
      sx={{
        p: 0,
        mr: 0.5,
        "&.Mui-checked": {
          color: "#E45F14",
        },
        ...checkboxProps.sx,
      }}
    />
  );

  if (!label) {
    return checkbox;
  }

  return (
    <FormControlLabel
     sx={{
      m: 0,
      // Or use ml: 0 if you want to retain the default right margin
    }}
      control={checkbox}
      label={
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      }
    />
  );
}