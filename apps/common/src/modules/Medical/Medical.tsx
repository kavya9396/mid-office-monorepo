import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Box, Typography } from "@mui/material";
import {
  Calendar,
  colors,
  CustomAccordion,
  CustomButton,
  CustomCheckbox,
  CustomDialog,
  CustomSearchSelect,
  CustomSelect,
  CustomSnackbar,
  CustomTable,
  CustomTabs,
  CustomTextField,
  DeleteIcon,
  ScrollToTop,
  type Column,
} from "@insurance-poc/ui";
import { formatIndianCurrency, getSessionUser } from "@insurance-poc/utils";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import {
  getMedicalOptions,
  MEDICAL_DATE_FORMAT,
  MEDICAL_DEFAULT_APPLICANTS,
  MEDICAL_FAMILY_RELATION_OPTIONS,
  MEDICAL_TELE_HEALTH_STATUS_OPTIONS,
  type MedicalCmoDecision,
  type MedicalFamilyRow,
  getVisibleMedicalQuestions,
  MULTI_SELECT_SEPARATOR,
  splitMultiSelect,
  MEDICAL_GROUPS,
  MEDICAL_LOCKED_FIELDS,
  MEDICAL_MESSAGES,
  MEDICAL_COMBINED_GROUP_KEYS,
  MEDICAL_NON_EDITABLE_SECTION_KEYS,
  MEDICAL_SECTIONS,
  resolveMedicalControlKind,
  type MedicalApplicantTab,
  type MedicalControlKind,
  type MedicalGroup,
  type MedicalHistoryEntry,
  type MedicalOption,
  type MedicalSection,
  type MedicalSubmitPayload,
} from "./medical.config";
import {
  buildMedicalSaveRequest,
  formatMedicalSaveMessage,
  readMedicalSaveSections,
  type MedicalSaveRequest,
  type MedicalSaveResponse,
} from "./medical.save";
import {
  calculateMedicalAverage,
  calculateMedicalMeasurements,
  getMedicalFamilyRowValidator,
  getMedicalFieldValidator,
  getMedicalParameterValidator,
  MEDICAL_PARAMETER_COLUMNS,
  type MedicalFieldValidator,
  type MedicalParameterColumn,
} from "./medical.schema";

dayjs.extend(customParseFormat);

export { mapMedicalFetchPayload, type MedicalFetchResult } from "./medical.mapper";
export {
  buildMedicalSaveRequest,
  type MedicalSaveRequest,
  type MedicalSaveResponse,
} from "./medical.save";

export interface MedicalProps {
  summary?: ReactNode;
  applicationNumber?: string;
  partyId?: string;
  applicants?: readonly MedicalApplicantTab[];
  initialApplicantKey?: string;
  groups?: readonly MedicalGroup[];
  sections?: readonly MedicalSection[];
  /**
   * Every section the screen can offer in the "Search and add new document" list, even when the fetch
   * did not return it. Choosing one that is missing adds it (empty) to the page. Defaults to all
   * Medical sections and groups.
   */
  catalog?: {
    sections: readonly MedicalSection[];
    groups: readonly MedicalGroup[];
  };
  /**
   * Past data per section key, shown by each section's History button as the
   * same read-only form. Entry `values` use the same ids as the submit payload.
   */
  history?: Readonly<Record<string, readonly MedicalHistoryEntry[]>>;
  onApplicantChange?: (applicantKey: string) => void;
  onBack?: () => void;
  onViewDocuments?: () => void;
  onSubmit?: (payload: MedicalSubmitPayload) => void;
  /**
   * Called when a section's Save is clicked, with only the edited section(s) in the request. Resolves
   * with the API envelope: the screen shows its `message` (validation failure or success) and leaves
   * edit mode only when the save succeeded. A rejection is shown as an error.
   */
  onSaveSection?: (request: MedicalSaveRequest) => Promise<MedicalSaveResponse>;
}

/** Pulls a readable message out of a thrown Error or an RTK Query `{ error | data.message }` rejection. */
const readSaveError = (reason: unknown): string => {
  if (reason instanceof Error) return reason.message;
  if (typeof reason !== "object" || reason === null) return "";
  if ("error" in reason && typeof reason.error === "string") return reason.error;
  if ("data" in reason && typeof reason.data === "object" && reason.data !== null) {
    const { message } = reason.data as { message?: unknown };
    if (typeof message === "string") return message;
  }
  return "";
};

/* ------------------------------------------------------------------ */
/* In-memory reactive store                                            */
/* ------------------------------------------------------------------ */

type Listener = () => void;

interface MedicalStore {
  get: (id: string) => string;
  set: (id: string, value: string) => void;
  subscribe: (id: string, listener: Listener) => () => void;
  /** Fires on any change to a value whose id starts with `prefix`. */
  subscribePrefix: (prefix: string, listener: Listener) => () => void;
  snapshot: () => Record<string, string>;
  pick: (prefix: string) => Record<string, string>;
  restore: (prefix: string, saved: Readonly<Record<string, string>>) => void;
  /** Deletes every value whose id starts with `prefix` (used when a family row is removed). */
  remove: (prefix: string) => void;
}

const fieldId = (sectionKey: string, index: number) =>
  `${sectionKey}-${index}`;

/** Store id of the field `validator` depends on (same section), if any. */
const dependencyFieldId = (
  section: MedicalSection,
  validator: MedicalFieldValidator | undefined,
): string | undefined => {
  if (!validator?.dependsOn) return undefined;
  const index = section.fields.findIndex(
    ([label]) => label === validator.dependsOn,
  );
  return index === -1 ? undefined : fieldId(section.key, index);
};

/** Field labels used by each section that auto-calculates feet / inches / BMI. */
const MEASUREMENT_SECTION_LABELS: readonly {
  sectionKey: string;
  height: string;
  weight: string;
  feet: string;
  inches: string;
  bmi: string;
}[] = [
  {
    sectionKey: "measurement",
    height: "Height (cms)",
    weight: "Weight (Kgs)",
    feet: "Height (Fts)",
    inches: "Inches",
    bmi: "BMI",
  },
  {
    sectionKey: "tele_measurements",
    height: "Height (cms)",
    weight: "Weight (kgs)",
    feet: "Height (ft)",
    inches: "Inches",
    bmi: "BMI",
  },
];

/** Starter rows: Father and Mother. Further rows are added by the user. */
const FAMILY_DEFAULT_ROWS: readonly MedicalFamilyRow[] = [
  { relation: "Father" },
  { relation: "Mother" },
];

const FAMILY_FIXED_RELATIONS: ReadonlySet<string> = new Set(["Father", "Mother"]);

/** Ids of the Father / Mother starter rows: their relation is locked and they cannot be removed. */
const familyFixedRowIds = (section: MedicalSection): ReadonlySet<string> =>
  new Set(
    (section.familyRows ?? FAMILY_DEFAULT_ROWS).flatMap((row, i) =>
      FAMILY_FIXED_RELATIONS.has(row.relation) ? [String(i + 1)] : [],
    ),
  );

const FAMILY_RELATION_VALIDATOR = getMedicalFamilyRowValidator("relation");
const FAMILY_AGE_VALIDATOR = getMedicalFamilyRowValidator("age");

const createInitialValues = (sections: readonly MedicalSection[]) => {
  const initial: Record<string, string> = {};
  sections.forEach((section) => {
    section.fields.forEach(([, value], index) => {
      initial[fieldId(section.key, index)] = value;
    });
    section.questionnaire?.forEach((question) => {
      initial[`${section.key}-q-${question.id}-response`] = question.response ?? "";
      initial[`${section.key}-q-${question.id}-remarks`] = question.remarks ?? "";
    });
    section.parameters?.forEach(([, unit], index) => {
      const fetched = section.parameterValues?.[index];
      initial[`${section.key}-param-${index}-unit`] = fetched?.unit || unit;
      if (fetched) {
        initial[`${section.key}-param-${index}-value`] = fetched.value;
        initial[`${section.key}-param-${index}-from`] = fetched.from;
        initial[`${section.key}-param-${index}-to`] = fetched.to;
      }
    });
    if (section.layout === "familyHistory") {
      const familyRows = section.familyRows ?? FAMILY_DEFAULT_ROWS;
      initial[`${section.key}-rows`] = familyRows.map((_, i) => String(i + 1)).join(",");
      familyRows.forEach((row, i) => {
        const prefix = `${section.key}-row-${i + 1}`;
        initial[`${prefix}-relation`] = row.relation;
        if (row.age !== undefined) initial[`${prefix}-age`] = row.age;
        if (row.alive !== undefined) initial[`${prefix}-alive`] = row.alive;
        if (row.health !== undefined) initial[`${prefix}-health`] = row.health;
      });
    }
  });
  return initial;
};

const createMedicalStore = (
  initial: Record<string, string>,
): MedicalStore => {
  const values: Record<string, string> = { ...initial };
  const listeners: Record<string, Set<Listener>> = {};
  const prefixListeners = new Map<string, Set<Listener>>();
  const notifyPrefixes = (id: string) => {
    prefixListeners.forEach((set, prefix) => {
      if (id.startsWith(prefix)) set.forEach((listener) => listener());
    });
  };

  return {
    get: (id) => values[id] ?? "",
    set: (id, value) => {
      if (values[id] === value) return;
      values[id] = value;
      listeners[id]?.forEach((listener) => listener());
      notifyPrefixes(id);
    },
    subscribe: (id, listener) => {
      listeners[id] ??= new Set<Listener>();
      listeners[id].add(listener);
      return () => {
        listeners[id]?.delete(listener);
      };
    },
    subscribePrefix: (prefix, listener) => {
      let set = prefixListeners.get(prefix);
      if (!set) {
        set = new Set<Listener>();
        prefixListeners.set(prefix, set);
      }
      set.add(listener);
      return () => {
        prefixListeners.get(prefix)?.delete(listener);
      };
    },
    snapshot: () => ({ ...values }),
    pick: (prefix) =>
      Object.fromEntries(
        Object.entries(values).filter(([k]) => k.startsWith(prefix)),
      ),
    remove: (prefix) => {
      Object.keys(values).forEach((k) => {
        if (!k.startsWith(prefix)) return;
        delete values[k];
        listeners[k]?.forEach((listener) => listener());
      });
    },
    restore: (prefix, saved) => {
      Object.keys(values).forEach((k) => {
        if (k.startsWith(prefix) && !(k in saved)) {
          delete values[k];
          listeners[k]?.forEach((listener) => listener());
        }
      });
      Object.assign(values, saved);
      Object.entries(saved).forEach(([id]) => {
        listeners[id]?.forEach((listener) => listener());
      });
    },
  };
};

const StoreContext = createContext<MedicalStore | null>(null);
const EditingContext = createContext(false);
/** True once Save was attempted on the section, so untouched invalid fields show their error. */
const ValidationAttemptedContext = createContext(false);

function useMedicalStore(): MedicalStore {
  const store = useContext(StoreContext);
  if (!store)
    throw new Error("useMedicalStore must be used within Medical StoreContext");
  return store;
}

function useFieldValue(id: string): string {
  const store = useMedicalStore();
  return useSyncExternalStore(
    useCallback((onStoreChange) => store.subscribe(id, onStoreChange), [store, id]),
    useCallback(() => store.get(id), [store, id]),
  );
}

const PROGRAMMATIC_SCROLL_LOCK_MS = 1200;

const parseMedicalDate = (value: string): Dayjs | null => {
  if (!value) return null;
  const parsed = dayjs(value, MEDICAL_DATE_FORMAT, true);
  if (parsed.isValid()) return parsed;
  const fallback = dayjs(value);
  return fallback.isValid() ? fallback : null;
};

const getAvatarText = (label: string) => {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("proposer")) return "P";
  if (normalized.includes("life")) return "LA";
  return label.slice(0, 2).toUpperCase() || "LA";
};

/* ------------------------------------------------------------------ */
/* Static styles                                                      */
/* ------------------------------------------------------------------ */

const READ_ONLY_DISPLAY_SX = {
  width: "100%",
  minHeight: 33,
  boxSizing: "border-box",
  p: "6px 8px",
  border: "1px solid #E4E7EC",
  borderRadius: "8px",
  bgcolor: "#EFF1F3",
  color: "#344054",
  fontSize: 13,
  display: "flex",
  alignItems: "center",
  overflowWrap: "anywhere",
  cursor: "default",
  userSelect: "text",
} as const;

const EDITABLE_CONTROL_SX = {
  width: "100%",
  minWidth: 0,
  "& .MuiOutlinedInput-root, & .MuiPickersInputBase-root": {
    minHeight: 33,
    height: 33,
    borderRadius: "8px",
    fontSize: 13,
    backgroundColor: "#fff",
  },
  "& .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-notchedOutline": {
    borderColor: "#CBD0D7",
    borderWidth: 1,
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-root:hover .MuiPickersOutlinedInput-notchedOutline": {
    borderColor: colors.primary,
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline": {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  "& input.MuiInputBase-input": {
    py: "6px",
    px: "8px",
    fontSize: 13,
    color: "#344054",
    WebkitTextFillColor: "#344054",
    cursor: "text",
  },
  "& .MuiSelect-select": {
    fontSize: 13,
    color: "#344054",
    WebkitTextFillColor: "#344054",
  },
} as const;

const FIELD_CELL_SX = { minWidth: 0 } as const;
const FIELD_LABEL_SX = {
  mb: "3px",
  display: "flex",
  gap: "2px",
  color: "#475467",
  fontSize: 12,
} as const;
const REQUIRED_MARK_SX = { color: "#B42318", fontWeight: 700 } as const;

const gridBodySx = (columns: number) =>
  ({
    p: "8px 10px",
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: "8px",
    "@media (max-width: 800px)": { gridTemplateColumns: "1fr 1fr" },
    "@media (max-width: 520px)": { gridTemplateColumns: "1fr" },
  }) as const;

const CARD_SX = {
  borderRadius: "8px",
  border: "1px solid #E4E7EC",
  bgcolor: "#fff",
  boxShadow: "0px 1px 2px rgba(16, 24, 40, 0.05)",
  overflow: "hidden",
  scrollMarginTop: "80px",
} as const;

const CARD_HEAD_SX = {
  p: "8px 12px",
  bgcolor: "#F8FAFC",
  borderBottom: "1px solid #E4E7EC",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 1,
  flexWrap: "wrap",
} as const;

const CARD_TITLE_SX = {
  fontSize: 13,
  fontWeight: 700,
  color: "#1D2939",
  display: "flex",
  alignItems: "center",
  gap: "6px",
} as const;

const CARD_HEAD_ACTIONS_SX = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
} as const;

const HEAD_BUTTON_SX = {
  minWidth: 64,
  height: 26,
  px: "10px",
  fontSize: 11.5,
  fontWeight: 600,
  textTransform: "none",
} as const;

const NAV_SX = {
  width: "280px",
  minWidth: "280px",
  position: "sticky",
  top: "20px",
  maxHeight: "calc(100vh - 84px)  ",
  overflowY: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  pr: "2px",
  flexShrink: 0,
  "& .MuiAccordion-root": {
    flexShrink: 0,
  },
  "&::-webkit-scrollbar": {
    width: "5px",
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: "transparent",
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: "#CBD5E1",
    borderRadius: "4px",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    backgroundColor: "#94A3B8",
  },
} as const;

const NAV_ITEM_SX = {
  width: "100%",
  flexShrink: 0,
  minHeight: "36px",
  p: "9px 12px",
  border: "none",
  borderBottom: "1px solid #EAECEF",
  borderLeft: "3px solid transparent",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  color: "#667085",
  bgcolor: "transparent",
  fontSize: 12,
  fontWeight: 500,
  textAlign: "left",
  cursor: "pointer",
  transition: "all 0.15s ease",
  "&:hover": {
    bgcolor: "#F2F4F7",
    color: "#1D2939",
  },
} as const;

const NAV_ITEM_ACTIVE_SX = {
  ...NAV_ITEM_SX,
  borderLeft: "3px solid #E45F14",
  color: "#E45F14",
  bgcolor: "#FFFFFF",
  fontWeight: 700,
  "&:hover": {
    bgcolor: "#FFF8F8",
    color: "#E45F14",
  },
} as const;

const DOCUMENT_SELECT_WRAP_SX = {
  width: 280,
  minWidth: 280,
  "@media (max-width: 800px)": { width: "100%", minWidth: "100%" },
} as const;

/* ------------------------------------------------------------------ */
/* Subcomponents                                                      */
/* ------------------------------------------------------------------ */

const RequiredMark = memo(function RequiredMark() {
  return (
    <Box component="span" sx={REQUIRED_MARK_SX} aria-hidden="true">
      *
    </Box>
  );
});

/** Asterisk beside a questionnaire Remarks field, shown while the selected Response requires it. */
const RemarksRequiredMark = memo(function RemarksRequiredMark({
  responseId,
  isRequired,
}: Readonly<{ responseId: string; isRequired: (responseKey?: string) => boolean }>) {
  const responseValue = useFieldValue(responseId);
  return isRequired(responseValue) ? <RequiredMark /> : null;
});

function RequiredHeader({
  label,
  required,
}: Readonly<{ label: string; required: boolean }>) {
  return (
    <Typography sx={{ fontSize: "12px", fontWeight: 600, color: "#000" }}>
      {label}
      {required && <RequiredMark />}
    </Typography>
  );
}

/** Builds a table `headerRender` at module level so no component is defined inside a parent. */
const requiredHeaderRender = (label: string, required: boolean) => () => (
  <RequiredHeader label={label} required={required} />
);

interface MedicalControlProps {
  id: string;
  ariaLabel: string;
  kind: MedicalControlKind;
  readOnly: boolean;
  type?: "text" | "number";
  placeholder?: string;
  selectPlaceholder?: string;
  /** Overrides the dropdown options derived from `kind`. */
  options?: readonly MedicalOption[];
  /** Schema-backed field validator; when set, errors are shown on the control. */
  validator?: MedicalFieldValidator;
  /** Store id of the field the validator's rules depend on. */
  dependencyId?: string;
  /** Multi-select over `options`; the stored value is the selected keys joined by ",". */
  multiple?: boolean;
}

/** Indian currency display for a stored plain number; a value that is not a number is shown as stored. */
const formatIndianCurrencyOrRaw = (value: string): string => {
  const formatted = formatIndianCurrency(value);
  return formatted === "-" ? value : formatted;
};


/** Option key that is mutually exclusive with the other options of a multi-select question. */
const MULTI_SELECT_NONE_KEY = "NO";

const MedicalControl = memo(function MedicalControl({
  id,
  ariaLabel,
  kind,
  readOnly,
  type = "text",
  placeholder = "",
  selectPlaceholder = "Select",
  options: optionsOverride,
  validator,
  dependencyId,
  multiple = false,
}: Readonly<MedicalControlProps>) {
  const store = useMedicalStore();
  const value = useFieldValue(id);
  const dependencyValue = useFieldValue(dependencyId ?? "");
  const attempted = useContext(ValidationAttemptedContext);
  const [touched, setTouched] = useState(false);
  const onChange = useCallback(
    (next: string) => {
      store.set(id, next);
      setTouched(true);
    },
    [store, id],
  );

  useEffect(() => {
    if (readOnly) setTouched(false);
  }, [readOnly]);

  const errorMessage =
    !readOnly && (touched || attempted)
      ? validator?.validate(value, dependencyValue)
      : undefined;
  const isMissingRequired =
    !readOnly &&
    validator?.isRequired(dependencyValue) === true &&
    value.trim() === "";

  if (readOnly) {
    const selectedKeys = multiple ? splitMultiSelect(value) : [value];
    const readOnlyText = selectedKeys
      .map((key) => optionsOverride?.find((option) => option.value === key)?.label)
      .filter((label): label is string => label !== undefined)
      .join(", ");
    return (
      <Box
        role="textbox"
        aria-readonly="true"
        aria-label={ariaLabel}
        data-field={id}
        sx={READ_ONLY_DISPLAY_SX}
      >
        {multiple
          ? readOnlyText || placeholder
          : kind === "currency" && value !== ""
            ? formatIndianCurrencyOrRaw(value)
            : (optionsOverride ?? getMedicalOptions(kind)).find((option) => option.value === value)?.label ??
              (value || placeholder)}
        {value}
      </Box>
    );
  }

  const options = optionsOverride ?? getMedicalOptions(kind);
  if (multiple && options.length > 0) {
    const selectedKeys = splitMultiSelect(value);
    const toggle = (key: string) => {
      const isSelected = selectedKeys.includes(key);
      // "NO" is exclusive: picking it clears every other option, and picking any other option clears "NO".
      const next = isSelected
        ? selectedKeys.filter((item) => item !== key)
        : key === MULTI_SELECT_NONE_KEY
          ? [key]
          : [...selectedKeys.filter((item) => item !== MULTI_SELECT_NONE_KEY), key];
      onChange(
        options
          .map((option) => option.value)
          .filter((item) => next.includes(item))
          .join(MULTI_SELECT_SEPARATOR),
      );
    };
    return (
      <Box sx={EDITABLE_CONTROL_SX} data-field={id} aria-label={ariaLabel}>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            columnGap: 2,
            rowGap: 0.5,
            "& .MuiTypography-root": { fontSize: "12px" },
          }}
        >
          {options.map((option) => (
            <CustomCheckbox
              key={option.value}
              label={option.label}
              checked={selectedKeys.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
          ))}
        </Box>
        {errorMessage && (
          <Typography sx={{ color: "#B42318", fontSize: 12 }}>{errorMessage}</Typography>
        )}
      </Box>
    );
  }
  if (options.length > 0) {
    return (
      <Box sx={EDITABLE_CONTROL_SX} data-field={id}>
        <CustomSelect
          options={[...options]}
          value={value}
          placeholder={selectPlaceholder}
          onChange={onChange}
          error={Boolean(errorMessage)}
          helperText={errorMessage}
        />
      </Box>
    );
  }

  if (kind === "date") {
    return (
      <Box sx={EDITABLE_CONTROL_SX} data-field={id}>
        <Calendar
          value={parseMedicalDate(value)}
          format={MEDICAL_DATE_FORMAT}
          maxDate={dayjs()}
          disableTodayAndFuture={false}
          error={Boolean(errorMessage)}
          helperText={errorMessage}
          onChange={(next) =>
            onChange(next ? next.format(MEDICAL_DATE_FORMAT) : "")
          }
        />
      </Box>
    );
  }

  if (kind === "time") {
    return (
      <Box sx={EDITABLE_CONTROL_SX} data-field={id}>
        <CustomTextField
          fullWidth
          value={value}
          placeholder="hh:mm AM/PM"
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          onBlur={() => setTouched(true)}
          error={Boolean(errorMessage) || isMissingRequired}
          helperText={errorMessage}
          htmlInputProps={{ "aria-label": ariaLabel }}
        />
      </Box>
    );
  }

  return (
    <Box sx={EDITABLE_CONTROL_SX} data-field={id}>
      <CustomTextField
        fullWidth
        type={kind === "number" || kind === "currency" ? "number" : type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setTouched(true)}
        error={Boolean(errorMessage) || isMissingRequired}
        helperText={errorMessage}
        htmlInputProps={{ "aria-label": ariaLabel }}
      />
    </Box>
  );
});

interface FieldBlockProps {
  section: MedicalSection;
  index: number;
  displayLabel?: string;
  forceReadOnly?: boolean;
}

const FieldBlock = memo(function FieldBlock({
  section,
  index,
  displayLabel,
  forceReadOnly = false,
}: Readonly<FieldBlockProps>) {
  const editing = useContext(EditingContext);
  const [label, , configRequired] = section.fields[index];
  const validator = useMemo(
    () => getMedicalFieldValidator(section.key, label),
    [section.key, label],
  );
  const dependencyId = dependencyFieldId(section, validator);
  const dependencyValue = useFieldValue(dependencyId ?? "");
  // The schema decides whether a field is mandatory; the config flag is the fallback.
  const required = validator?.isRequired(dependencyValue) ?? configRequired;
  const kind = resolveMedicalControlKind(section.key, label);
  const locked =
    forceReadOnly ||
    MEDICAL_LOCKED_FIELDS.has(label) ||
    MEDICAL_LOCKED_FIELDS.has(`${section.key}:${label}`);
  const readOnly = !editing || locked;

  return (
    <Box sx={FIELD_CELL_SX}>
      {displayLabel !== undefined && (
        <Box component="label" sx={FIELD_LABEL_SX}>
          {displayLabel}
          {required && <RequiredMark />}
        </Box>
      )}
      <MedicalControl
        id={fieldId(section.key, index)}
        ariaLabel={`${section.title}: ${displayLabel ?? label}`}
        kind={kind}
        readOnly={readOnly}
        selectPlaceholder={section.selectPlaceholder}
        options={validator?.options}
        validator={validator}
        dependencyId={dependencyId}
      />
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Family history: relation picker + table of added family members     */
/*                                                                     */
/* Rows live in the same store as every other field, under             */
/* `<sectionKey>-rows` (comma separated row ids) and                   */
/* `<sectionKey>-row-<id>-<column>`, so Edit / Reset / Save and the    */
/* popup restore them like any other section value.                    */
/* ------------------------------------------------------------------ */

interface FamilyRow {
  id: string;
  relation: string;
  age: string;
  alive: string;
  health: string;
  action: string;
}

const FAMILY_ADD_BAR_SX = {
  p: "8px 10px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
} as const;
const FAMILY_ADD_LABEL_SX = { color: "#344054", fontSize: 13, fontWeight: 700 } as const;
const FAMILY_ADD_SELECT_SX = { width: 260, maxWidth: "100%" } as const;
const FAMILY_TABLE_WRAP_SX = { p: "0 10px 10px", minWidth: 0, overflowX: "auto" } as const;
const FAMILY_DELETE_SX = { minWidth: 0, p: "4px", color: "#9A2529" } as const;

const familyRowKey = (sectionKey: string, rowId: string, column: string) =>
  `${sectionKey}-row-${rowId}-${column}`;

const FamilyHistoryBody = memo(function FamilyHistoryBody({
  section,
}: Readonly<{ section: MedicalSection }>) {
  const store = useMedicalStore();
  const editing = useContext(EditingContext);
  const rowsKey = `${section.key}-rows`;
  const rowIds = useFieldValue(rowsKey);
  const [selectedRelation, setSelectedRelation] = useState("");

  const ids = useMemo(() => (rowIds ? rowIds.split(",") : []), [rowIds]);

  const addRow = useCallback(() => {
    if (!selectedRelation) return;
    const nextId = String(ids.reduce((max, id) => Math.max(max, Number(id)), 0) + 1);
    store.set(familyRowKey(section.key, nextId, "relation"), selectedRelation);
    store.set(rowsKey, [...ids, nextId].join(","));
    setSelectedRelation("");
  }, [ids, rowsKey, section.key, selectedRelation, store]);

  const removeRow = useCallback(
    (rowId: string) => {
      store.remove(`${section.key}-row-${rowId}-`);
      store.set(rowsKey, ids.filter((id) => id !== rowId).join(","));
    },
    [ids, rowsKey, section.key, store],
  );

  const rows = useMemo<FamilyRow[]>(
    () => ids.map((id) => ({ id, relation: "", age: "", alive: "", health: "", action: "" })),
    [ids],
  );

  const fixedIds = useMemo(() => familyFixedRowIds(section), [section]);

  const columns = useMemo<Column<FamilyRow>[]>(
    () => [
      {
        key: "relation",
        header: "Relation Type",
        width: "24%",
        headerRender: requiredHeaderRender(
          "Relation Type",
          FAMILY_RELATION_VALIDATOR.isRequired(),
        ),
        render: (_value, row) => (
          <MedicalControl
            id={familyRowKey(section.key, row.id, "relation")}
            ariaLabel={`Relation type, row ${row.id}`}
            kind="familyRelation"
            readOnly={!editing || fixedIds.has(row.id)}
            validator={FAMILY_RELATION_VALIDATOR}
          />
        ),
      },
      {
        key: "age",
        header: "Age",
        width: "12%",
        headerRender: requiredHeaderRender("Age", FAMILY_AGE_VALIDATOR.isRequired()),
        render: (_value, row) => (
          <MedicalControl
            id={familyRowKey(section.key, row.id, "age")}
            ariaLabel={`Age, row ${row.id}`}
            kind="number"
            readOnly={!editing}
            validator={FAMILY_AGE_VALIDATOR}
          />
        ),
      },
      {
        key: "alive",
        header: "Dead or alive",
        width: "22%",
        render: (_value, row) => (
          <MedicalControl
            id={familyRowKey(section.key, row.id, "alive")}
            ariaLabel={`Dead or alive, row ${row.id}`}
            kind="deadOrAlive"
            readOnly={!editing}
          />
        ),
      },
      {
        key: "health",
        header: "Health Status",
        width: "30%",
        render: (_value, row) => (
          <MedicalControl
            id={familyRowKey(section.key, row.id, "health")}
            ariaLabel={`Health status, row ${row.id}`}
            kind="text"
            readOnly={!editing}
            options={section.key === "tele_family_history" ? MEDICAL_TELE_HEALTH_STATUS_OPTIONS : undefined}
          />
        ),
      },
      {
        key: "action",
        header: "Action",
        width: "12%",
        render: (_value, row) => (
          <CustomButton
            variant="text"
            aria-label={`Remove family member, row ${row.id}`}
            disabled={!editing || fixedIds.has(row.id)}
            onClick={() => removeRow(row.id)}
            sx={FAMILY_DELETE_SX}
          >
            <DeleteIcon width={18} height={18} />
          </CustomButton>
        ),
      },
    ],
    [editing, fixedIds, removeRow, section.key],
  );

  return (
    <Box>
      <Box sx={FAMILY_ADD_BAR_SX}>
        <Box component="span" sx={FAMILY_ADD_LABEL_SX}>
          Relation:
        </Box>
        <Box sx={FAMILY_ADD_SELECT_SX}>
          <CustomSelect
            options={MEDICAL_FAMILY_RELATION_OPTIONS}
            value={selectedRelation}
            placeholder="Select a relation"
            disabled={!editing}
            onChange={setSelectedRelation}
          />
        </Box>
        <CustomButton onClick={addRow} disabled={!editing || !selectedRelation}>
          Add
        </CustomButton>
      </Box>
      <Box sx={FAMILY_TABLE_WRAP_SX}>
        <CustomTable<FamilyRow> columns={columns} data={rows} getRowId={(row) => row.id} />
      </Box>
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Habit and Addiction: habit rows x Indicator / Quantity / No. of Year */
/* Field ids reuse the default `<sectionKey>-<index>` scheme, with the  */
/* section's `fields` laid out three per habit.                         */
/* ------------------------------------------------------------------ */

interface HabitRow {
  habit: string;
  indicator: string;
  quantity: string;
  years: string;
}

const HABIT_TABLE_WRAP_SX = { p: "10px", minWidth: 0, overflowX: "auto" } as const;

const HabitAddictionBody = memo(function HabitAddictionBody({
  section,
}: Readonly<{ section: MedicalSection }>) {
  const editing = useContext(EditingContext);
  const validators = useMemo(
    () =>
      section.fields.map(([label]) =>
        getMedicalFieldValidator(section.key, label),
      ),
    [section.fields, section.key],
  );

  const rows = useMemo<HabitRow[]>(() => {
    const habits: HabitRow[] = [];
    for (let i = 0; i + 2 < section.fields.length; i += 3) {
      habits.push({
        habit: section.fields[i][0].replace(/ - Indicator$/, ""),
        indicator: String(i),
        quantity: String(i + 1),
        years: String(i + 2),
      });
    }
    return habits;
  }, [section.fields]);

  const columns = useMemo<Column<HabitRow>[]>(() => {
    const control = (
      fieldIndex: string,
      label: string,
      kind: "yesNo" | "number",
    ) => {
      const validator = validators[Number(fieldIndex)];
      return (
        <MedicalControl
          id={fieldId(section.key, Number(fieldIndex))}
          ariaLabel={label}
          kind={kind}
          readOnly={!editing}
          selectPlaceholder={section.selectPlaceholder}
          validator={validator}
          dependencyId={dependencyFieldId(section, validator)}
        />
      );
    };
    return [
      {
        key: "habit",
        header: "",
        width: "28%",
        render: (_value, row) => (
          <>
            {row.habit}
            {validators[Number(row.indicator)]?.isRequired() && <RequiredMark />}
          </>
        ),
      },
      {
        key: "indicator",
        header: "INDICATOR",
        width: "24%",
        render: (value, row) => control(String(value), `${row.habit}: Indicator`, "yesNo"),
      },
      {
        key: "quantity",
        header: "QUANTITY",
        width: "24%",
        render: (value, row) => control(String(value), `${row.habit}: Quantity`, "number"),
      },
      {
        key: "years",
        header: "NO. OF YEAR",
        width: "24%",
        render: (value, row) => control(String(value), `${row.habit}: No. of Year`, "number"),
      },
    ];
  }, [editing, section.key]);

  return (
    <Box sx={HABIT_TABLE_WRAP_SX}>
      <CustomTable<HabitRow> columns={columns} data={rows} getRowId={(row) => row.habit} />
    </Box>
  );
});

interface SectionBodyProps {
  section: MedicalSection;
}

/* ------------------------------------------------------------------ */
/* CMO decision: read-only table shown above a Special Medical section  */
/* ------------------------------------------------------------------ */

const CMO_WRAP_SX = { p: "10px 10px 0", minWidth: 0 } as const;
const CMO_TITLE_SX = {
  mb: "8px",
  color: "#1D2939",
  fontSize: 13,
  fontWeight: 700,
} as const;
const CMO_TABLE_SX = { minWidth: 0, overflowX: "auto" } as const;

const CMO_COLUMNS: Column<MedicalCmoDecision>[] = [
  { key: "userName", header: "User Name", width: "16%" },
  { key: "poolName", header: "Pool Name", width: "20%" },
  { key: "decision", header: "Decision", width: "20%" },
  { key: "remarks", header: "Comments/Remarks", width: "30%" },
  { key: "updatedOn", header: "Date Updated On", width: "14%" },
];

const CmoDecisionTable = memo(function CmoDecisionTable({
  decisions,
}: Readonly<{ decisions: readonly MedicalCmoDecision[] }>) {
  const data = useMemo(() => [...decisions], [decisions]);
  return (
    <Box sx={CMO_WRAP_SX}>
      <Typography component="h4" sx={CMO_TITLE_SX}>
        CMO decision
      </Typography>
      <Box sx={CMO_TABLE_SX}>
        <CustomTable<MedicalCmoDecision>
          columns={CMO_COLUMNS}
          data={data}
          getRowId={(row) => `${row.userName}-${row.updatedOn}`}
        />
      </Box>
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Lab result table: a one-row table of the section's `tableFieldLabels` */
/* (Value / Lab Range Start / Lab Range End / Unit Value / Findings).    */
/* ------------------------------------------------------------------ */

interface LabResultRow {
  id: string;
  [column: string]: string;
}

const LAB_TABLE_WRAP_SX = { p: "0 10px 10px", minWidth: 0, overflowX: "auto" } as const;

const LAB_PLAIN_TEXT_SX = { color: "#344054", fontSize: 13 } as const;

const PlainTextValue = memo(function PlainTextValue({
  id,
  ariaLabel,
}: Readonly<{ id: string; ariaLabel: string }>) {
  const value = useFieldValue(id);
  return (
    <Box component="span" aria-label={ariaLabel} data-field={id} sx={LAB_PLAIN_TEXT_SX}>
      {value}
    </Box>
  );
});

const LabResultTable = memo(function LabResultTable({
  section,
}: Readonly<{ section: MedicalSection }>) {
  const editing = useContext(EditingContext);
  const labels = section.tableFieldLabels ?? [];

  const columns = useMemo<Column<LabResultRow>[]>(
    () =>
      labels.map((label) => {
        const index = section.fields.findIndex(([fieldLabel]) => fieldLabel === label);
        const locked = MEDICAL_LOCKED_FIELDS.has(`${section.key}:${label}`);
        const validator = getMedicalFieldValidator(section.key, label);
        return {
          key: label,
          header: label,
          headerRender: requiredHeaderRender(label, !!validator?.isRequired()),
          render: () =>
            section.plainTextTableFieldLabels?.includes(label) ? (
              <PlainTextValue
                id={fieldId(section.key, index)}
                ariaLabel={`${section.title}: ${label}`}
              />
            ) : (
              <MedicalControl
                id={fieldId(section.key, index)}
                ariaLabel={`${section.title}: ${label}`}
                kind={resolveMedicalControlKind(section.key, label)}
                readOnly={!editing || locked}
                selectPlaceholder={section.selectPlaceholder}
                options={validator?.options}
                validator={validator}
              />
            ),
        };
      }),
    [editing, labels, section],
  );

  return (
    <Box sx={LAB_TABLE_WRAP_SX}>
      <CustomTable<LabResultRow>
        columns={columns}
        data={[{ id: section.key }]}
        getRowId={(row) => row.id}
      />
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Parameter table: Parameter / Value / Normal Range / Unit / Findings  */
/* Findings is derived: Abnormal when Value is outside the range.       */
/* ------------------------------------------------------------------ */

interface ParameterRow {
  id: string;
  name: string;
  unit: string;
  required: boolean;
  index: number;
  options?: readonly MedicalOption[];
}

const PARAM_WRAP_SX = { p: "0 10px 10px", minWidth: 0 } as const;
const PARAM_TITLE_SX = {
  m: "8px 0",
  color: "#1D2939",
  fontSize: 15,
  fontWeight: 700,
} as const;
const PARAM_TABLE_SX = { minWidth: 0, overflowX: "auto" } as const;
const PARAM_RANGE_SX = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
} as const;
const PARAM_RANGE_SEPARATOR_SX = { color: "#667085", fontSize: 13 } as const;
const PARAM_FINDINGS_SX = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  pr: "12px",
  fontSize: 12,
  fontWeight: 700,
} as const;
const PARAM_DOT_SX = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  flexShrink: 0,
} as const;
const PARAM_NORMAL_COLOR = "#067647";
const PARAM_ABNORMAL_COLOR = "#B42318";

const paramId = (sectionKey: string, index: number, column: string) =>
  `${sectionKey}-param-${index}-${column}`;

/** Store id of the partner parameter's Value that `validator` depends on, if any. */
const parameterDependencyId = (
  section: MedicalSection,
  validator: MedicalFieldValidator | undefined,
): string | undefined => {
  if (!validator?.dependsOn) return undefined;
  const index = (section.parameters ?? []).findIndex(
    ([name]) => name === validator.dependsOn,
  );
  return index === -1 ? undefined : paramId(section.key, index, "value");
};

/** Parameter name with an asterisk when the schema makes its Value mandatory. */
const ParameterName = memo(function ParameterName({
  section,
  row,
}: Readonly<{ section: MedicalSection; row: ParameterRow }>) {
  const validator = useMemo(
    () => getMedicalParameterValidator(section.key, row.name, "value"),
    [section.key, row.name],
  );
  const dependencyId = parameterDependencyId(section, validator);
  const dependencyValue = useFieldValue(dependencyId ?? "");
  const required = validator?.isRequired(dependencyValue) ?? row.required;
  return (
    <>
      {row.name}
      {required && <RequiredMark />}
    </>
  );
});

const ParameterFindings = memo(function ParameterFindings({
  sectionKey,
  index,
}: Readonly<{ sectionKey: string; index: number }>) {
  const value = useFieldValue(paramId(sectionKey, index, "value"));
  const from = useFieldValue(paramId(sectionKey, index, "from"));
  const to = useFieldValue(paramId(sectionKey, index, "to"));
  if (value === "" || from === "" || to === "") return null;
  const current = Number(value);
  // Dropdown values (e.g. "Nil", "Negative") are not numeric and count as Normal.
  const abnormal =
    !Number.isNaN(current) && (current < Number(from) || current > Number(to));
  const color = abnormal ? PARAM_ABNORMAL_COLOR : PARAM_NORMAL_COLOR;
  return (
    <Box sx={{ ...PARAM_FINDINGS_SX, color }}>
      <span>{abnormal ? "Abnormal" : "Normal"}</span>
      <Box component="span" sx={{ ...PARAM_DOT_SX, bgcolor: color }} />
    </Box>
  );
});

const ParameterTable = memo(function ParameterTable({
  section,
}: Readonly<{ section: MedicalSection }>) {
  const editing = useContext(EditingContext);

  const rows = useMemo<ParameterRow[]>(
    () =>
      (section.parameters ?? []).map(([name, unit, required, options], index) => ({
        id: String(index),
        name,
        unit,
        required: Boolean(required),
        index,
        options,
      })),
    [section.parameters],
  );

  const columns = useMemo<Column<ParameterRow>[]>(() => {
    const control = (
      row: ParameterRow,
      column: MedicalParameterColumn | "unit",
      label: string,
      kind: "number" | "text" = "number",
      options?: readonly MedicalOption[],
    ) => {
      const validator =
        column === "unit"
          ? undefined
          : getMedicalParameterValidator(section.key, row.name, column);
      return (
        <MedicalControl
          id={paramId(section.key, row.index, column)}
          ariaLabel={`${row.name}: ${label}`}
          kind={kind}
          readOnly={!editing}
          options={validator?.options ?? options}
          selectPlaceholder={section.selectPlaceholder}
          validator={validator}
          dependencyId={parameterDependencyId(section, validator)}
        />
      );
    };
    return [
      {
        key: "name",
        header: "Parameter",
        width: "22%",
        render: (_value, row) => <ParameterName section={section} row={row} />,
      },
      {
        key: "index",
        header: "Value",
        width: "16%",
        render: (_value, row) =>
          control(row, "value", "Value", "number", row.options),
      },
      {
        key: "id",
        header: "Normal Range",
        width: "28%",
        render: (_value, row) => (
          <Box sx={PARAM_RANGE_SX}>
            {control(row, "from", "Normal Range From")}
            <Box component="span" sx={PARAM_RANGE_SEPARATOR_SX}>
              -
            </Box>
            {control(row, "to", "Normal Range To")}
          </Box>
        ),
      },
      {
        key: "unit",
        header: "Unit",
        width: "14%",
        render: (_value, row) => control(row, "unit", "Unit", "text"),
      },
      {
        key: "required",
        header: "Findings",
        width: "20%",
        render: (_value, row) => (
          <ParameterFindings sectionKey={section.key} index={row.index} />
        ),
      },
    ];
  }, [editing, section]);

  return (
    <Box sx={PARAM_WRAP_SX}>
      {section.parametersTitle && (
        <Typography component="h4" sx={PARAM_TITLE_SX}>
          {section.parametersTitle}
        </Typography>
      )}
      <Box sx={PARAM_TABLE_SX}>
        <CustomTable<ParameterRow>
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Questionnaire: one row per question (ID, Question, Response, Remarks) */
/* Each row is keyed by its position in `fields`, like any other field. */
/* ------------------------------------------------------------------ */

interface QuestionnaireRow {
  id: string;
  label: string;
  /** Option label (or "Yes") of the parent response that asks this sub-question. Empty for top-level. */
  triggeredBy: string;
  index: number;
  response: string;
  remarks: string;
}

const QuestionnaireBody = memo(function QuestionnaireBody({
  section,
}: Readonly<{ section: MedicalSection }>) {
  const editing = useContext(EditingContext);
  const store = useMedicalStore();
  const questions = section.questionnaire ?? [];
  const responsePrefix = `${section.key}-q-`;
  const responseKey = useSyncExternalStore(
    useCallback(
      (onStoreChange) => store.subscribePrefix(responsePrefix, onStoreChange),
      [store, responsePrefix],
    ),
    () =>
      questions
        .map((question) => store.get(`${responsePrefix}${question.id}-response`))
        .join("\u0000"),
  );
  const visibleQuestions = useMemo(
    () =>
      getVisibleMedicalQuestions(questions, (questionId) =>
        store.get(`${responsePrefix}${questionId}-response`),
      ),
    // responseKey changes whenever a questionnaire response changes, so it drives the recompute.
    [questions, store, responsePrefix, responseKey],
  );
  const rows = useMemo<QuestionnaireRow[]>(
    () =>
      visibleQuestions.map((question) => {
        const parent = questions.find((item) => item.id === question.parentId);
        const triggerOption =
          question.parentOption === null
            ? "Yes"
            : parent?.answerType?.find((option) => option.key === question.parentOption)?.label ?? "";
        return {
          id: question.id,
          label: question.questionDesc,
          triggeredBy: question.parentId === null ? "" : triggerOption,
          index: questions.indexOf(question),
          response: question.response ?? "",
          remarks: question.remarks ?? "",
        };
      }),
    [questions, visibleQuestions],
  );
  const columns = useMemo<Column<QuestionnaireRow>[]>(
    () => [
      { key: "id", header: "ID", width: "6%" },
      {
        key: "label",
        header: "Question",
        width: "50%",
        render: (_value, row) => (
          <Box>
            {row.label}
            {row.triggeredBy && (
              <Typography
                component="div"
                sx={{ color: "#7B716C", fontSize: 11, mt: "2px" }}
              >
                Asked for response: {row.triggeredBy}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        key: "response",
        header: "Response",
        width: "20%",
        render: (_value, row) => {
          const question = questions[row.index];
          return (
            <MedicalControl
              id={`${section.key}-q-${row.id}-response`}
              ariaLabel={`Response, question ${row.id}`}
              kind="text"
              readOnly={!editing}
              multiple={question.questionType === "MULTISELECT"}
              placeholder=""
              options={question.answerType?.map((option) => ({
                value: option.key,
                label: option.label,
              }))}
            />
          );
        },
      },
      {
        key: "remarks",
        header: "Remarks",
        width: "20%",
        render: (_value, row) => {
          const question = questions[row.index];
          const responseId = `${section.key}-q-${row.id}-response`;
          const remarksMandatoryFor = (responseKey: string) =>
            question.answerType?.some(
              (option) =>
                option.key === responseKey && option.remarksMandatory === "Y",
            ) ?? false;
          const validator: MedicalFieldValidator = {
            dependsOn: "response",
            isRequired: (responseKey) => remarksMandatoryFor(responseKey ?? ""),
            validate: (value, responseKey) =>
              remarksMandatoryFor(responseKey ?? "") && value.trim() === ""
                ? "Remarks are mandatory for the selected response"
                : undefined,
          };
          return (
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: "2px" }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <MedicalControl
                  id={`${section.key}-q-${row.id}-remarks`}
                  ariaLabel={`Remarks, question ${row.id}`}
                  kind="text"
                  readOnly={!editing}
                  validator={validator}
                  dependencyId={responseId}
                  placeholder=""
                />
              </Box>
              {editing && (
                <RemarksRequiredMark
                  responseId={responseId}
                  isRequired={validator.isRequired}
                />
              )}
            </Box>
          );
        },
      },
    ],
    [editing, questions, section.key],
  );

  return (
    <CustomTable<QuestionnaireRow>
      columns={columns}
      data={rows}
      getRowId={(row) => row.id}
    />
  );
});

const SectionBody = memo(function SectionBody({
  section,
}: Readonly<SectionBodyProps>) {
  if (section.layout === "familyHistory") {
    return <FamilyHistoryBody section={section} />;
  }
  if (section.layout === "habitAddiction") {
    return <HabitAddictionBody section={section} />;
  }
  if (section.layout === "questionnaire") {
    return <QuestionnaireBody section={section} />;
  }
  const tableLabels = section.tableFieldLabels ?? [];
  return (
    <>
      {section.cmoDecisions && section.cmoDecisions.length > 0 && (
        <CmoDecisionTable decisions={section.cmoDecisions} />
      )}
      <Box sx={gridBodySx(section.cols)}>
        {section.fields.map(([label], index) =>
          tableLabels.includes(label) ? null : (
            <FieldBlock
              key={label}
              section={section}
              index={index}
              displayLabel={label}
            />
          ),
        )}
      </Box>
      {tableLabels.length > 0 && <LabResultTable section={section} />}
      {section.parameters && section.parameters.length > 0 && (
        <ParameterTable section={section} />
      )}
    </>
  );
});

/** A group of sections edited together with one Edit / Save / Reset (a single section by default). */
interface MedicalEditUnit {
  /** Key of the first section; it carries the unit's controls and is the editing state key. */
  key: string;
  title: string;
  sectionKeys: readonly string[];
}

interface SectionCardProps {
  section: MedicalSection;
  editing: boolean;
  /**
   * False for sub sections that follow the group's single Edit / Save / Reset / History (MER, Tele MER).
   */
  ownsEditControls: boolean;
  validationAttempted: boolean;
  onEdit: (sectionKey: string) => void;
  onSave: (sectionKey: string) => void;
  onReset: (sectionKey: string) => void;
  onHistory: (sectionKey: string) => void;
  /** Number of past records available for this card's History button (0 when none). */
  historyCount: number;
  registerRef: (sectionKey: string, element: HTMLElement | null) => void;
}

const SectionCard = memo(function SectionCard({
  section,
  editing,
  ownsEditControls,
  validationAttempted,
  onEdit,
  onSave,
  onReset,
  onHistory,
  historyCount,
  registerRef,
}: Readonly<SectionCardProps>) {
  const alwaysEditable = Boolean(section.alwaysEditable);
  const hasActions =
    alwaysEditable || !MEDICAL_NON_EDITABLE_SECTION_KEYS.includes(section.key);
  return (
    <Box
      component="article"
      id={section.key}
      ref={(element: HTMLElement | null) => registerRef(section.key, element)}
      sx={CARD_SX}
    >
      <Box sx={CARD_HEAD_SX}>
        <Typography component="h3" sx={CARD_TITLE_SX}>
          {section.title}
        </Typography>

        {hasActions && (
          <Box sx={CARD_HEAD_ACTIONS_SX}>
            {!ownsEditControls && !alwaysEditable ? null : editing || alwaysEditable ? (
              <>
                {!alwaysEditable && (
                  <CustomButton
                    variant="outlined"
                    onClick={() => onReset(section.key)}
                    sx={HEAD_BUTTON_SX}
                  >
                    Reset
                  </CustomButton>
                )}
                <CustomButton
                  variant="contained"
                  onClick={() => onSave(section.key)}
                  sx={HEAD_BUTTON_SX}
                >
                  Save
                </CustomButton>
              </>
            ) : (
              <CustomButton
                variant="outlined"
                onClick={() => onEdit(section.key)}
                sx={HEAD_BUTTON_SX}
              >
                Edit
              </CustomButton>
            )}
            {ownsEditControls && (
              <CustomButton
                variant="outlined"
                onClick={() => onHistory(section.key)}
                sx={HEAD_BUTTON_SX}
              >
                History ({historyCount})
              </CustomButton>
            )}
          </Box>
        )}
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <EditingContext.Provider value={editing || alwaysEditable}>
          <ValidationAttemptedContext.Provider value={validationAttempted}>
            <SectionBody section={section} />
          </ValidationAttemptedContext.Provider>
        </EditingContext.Provider>
      </Box>
    </Box>
  );
});

interface NavItemProps {
  sectionKey: string;
  title: string;
  active: boolean;
  onSelect: (sectionKey: string) => void;
  registerNavRef?: (sectionKey: string, element: HTMLElement | null) => void;
}

const NavItem = memo(function NavItem({
  sectionKey,
  title,
  active,
  onSelect,
  registerNavRef,
}: Readonly<NavItemProps>) {
  return (
    <Box
      component="button"
      type="button"
      ref={(element: HTMLElement | null) => registerNavRef?.(sectionKey, element)}
      onClick={() => onSelect(sectionKey)}
      sx={active ? NAV_ITEM_ACTIVE_SX : NAV_ITEM_SX}
      aria-current={active ? "true" : undefined}
    >
      <Typography component="span" sx={{ fontSize: "inherit", fontWeight: "inherit" }}>
        {title}
      </Typography>
      <Typography
        component="span"
        sx={{ fontSize: 13, color: "inherit", opacity: 0.6 }}
      >
        ›
      </Typography>
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* History popup: the same section form, read-only, with past values    */
/* ------------------------------------------------------------------ */

const HISTORY_NOTICE_SX = {
  p: "16px",
  color: "#667085",
  fontSize: 13,
  textAlign: "center",
} as const;

/** One section's read-only form, filled with the selected past record. */
const MedicalHistorySectionPanel = memo(function MedicalHistorySectionPanel({
  section,
  entry,
  showTitle,
}: Readonly<{
  section: MedicalSection;
  entry: MedicalHistoryEntry;
  showTitle: boolean;
}>) {
  // A separate store, so the live form is never touched by past data.
  const historyStore = useMemo(
    () =>
      createMedicalStore({
        ...createInitialValues([section]),
        ...entry.values,
      }),
    [section, entry],
  );

  return (
    <Box sx={{ minWidth: 0 }}>
      {showTitle && (
        <Typography component="h3" sx={{ ...CARD_TITLE_SX, mb: "8px" }}>
          {section.title}
        </Typography>
      )}
      <StoreContext.Provider value={historyStore}>
        <EditingContext.Provider value={false}>
          <ValidationAttemptedContext.Provider value={false}>
            <SectionBody section={section} />
          </ValidationAttemptedContext.Provider>
        </EditingContext.Provider>
      </StoreContext.Provider>
    </Box>
  );
});

/**
 * Consolidated History popup for one edit unit: a single section, or every sub section of MER /
 * Tele MER stacked together. One record picker (shared id across the sub sections) switches all
 * of them at once. Sections without past records are left out.
 */
const MedicalHistoryDialog = memo(function MedicalHistoryDialog({
  title,
  sections,
  history,
  onClose,
}: Readonly<{
  title: string;
  sections: readonly MedicalSection[];
  history: Readonly<Record<string, readonly MedicalHistoryEntry[]>> | undefined;
  onClose: () => void;
}>) {
  const sectionsWithHistory = useMemo(
    () => sections.filter((section) => (history?.[section.key]?.length ?? 0) > 0),
    [sections, history],
  );
  // Records of the unit, in first-seen order, one per id.
  const recordOptions = useMemo(() => {
    const seen = new Map<string, string>();
    sectionsWithHistory.forEach((section) =>
      history?.[section.key]?.forEach(({ id, label }) => {
        if (!seen.has(id)) seen.set(id, label);
      }),
    );
    return Array.from(seen, ([value, label]) => ({ label, value }));
  }, [sectionsWithHistory, history]);
  const [selectedId, setSelectedId] = useState(recordOptions[0]?.value ?? "");
  const activeId = recordOptions.some((option) => option.value === selectedId)
    ? selectedId
    : (recordOptions[0]?.value ?? "");

  return (
    <CustomDialog
      open
      onClose={onClose}
      maxWidth="lg"
      title={
        <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
          {title} - History
        </Typography>
      }
    >
      {sectionsWithHistory.length > 0 ? (
        <>
          {recordOptions.length > 1 && (
            <Box sx={{ mb: "12px", maxWidth: 280 }}>
              <CustomSelect
                options={recordOptions}
                value={activeId}
                placeholder="Select"
                onChange={setSelectedId}
              />
            </Box>
          )}
          <Box
            sx={{
              backgroundColor: "#F6F6F6",
              borderRadius: 2,
              p: 2,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {sectionsWithHistory.map((section) => {
              const entry = history?.[section.key]?.find((item) => item.id === activeId);
              return entry ? (
                <MedicalHistorySectionPanel
                  key={section.key}
                  section={section}
                  entry={entry}
                  showTitle={sections.length > 1}
                />
              ) : null;
            })}
          </Box>
        </>
      ) : (
        <Typography sx={HISTORY_NOTICE_SX}>
          {MEDICAL_MESSAGES.noHistory}
        </Typography>
      )}
    </CustomDialog>
  );
});

/* ------------------------------------------------------------------ */
/* Main Medical Module Component                                      */
/* ------------------------------------------------------------------ */

export function Medical({
  summary,
  applicationNumber,
  partyId,
  applicants = MEDICAL_DEFAULT_APPLICANTS,
  initialApplicantKey,
  groups: groupsProp = MEDICAL_GROUPS,
  sections: sectionsProp = MEDICAL_SECTIONS,
  catalog,
  onApplicantChange,
  onViewDocuments,
  onSubmit,
  onSaveSection,
  history,
}: Readonly<MedicalProps>) {
  const [activeApplicantKey, setActiveApplicantKey] = useState(
    initialApplicantKey ?? applicants[0]?.key ?? "",
  );
  // The store is built once per `sections` prop, so a save never rebuilds it (other sections keep their edits).
  const store = useMemo(
    () => createMedicalStore(createInitialValues(sectionsProp)),
    [sectionsProp],
  );
  // Sections re-read from a save response (real memberId, habitId, readingId, responseId), by section key. They
  // belong to one `sections` prop: a new prop (a refetch) drops them.
  const [savedSections, setSavedSections] = useState<{
    base: readonly MedicalSection[];
    byKey: Readonly<Record<string, MedicalSection>>;
  }>({ base: sectionsProp, byKey: {} });
  const catalogSections = catalog?.sections ?? MEDICAL_SECTIONS;
  const catalogGroups = catalog?.groups ?? MEDICAL_GROUPS;
  // Sections the user added from the document list although the fetch did not return them. They belong
  // to one `sections` prop: a new prop (a refetch) drops them.
  const [added, setAdded] = useState<{
    base: readonly MedicalSection[];
    keys: readonly string[];
  }>({ base: sectionsProp, keys: [] });
  const addedKeys = useMemo(
    () => (added.base === sectionsProp ? added.keys : []),
    [added, sectionsProp],
  );
  const sections = useMemo(() => {
    const present = new Set(sectionsProp.map((section) => section.key));
    const extra = catalogSections.filter(
      (section) => addedKeys.includes(section.key) && !present.has(section.key),
    );
    const catalogOrder = (key: string) => {
      const index = catalogSections.findIndex((section) => section.key === key);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    const combined =
      extra.length === 0
        ? sectionsProp
        : [...sectionsProp, ...extra].sort(
            (a, b) => catalogOrder(a.key) - catalogOrder(b.key),
          );
    return savedSections.base === sectionsProp
      ? combined.map((section) => savedSections.byKey[section.key] ?? section)
      : combined;
  }, [sectionsProp, savedSections, addedKeys, catalogSections]);
  // Left navigation groups: the fetched groups, plus the added sections in their catalog group.
  const groups = useMemo(() => {
    if (addedKeys.length === 0) return groupsProp;
    const byKey = new Map(sections.map((section) => [section.key, section]));
    const merged = catalogGroups.flatMap((catalogGroup) => {
      const shown = new Set([
        ...(groupsProp.find((group) => group.key === catalogGroup.key)?.sections.map(
          (section) => section.key,
        ) ?? []),
        ...addedKeys,
      ]);
      const list = catalogGroup.sections.flatMap((catalogSection) => {
        const section = byKey.get(catalogSection.key);
        return section && shown.has(catalogSection.key) ? [section] : [];
      });
      return list.length > 0 ? [{ ...catalogGroup, sections: list }] : [];
    });
    const unlisted = groupsProp.filter(
      (group) => !catalogGroups.some((catalogGroup) => catalogGroup.key === group.key),
    );
    return [...merged, ...unlisted];
  }, [groupsProp, catalogGroups, addedKeys, sections]);
  // Measurements: feet, inches and BMI are disabled and auto calculated.
  useEffect(() => {
    const cleanups = MEASUREMENT_SECTION_LABELS.flatMap((labels) => {
      const section = sections.find((s) => s.key === labels.sectionKey);
      if (!section) return [];
      const idOf = (label: string) => {
        const index = section.fields.findIndex(([l]) => l === label);
        return index === -1 ? undefined : fieldId(section.key, index);
      };
      const heightId = idOf(labels.height);
      const weightId = idOf(labels.weight);
      const feetId = idOf(labels.feet);
      const inchesId = idOf(labels.inches);
      const bmiId = idOf(labels.bmi);
      if (!heightId || !weightId || !feetId || !inchesId || !bmiId) return [];

      const recalculate = () => {
        const derived = calculateMedicalMeasurements(
          store.get(heightId),
          store.get(weightId),
        );
        store.set(feetId, derived.heightFts);
        store.set(inchesId, derived.inches);
        store.set(bmiId, derived.bmi);
      };
      if (store.get(heightId) || store.get(weightId)) recalculate();
      return [
        store.subscribe(heightId, recalculate),
        store.subscribe(weightId, recalculate),
      ];
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [sections, store]);

  // Blood pressure: Avg Systolic / Avg Diastolic are disabled and auto populated.
  useEffect(() => {
    const section = sections.find(
      (s) => s.key === "blood_pressure_pulse_details",
    );
    if (!section) return;
    // Every reading shown counts (Systolic 1..N), however many the API returned.
    const idsOf = (prefix: string) =>
      section.fields.flatMap(([label], index) =>
        new RegExp(`^${prefix} \\d+$`).test(label)
          ? [fieldId(section.key, index)]
          : [],
      );
    const idOf = (label: string) => {
      const index = section.fields.findIndex(([l]) => l === label);
      return index === -1 ? undefined : fieldId(section.key, index);
    };
    const groups = [
      { readingIds: idsOf("Systolic"), averageId: idOf("Avg Systolic") },
      { readingIds: idsOf("Diastolic"), averageId: idOf("Avg Diastolic") },
    ];

    const cleanups = groups.flatMap(({ readingIds, averageId }) => {
      if (!averageId) return [];
      const recalculate = () =>
        store.set(
          averageId,
          calculateMedicalAverage(readingIds.map((id) => store.get(id))),
        );
      if (readingIds.some((id) => store.get(id))) recalculate();
      return readingIds.map((id) => store.subscribe(id, recalculate));
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, [sections, store]);

  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [validationAttempted, setValidationAttempted] = useState<
    Record<string, boolean>
  >({});
  const [dialogKey, setDialogKey] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState(
    sections[0]?.key ?? "",
  );
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    groups.forEach((group) => {
      initial[group.key] = true;
    });
    return initial;
  });
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: "success" | "warning" | "error";
  } | null>(null);

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const navItemRefs = useRef<Record<string, HTMLElement | null>>({});
  const navRef = useRef<HTMLElement | null>(null);
  const activeSectionKeyRef = useRef(activeSectionKey);
  activeSectionKeyRef.current = activeSectionKey;
  const originalsRef = useRef<Record<string, Record<string, string>>>({});
  const dialogOriginalRef = useRef<Record<string, Record<string, string>>>({});
  const editingRef = useRef<Record<string, boolean>>({});
  const observerLockUntil = useRef(0);

  const registerRef = useCallback(
    (sectionKey: string, element: HTMLElement | null) => {
      cardRefs.current[sectionKey] = element;
    },
    [],
  );

  const registerNavRef = useCallback(
    (sectionKey: string, element: HTMLElement | null) => {
      navItemRefs.current[sectionKey] = element;
    },
    [],
  );

  const handleGroupToggle = useCallback((groupKey: string, isOpen: boolean) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: isOpen }));
  }, []);

  const scrollToSection = useCallback(
    (sectionKey: string) => {
      observerLockUntil.current = Date.now() + PROGRAMMATIC_SCROLL_LOCK_MS;
      activeSectionKeyRef.current = sectionKey;
      setActiveSectionKey(sectionKey);
      const targetGroup = groups.find((g) =>
        g.sections.some((s) => s.key === sectionKey),
      );
      if (targetGroup) {
        setExpandedGroups((prev) =>
          prev[targetGroup.key] ? prev : { ...prev, [targetGroup.key]: true },
        );
      }
      cardRefs.current[sectionKey]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    },
    [groups],
  );

  // Keep the highlighted left-panel item visible: scroll only the panel (never the page) when
  // the active item is outside its visible area, centring it for context. Scrolling the page
  // from here would cancel the smooth scroll to the section card.
  useEffect(() => {
    const nav = navRef.current;
    const item = navItemRefs.current[activeSectionKey];
    if (!nav || !item) return;
    const navRect = nav.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    if (itemRect.top >= navRect.top && itemRect.bottom <= navRect.bottom) return;
    const top =
      nav.scrollTop +
      (itemRect.top - navRect.top) -
      (nav.clientHeight - item.offsetHeight) / 2;
    nav.scrollTo({ top, behavior: "smooth" });
  }, [activeSectionKey]);

  useEffect(() => {
    let rafId: number | null = null;

    const updateActiveSection = () => {
      if (Date.now() < observerLockUntil.current) return;
      const scrollOffset = 140;
      let closestKey = "";
      let minDistance = Infinity;

      for (const section of sections) {
        const el = cardRefs.current[section.key];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= scrollOffset && rect.bottom > scrollOffset) {
          closestKey = section.key;
          break;
        }
        const dist = Math.abs(rect.top - scrollOffset);
        if (dist < minDistance) {
          minDistance = dist;
          closestKey = section.key;
        }
      }

      if (closestKey && closestKey !== activeSectionKeyRef.current) {
        activeSectionKeyRef.current = closestKey;
        setActiveSectionKey(closestKey);
        const targetGroup = groups.find((g) =>
          g.sections.some((s) => s.key === closestKey),
        );
        if (targetGroup) {
          setExpandedGroups((prev) =>
            prev[targetGroup.key] ? prev : { ...prev, [targetGroup.key]: true },
          );
        }
      }
    };

    const handleScroll = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateActiveSection);
    };

    window.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    updateActiveSection();

    const releaseLock = () => {
      observerLockUntil.current = 0;
    };
    window.addEventListener("scrollend", releaseLock);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("scrollend", releaseLock);
    };
  }, [groups, sections]);

  // Edit units: MER and Tele MER are edited as one unit (one Edit / Save for all their sub
  // sections). Every other section is its own unit.
  const unitBySection = useMemo(() => {
    const map = new Map<string, MedicalEditUnit>();
    groups.forEach((group) => {
      if (!MEDICAL_COMBINED_GROUP_KEYS.includes(group.key) || group.sections.length === 0) {
        return;
      }
      const unit: MedicalEditUnit = {
        key: group.sections[0].key,
        title: group.name,
        sectionKeys: group.sections.map((s) => s.key),
      };
      unit.sectionKeys.forEach((key) => map.set(key, unit));
    });
    return map;
  }, [groups]);

  const getUnit = useCallback(
    (sectionKey: string): MedicalEditUnit =>
      unitBySection.get(sectionKey) ?? {
        key: sectionKey,
        title: sections.find((s) => s.key === sectionKey)?.title ?? "",
        sectionKeys: [sectionKey],
      },
    [sections, unitBySection],
  );

  // A MER / Tele MER unit shows the largest record count among its sub sections.
  const getHistoryCount = useCallback(
    (sectionKey: string): number =>
      Math.max(
        0,
        ...getUnit(sectionKey).sectionKeys.map((key) => history?.[key]?.length ?? 0),
      ),
    [getUnit, history],
  );

  const historyUnit = historyKey ? getUnit(historyKey) : undefined;
  const historySections = useMemo(
    () =>
      (historyUnit?.sectionKeys ?? []).flatMap((key) => {
        const found = sections.find((s) => s.key === key);
        return found ? [found] : [];
      }),
    [historyUnit, sections],
  );

  const dialogUnit = dialogKey ? getUnit(dialogKey) : undefined;
  const dialogSections = useMemo(
    () =>
      (dialogUnit?.sectionKeys ?? []).flatMap((key) => {
        const found = sections.find((s) => s.key === key);
        return found ? [found] : [];
      }),
    [dialogUnit, sections],
  );

  const startEditing = useCallback(
    (sectionKey: string) => {
      const unit = getUnit(sectionKey);
      if (editingRef.current[unit.key]) return;
      unit.sectionKeys.forEach((key) => {
        originalsRef.current[key] = store.pick(`${key}-`);
      });
      editingRef.current = { ...editingRef.current, [unit.key]: true };
      setEditing(editingRef.current);
    },
    [getUnit, store],
  );

  const stopEditing = useCallback(
    (sectionKey: string, restore: boolean) => {
      const unit = getUnit(sectionKey);
      if (!editingRef.current[unit.key]) return;
      if (restore) {
        unit.sectionKeys.forEach((key) => {
          store.restore(`${key}-`, originalsRef.current[key] ?? {});
        });
      }
      editingRef.current = { ...editingRef.current, [unit.key]: false };
      setEditing(editingRef.current);
    },
    [getUnit, store],
  );

  const setAttempted = useCallback((sectionKey: string, value: boolean) => {
    setValidationAttempted((prev) =>
      prev[sectionKey] === value ? prev : { ...prev, [sectionKey]: value },
    );
  }, []);

  /** Runs the section's schema validators; returns true when every field is valid. */
  const validateSection = useCallback(
    (section: MedicalSection) => {
      if (section.layout === "familyHistory") {
        const rowIds = store.get(`${section.key}-rows`);
        return (rowIds ? rowIds.split(",") : []).every(
          (rowId) =>
            FAMILY_RELATION_VALIDATOR.validate(
              store.get(familyRowKey(section.key, rowId, "relation")),
            ) === undefined &&
            FAMILY_AGE_VALIDATOR.validate(
              store.get(familyRowKey(section.key, rowId, "age")),
            ) === undefined,
        );
      }
      const parametersValid = (section.parameters ?? []).every(([name], index) =>
        MEDICAL_PARAMETER_COLUMNS.every((column) => {
          const validator = getMedicalParameterValidator(section.key, name, column);
          if (!validator) return true;
          const dependencyId = parameterDependencyId(section, validator);
          return (
            validator.validate(
              store.get(paramId(section.key, index, column)),
              dependencyId ? store.get(dependencyId) : undefined,
            ) === undefined
          );
        }),
      );
      if (!parametersValid) return false;
      return section.fields.every(([label], index) => {
        if (
          MEDICAL_LOCKED_FIELDS.has(label) ||
          MEDICAL_LOCKED_FIELDS.has(`${section.key}:${label}`)
        ) {
          return true;
        }
        const validator = getMedicalFieldValidator(section.key, label);
        if (!validator) return true;
        const dependencyId = dependencyFieldId(section, validator);
        return (
          validator.validate(
            store.get(fieldId(section.key, index)),
            dependencyId ? store.get(dependencyId) : undefined,
          ) === undefined
        );
      });
    },
    [store],
  );

  const unitSections = useCallback(
    (sectionKey: string) => {
      const unit = getUnit(sectionKey);
      return unit.sectionKeys.flatMap((key) => {
        const found = sections.find((s) => s.key === key);
        return found ? [found] : [];
      });
    },
    [getUnit, sections],
  );

  const handleReset = useCallback(
    (sectionKey: string) => {
      unitSections(sectionKey).forEach((s) => setAttempted(s.key, false));
      stopEditing(sectionKey, true);
    },
    [setAttempted, stopEditing, unitSections],
  );

  /**
   * Validates the edited unit, then sends only that unit's sections to the Save API. The API either
   * rejects it (validation message, edit mode stays on) or accepts it (success message, edit mode ends).
   * Returns true when the unit was saved.
   */
  const saveUnit = useCallback(
    async (sectionKey: string): Promise<boolean> => {
      const unit = getUnit(sectionKey);
      const unitSectionList = unitSections(sectionKey);
      const invalid = unitSectionList.filter((s) => !validateSection(s));
      if (invalid.length > 0) {
        unitSectionList.forEach((s) =>
          setAttempted(s.key, invalid.some((i) => i.key === s.key)),
        );
        setSnackbar({
          message: MEDICAL_MESSAGES.validationFailed,
          severity: "warning",
        });
        return false;
      }
      unitSectionList.forEach((s) => setAttempted(s.key, false));
      if (onSaveSection) {
        // Every applicant profile has a party id; it is the DB correlation key, so a save never goes without it.
        const activePartyId = partyId?.trim() ?? "";
        if (activePartyId.length === 0) {
          setSnackbar({ message: MEDICAL_MESSAGES.partyMissing, severity: "error" });
          return false;
        }
        // `createdBy` is the logged-in user id, the same value the header profile shows.
        const createdBy = getSessionUser()?.username.trim() ?? "";
        if (createdBy.length === 0) {
          setSnackbar({ message: MEDICAL_MESSAGES.sessionMissing, severity: "error" });
          return false;
        }
        const request = buildMedicalSaveRequest({
          applicationNumber: applicationNumber ?? "",
          partyId: activePartyId,
          createdBy,
          sections: unitSectionList,
          values: store.snapshot(),
        });
        try {
          const response = await onSaveSection(request);
          const failed = response.error || response.response_code !== 200;
          // Success shows the API's top-level message; a failure appends the field-level errors to it.
          setSnackbar({
            message: formatMedicalSaveMessage(
              response,
              failed ? MEDICAL_MESSAGES.saveFailed : MEDICAL_MESSAGES.sectionSaved(unit.title),
            ),
            severity: failed ? "error" : "success",
          });
          if (failed) return false;
          // The response echoes the fetch structure: re-read the saved sections from it, so the form holds what
          // the database stored (real memberId, habitId, readingId, responseId) and a second Save updates the
          // same rows instead of inserting them again. Other sections, and their unsaved edits, are untouched.
          const refreshed = readMedicalSaveSections(response, unit.sectionKeys);
          if (refreshed.length > 0) {
            refreshed.forEach((section) => {
              store.restore(`${section.key}-`, createInitialValues([section]));
            });
            setSavedSections((previous) => ({
              base: sectionsProp,
              byKey: {
                ...(previous.base === sectionsProp ? previous.byKey : {}),
                ...Object.fromEntries(refreshed.map((section) => [section.key, section])),
              },
            }));
          }
        } catch (reason: unknown) {
          setSnackbar({
            message: readSaveError(reason) || MEDICAL_MESSAGES.saveFailed,
            severity: "error",
          });
          return false;
        }
      } else {
        setSnackbar({
          message: MEDICAL_MESSAGES.sectionSaved(unit.title),
          severity: "success",
        });
      }
      stopEditing(sectionKey, false);
      return true;
    },
    [
      applicationNumber,
      getUnit,
      onSaveSection,
      partyId,
      sectionsProp,
      setAttempted,
      stopEditing,
      store,
      unitSections,
      validateSection,
    ],
  );

  const handleSave = useCallback(
    (sectionKey: string) => {
      void saveUnit(sectionKey);
    },
    [saveUnit],
  );

  // The edit unit of a catalog section: MER / Tele MER are one unit of all their sub sections.
  const getCatalogUnit = useCallback(
    (sectionKey: string): MedicalEditUnit => {
      const group = catalogGroups.find(
        (item) =>
          MEDICAL_COMBINED_GROUP_KEYS.includes(item.key) &&
          item.sections.some((section) => section.key === sectionKey),
      );
      return group && group.sections.length > 0
        ? {
            key: group.sections[0].key,
            title: group.name,
            sectionKeys: group.sections.map((section) => section.key),
          }
        : {
            key: sectionKey,
            title: catalogSections.find((section) => section.key === sectionKey)?.title ?? "",
            sectionKeys: [sectionKey],
          };
    },
    [catalogGroups, catalogSections],
  );

  const openDialog = useCallback(
    (sectionKey: string) => {
      if (!sectionKey) return;
      const unit = getCatalogUnit(sectionKey);
      // A section the fetch did not return is added to the page empty, then opened for editing.
      const shownKeys = new Set(sections.map((section) => section.key));
      const missing = catalogSections.filter(
        (section) => unit.sectionKeys.includes(section.key) && !shownKeys.has(section.key),
      );
      if (missing.length > 0) {
        missing.forEach((section) => {
          store.restore(`${section.key}-`, createInitialValues([section]));
        });
        setAdded((previous) => ({
          base: sectionsProp,
          keys: Array.from(
            new Set([
              ...(previous.base === sectionsProp ? previous.keys : []),
              ...missing.map((section) => section.key),
            ]),
          ),
        }));
      }
      dialogOriginalRef.current = Object.fromEntries(
        unit.sectionKeys.map((key) => [key, store.pick(`${key}-`)]),
      );
      setDialogKey(unit.key);
      setDialogOpen(true);
    },
    [catalogSections, getCatalogUnit, sections, sectionsProp, store],
  );

  const closeDialog = useCallback(() => {
    if (dialogKey) {
      unitSections(dialogKey).forEach((s) => {
        store.restore(`${s.key}-`, dialogOriginalRef.current[s.key] ?? {});
        setAttempted(s.key, false);
      });
    }
    setDialogOpen(false);
  }, [dialogKey, setAttempted, store, unitSections]);

  const saveDialog = useCallback(() => {
    if (!dialogKey) return;
    void saveUnit(dialogKey).then((saved) => {
      if (saved) setDialogOpen(false);
    });
  }, [dialogKey, saveUnit]);

  const handleApplicantChange = (applicantKey: string) => {
    setActiveApplicantKey(applicantKey);
    onApplicantChange?.(applicantKey);
  };

  const handleSubmit = () => {
    onSubmit?.({
      applicantKey: activeApplicantKey,
      values: store.snapshot(),
      reviews: {},
    });
    setSnackbar({ message: MEDICAL_MESSAGES.submitted, severity: "success" });
  };

  const activeApplicant = applicants.find(
    (applicant) => applicant.key === activeApplicantKey,
  );
  const applicantTabs = useMemo(
    () => applicants.map(({ key, label }) => ({ key, label })),
    [applicants],
  );

  // Every catalog section is offered, whether or not the fetch returned it. Only the first section of
  // a combined group (MER, Tele MER) is listed; its sub sections open together with it.
  const editableOptions = useMemo(
    () =>
      catalogSections
        .filter(
          (section) =>
            !MEDICAL_NON_EDITABLE_SECTION_KEYS.includes(section.key) &&
            getCatalogUnit(section.key).key === section.key,
        )
        .map((section) => ({
          label: getCatalogUnit(section.key).title,
          value: section.key,
        })),
    [catalogSections, getCatalogUnit],
  );

  return (
    <StoreContext.Provider value={store}>
      <Box
        component="section"
        aria-label="View Medical"
        sx={{
          width: "100%",
          minWidth: 0,
          p: "16px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          alignItems: "start",
          rowGap: "12px",
        }}
      >
        {summary}

        {/* Top bar: back button, search/add document, applicant switcher, documents link */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Box sx={DOCUMENT_SELECT_WRAP_SX}>
            <CustomSearchSelect
              placeholder="Search and add new document"
              options={editableOptions}
              value=""
              onChange={openDialog}
              noOptionsText={MEDICAL_MESSAGES.sectionNotFound}
            />
          </Box>

          <Box
            sx={{
              m: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "7px",
              "@media (max-width: 800px)": { order: 3, width: "100%" },
            }}
          >
            <Box
              aria-label={`${activeApplicant?.label ?? "Applicant"} avatar`}
              sx={{
                width: 42,
                height: 42,
                display: "grid",
                placeItems: "center",
                border: "1px solid",
                borderColor: "primary.main",
                borderRadius: "50%",
                color: colors.primary,
                bgcolor: "#fff",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {getAvatarText(activeApplicant?.label ?? "")}
            </Box>
            <CustomTabs
              tabs={applicantTabs}
              value={activeApplicantKey}
              onChange={handleApplicantChange}
            />
          </Box>

          <CustomButton
            variant="text"
            onClick={() =>
              onViewDocuments
                ? onViewDocuments()
                : setSnackbar({
                    message: MEDICAL_MESSAGES.documents,
                    severity: "success",
                  })
            }
          >
            View Medical Documents
          </CustomButton>
        </Box>

        {/* Left navigation accordions + right section cards */}
        <Box
          sx={{
            mt: "8px",
            display: "grid",
            gridTemplateColumns: "280px minmax(0, 1fr)",
            alignItems: "start",
            gap: "12px",
            width: "100%",
            minWidth: 0,
            "@media (max-width: 800px)": {
              gridTemplateColumns: "minmax(0, 1fr)",
            },
          }}
        >
          {/* Left panel with CustomAccordion per group */}
          <Box
            component="nav"
            ref={navRef}
            aria-label="Medical groups and sections"
            sx={NAV_SX}
          >
            {groups.map((group) => (
              <CustomAccordion
                key={group.key}
                title={group.name}
                defaultExpanded={group.key === "mer"}
                expanded={expandedGroups[group.key]}
                onChange={(isOpen) => handleGroupToggle(group.key, isOpen)}
                titleFontSize={12}
                detailPadding="0px"
              >
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {group.sections.length > 0 ? (
                    group.sections.map((section) => (
                      <NavItem
                        key={section.key}
                        sectionKey={section.key}
                        title={section.title}
                        active={section.key === activeSectionKey}
                        onSelect={scrollToSection}
                        registerNavRef={registerNavRef}
                      />
                    ))
                  ) : (
                    <Typography
                      sx={{
                        p: "8px 12px",
                        fontSize: 11.5,
                        color: "#98A2B3",
                        fontStyle: "italic",
                      }}
                    >
                      No sections available
                    </Typography>
                  )}
                </Box>
              </CustomAccordion>
            ))}
          </Box>

          {/* Right panel with section cards */}
          <Box
            sx={{
              minWidth: 0,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {sections.map((section) => (
              <SectionCard
                key={section.key}
                section={section}
                editing={Boolean(editing[getUnit(section.key).key])}
                ownsEditControls={getUnit(section.key).sectionKeys[0] === section.key}
                validationAttempted={Boolean(validationAttempted[section.key])}
                onEdit={startEditing}
                onSave={handleSave}
                onReset={handleReset}
                onHistory={setHistoryKey}
                historyCount={getHistoryCount(section.key)}
                registerRef={registerRef}
              />
            ))}
          </Box>
        </Box>

        {/* Bottom submit button */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "flex-end",
            borderRadius: "8px",
            bgcolor: "#fff",
          }}
        >
          <CustomButton
            onClick={handleSubmit}
            sx={{
              minWidth: 110,
              minHeight: 28,
              px: "11px",
              py: "4px",
              borderRadius: "50px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Submit
          </CustomButton>
        </Box>

        {/* Dialog for popup editing */}
        <CustomDialog
          open={dialogOpen}
          onClose={closeDialog}
          maxWidth="lg"
          title={
            <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
              {dialogUnit?.title}
            </Typography>
          }
          actionsSx={{ justifyContent: "center" }}
          actions={
            <CustomButton
              onClick={saveDialog}
              sx={{ px: 4, borderRadius: "50px" }}
            >
              Save
            </CustomButton>
          }
        >
          {dialogSections.length > 0 && (
            <Box
              sx={{
                backgroundColor: "#F6F6F6",
                borderRadius: 2,
                p: 2,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <EditingContext.Provider value>
                {dialogSections.map((dialogSection) => (
                  <ValidationAttemptedContext.Provider
                    key={dialogSection.key}
                    value={Boolean(validationAttempted[dialogSection.key])}
                  >
                    {dialogSections.length > 1 && (
                      <Typography component="h3" sx={CARD_TITLE_SX}>
                        {dialogSection.title}
                      </Typography>
                    )}
                    <SectionBody section={dialogSection} />
                  </ValidationAttemptedContext.Provider>
                ))}
              </EditingContext.Provider>
            </Box>
          )}
        </CustomDialog>

        {historyUnit && (
          <MedicalHistoryDialog
            title={historyUnit.title}
            sections={historySections}
            history={history}
            onClose={() => setHistoryKey(null)}
          />
        )}

        <ScrollToTop threshold={200} />

        <CustomSnackbar
          open={Boolean(snackbar)}
          message={snackbar?.message ?? ""}
          severity={snackbar?.severity}
          onClose={() => setSnackbar(null)}
        />
      </Box>
    </StoreContext.Provider>
  );
}

export default Medical;