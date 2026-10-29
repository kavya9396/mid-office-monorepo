import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { CustomTextField, EyeIcon, EyeSlashIcon } from "@insurance-poc/ui";
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form";

type AuthPasswordFieldProps<T extends FieldValues> = {
  name: FieldPath<T>;
  control: Control<T>;
  label: string;
  placeholder: string;
  autoComplete: string;
};

export function AuthPasswordField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  autoComplete,
}: Readonly<AuthPasswordFieldProps<T>>) {
  const [visible, setVisible] = useState(false);
  const visibilityLabel = visible ? `Hide ${label}` : `Show ${label}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <CustomTextField
          fullWidth
          name={field.name}
          value={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          type={visible ? "text" : "password"}
          labelText={label}
          mandatory
          placeholder={placeholder}
          autoComplete={autoComplete}
          error={Boolean(fieldState.error)}
          helperText={fieldState.error?.message}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="button"
                    aria-label={visibilityLabel}
                    aria-pressed={visible}
                    edge="end"
                    onClick={() => setVisible((current) => !current)}
                  >
                    {visible ? <EyeSlashIcon /> : <EyeIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      )}
    />
  );
}
