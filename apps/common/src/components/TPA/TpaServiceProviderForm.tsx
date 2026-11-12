import { useState } from "react";
import {
  CustomBox,
  CustomButton,
  CustomSelect,
  CustomTextField,
  CustomTypography,
} from "@insurance-poc/ui";
import type { MedicalTpaSelectOption, MedicalTpaSubmitPayload } from "./types";

/** Non-selectable placeholder value when master list is empty (label is informational only). */
const MASTER_EMPTY_HINT_VALUE = "__tpa_master_empty_hint__";
const MASTER_EMPTY_HINT_LABEL = "Need to add data in master";

type SelectDropdownOption = MedicalTpaSelectOption & { disabled?: boolean };

const withMasterEmptyHint = (options: MedicalTpaSelectOption[]): SelectDropdownOption[] =>
  options.length > 0
    ? options
    : [{ label: MASTER_EMPTY_HINT_LABEL, value: MASTER_EMPTY_HINT_VALUE, disabled: true }];

type TpaServiceProviderFormProps = {
  serviceProviderOptions: MedicalTpaSelectOption[];
  defaultServiceProvider?: string;
  reasonOptions: MedicalTpaSelectOption[];
  readOnly?: boolean;
  submitting?: boolean;
  onSubmit?: (payload: Omit<MedicalTpaSubmitPayload, "applicationNo">) => void;
};

/** Matches CustomSelect / CustomTextField control height in `@insurance-poc/ui`. */
const controlHeightSx = {
  "& .MuiOutlinedInput-root": {
    height: 40,
    minHeight: 40,
  },
  "& .MuiOutlinedInput-root.MuiInputBase-multiline": {
    height: 40,
    minHeight: 40,
    py: 0,
    alignItems: "center",
  },
  "& .MuiInputBase-inputMultiline": {
    py: 0.75,
  },
};

export function TpaServiceProviderForm({
  serviceProviderOptions,
  defaultServiceProvider = "",
  reasonOptions,
  readOnly = false,
  submitting = false,
  onSubmit,
}: Readonly<TpaServiceProviderFormProps>) {
  const [serviceProvider, setServiceProvider] = useState(
    defaultServiceProvider || "",
  );
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");

  const hasServiceProviderMaster = serviceProviderOptions.length > 0;
  const hasReasonMaster = reasonOptions.length > 0;
  const providerDropdownOptions = withMasterEmptyHint(serviceProviderOptions);
  const reasonDropdownOptions = withMasterEmptyHint(reasonOptions);

  const canSubmit =
    hasServiceProviderMaster &&
    hasReasonMaster &&
    serviceProvider.trim().length > 0 &&
    reason.trim().length > 0 &&
    remarks.trim().length > 0;

  const handleSubmit = () => {
    if (readOnly || !onSubmit || !canSubmit) return;
    onSubmit({ serviceProvider, reason, remarks: remarks.trim() });
  };

  return (
    <CustomBox
      sx={{
        display: "grid",
        gridTemplateRows: "30px minmax(0, 1fr)",
      }}
    >
      <CustomBox
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1.5,
          bgcolor: "#fff1e6",
          borderTop: "1px solid #F1D4BF",
          borderBottom: "1px solid #F1D4BF",
        }}
      >
        <CustomTypography sx={{ fontSize: "12.5px", fontWeight: 700 }}>
          Service Provider Details
        </CustomTypography>
      </CustomBox>
      <CustomBox
        sx={{
          p: 1.5,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "220px 220px minmax(260px, 1fr) 110px",
          },
          gap: 1.25,
          alignItems: "end",
        }}
      >
        <CustomBox sx={{ minWidth: 0 }}>
          <CustomSelect
            label="Service Provider Name"
            value={serviceProvider}
            onChange={setServiceProvider}
            placeholder="Select"
            disabled={readOnly}
            options={providerDropdownOptions}
          />
        </CustomBox>
        <CustomBox sx={{ minWidth: 0 }}>
          <CustomSelect
            label="Reason"
            value={reason}
            onChange={setReason}
            placeholder="Select Reason"
            disabled={readOnly}
            options={reasonDropdownOptions}
          />
        </CustomBox>
        <CustomBox sx={{ minWidth: 0 }}>
          <CustomTextField
            fullWidth
            labelText="Remarks"
            multiline
            minRows={1}
            maxRows={3}
            placeholder="Enter remarks"
            value={remarks}
            disabled={readOnly}
            onChange={(event) => setRemarks(event.target.value)}
            aria-label="Remarks"
            sx={controlHeightSx}
          />
        </CustomBox>
        {!readOnly ? (
          <CustomButton
            variant="contained"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            sx={{
              width: "100%",
              height: 40,
              minHeight: 40,
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: 700,
            }}
          >
            Submit
          </CustomButton>
        ) : null}
      </CustomBox>
    </CustomBox>
  );
}
