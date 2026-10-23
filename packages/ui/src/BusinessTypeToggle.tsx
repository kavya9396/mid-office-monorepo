import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

export type BusinessType = "RETAIL" | "GROUP";

export function BusinessTypeToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: BusinessType;
  onChange: (businessType: BusinessType) => void;
  disabled?: boolean;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      disabled={disabled}
      onChange={(_, nextValue: BusinessType | null) => {
        if (nextValue && nextValue !== value) onChange(nextValue);
      }}
      size="small"
      aria-label="Business type"
      sx={{
        backgroundColor: "rgba(255,255,255,0.12)",
        "& .MuiToggleButton-root": {
          borderColor: "rgba(255,255,255,0.5)",
          color: "#ffffff",
          px: { xs: 1, sm: 2 },
          "&.Mui-selected": {
            backgroundColor: "#ffffff",
            color: "#0d47a1",
            "&:hover": { backgroundColor: "#f5f5f5" },
          },
        },
      }}
    >
      <ToggleButton value="RETAIL">Retail</ToggleButton>
      <ToggleButton value="GROUP">Group</ToggleButton>
    </ToggleButtonGroup>
  );
}
