import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Calendar, CustomSelect, CustomTextField } from "@insurance-poc/ui";
import {
  MEDICAL_DATE_FORMAT,
  getMedicalOptions,
  resolveMedicalControlKind,
  type MedicalSection,
} from "../../modules/Medical/medical.config";
import { getMedicalFieldValidator } from "../../modules/Medical/medical.schema";

dayjs.extend(customParseFormat);

type SpecialMedicalFieldProps = Readonly<{
  section: MedicalSection;
  label: string;
  configRequired: boolean;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}>;

export function SpecialMedicalField({
  section,
  label,
  configRequired,
  value,
  error,
  onChange,
}: SpecialMedicalFieldProps) {
  const validator = getMedicalFieldValidator(section.key, label);
  const required = validator?.isRequired() ?? configRequired;
  const kind = resolveMedicalControlKind(section.key, label);
  const options = validator?.options ?? getMedicalOptions(kind);
  const labelText = required ? `${label} *` : label;

  if (options.length > 0) {
    return (
      <CustomSelect
        label={labelText}
        placeholder={section.selectPlaceholder ?? "Select"}
        fullWidth
        value={value}
        options={[...options]}
        error={Boolean(error)}
        helperText={error}
        onChange={onChange}
      />
    );
  }

  if (kind === "date") {
    const parsed = value ? dayjs(value, MEDICAL_DATE_FORMAT, true) : null;
    return (
      <Calendar
        label={labelText}
        value={parsed?.isValid() ? parsed : null}
        format={MEDICAL_DATE_FORMAT}
        maxDate={dayjs()}
        disableTodayAndFuture={false}
        error={Boolean(error)}
        helperText={error}
        onChange={(next: Dayjs | null) => onChange(next ? next.format(MEDICAL_DATE_FORMAT) : "")}
      />
    );
  }

  return (
    <CustomTextField
      labelText={labelText}
      fullWidth
      type={kind === "number" ? "number" : "text"}
      value={value}
      error={Boolean(error)}
      helperText={error}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function specialMedicalFieldErrors(
  section: MedicalSection,
  values: Readonly<Record<string, string>>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [label, , configRequired] of section.fields) {
    const validator = getMedicalFieldValidator(section.key, label);
    const value = values[label] ?? "";
    const required = validator?.isRequired() ?? Boolean(configRequired);
    const message = validator?.validate(value) ?? (required && value.trim().length === 0 ? `${label} is required` : undefined);
    if (message) errors[label] = message;
  }
  return errors;
}
