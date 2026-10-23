import { useId } from "react";
import { Box, TextField, Typography } from "@mui/material";
import Autocomplete, { createFilterOptions } from "@mui/material/Autocomplete";

export type SearchSelectOption = {
    label: string;
    value: string;
    disabled?: boolean;
};

export type CustomSearchSelectProps = {
    id?: string;
    label?: string;
    options: SearchSelectOption[];
    /** Selected option value; an empty string clears the selection. */
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    fullWidth?: boolean;
    error?: boolean;
    helperText?: string;
    disabled?: boolean;
    noOptionsText?: string;
};

const filterOptions = createFilterOptions<SearchSelectOption>({
    ignoreCase: true,
    ignoreAccents: true,
    matchFrom: "any",
    trim: true,
    stringify: (option) => option.label,
});

export default function CustomSearchSelect({
    id,
    label,
    options,
    value = "",
    onChange,
    placeholder = "Search and select",
    fullWidth = true,
    error = false,
    helperText,
    disabled = false,
    noOptionsText = "No options found",
}: CustomSearchSelectProps) {
    const generatedId = useId();
    const inputId = id ?? `search-select-${generatedId}`;
    const selectedOption = options.find((option) => option.value === value) ?? null;

    return (
        <Box sx={{ width: fullWidth ? "100%" : 240, maxWidth: "100%" }}>
            {label && (
                <Typography
                    sx={{
                        fontSize: "12px",
                        fontWeight: 600,
                    }}
                >
                    {label || placeholder}
                </Typography>
            )}

            <Autocomplete<SearchSelectOption, false, false, false>
                id={inputId}
                options={options}
                value={selectedOption}
                onChange={(_event, option) => onChange?.(option?.value ?? "")}
                getOptionLabel={(option) => option.label}
                getOptionKey={(option) => option.value}
                isOptionEqualToValue={(option, selected) => option.value === selected.value}
                getOptionDisabled={(option) => Boolean(option.disabled)}
                filterOptions={filterOptions}
                disabled={disabled}
                fullWidth={fullWidth}
                size="small"
                openOnFocus
                noOptionsText={noOptionsText}
                slotProps={{
                    paper: { sx: { mt: 0.5 } },
                    listbox: {
                        sx: {
                            maxHeight: 300,
                            fontSize: "12px",
                            "& .MuiAutocomplete-option": { minHeight: 40 },
                            "& .MuiAutocomplete-option.Mui-focused": {
                                backgroundColor: "#FFEAD7",
                            },
                            "& .MuiAutocomplete-option.Mui-focusVisible": {
                                backgroundColor: "#FFEAD7",
                            },
                            "& .MuiAutocomplete-option[aria-selected='true']": {
                                backgroundColor: "#f8e9ea", color: "#7b1d21",
                            },
                            "& .MuiAutocomplete-option[aria-selected='true'].Mui-focused": {
                                backgroundColor: "#f3d6d8",
                            },
                        },
                    },
                }}
                sx={{
                    "& .MuiOutlinedInput-root": {
                        height: 40,
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        fontSize: "12px",
                        "&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#EA7617",
                        },
                        "&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#EA7617", borderWidth: "2px",
                        },
                    },
                    "& .MuiAutocomplete-input::placeholder": {
                        color: "#9ca3af", opacity: 1,
                    },
                    "& .MuiAutocomplete-clearIndicator:focus-visible, & .MuiAutocomplete-popupIndicator:focus-visible": {
                        backgroundColor: "#FFEAD7",
                    },
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        placeholder={placeholder}
                        error={error}
                        helperText={helperText}
                    />
                )}
            />
        </Box>
    );
}
