import React from "react";
import {
  FormControl,
  FormHelperText,
  Select,
  MenuItem,
  Typography,
  Chip,
  Box,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

type Option = {
  label: string;
  value: string;
  disabled?: boolean;
};

type BaseSelectProps = {
  label?: string;
  options: Option[];
  placeholder?: string;
  fullWidth?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
};

type SingleSelectProps = BaseSelectProps & {
  multiple?: false;
  value?: string;
  onChange?: (value: string) => void;
  renderValue?: (value: string) => React.ReactNode;
  maxCount?: never;
};

type MultipleSelectProps = BaseSelectProps & {
  multiple: true;
  value?: string[];
  onChange?: (value: string[]) => void;
  renderValue?: (value: string[]) => React.ReactNode;
  maxCount?: number;
};

type CustomSelectProps = SingleSelectProps | MultipleSelectProps;

export default function CustomSelect(props: CustomSelectProps) {
  const {
    label,
    value,
    onChange,
    options,
    placeholder = "Select",
    renderValue,
    fullWidth = true,
    error = false,
    helperText,
    disabled = false,
    multiple = false,
  } = props;

  const maxCount = multiple ? props.maxCount : undefined;

  const handleChange = (
    e: SelectChangeEvent<string | string[]>
  ) => {
    const newValue = e.target.value;

    if (multiple && Array.isArray(newValue) && maxCount) {
      if (newValue.length <= maxCount) {
        (onChange as ((value: string[]) => void) | undefined)?.(
          newValue
        );
      }
    } else if (multiple && Array.isArray(newValue)) {
      (onChange as ((value: string[]) => void) | undefined)?.(
        newValue
      );
    } else if (!multiple && typeof newValue === "string") {
      (onChange as ((value: string) => void) | undefined)?.(
        newValue
      );
    }
  };

  const removeSelectedValue = (
    selectedValue: string,
    event: React.SyntheticEvent,
  ) => {
    event.stopPropagation();

    if (!multiple || !Array.isArray(value)) return;

    const updatedValues = value.filter(
      (item) => item !== selectedValue,
    );

    (
      onChange as
      | ((values: string[]) => void)
      | undefined
    )?.(updatedValues);
  };

  const defaultRenderValue = (
    selected: string | string[],
  ) => {
    if (
      !selected ||
      (Array.isArray(selected) && selected.length === 0)
    ) {
      return (
        <span style={{ color: "#9ca3af" }}>
          {placeholder}
        </span>
      );
    }

    const lookupLabel = (selectedValue: string) =>
      options.find(
        (option) => option.value === selectedValue,
      )?.label ?? selectedValue;

    if (Array.isArray(selected)) {
      return (
        <Box
          sx={{
            width: "100%",
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            overflowX: "auto",
            overflowY: "hidden",
            py: 0.25,

            "&::-webkit-scrollbar": {
              height: 3,
            },

            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "#c4c4c4",
              borderRadius: 4,
            },
          }}
        >
          {selected.map((selectedValue) => {
            const selectedLabel =
              lookupLabel(selectedValue);

            return (
              <Chip
                key={selectedValue}
                label={selectedLabel}
                title={selectedLabel}
                size="small"
                disabled={disabled}
                onMouseDown={(event) => {
                  event.stopPropagation();
                }}
                onDelete={
                  disabled
                    ? undefined
                    : (event) =>
                      removeSelectedValue(
                        selectedValue,
                        event,
                      )
                }
                sx={{
                  height: 26,
                  maxWidth: 120,
                  flexShrink: 0,
                  fontSize: "12px",
                  borderRadius: "6px",
                  backgroundColor: "#f8e9ea",
                  color: "#EA7617",

                  "& .MuiChip-label": {
                    px: 1,
                    display: "block",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  },

                  "& .MuiChip-deleteIcon": {
                    fontSize: 17,
                    color: "#EA7617",

                    "&:hover": {
                      color: "#EA7617",
                    },
                  },
                }}
              />
            );
          })}
        </Box>
      );
    }

    return lookupLabel(selected);
  };

  return (
    <Box>
      {label && (
        <Typography
          sx={{
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {label}
        </Typography>
      )}

      <FormControl
        fullWidth={fullWidth}
        error={error}
      >
        <Select
          value={value ?? (multiple ? [] : "")}
          disabled={disabled}
          displayEmpty
          multiple={multiple}
          onChange={handleChange}
          renderValue={
            (renderValue ||
              defaultRenderValue) as (
                value: string | string[]
              ) => React.ReactNode
          }
          sx={{
            height: 40,
            borderRadius: "8px",
            fontSize: "12px",
            backgroundColor: "#fff",

            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(0, 0, 0, 0.23)",
            },

            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#EA7617",
            },

            "&.Mui-focused .MuiOutlinedInput-notchedOutline":
            {
              borderColor: "#EA7617",
              borderWidth: "2px",
            },
            "& .MuiSelect-select": {
              fontSize: "12px",
              px: 2,
              py: "4px !important",
              height: "100%",
              minHeight: "0 !important",
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
            },
          }}
        >
          {/* {!multiple && (
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
          )} */}

          {options.map((option) => {
            const isDisabled = Boolean(
              option.disabled ||
              (multiple &&
                maxCount &&
                Array.isArray(value) &&
                value.length >= maxCount &&
                !value.includes(option.value))
            );

            return (
              <MenuItem
                key={option.value}
                value={option.value}
                disabled={isDisabled}
                sx={{
                  fontSize: "12px",

                  "&.Mui-selected": {
                    backgroundColor: "#f8e9ea",
                    color: "#7b1d21",
                  },

                  "&.Mui-selected:hover": {
                    backgroundColor: "#f3d6d8",
                  },

                  "&.Mui-selected.Mui-focusVisible": {
                    backgroundColor: "#f3d6d8",
                  },
                }}
              >
                {option.label}
              </MenuItem>
            );
          })}
        </Select>

        {!!helperText && (
          <FormHelperText>
            {helperText}
          </FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}