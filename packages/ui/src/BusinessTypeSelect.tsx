import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { BusinessType } from "./BusinessTypeToggle";

export function BusinessTypeSelect({
  value,
  onChange,
  disabled = false,
}: {
  value: BusinessType | "";
  onChange: (businessType: BusinessType) => void;
  disabled?: boolean;
}) {
  return (
    <FormControl fullWidth>
      <InputLabel id="business-type-label">Business type</InputLabel>
      <Select
        labelId="business-type-label"
        label="Business type"
        name="businessType"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as BusinessType)}
      >
        <MenuItem value="RETAIL">Retail</MenuItem>
        <MenuItem value="GROUP">Group</MenuItem>
      </Select>
    </FormControl>
  );
}
