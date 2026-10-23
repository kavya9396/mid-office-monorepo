
import { useEffect, useId, useRef, useState } from "react";
import {
  Box,
  CircularProgress,
  SxProps,
  TextField,
  Theme,
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

export type ApiAutocompleteOption = {
  label: string;
  value: string;
  disabled?: boolean;
};

export type CustomApiAutocompleteProps = {
  id?: string;
  label?: string;
  value?: ApiAutocompleteOption | null;
  onChange?: (option: ApiAutocompleteOption | null) => void;
  /** Map your API response to { label, value } options. Pass signal to fetch. */
  fetchOptions: (
    query: string,
    signal: AbortSignal,
  ) => Promise<ApiAutocompleteOption[]>;
  /** Defaults to 3. Values below 3 are treated as 3. */
  minCharacters?: number;
  /** Delay after typing stops, in milliseconds. Defaults to 300. */
  debounceMs?: number;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  noOptionsText?: string;
  fetchErrorText?: string;
};

type SearchRequest = {
  query: string;
  id: number;
};

type SearchResult = {
  id: number;
  status: "loading" | "success" | "error";
  options: ApiAutocompleteOption[];
};

/**
 * A controlled single-select dropdown with API results
 * after 3+ characters.
 *
 * Keep fetchOptions stable using useCallback or by
 * defining it outside the parent component.
 */
export default function CustomApiAutocomplete({
  id,
  label,
  value = null,
  onChange,
  fetchOptions,
  minCharacters = 3,
  debounceMs = 300,
  placeholder = "Type to search",
  fullWidth = true,
  disabled = false,
  error = false,
  helperText,
  noOptionsText = "No options found",
  fetchErrorText = "Unable to load options. Please try again.",
}: Readonly<CustomApiAutocompleteProps>) {
  const generatedId = useId();
  const inputId = id ?? `api-autocomplete-${generatedId}`;
  const minimum = Math.max(3, minCharacters);

  const [search, setSearch] = useState<SearchRequest | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [wantsOpen, setWantsOpen] = useState(false);

  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  // Cancel the current search
  const cancelSearch = () => {
    requestIdRef.current += 1;
    controllerRef.current?.abort();
    setSearch(null);
    setWantsOpen(false);
  };

  // Begin a new search
  const beginSearch = (text: string) => {
    // Invalidate old responses before effect cleanup.
    requestIdRef.current += 1;
    controllerRef.current?.abort();

    setSearch({
      query: text.trim(),
      id: requestIdRef.current,
    });

    setWantsOpen(true);
  };

  // Fetch options after debounce
  useEffect(() => {
    if (
      !search ||
      disabled ||
      search.query.length < minimum
    ) {
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;

    const isCurrent = () =>
      !controller.signal.aborted &&
      requestIdRef.current === search.id;

    const timer = setTimeout(async () => {
      if (!isCurrent()) {
        return;
      }

      setResult({
        id: search.id,
        status: "loading",
        options: [],
      });

      try {
        const options = await fetchOptions(
          search.query,
          controller.signal
        );

        if (isCurrent()) {
          setResult({
            id: search.id,
            status: "success",
            options,
          });
        }
      } catch {
        // Ignore aborted or superseded requests.
        if (isCurrent()) {
          setResult({
            id: search.id,
            status: "error",
            options: [],
          });
        }
      }
    }, Math.max(0, debounceMs));

    return () => {
      clearTimeout(timer);
      controller.abort();

      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    };
  }, [
    search,
    disabled,
    minimum,
    debounceMs,
    fetchOptions,
  ]);

  // Search state
  const canSearch =
    !disabled &&
    search !== null &&
    search.query.length >= minimum;

  const currentResult =
    canSearch && result?.id === search?.id
      ? result
      : null;

  const isSearching =
    canSearch &&
    (!currentResult || currentResult.status === "loading");

  const hasResponse =
    currentResult !== null &&
    currentResult.status !== "loading";

  const searchFailed = currentResult?.status === "error";

  const visibleOptions =
    currentResult?.status === "success"
      ? currentResult.options
      : [];

  // SonarQube S3358 fix: No nested ternary
  let displayedHelper =
    helperText ??
    `Type at least ${minimum} characters to search`;

  if (searchFailed) {
    displayedHelper = fetchErrorText;
  } else if (isSearching) {
    displayedHelper = "Searching...";
  }

  // Label styles
const labelStyles: SxProps<Theme> = label
  ? {
      display: "block",
      fontSize: "12px",
      fontWeight: 600,
      mb: 0.5,
    }
  : {
      position: "absolute",
      width: 1,
      height: 1,
      p: 0,
      m: -1,
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap",
      border: 0,
    };

  return (
    <Box
      sx={{
        width: fullWidth ? "100%" : 240,
        maxWidth: "100%",
      }}
    >
      {/* Label and loading indicator */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography
          component="label"
          htmlFor={inputId}
          sx={labelStyles}
        >
          {label || placeholder}
        </Typography>

        {isSearching && (
          <CircularProgress
            size={14}
            aria-label="Searching options"
            sx={{
              ml: "auto",
              mb: 0.5,
              color: "#EA7617",
            }}
          />
        )}
      </Box>

      {/* API Autocomplete */}
      <Autocomplete<
        ApiAutocompleteOption,
        false,
        false,
        false
      >
        id={inputId}
        value={value}
        options={visibleOptions}
        onChange={(_event, option) => {
          cancelSearch();
          onChange?.(option);
        }}
        onInputChange={(_event, text, reason) => {
          if (reason === "input") {
            beginSearch(text);
          } else if (
            reason === "clear" ||
            reason === "reset" ||
            reason === "selectOption"
          ) {
            // Selecting or clearing is not a new search.
            cancelSearch();
          }
        }}
        open={wantsOpen && canSearch && hasResponse}
        onOpen={() => setWantsOpen(true)}
        onClose={() => setWantsOpen(false)}
        clearOnBlur={false}
        getOptionLabel={(option) => option.label}
        getOptionKey={(option) => option.value}
        isOptionEqualToValue={(option, selected) =>
          option.value === selected.value
        }
        getOptionDisabled={(option) =>
          Boolean(option.disabled)
        }
        // API handles filtering.
        filterOptions={(options) => options}
        disabled={disabled}
        fullWidth={fullWidth}
        size="small"
        loading={isSearching}
        noOptionsText={
          searchFailed
            ? fetchErrorText
            : noOptionsText
        }
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
            },
          },
          listbox: {
            sx: {
              maxHeight: 300,
              fontSize: "12px",

              "& .MuiAutocomplete-option": {
                minHeight: 40,
              },

              "& .MuiAutocomplete-option.Mui-focused": {
                backgroundColor: "#FFEAD7",
              },

              "& .MuiAutocomplete-option.Mui-focusVisible": {
                backgroundColor: "#FFEAD7",
              },

              "& .MuiAutocomplete-option[aria-selected='true']": {
                backgroundColor: "#f8e9ea",
                color: "#7b1d21",
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

            "&:hover:not(.Mui-disabled):not(.Mui-error) .MuiOutlinedInput-notchedOutline":
              {
                borderColor: "#EA7617",
              },

            "&.Mui-focused:not(.Mui-error) .MuiOutlinedInput-notchedOutline":
              {
                borderColor: "#EA7617",
                borderWidth: "2px",
              },
          },

          "& .MuiAutocomplete-input::placeholder": {
            color: "#9ca3af",
            opacity: 1,
          },
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            placeholder={placeholder}
            error={error || searchFailed}
            helperText={displayedHelper}
          />
        )}
      />
    </Box>
  );
}
