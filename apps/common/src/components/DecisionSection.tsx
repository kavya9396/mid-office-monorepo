import { useState } from "react";
import { Box, type SxProps, type Theme } from "@mui/material";
import {
  colors,
  CustomButton,
  CustomSelect,
  CustomTextField,
} from "@insurance-poc/ui";

export type DecisionOption =
  | string
  | {
      label: string;
      value: string;
      disabled?: boolean;
    };

export type DecisionSubmitPayload = {
  remarks: string;
  decision: string;
  decisionCode: string;
};

export type DecisionSectionProps = {
  /** ARIA label and section identifier */
  ariaLabel?: string;
  /** Label / placeholder for the remarks multiline text field */
  remarksLabel?: string;
  /** Label / placeholder for the decision select dropdown */
  decisionLabel?: string;
  /** Label / placeholder for the decision code input field */
  decisionCodeLabel?: string;
  /** Label for the submit button */
  submitButtonLabel?: string;
  /** Available decision dropdown options */
  decisionOptions?: DecisionOption[];
  /** Controlled remarks value */
  remarks?: string;
  /** Remarks change callback */
  onRemarksChange?: (remarks: string) => void;
  /** Controlled decision value */
  decision?: string;
  /** Decision change callback */
  onDecisionChange?: (decision: string) => void;
  /** Decision code value (read-only field) */
  decisionCode?: string;
  /** Initial default remarks (uncontrolled) */
  defaultRemarks?: string;
  /** Initial default decision (uncontrolled) */
  defaultDecision?: string;
  /** Default decision code shown when `decisionCode` is not provided (read-only) */
  defaultDecisionCode?: string;
  /** Callback fired when clicking the submit button */
  onSubmit?: (data: DecisionSubmitPayload) => void;
  /** When true, hides the submit button and disables all fields */
  readOnly?: boolean;
  /** When true, disables all fields and the submit button */
  disabled?: boolean;
  /** Indicates submission in progress */
  isSubmitting?: boolean;
  /** Explicitly disable the submit button */
  submitDisabled?: boolean;
  /** Optional custom sx overrides for the root section box */
  sx?: SxProps<Theme>;
};

export const DEFAULT_DVT_DECISION_OPTIONS: DecisionOption[] = [
  "Accept",
  "Raise Requirements",
  "Refer to Risk",
  "Refer to IT",
  "Refer to GUW",
];

const normalizeOption = (
  opt: DecisionOption,
): { label: string; value: string; disabled?: boolean } =>
  typeof opt === "string" ? { label: opt, value: opt } : opt;

export function DecisionSection({
  ariaLabel = "DVT Decision",
  remarksLabel = "DVT Remarks",
  decisionLabel = "DVT Decision",
  decisionCodeLabel = "Decision Code",
  submitButtonLabel = "Submit",
  decisionOptions = DEFAULT_DVT_DECISION_OPTIONS,
  remarks: controlledRemarks,
  onRemarksChange,
  decision: controlledDecision,
  onDecisionChange,
  decisionCode: controlledDecisionCode,
  defaultRemarks = "",
  defaultDecision = "",
  defaultDecisionCode = "",
  onSubmit,
  readOnly = false,
  disabled = false,
  isSubmitting = false,
  submitDisabled = false,
  sx,
}: Readonly<DecisionSectionProps>) {
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [internalRemarks, setInternalRemarks] = useState(defaultRemarks);
  const [internalDecision, setInternalDecision] = useState(defaultDecision);

  const remarksVal = controlledRemarks ?? internalRemarks;
  const decisionVal = controlledDecision ?? internalDecision;
  const decisionCodeVal = controlledDecisionCode ?? defaultDecisionCode;

  const isDisabled = disabled || readOnly;

  const handleRemarksChange = (value: string) => {
    if (controlledRemarks === undefined) {
      setInternalRemarks(value);
    }
    onRemarksChange?.(value);
  };

  const handleDecisionChange = (value: string) => {
    if (controlledDecision === undefined) {
      setInternalDecision(value);
    }
    onDecisionChange?.(value);
  };

  const remarksError =
    submitAttempted && remarksVal.trim() === "" ? "Remarks are required" : "";
  const decisionError =
    submitAttempted && decisionVal === "" ? "Decision is required" : "";
  const hasErrors = remarksError !== "" || decisionError !== "";

  const handleSubmit = () => {
    setSubmitAttempted(true);
    if (remarksVal.trim() === "" || decisionVal === "") {
      return;
    }
    onSubmit?.({
      remarks: remarksVal,
      decision: decisionVal,
      decisionCode: decisionCodeVal,
    });
  };

  const normalizedOptions = decisionOptions.map(normalizeOption);

  return (
    <Box
      component="section"
      aria-label={ariaLabel}
      sx={{
        p: 1.25,
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1fr) 250px 220px auto",
        },
        gap: 1.25,
        alignItems: hasErrors ? "start" : "center",
        border: "1px solid #D8D8D8",
        borderLeft: `4px solid ${colors.primary}`,
        borderRadius: 2,
        backgroundColor: colors.white,
        ...sx,
      }}
    >
      <CustomTextField
        label={remarksLabel}
        // placeholder={remarksLabel}
        value={remarksVal}
        onChange={(e) => handleRemarksChange(e.target.value)}
        multiline
        minRows={1}
        size="small"
        fullWidth
        disabled={isDisabled}
        required
        error={remarksError !== ""}
        helperText={remarksError || undefined}
      />

      <CustomSelect
        placeholder={decisionLabel}
        value={decisionVal}
        onChange={(val) => handleDecisionChange(val)}
        options={normalizedOptions}
        disabled={isDisabled}
        fullWidth
        error={decisionError !== ""}
        helperText={decisionError || undefined}
      />

      <CustomTextField
        label={decisionCodeLabel}
        value={decisionCodeVal}
        size="small"
        fullWidth
        slotProps={{ input: { readOnly: true } }}
        sx={{
          "& .MuiInputBase-root.MuiOutlinedInput-root": {
            backgroundColor: "#F5F5F5",
            cursor: "default",
          },
          "& .MuiInputBase-root.MuiOutlinedInput-root input": {
            cursor: "default",
            caretColor: "transparent",
          },
          "& .MuiInputBase-root.MuiOutlinedInput-root fieldset": {
            borderColor: "#D8D8D8",
          },
          "& .MuiInputBase-root.MuiOutlinedInput-root:hover fieldset": {
            borderColor: "#D8D8D8",
          },
          "& .MuiInputBase-root.MuiOutlinedInput-root.Mui-focused fieldset": {
            borderColor: "#D8D8D8",
            borderWidth: "1px",
          },
        }}
      />

      {!readOnly && (
        <CustomButton
          variant="contained"
          disabled={isDisabled || submitDisabled || isSubmitting}
          onClick={handleSubmit}
        >
          {submitButtonLabel}
        </CustomButton>
      )}
    </Box>
  );
}

export default DecisionSection;
