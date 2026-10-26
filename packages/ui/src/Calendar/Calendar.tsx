import { useId, useState, type ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { DateValidationError } from "@mui/x-date-pickers/models";
import dayjs, { type Dayjs } from "dayjs";

export type CalendarProps = {
    label?: string;
    value?: Dayjs | null;
    onChange?: (value: Dayjs | null) => void;
    fullWidth?: boolean;
    error?: boolean;
    helperText?: ReactNode;
    disabled?: boolean;
    readOnly?: boolean;
    required?: boolean;
    name?: string;
    format?: string;
    minDate?: Dayjs;
    maxDate?: Dayjs;
    disableTodayAndFuture?: boolean;
    shouldDisableDate?: (date: Dayjs) => boolean;
};

export default function Calendar({
    label,
    value = null,
    onChange,
    fullWidth = true,
    error = false,
    helperText,
    disabled = false,
    readOnly = false,
    required = false,
    name,
    format = "DD/MM/YYYY",
    minDate = dayjs("1925-01-01"),
    maxDate,
    disableTodayAndFuture = true,
    shouldDisableDate,
}: Readonly<CalendarProps>) {
    const id = useId();
    const [validationError, setValidationError] =
        useState<DateValidationError>(null);

    // Use local calendar dates rather than a fixed number of milliseconds.
   const yesterday = dayjs().startOf("day").subtract(1, "day");

let effectiveMaxDate = maxDate;

if (disableTodayAndFuture) {
    effectiveMaxDate = maxDate?.isBefore(yesterday, "day")
        ? maxDate
        : yesterday;
}

    const validationMessage = (() => {
        switch (validationError) {
            case "invalidDate":
                return `Enter a valid date (${format}).`;
            case "maxDate":
                return effectiveMaxDate
                    ? `Select a date on or before ${effectiveMaxDate.format(format)}.`
                    : "Select an earlier date.";
            case "minDate":
                return "Select a date within the allowed range.";
            case "shouldDisableDate":
                return "This date is unavailable.";
            default:
                return undefined;
        }
    })();

    return (
        <Box sx={{ width: fullWidth ? "100%" : 240 }}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                {label && (
                    <Typography
                        component="label"
                        htmlFor={id}
                        sx={{ display: "block", fontSize: "12px", fontWeight: 600 }}
                    >
                        {label}
                        {required && <Box component="span" sx={{ color: "error.main" }}> *</Box>}
                    </Typography>
                )}

                <DatePicker
                    value={value}
                    name={name}
                    format={format}
                    disabled={disabled}
                    readOnly={readOnly}
                    minDate={minDate}
                    maxDate={effectiveMaxDate}
                    shouldDisableDate={shouldDisableDate}
                    onError={setValidationError}
                    onChange={(newValue, context) => {
                        // Reject invalid manually typed dates as well as disabled dates.
                        if (newValue === null || context.validationError === null) {
                            onChange?.(newValue);
                        }
                    }}
                    slotProps={{
                        yearButton: {
                            sx: {
                                "&.Mui-selected": {
                                    backgroundColor: "#EA7617",
                                    color: "#fff",
                                    "&:hover, &:focus": {
                                        backgroundColor: "#cf6410",
                                    },
                                },
                            },
                        },
                        textField: {
                            id,
                            fullWidth: true,
                            size: "small",
                            variant: "outlined",
                            required,
                            error: error || Boolean(validationError),
                            helperText: helperText ?? validationMessage,
                            sx: {
                                // Cover both the accessible field and older TextField markup.
                                "& .MuiPickersInputBase-root, & .MuiOutlinedInput-root": {
                                    height: 40,
                                    borderRadius: "8px",
                                    fontSize: "12px",
                                    backgroundColor: "#fff",
                                },
                                "& .MuiPickersOutlinedInput-notchedOutline, & .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "rgba(0, 0, 0, 0.23)",
                                },
                                "& .MuiPickersOutlinedInput-root:hover:not(.Mui-disabled):not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline, & .MuiOutlinedInput-root:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#EA7617",
                                },
                                "& .MuiPickersOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiPickersOutlinedInput-notchedOutline, & .MuiOutlinedInput-root.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#EA7617",
                                    borderWidth: "2px",
                                },
                                "& .MuiPickersSectionList-root, & .MuiInputBase-input": {
                                    fontSize: "12px",
                                },
                                "& .MuiIconButton-root": { color: "#EA7617" },
                                "& .MuiIconButton-root.Mui-disabled": { color: "action.disabled" },
                                "& .MuiSvgIcon-root": { fontSize: 20 },
                                "& .MuiFormHelperText-root": { fontSize: "12px" },
                            },
                        },
                        day: {
                            sx: {
                                "&:focus, &.Mui-focusVisible": {
                                    backgroundColor: "#FFEAD7",
                                    color: "#EA7617",
                                },
                                "&.Mui-selected": {
                                    backgroundColor: "#EA7617",
                                    color: "#fff",
                                    "&:hover": {
                                        backgroundColor: "#cf6410",
                                    },
                                    "&:focus, &.Mui-focusVisible": {
                                        backgroundColor: "#FFEAD7",
                                        color: "#EA7617",
                                    },
                                },
                            },
                        },
                    }}
                />
            </LocalizationProvider>
        </Box>
    );
}