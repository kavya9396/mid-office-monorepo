import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
} from "@mui/material";

type Option = {
  label: string;
  value: string;
  disabled?: boolean;
};

type CustomRadioGroupProps = {
  label?: string;
  options: Option[];
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  row?: boolean;
};

export default function CustomRadioGroup({
  label,
  options,
  value,
  onChange,
  row = false,
}: CustomRadioGroupProps) {
  return (
    <FormControl>
      {label && (
        <FormLabel>
          <Typography>{label}</Typography>
        </FormLabel>
      )}

      <RadioGroup row={row} value={value} onChange={onChange}>
        {options.map((option) => (
          <FormControlLabel
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            control={
              <Radio
                size="small"
                sx={{
                  "&.Mui-checked": {
                    color: "#EA7617",
                  },
                }}
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                {option.label}
              </Typography>
            }
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}