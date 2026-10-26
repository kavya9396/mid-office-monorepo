import React from "react";
import {
    Box,
    Checkbox,
    Chip,
    FormControl,
    FormHelperText,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import CustomButton from "../Button/Button";
type Option = {
    label: string;
    value: string;
    disabled?: boolean;
};
type CustomMultiSelectProps = {
    label?: string;
    options: Option[];
    value?: string[];
    onChange?: (value: string[]) => void;
    placeholder?: string;
    fullWidth?: boolean;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    maxCount?: number;
    showCheckbox?: boolean;
    /** Shows a Select All / Clear All button. Hidden by default. */
    showSelectAll?: boolean;
};
export default function CustomMultiSelect({
    label,
    options,
    value = [],
    onChange,
    placeholder = "Select",
    fullWidth = true,
    error = false,
    helperText,
    disabled = false,
    maxCount,
    showCheckbox = true,
    showSelectAll = false,
}: Readonly<CustomMultiSelectProps>) {
    const selectableValues = Array.from(
        new Set(
            options
                .filter((option) => !option.disabled)
                .map((option) => option.value),
        ),
    );
    const unselectedValues = selectableValues.filter(
        (optionValue) => !value.includes(optionValue),
    );
    const isLimitReached =
        maxCount !== undefined && value.length >= maxCount;
    const showClearAll =
        value.length > 0 &&
        (unselectedValues.length === 0 || isLimitReached);
    const handleSelectAllOrClearAll = () => {
        if (disabled) return;
        if (showClearAll) {
            onChange?.([]);
            return;
        }
        // Keep existing selections and add only enabled options up to maxCount.
        const remainingSlots =
            maxCount === undefined
                ? unselectedValues.length
                : Math.max(0, maxCount - value.length);
        const nextValue = [
            ...value,
            ...unselectedValues.slice(0, remainingSlots),
        ];
        if (nextValue.length !== value.length) {
            onChange?.(nextValue);
        }
    };
    const handleChange = (
        event: SelectChangeEvent<string[]>,
    ) => {
        const newValue = event.target.value;
        const selectedValues =
            typeof newValue === "string"
                ? newValue.split(",")
                : newValue;
        if (
            maxCount !== undefined &&
            selectedValues.length > maxCount
        ) {
            return;
        }
        onChange?.(selectedValues);
    };
    const removeSelectedValue = (
        selectedValue: string,
        event: React.MouseEvent,
    ) => {
        event.stopPropagation();
        const updatedValues = value.filter(
            (item) => item !== selectedValue,
        );
        onChange?.(updatedValues);
    };
    const getOptionLabel = (selectedValue: string) =>
        options.find(
            (option) => option.value === selectedValue,
        )?.label ?? selectedValue;
    const renderValue = (selected: string[]) => {
        if (!selected || selected.length === 0) {
            return (
                <span style={{ color: "#9ca3af" }}>
                    {placeholder}
                </span>
            );
        }
        return (
            <Box
                // Let users drag the scrollbar without opening the menu.
                onMouseDown={(event) => event.stopPropagation()}
                sx={{
                    width: "100%",
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: "4px",
                    // Three 26px rows + two 4px gaps. Extra rows scroll vertically.
                    maxHeight: "86px",
                    overflowX: "hidden",
                    overflowY: "auto",
                    overscrollBehaviorY: "contain",
                    pr: 0.25,
                    "&::-webkit-scrollbar": {
                        width: 4,
                    },
                    "&::-webkit-scrollbar-thumb": {
                        backgroundColor: "#c4c4c4",
                        borderRadius: 4,
                    },
                }}
            >
                {selected.map((selectedValue) => {
                    const selectedLabel =
                        getOptionLabel(selectedValue);
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
                                minHeight: 26,
                                width: "100%",
                                maxWidth: "100%",
                                flexShrink: 0,
                                borderRadius: "6px",
                                backgroundColor: "#f8e9ea",
                                color: "#EA7617",
                                "& .MuiChip-label": {
                                    flex: 1,
                                    minWidth: 0,
                                    textAlign: "left",
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
    };
    return (
        <div>
            <FormControl
                fullWidth={fullWidth}
                error={error}
            >
                {(label || showSelectAll) && (
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 1,
                        }}
                    >
                        {label && (
                            <Typography
                                sx={{ fontSize: "12px", fontWeight: 600 }}
                            >
                                {label}
                            </Typography>
                        )}
                        {showSelectAll && (
                            <CustomButton
                                onClick={handleSelectAllOrClearAll}
                                disabled={
                                    disabled ||
                                    (!showClearAll &&
                                        (unselectedValues.length === 0 || isLimitReached))
                                }
                                sx={{ fontSize: "10px" }}
                                variant="text"
                            >
                                {showClearAll ? "Clear All" : "Select All"}
                            </CustomButton>
                        )}
                    </Box>
                )}
                <Select<string[]>
                    multiple
                    value={value}
                    disabled={disabled}
                    displayEmpty
                    onChange={handleChange}
                    renderValue={renderValue}
                    MenuProps={{
                        sx: {
                            "& .MuiPaper-root": {
                                maxHeight: 300,
                                mt: 0.5,
                            },
                        },
                    }}
                    sx={{
                        minHeight: 40,
                        height: "auto",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        fontSize: "12px",
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(0, 0, 0, 0.23)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#EA7617",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#EA7617",
                            borderWidth: "2px",
                        },
                        "& .MuiSelect-select": {
                            pl: "12px !important",
                            pr: "36px !important",
                            py: "6px !important",
                            height: "auto",
                            minHeight: "0 !important",
                            boxSizing: "border-box",
                            display: "flex",
                            alignItems: "center",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                        },
                    }}
                >
                    {options.map((option) => {
                        const isSelected = value.includes(
                            option.value,
                        );
                        const isMaxCountReached =
                            maxCount !== undefined &&
                            value.length >= maxCount &&
                            !isSelected;
                        const isDisabled =
                            option.disabled || isMaxCountReached;
                        return (
                            <MenuItem
                                key={option.value}
                                value={option.value}
                                disabled={isDisabled}
                                sx={{
                                    minHeight: 40,
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
                                {showCheckbox && (
                                    <Checkbox
                                        checked={isSelected}
                                        disabled={isDisabled}
                                        size="small"
                                        sx={{
                                            p: 0.5,
                                            mr: 1,
                                            color: "#bdbdbd",
                                            "&.Mui-checked": {
                                                color: "#EA7617",
                                            },
                                        }}
                                    />
                                )}
                                <Typography
                                    sx={{
                                        fontSize: "12px",
                                    }}
                                >
                                    {option.label}
                                </Typography>
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
        </div>
    );
}
