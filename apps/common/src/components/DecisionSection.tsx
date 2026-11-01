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
  /** Optional options if decision code is also selectable */
  decisionCodeOptions?: DecisionOption[];
  /** Controlled remarks value */
  remarks?: string;
  /** Remarks change callback */
  onRemarksChange?: (remarks: string) => void;
  /** Controlled decision value */
  decision?: string;
  /** Decision change callback */
  onDecisionChange?: (decision: string) => void;
  /** Controlled decision code value */
  decisionCode?: string;
  /** Decision code change callback */
  onDecisionCodeChange?: (decisionCode: string) => void;
  /** Initial default remarks (uncontrolled) */
  defaultRemarks?: string;
  /** Initial default decision (uncontrolled) */
  defaultDecision?: string;
  /** Initial default decision code (uncontrolled) */
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
  decisionCodeOptions,
  remarks: controlledRemarks,
  onRemarksChange,
  decision: controlledDecision,
  onDecisionChange,
  decisionCode: controlledDecisionCode,
  onDecisionCodeChange,
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
  const [internalRemarks, setInternalRemarks] = useState(defaultRemarks);
  const [internalDecision, setInternalDecision] = useState(defaultDecision);
  const [internalDecisionCode, setInternalDecisionCode] =
    useState(defaultDecisionCode);

  const remarksVal = controlledRemarks ?? internalRemarks;
  const decisionVal = controlledDecision ?? internalDecision;
  const decisionCodeVal = controlledDecisionCode ?? internalDecisionCode;

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

  const handleDecisionCodeChange = (value: string) => {
    if (controlledDecisionCode === undefined) {
      setInternalDecisionCode(value);
    }
    onDecisionCodeChange?.(value);
  };

  const handleSubmit = () => {
    onSubmit?.({
      remarks: remarksVal,
      decision: decisionVal,
      decisionCode: decisionCodeVal,
    });
  };

  const normalizedOptions = decisionOptions.map(normalizeOption);
  const normalizedCodeOptions = decisionCodeOptions?.map(normalizeOption);

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
        alignItems: "center",
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
      />

      <CustomSelect
        placeholder={decisionLabel}
        value={decisionVal}
        onChange={(val) => handleDecisionChange(val)}
        options={normalizedOptions}
        disabled={isDisabled}
        fullWidth
      />

      {normalizedCodeOptions && normalizedCodeOptions.length > 0 ? (
        <CustomSelect
          placeholder={decisionCodeLabel}
          value={decisionCodeVal}
          onChange={(val) => handleDecisionCodeChange(val)}
          options={normalizedCodeOptions}
          disabled={isDisabled}
          fullWidth
        />
      ) : (
        <CustomTextField
          label={decisionCodeLabel}
          value={decisionCodeVal}
          onChange={(e) => handleDecisionCodeChange(e.target.value)}
          size="small"
          fullWidth
          disabled={isDisabled}
        />
      )}

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
