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
import dayjs, { type Dayjs } from "dayjs";
import {
  Calendar,
  colors,
  CustomButton,
  CustomDialog,
  CustomSearchSelect,
  CustomSelect,
  CustomSnackbar,
  CustomTable,
  CustomTabs,
  CustomTextField,
  ScrollToTop,
  type Column,
} from "@insurance-poc/ui";
import {
  buildFinancialYesNoOptions,
  FINANCIAL_DATE_FORMAT,
  FINANCIAL_DECISION_OPTIONS,
  FINANCIAL_DEFAULT_APPLICANTS,
  FINANCIAL_EDIT_ONLY_SECTION_KEYS,
  FINANCIAL_LOCKED_FIELDS,
  FINANCIAL_MESSAGES,
  FINANCIAL_MONTH_OPTIONS,
  FINANCIAL_MONTHLY_INCOME_LAYOUTS,
  FINANCIAL_NON_REVIEWABLE_SECTION_KEYS,
  FINANCIAL_SECTIONS,
  FINANCIAL_STATEMENT_LAYOUTS,
  FINANCIAL_TABLE_LAYOUTS,
  resolveFinancialControlKind,
  type FinancialApplicantTab,
  type FinancialControlKind,
  type FinancialLabelRef,
  type FinancialMonthlyIncomeLayout,
  type FinancialSection,
  type FinancialStatementLayout,
  type FinancialSubmitPayload,
  type FinancialTableLayout,
} from "./financial.config";
import {
  isFinancialFieldRequired,
  validateFinancialField,
} from "./financial.schema";

export * from "./financial.config";

type ReviewDecision = "agree" | "disagree";

export interface FinancialProps {
  /** Optional content rendered above the top bar (e.g. the DRS detail cards). */
  summary?: ReactNode;
  /** Applicant tabs (defaults to Life Assured1 / Proposer, like the prototype). */
  applicants?: readonly FinancialApplicantTab[];
  /** Applicant tab selected on first render. */
  initialApplicantKey?: string;
  /** Sections to render; defaults to the DVT financial configuration. */
  sections?: readonly FinancialSection[];
  onApplicantChange?: (applicantKey: string) => void;
  onBack?: () => void;
  onViewDocuments?: () => void;
  onSubmit?: (payload: FinancialSubmitPayload) => void;
}

/* ------------------------------------------------------------------ */
/* Value store                                                         */
/*                                                                     */
/* Field values live outside React state. Every field subscribes to    */
/* its own id only, so typing re-renders one field instead of the      */
/* whole ~600 field tree.                                              */
/* ------------------------------------------------------------------ */

type Listener = () => void;

interface FinancialStore {
  get: (id: string) => string;
  set: (id: string, value: string) => void;
  subscribe: (id: string, listener: Listener) => () => void;
  snapshot: () => Record<string, string>;
  /** Values of every field whose id starts with `prefix`. */
  pick: (prefix: string) => Record<string, string>;
  /** Resets every field whose id starts with `prefix` to the saved values. */
  restore: (prefix: string, saved: Readonly<Record<string, string>>) => void;
  /** Validation message for a field (`undefined` when valid). */
  getError: (id: string) => string | undefined;
  setError: (id: string, message: string | undefined) => void;
  /** Clears the validation messages of every field whose id starts with `prefix`. */
  clearErrors: (prefix: string) => void;
  /** Resets/populates entire store with new initial values. */
  resetAll: (newValues: Readonly<Record<string, string>>) => void;
}

const errorKey = (id: string) => `error:${id}`;

const fieldId = (sectionKey: string, index: number) => `${sectionKey}-${index}`;

const createInitialValues = (sections: readonly FinancialSection[]) => {
  const values: Record<string, string> = {};
  sections.forEach((section) => {
    section.fields.forEach((field, index) => {
      values[fieldId(section.key, index)] = field[1];
    });
    if (section.extraValues) {
      Object.assign(values, section.extraValues);
    }
  });
  return values;
};

const createFinancialStore = (
  initial: Record<string, string>,
): FinancialStore => {
  const values: Record<string, string> = { ...initial };
  const errors: Record<string, string> = {};
  const listeners = new Map<string, Set<Listener>>();
  const notify = (id: string) =>
    listeners.get(id)?.forEach((listener) => listener());
  const clearErrors = (prefix: string) =>
    Object.keys(errors)
      .filter((id) => id.startsWith(prefix))
      .forEach((id) => {
        delete errors[id];
        notify(errorKey(id));
      });

  return {
    getError: (id) => errors[id],
    setError: (id, message) => {
      if (errors[id] === message) return;
      if (message === undefined) delete errors[id];
      else errors[id] = message;
      notify(errorKey(id));
    },
    clearErrors,
    get: (id) => values[id] ?? "",
    set: (id, value) => {
      if ((values[id] ?? "") === value) return;
      values[id] = value;
      notify(id);
    },
    subscribe: (id, listener) => {
      const existing = listeners.get(id);
      const set = existing ?? new Set<Listener>();
      if (!existing) listeners.set(id, set);
      set.add(listener);
      return () => {
        set.delete(listener);
      };
    },
    snapshot: () => ({ ...values }),
    pick: (prefix) =>
      Object.fromEntries(
        Object.entries(values).filter(([id]) => id.startsWith(prefix)),
      ),
    restore: (prefix, saved) => {
      clearErrors(prefix);
      Object.keys(values)
        .filter((id) => id.startsWith(prefix))
        .forEach((id) => {
          values[id] = saved[id] ?? "";
          notify(id);
        });
    },
    resetAll: (newValues) => {
      Object.keys(errors).forEach((id) => delete errors[id]);
      const allKeys = new Set([...Object.keys(values), ...Object.keys(newValues)]);
      allKeys.forEach((id) => {
        const nextVal = newValues[id] ?? "";
        if (values[id] !== nextVal) {
          values[id] = nextVal;
          notify(id);
        }
      });
    },
  };
};

const StoreContext = createContext<FinancialStore | null>(null);
/** Whether the section that owns a field is currently editable (after "Disagree"). */
const EditingContext = createContext(false);

function useFinancialStore(): FinancialStore {
  const store = useContext(StoreContext);
  if (!store)
    throw new Error("Financial fields must be rendered inside <Financial />.");
  return store;
}

function useFieldValue(id: string): string {
  const store = useFinancialStore();
  const subscribe = useCallback(
    (listener: Listener) => store.subscribe(id, listener),
    [store, id],
  );
  const getSnapshot = useCallback(() => store.get(id), [store, id]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

function useFieldError(id: string): string | undefined {
  const store = useFinancialStore();
  const subscribe = useCallback(
    (listener: Listener) => store.subscribe(errorKey(id), listener),
    [store, id],
  );
  const getSnapshot = useCallback(() => store.getError(id), [store, id]);
  return useSyncExternalStore(subscribe, getSnapshot);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Observer updates are ignored for this long after a programmatic scroll (or until `scrollend`). */
const PROGRAMMATIC_SCROLL_LOCK_MS = 1200;

const labelIndexCache = new WeakMap<FinancialSection, Map<string, number>>();

/** First index of a field label inside a section (cached; the tables look this up many times). */
const findFieldIndex = (section: FinancialSection, label: string): number => {
  const cached = labelIndexCache.get(section);
  if (cached) return cached.get(label) ?? -1;
  const built = new Map<string, number>();
  section.fields.forEach((field, index) => {
    if (!built.has(field[0])) built.set(field[0], index);
  });
  labelIndexCache.set(section, built);
  return built.get(label) ?? -1;
};

const toLabelRef = (item: FinancialLabelRef) =>
  typeof item === "string"
    ? { label: item, fieldLabel: item }
    : { label: item.label, fieldLabel: item.fieldLabel ?? item.label };

const parseFinancialDate = (value: string): Dayjs | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
  if (ddmmyyyy) {
    const parsed = dayjs(
      new Date(Number(ddmmyyyy[3]), Number(ddmmyyyy[2]) - 1, Number(ddmmyyyy[1])),
    );
    return parsed.isValid() ? parsed : null;
  }
  const yyyymmdd = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(trimmed);
  if (yyyymmdd) {
    const parsed = dayjs(
      new Date(Number(yyyymmdd[1]), Number(yyyymmdd[2]) - 1, Number(yyyymmdd[3])),
    );
    return parsed.isValid() ? parsed : null;
  }
  const parsed = dayjs(trimmed);
  return parsed.isValid() ? parsed : null;
};

const getAvatarText = (label: string) =>
  /^proposer/i.test(label) ? "P" : "LA";

const selectPlaceholder = (kind: FinancialControlKind) => {
  if (kind === "decision") return "Select financial decision";
  if (kind === "month") return "Select month";
  if (kind === "yesNo") return "Select";
  return "";
};

/* ------------------------------------------------------------------ */
/* Static styles (hoisted so they are not rebuilt on every render)     */
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
  "& .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-notchedOutline":
    {
      borderColor: "#CBD0D7",
      borderWidth: 1,
    },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-root:hover .MuiPickersOutlinedInput-notchedOutline":
    {
      borderColor: colors.primary,
    },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline, & .MuiPickersOutlinedInput-root.Mui-focused .MuiPickersOutlinedInput-notchedOutline":
    {
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
  "& .MuiPickersSectionList-root": { fontSize: 13, color: "#344054" },
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
const STATEMENT_LABEL_SX = {
  m: 0,
  color: "#475467",
  fontSize: 12,
  fontWeight: 600,
} as const;

const gridBodySx = (columns: number, flush: boolean) =>
  ({
    p: flush ? "8px 0 0" : "8px 10px",
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: "8px",
    "@media (max-width: 800px)": { gridTemplateColumns: "1fr 1fr" },
    "@media (max-width: 520px)": { gridTemplateColumns: "1fr" },
  }) as const;

/** columns (2 | 3 | 4 ...) x flush -> sx, created once per combination. */
const gridSxCache = new Map<string, ReturnType<typeof gridBodySx>>();
const getGridSx = (columns: number, flush: boolean) => {
  const key = `${columns}:${flush}`;
  const cached = gridSxCache.get(key);
  if (cached) return cached;
  const created = gridBodySx(columns, flush);
  gridSxCache.set(key, created);
  return created;
};

const YEAR_ROW_LABEL_SX = {
  color: "#475467",
  fontSize: 12,
  fontWeight: 500,
  overflowWrap: "anywhere",
} as const;
/** Body rows only (`td`); the Year / Receipt header cells (`th`) keep their size. */
const YEAR_TABLE_ROWS_SX = {
  "& td, & td *": { fontSize: "12px" },
  "& td .MuiOutlinedInput-root, & td input.MuiInputBase-input, & td .MuiSelect-select, & td .MuiPickersSectionList-root":
    { fontSize: "12px" },
} as const;
const TABLE_AREA_SX = {
  p: "8px 10px",
  display: "flex",
  flexDirection: "column",
  gap: "9px",
  minWidth: 0,
} as const;

const INCOME_BLOCK_SX = { p: "8px 10px", display: "grid", gap: "8px" } as const;
const INCOME_DIVIDER_SX = {
  pt: "2px",
  borderTop: "1px solid #E4E7EC",
} as const;
const INCOME_HEADER_SX = { fontSize: 12, fontWeight: 600, color: "#000" } as const;
const statementGridSx = (columns: number) =>
  ({
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gap: "6px 14px",
    p: "7px",
    border: "1px solid #E4E7EC",
    borderRadius: "7px",
    bgcolor: "#fff",
    "@media (max-width: 800px)": { gridTemplateColumns: "1fr 1fr" },
    "@media (max-width: 520px)": { gridTemplateColumns: "1fr" },
  }) as const;
/** With 3 columns the label sits above its month / value inputs so each cell stays narrow. */
const statementRowSx = (columns: number) =>
  ({
    minWidth: 0,
    display: "grid",
    gridTemplateColumns:
      columns > 2 ? "1fr" : "minmax(128px, 1fr) minmax(230px, 1.6fr)",
    alignItems: columns > 2 ? "stretch" : "center",
    gap: columns > 2 ? "4px" : "8px",
    "@media (max-width: 520px)": { gridTemplateColumns: "1fr", gap: "4px" },
  }) as const;
const statementGridCache = new Map<number, ReturnType<typeof statementGridSx>>();
const getStatementGridSx = (columns: number) => {
  const cached = statementGridCache.get(columns);
  if (cached) return cached;
  const created = statementGridSx(columns);
  statementGridCache.set(columns, created);
  return created;
};
const statementRowCache = new Map<number, ReturnType<typeof statementRowSx>>();
const getStatementRowSx = (columns: number) => {
  const cached = statementRowCache.get(columns);
  if (cached) return cached;
  const created = statementRowSx(columns);
  statementRowCache.set(columns, created);
  return created;
};
const STATEMENT_INPUTS_SX = {
  minWidth: 0,
  display: "grid",
  gridTemplateColumns: "minmax(92px, .8fr) minmax(112px, 1fr)",
  gap: "6px",
} as const;

const CARD_SX = {
  minWidth: 0,
  scrollMarginTop: "75px",
  overflow: "hidden",
  border: "1px solid #E4E7EC",
  borderRadius: "6px",
  bgcolor: "#fff",
  boxShadow: "0 1px 2px rgba(16, 24, 40, .08)",
} as const;
const CARD_HEAD_SX = {
  p: "7px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",
  borderBottom: "1px solid #E4E7EC",
  bgcolor: "#F8FAFC",
} as const;
const CARD_TITLE_SX = {
  m: 0,
  color: "#1F2937",
  fontSize: 14,
  fontWeight: 700,
} as const;
const CARD_HEAD_ACTIONS_SX = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexShrink: 0,
} as const;
const HEAD_BUTTON_SX = {
  minWidth: 60,
  px: "12px",
  py: "4px",
  fontSize: 12,
  fontWeight: 600,
} as const;
const REVIEW_BAR_SX = {
  p: "7px 12px",
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  borderTop: "1px solid #E4E7EC",
  bgcolor: "#FCFCFD",
} as const;

const reviewButtonSx = (
  color: string,
  hoverBorder: string,
  selected: boolean,
) =>
  ({
    // minWidth: 90,
    // px: "12px",
    // py: "5px",
    // borderRadius: "4px",
    border: "1px solid",
    borderColor: selected ? color : "currentColor",
    color: selected ? "#fff" : color,
    bgcolor: selected ? color : "transparent",
    fontSize: 13,
    fontWeight: 500,
    "&:hover": {
      color: selected ? "#fff" : color,
      bgcolor: selected ? color : "transparent",
      borderColor: hoverBorder,
    },
  }) as const;

const AGREE_SX = reviewButtonSx("#027A48", "#05603A", false);
const AGREE_SELECTED_SX = reviewButtonSx("#027A48", "#05603A", true);
const DISAGREE_SX = reviewButtonSx("#B42318", "#912018", false);
const DISAGREE_SELECTED_SX = reviewButtonSx("#B42318", "#912018", true);

const NAV_SX = {
  width: "100%",
  minWidth: 0,
  position: "sticky",
  top: "20px",
  maxHeight: "calc(100vh - 84px)",
  overflowY: "auto",
  border: "1px solid #D6D8DC",
  borderRadius: "4px",
  bgcolor: "#F8F9FB",
  "@media (max-width: 800px)": { position: "static", maxHeight: 260 },
} as const;
const NAV_ITEM_SX = {
  width: "100%",
  p: "10px 12px",
  border: 0,
  borderBottom: "1px solid #EAECEF",
  borderLeft: "3px solid",
  borderLeftColor: "transparent",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "8px",
  color: "#667085",
  bgcolor: "transparent",
  fontFamily: "inherit",
  fontSize: 12,
  fontWeight: 500,
  lineHeight: 1.3,
  textAlign: "left",
  cursor: "pointer",
} as const;
const NAV_ITEM_ACTIVE_SX = {
  ...NAV_ITEM_SX,
  borderLeftColor: "#E45F14",
  color: "#E45F14",
  bgcolor: "#fff",
  fontWeight: 600,
} as const;

const DOCUMENT_SELECT_WRAP_SX = {
  // p: "10px 12px",
  // border: "1px solid #E4E7EC",
  // borderRadius: "6px",
  // bgcolor: "#F8FAFC",
  maxWidth: 280,
  width: "100%",
} as const;

/* ------------------------------------------------------------------ */
/* Field primitives                                                    */
/* ------------------------------------------------------------------ */

const RequiredMark = memo(function RequiredMark() {
  return (
    <Box component="span" sx={REQUIRED_MARK_SX}>
      *
    </Box>
  );
});

interface FinancialControlProps {
  id: string;
  ariaLabel: string;
  kind: FinancialControlKind;
  readOnly: boolean;
  type?: "text" | "number";
  placeholder?: string;
  /** Returns an error message for the value, or `undefined` when valid. */
  validate?: (value: string) => string | undefined;
}

/**
 * Read-only fields (the vast majority) render as a lightweight display box.
 * The heavier MUI inputs only mount for a section that is being edited.
 */
const FinancialControl = memo(function FinancialControl({
  id,
  ariaLabel,
  kind,
  readOnly,
  type = "text",
  placeholder,
  validate,
}: Readonly<FinancialControlProps>) {
  const store = useFinancialStore();
  const value = useFieldValue(id);
  const error = useFieldError(id);
  const onChange = useCallback(
    (next: string) => {
      store.set(id, next);
      if (validate) store.setError(id, validate(next));
    },
    [store, id, validate],
  );

  if (readOnly) {
    let displayValue = value;
    if (kind === "date" && value) {
      const parsed = parseFinancialDate(value);
      if (parsed) displayValue = parsed.format(FINANCIAL_DATE_FORMAT);
    }
    return (
      <Box
        role="textbox"
        aria-readonly="true"
        aria-label={ariaLabel}
        data-field={id}
        sx={READ_ONLY_DISPLAY_SX}
      >
        {displayValue || selectPlaceholder(kind)}
      </Box>
    );
  }

  if (kind === "decision" || kind === "yesNo" || kind === "month") {
    let options = buildFinancialYesNoOptions(value);
    if (kind === "decision") options = FINANCIAL_DECISION_OPTIONS;
    if (kind === "month") options = FINANCIAL_MONTH_OPTIONS;
    return (
      <Box sx={EDITABLE_CONTROL_SX} data-field={id}>
        <CustomSelect
          options={options}
          value={value}
          placeholder={selectPlaceholder(kind)}
          onChange={onChange}
          error={Boolean(error)}
          helperText={error}
        />
      </Box>
    );
  }

  if (kind === "date") {
    return (
      <Box sx={EDITABLE_CONTROL_SX} data-field={id}>
        <Calendar
          value={parseFinancialDate(value)}
          format={FINANCIAL_DATE_FORMAT}
          maxDate={dayjs()}
          disableTodayAndFuture={false}
          error={Boolean(error)}
          helperText={error}
          onChange={(next) =>
            onChange(next ? next.format(FINANCIAL_DATE_FORMAT) : "")
          }
        />
      </Box>
    );
  }

  return (
    <Box sx={EDITABLE_CONTROL_SX} data-field={id}>
      <CustomTextField
        fullWidth
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        error={Boolean(error)}
        helperText={error}
        htmlInputProps={{ "aria-label": ariaLabel }}
      />
    </Box>
  );
});

interface FieldBlockProps {
  section: FinancialSection;
  index: number;
  /** Label shown above the control. Omit to render the control alone (table cells). */
  displayLabel?: string;
  /** Forces the control to stay read-only (calculated summary cells). */
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
  // The validation schema is the source of truth for mandatory fields.
  const required =
    isFinancialFieldRequired(section.key, label) ?? configRequired;
  const validate = useCallback(
    (value: string) => validateFinancialField(section.key, label, value),
    [section.key, label],
  );
  const kind = resolveFinancialControlKind(section.key, label);
  const locked =
    forceReadOnly || FINANCIAL_LOCKED_FIELDS.has(`${section.key}:${label}`);
  // The Financial Decision dropdown is the one control that is always editable.
  const readOnly = kind === "decision" ? false : !editing || locked;

  return (
    <Box sx={FIELD_CELL_SX}>
      {displayLabel !== undefined && (
        <Box component="label" sx={FIELD_LABEL_SX}>
          {displayLabel}
          {required && <RequiredMark />}
        </Box>
      )}
      <FinancialControl
        id={fieldId(section.key, index)}
        ariaLabel={`${section.title}: ${displayLabel ?? label}`}
        kind={kind}
        readOnly={readOnly}
        validate={validate}
      />
    </Box>
  );
});

interface FieldGridProps {
  section: FinancialSection;
  labels: readonly FinancialLabelRef[];
  columns?: number;
  /** Removes the card padding when the grid is nested inside another padded block. */
  flush?: boolean;
}

function FieldGrid({
  section,
  labels,
  columns = 3,
  flush = false,
}: Readonly<FieldGridProps>) {
  return (
    <Box sx={getGridSx(columns, flush)}>
      {labels.map((item) => {
        const { label, fieldLabel } = toLabelRef(item);
        const index = findFieldIndex(section, fieldLabel);
        if (index < 0) return null;
        return (
          <FieldBlock
            key={`${fieldLabel}-${index}`}
            section={section}
            index={index}
            displayLabel={label}
          />
        );
      })}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Section bodies                                                      */
/* ------------------------------------------------------------------ */

type YearTableColumnKey = "label" | "month" | "c1" | "c2" | "c3" | "c4" | "c5" | "c6";

const YEAR_TABLE_VALUE_KEYS = ["c1", "c2", "c3", "c4", "c5", "c6"] as const;

/** One table row; the string columns only provide the keys `CustomTable` needs, cells render from the other props. */
interface YearTableRow extends Record<YearTableColumnKey, string> {
  id: string;
  rowLabel: string;
  required: boolean;
  /** Field index per value column (-1 when the section has no such field). */
  indexes: readonly number[];
}

const EMPTY_YEAR_ROW_CELLS: Record<YearTableColumnKey, string> = {
  label: "",
  month: "",
  c1: "",
  c2: "",
  c3: "",
  c4: "",
  c5: "",
  c6: "",
};

function YearTable({
  section,
  layout,
}: Readonly<{ section: FinancialSection; layout: FinancialTableLayout }>) {
  const editing = useContext(EditingContext);
  const isReceipts = layout.kind === "receipts";
  let count: number;
  let firstWidth: number;
  if (isReceipts) {
    count = 6;
    firstWidth = 12;
  } else if (layout.kind === "year4") {
    count = 4;
    firstWidth = 20;
  } else {
    count = 3;
    firstWidth = 28;
  }
  const monthWidth = isReceipts ? 12 : 0;
  const restWidth = `${(100 - firstWidth - monthWidth) / count}%`;

  const rows = useMemo<YearTableRow[]>(
    () =>
      layout.rows.map<YearTableRow>((rowLabel) => {
        const indexes = Array.from({ length: count }, (_, column) => {
          let fieldLabel = `${rowLabel} Year ${column + 1}`;
          if (isReceipts) fieldLabel = `${rowLabel} Receipt${column + 1}`;
          else if (column === 0) fieldLabel = rowLabel;
          return findFieldIndex(section, fieldLabel);
        });
        return {
          ...EMPTY_YEAR_ROW_CELLS,
          id: rowLabel,
          rowLabel,
          required: indexes.some(
            (index) => index >= 0 && section.fields[index][2],
          ),
          indexes,
        };
      }),
    [section, layout, count, isReceipts],
  );

  const columns = useMemo<Column<YearTableRow>[]>(() => {
    const result: Column<YearTableRow>[] = [
      {
        key: "label",
        header: "",
        width: `${firstWidth}%`,
        render: (_value, row) => (
          <Box sx={YEAR_ROW_LABEL_SX}>
            {row.rowLabel}
            {row.required && !isReceipts && <RequiredMark />}
          </Box>
        ),
      },
    ];

    if (isReceipts) {
      result.push({
        key: "month",
        header: "",
        width: `${monthWidth}%`,
        render: (_value, row) => (
          <FinancialControl
            id={`${section.key}-month-${row.rowLabel}`}
            ariaLabel={`Select month for ${row.rowLabel}`}
            kind="month"
            readOnly={!editing}
            validate={(value) =>
              validateFinancialField(section.key, row.rowLabel, value)
            }
          />
        ),
      });
    }

    YEAR_TABLE_VALUE_KEYS.slice(0, count).forEach((key, column) => {
      result.push({
        key,
        header: isReceipts ? `Receipt ${column + 1}` : `Year ${column + 1}`,
        width: restWidth,
        render: (_value, row) => {
          const index = row.indexes[column];
          return index >= 0 ? (
            <FieldBlock section={section} index={index} />
          ) : null;
        },
      });
    });
    return result;
  }, [section, count, firstWidth, monthWidth, restWidth, isReceipts, editing]);

  return (
    <Box sx={YEAR_TABLE_ROWS_SX}>
      <CustomTable<YearTableRow>
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
      />
    </Box>
  );
}

interface MonthlyIncomeRow {
  number: number;
  month: string;
  selected: string;
  income: string;
}

function MonthlyIncomeBody({
  section,
  layout,
}: Readonly<{
  section: FinancialSection;
  layout: FinancialMonthlyIncomeLayout;
}>) {
  const editing = useContext(EditingContext);
  const excluded = new Set([...layout.top, ...layout.average]);
  const remaining = section.fields
    .map((field) => field[0])
    .filter(
      (label) =>
        !excluded.has(label) &&
        !/month|monthly|net salary credited pm|sip per month/i.test(label),
    );

  const rows = useMemo<MonthlyIncomeRow[]>(
    () =>
      Array.from({ length: layout.entries }, (_, i) => ({
        number: i + 1,
        month: `Month ${i + 1}`,
        selected: "",
        income: "",
      })),
    [layout.entries],
  );

  const columns = useMemo<Column<MonthlyIncomeRow>[]>(
    () => [
      {
        key: "month",
        header: "Month",
        render: (value) => <Box sx={YEAR_ROW_LABEL_SX}>{value}</Box>,
      },
      {
        key: "selected",
        headerRender: () => (
          <Box component="span" sx={INCOME_HEADER_SX}>
            Selected Month
            <RequiredMark />
          </Box>
        ),
        render: (_value, row) => (
          <FinancialControl
            id={`${section.key}-entry-month-${row.number}`}
            ariaLabel={`Month ${row.number}`}
            kind="month"
            readOnly={!editing}
            validate={(value) =>
              validateFinancialField(section.key, `Month ${row.number}`, value)
            }
          />
        ),
      },
      {
        key: "income",
        headerRender: () => (
          <Box component="span" sx={INCOME_HEADER_SX}>
            Income
            <RequiredMark />
          </Box>
        ),
        render: (_value, row) => (
          <FinancialControl
            id={`${section.key}-entry-income-${row.number}`}
            ariaLabel={`Income for month ${row.number}`}
            kind="text"
            type="number"
            placeholder="Enter income"
            readOnly={!editing}
            validate={(value) =>
              validateFinancialField(
                section.key,
                `Income for Month ${row.number}`,
                value,
              )
            }
          />
        ),
      },
    ],
    [section.key, editing],
  );

  return (
    <Box sx={INCOME_BLOCK_SX}>
      {layout.top.length > 0 && (
        <FieldGrid section={section} labels={layout.top} flush />
      )}
      <CustomTable<MonthlyIncomeRow>
        columns={columns}
        data={rows}
        getRowId={(row) => row.number}
      />
      {layout.average.length > 0 && (
        <Box sx={INCOME_DIVIDER_SX}>
          <FieldGrid section={section} labels={layout.average} flush />
        </Box>
      )}
      {remaining.length > 0 && (
        <Box sx={INCOME_DIVIDER_SX}>
          <FieldGrid section={section} labels={remaining} flush />
        </Box>
      )}
    </Box>
  );
}

function StatementBody({
  section,
  layout,
}: Readonly<{ section: FinancialSection; layout: FinancialStatementLayout }>) {
  const editing = useContext(EditingContext);
  const columns = layout.columns ?? 2;

  return (
    <Box sx={INCOME_BLOCK_SX}>
      {layout.top && layout.top.length > 0 && (
        <FieldGrid section={section} labels={layout.top} columns={columns} flush />
      )}
      <Box sx={getStatementGridSx(columns)}>
        {layout.monthly.map((item, position) => {
          const { label, fieldLabel } = toLabelRef(item);
          const index = findFieldIndex(section, fieldLabel);
          if (index < 0) return null;
          // The month dropdown beside a monthly value is validated as "Month <position>".
          const monthLabel = `Month ${position + 1}`;
          return (
            <Box key={fieldLabel} sx={getStatementRowSx(columns)}>
              <Box component="label" sx={STATEMENT_LABEL_SX}>
                {label}
                {(isFinancialFieldRequired(section.key, fieldLabel) ??
                  section.fields[index][2]) && <RequiredMark />}
              </Box>
              <Box sx={STATEMENT_INPUTS_SX}>
                <FinancialControl
                  id={`${fieldId(section.key, index)}-month`}
                  ariaLabel={`Select month for ${label}`}
                  kind="month"
                  readOnly={!editing}
                  validate={(value) =>
                    validateFinancialField(section.key, monthLabel, value)
                  }
                />
                <FieldBlock section={section} index={index} />
              </Box>
            </Box>
          );
        })}
      </Box>
      {layout.calculated && layout.calculated.length > 0 && (
        <Box sx={INCOME_DIVIDER_SX}>
          <FieldGrid
            section={section}
            labels={layout.calculated}
            columns={columns}
            flush
          />
        </Box>
      )}
      {layout.trailing && layout.trailing.length > 0 && (
        <Box sx={INCOME_DIVIDER_SX}>
          <FieldGrid
            section={section}
            labels={layout.trailing}
            columns={columns}
            flush
          />
        </Box>
      )}
    </Box>
  );
}

/** Memoised: highlight / review changes on the card do not rebuild the field tree. */
const SectionBody = memo(function SectionBody({
  section,
}: Readonly<{ section: FinancialSection }>) {
  const monthlyLayout = FINANCIAL_MONTHLY_INCOME_LAYOUTS[section.key];
  if (monthlyLayout)
    return <MonthlyIncomeBody section={section} layout={monthlyLayout} />;

  const statementLayout = FINANCIAL_STATEMENT_LAYOUTS[section.key];
  if (statementLayout)
    return <StatementBody section={section} layout={statementLayout} />;

  const layout = FINANCIAL_TABLE_LAYOUTS[section.key];
  if (!layout) {
    return (
      <FieldGrid
        section={section}
        labels={section.fields.map((field) => field[0])}
        columns={section.cols}
      />
    );
  }

  // Receipts (Form J) lay the fields outside the table on the section's own grid, like Fixed Deposit Receipt.
  const topColumns =
    layout.topColumns ?? (layout.kind === "receipts" ? section.cols : 2);
  return (
    <Box sx={TABLE_AREA_SX}>
      {layout.top && layout.top.length > 0 && (
        <FieldGrid section={section} labels={layout.top} columns={topColumns} flush />
      )}
      <YearTable section={section} layout={layout} />
      {layout.bottom && layout.bottom.length > 0 && (
        <FieldGrid section={section} labels={layout.bottom} flush />
      )}
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Section card                                                        */
/* ------------------------------------------------------------------ */

interface SectionCardProps {
  section: FinancialSection;
  editing: boolean;
  review?: ReviewDecision;
  onReview: (sectionKey: string, decision: ReviewDecision) => void;
  onEdit: (sectionKey: string) => void;
  onSave: (sectionKey: string) => void;
  onReset: (sectionKey: string) => void;
  registerRef: (sectionKey: string, element: HTMLElement | null) => void;
}

const SectionCard = memo(function SectionCard({
  section,
  editing,
  review,
  onReview,
  onEdit,
  onSave,
  onReset,
  registerRef,
}: Readonly<SectionCardProps>) {
  const hasReviewActions = !FINANCIAL_NON_REVIEWABLE_SECTION_KEYS.includes(
    section.key,
  );
  const hasEditActions = FINANCIAL_EDIT_ONLY_SECTION_KEYS.includes(section.key);
  const setRef = useCallback(
    (element: HTMLElement | null) => registerRef(section.key, element),
    [registerRef, section.key],
  );

  return (
    <EditingContext.Provider value={editing}>
      <Box
        component="article"
        id={section.key}
        ref={setRef}
        data-testid={`financial-section-${section.key}`}
        sx={CARD_SX}
      >
        <Box component="header" sx={CARD_HEAD_SX}>
          <Box component="h3" sx={CARD_TITLE_SX}>
            {section.title}
          </Box>
          {(hasReviewActions || hasEditActions) && (
            <Box sx={CARD_HEAD_ACTIONS_SX}>
              {editing ? (
                <>
                  <CustomButton
                    variant="outlined"
                    onClick={() => onReset(section.key)}
                    sx={HEAD_BUTTON_SX}
                  >
                    Reset
                  </CustomButton>
                  <CustomButton
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
            </Box>
          )}
        </Box>

        <SectionBody section={section} />

        {hasReviewActions && (
          <Box
            role="group"
            aria-label={`${section.title} review`}
            sx={REVIEW_BAR_SX}
          >
            <CustomButton
              variant="outlined"
              aria-pressed={review === "agree"}
              onClick={() => onReview(section.key, "agree")}
              sx={review === "agree" ? AGREE_SELECTED_SX : AGREE_SX}
            >
              Agree
            </CustomButton>
            <CustomButton
              variant="outlined"
              aria-pressed={review === "disagree"}
              onClick={() => onReview(section.key, "disagree")}
              sx={review === "disagree" ? DISAGREE_SELECTED_SX : DISAGREE_SX}
            >
              Disagree
            </CustomButton>
          </Box>
        )}
      </Box>
    </EditingContext.Provider>
  );
});

/* ------------------------------------------------------------------ */
/* Left navigation                                                     */
/* ------------------------------------------------------------------ */

interface NavItemProps {
  sectionKey: string;
  title: string;
  active: boolean;
  onSelect: (sectionKey: string) => void;
}

const NavItem = memo(function NavItem({
  sectionKey,
  title,
  active,
  onSelect,
}: Readonly<NavItemProps>) {
  const handleClick = useCallback(
    () => onSelect(sectionKey),
    [onSelect, sectionKey],
  );
  return (
    <Box
      component="button"
      type="button"
      data-target={sectionKey}
      aria-current={active ? "true" : undefined}
      onClick={handleClick}
      sx={active ? NAV_ITEM_ACTIVE_SX : NAV_ITEM_SX}
    >
      <span>{title}</span>
      <span>›</span>
    </Box>
  );
});

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function Financial({
  summary,
  applicants = FINANCIAL_DEFAULT_APPLICANTS,
  initialApplicantKey,
  sections = FINANCIAL_SECTIONS,
  onApplicantChange,
  onViewDocuments,
  onSubmit,
}: Readonly<FinancialProps>) {
  const [activeApplicantKey, setActiveApplicantKey] = useState(
    initialApplicantKey ?? applicants[0]?.key ?? "",
  );
  const [store] = useState(() =>
    createFinancialStore(createInitialValues(sections)),
  );
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<Record<string, ReviewDecision>>({});
  const [dialogKey, setDialogKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeSectionKey, setActiveSectionKey] = useState(
    sections[0]?.key ?? "",
  );
  const [snackbar, setSnackbar] = useState<{
    message: string;
    severity: "success" | "warning";
  } | null>(null);

  useEffect(() => {
    store.resetAll(createInitialValues(sections));
    setEditing({});
    setReviews({});
    if (sections.length > 0 && !sections.some((s) => s.key === activeSectionKey)) {
      setActiveSectionKey(sections[0].key);
    }
  }, [sections, store, activeSectionKey]);

  useEffect(() => {
    if (initialApplicantKey && initialApplicantKey !== activeApplicantKey) {
      setActiveApplicantKey(initialApplicantKey);
    }
  }, [initialApplicantKey, activeApplicantKey]);

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const originalsRef = useRef<Record<string, Record<string, string>>>({});
  const dialogOriginalRef = useRef<Record<string, string>>({});
  /** Mirror of `editing` so handlers stay referentially stable. */
  const editingRef = useRef<Record<string, boolean>>({});
  const observerLockUntil = useRef(0);
  const navRef = useRef<HTMLElement | null>(null);

  const registerRef = useCallback(
    (sectionKey: string, element: HTMLElement | null) => {
      cardRefs.current[sectionKey] = element;
    },
    [],
  );

  /** Single entry point for both the left-panel click and the search so they behave identically. */
  const scrollToSection = useCallback((sectionKey: string) => {
    observerLockUntil.current = Date.now() + PROGRAMMATIC_SCROLL_LOCK_MS;
    setActiveSectionKey(sectionKey);
    cardRefs.current[sectionKey]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  // Keep the left panel in sync with the section in view while the user scrolls by hand.
  // Updates are paused while a click/search-driven smooth scroll is running, so the panel
  // does not flicker through every section it passes.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < observerLockUntil.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSectionKey(visible.target.id);
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: 0.05 },
    );
    Object.values(cardRefs.current).forEach((element) => {
      if (element) observer.observe(element);
    });
    const releaseLock = () => {
      observerLockUntil.current = 0;
    };
    window.addEventListener("scrollend", releaseLock);
    return () => {
      observer.disconnect();
      window.removeEventListener("scrollend", releaseLock);
    };
  }, [sections]);

  // Keep the highlighted left-panel item visible: scroll only the panel (never the page) when
  // the active item is outside its visible area, centring it for context.
  useEffect(() => {
    const nav = navRef.current;
    const item = nav?.querySelector<HTMLElement>(
      `[data-target="${activeSectionKey}"]`,
    );
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

  const dialogSection = useMemo(
    () => sections.find((section) => section.key === dialogKey),
    [sections, dialogKey],
  );

  /** Makes a section editable, remembering its current values so Reset can restore them. */
  const startEditing = useCallback(
    (sectionKey: string) => {
      if (editingRef.current[sectionKey]) return;
      originalsRef.current[sectionKey] = store.pick(`${sectionKey}-`);
      editingRef.current = { ...editingRef.current, [sectionKey]: true };
      setEditing(editingRef.current);
    },
    [store],
  );

  /** Locks a section again; `restore` puts back the values captured by `startEditing`. */
  const stopEditing = useCallback(
    (sectionKey: string, restore: boolean) => {
      if (!editingRef.current[sectionKey]) return;
      if (restore)
        store.restore(`${sectionKey}-`, originalsRef.current[sectionKey] ?? {});
      editingRef.current = { ...editingRef.current, [sectionKey]: false };
      setEditing(editingRef.current);
    },
    [store],
  );

  const handleReview = useCallback(
    (sectionKey: string, decision: ReviewDecision) => {
      if (decision === "disagree") startEditing(sectionKey);
      else stopEditing(sectionKey, true);
      setReviews((current) =>
        current[sectionKey] === decision
          ? current
          : { ...current, [sectionKey]: decision },
      );
    },
    [startEditing, stopEditing],
  );

  const handleReset = useCallback(
    (sectionKey: string) => stopEditing(sectionKey, true),
    [stopEditing],
  );

  /** Validates every field of a section against its schema and shows the errors; true when valid. */
  const validateSection = useCallback(
    (sectionKey: string) => {
      const section = sections.find((item) => item.key === sectionKey);
      if (!section) return true;
      let valid = true;
      const check = (id: string, label: string) => {
        const message = validateFinancialField(
          section.key,
          label,
          store.get(id),
        );
        store.setError(id, message);
        if (message) valid = false;
      };
      const monthlyLayout = FINANCIAL_MONTHLY_INCOME_LAYOUTS[section.key];
      section.fields.forEach(([label], index) => {
        // In monthly-income sections "Month N" is rendered as an entry row, not as a field.
        if (monthlyLayout && /^Month \d+$/.test(label)) return;
        check(fieldId(section.key, index), label);
      });
      // Statement sections (e.g. Salary Slips) have a month dropdown beside each monthly value.
      FINANCIAL_STATEMENT_LAYOUTS[section.key]?.monthly.forEach(
        (item, position) => {
          const index = findFieldIndex(section, toLabelRef(item).fieldLabel);
          if (index >= 0)
            check(
              `${fieldId(section.key, index)}-month`,
              `Month ${position + 1}`,
            );
        },
      );
      // Receipts tables (FORM J) have a month dropdown per row that is not a section field.
      const tableLayout = FINANCIAL_TABLE_LAYOUTS[section.key];
      if (tableLayout?.kind === "receipts") {
        tableLayout.rows.forEach((rowLabel) =>
          check(`${section.key}-month-${rowLabel}`, rowLabel),
        );
      }
      if (monthlyLayout) {
        for (let n = 1; n <= monthlyLayout.entries; n += 1) {
          check(`${section.key}-entry-month-${n}`, `Month ${n}`);
          check(`${section.key}-entry-income-${n}`, `Income for Month ${n}`);
        }
      }
      if (!valid)
        setSnackbar({
          message: FINANCIAL_MESSAGES.validationFailed,
          severity: "warning",
        });
      return valid;
    },
    [sections, store],
  );

  const handleSave = useCallback(
    (sectionKey: string) => {
      if (!validateSection(sectionKey)) return;
      stopEditing(sectionKey, false);
      const title =
        sections.find((section) => section.key === sectionKey)?.title ?? "";
      setSnackbar({
        message: FINANCIAL_MESSAGES.sectionSaved(title),
        severity: "success",
      });
    },
    [sections, stopEditing, validateSection],
  );

  /** Opens the chosen document in a popup, remembering its values so closing without saving discards edits. */
  const openDialog = useCallback(
    (sectionKey: string) => {
      if (!sectionKey) return;
      dialogOriginalRef.current = store.pick(`${sectionKey}-`);
      setDialogKey(sectionKey);
      setDialogOpen(true);
    },
    [store],
  );

  const closeDialog = useCallback(() => {
    if (dialogKey) store.restore(`${dialogKey}-`, dialogOriginalRef.current);
    setDialogOpen(false);
  }, [dialogKey, store]);

  const saveDialog = useCallback(() => {
    if (!dialogKey) return;
    if (!validateSection(dialogKey)) return;
    stopEditing(dialogKey, false);
    setSnackbar({
      message: FINANCIAL_MESSAGES.sectionSaved(dialogSection?.title ?? ""),
      severity: "success",
    });
    setDialogOpen(false);
  }, [dialogKey, dialogSection, stopEditing, validateSection]);

  const handleApplicantChange = (applicantKey: string) => {
    setActiveApplicantKey(applicantKey);
    onApplicantChange?.(applicantKey);
  };

  const handleSubmit = () => {
    onSubmit?.({
      applicantKey: activeApplicantKey,
      values: store.snapshot(),
      reviews,
    });
    setSnackbar({ message: FINANCIAL_MESSAGES.submitted, severity: "success" });
  };

  const activeApplicant = applicants.find(
    (applicant) => applicant.key === activeApplicantKey,
  );
  const applicantTabs = useMemo(
    () => applicants.map(({ key, label }) => ({ key, label })),
    [applicants],
  );
  /** Only sections with Edit/Save or Agree/Disagree buttons can be opened from the dropdown. */
  const editableOptions = useMemo(
    () =>
      sections
        .filter(
          (section) =>
            !FINANCIAL_NON_REVIEWABLE_SECTION_KEYS.includes(section.key),
        )
        .map((section) => ({ label: section.title, value: section.key })),
    [sections],
  );
  return (
    <StoreContext.Provider value={store}>
      <Box
        component="section"
        aria-label="View Financial"
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

        {/* Top bar: back, applicant switcher, documents link */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Box sx={DOCUMENT_SELECT_WRAP_SX}>
            <CustomSearchSelect
              // label="Editable documents"
              placeholder="Search and add new document"
              options={editableOptions}
              value=""
              onChange={openDialog}
              noOptionsText={FINANCIAL_MESSAGES.sectionNotFound}
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
                    message: FINANCIAL_MESSAGES.documents,
                    severity: "success",
                  })
            }
          >
            View Financial Documents
          </CustomButton>
        </Box>
        {/* 
        <Box sx={DOCUMENT_SELECT_WRAP_SX}>
          <CustomSearchSelect
            label="Editable documents"
            placeholder="Search and select a document"
            options={editableOptions}
            value=""
            onChange={openDialog}
            noOptionsText={FINANCIAL_MESSAGES.sectionNotFound}
          />
        </Box> */}

        {/* Left navigation + section cards */}
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
          <Box
            component="nav"
            ref={navRef}
            aria-label="Financial sections"
            sx={NAV_SX}
          >
            {sections.map((section) => (
              <NavItem
                key={section.key}
                sectionKey={section.key}
                title={section.title}
                active={section.key === activeSectionKey}
                onSelect={scrollToSection}
              />
            ))}
          </Box>

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
                editing={Boolean(editing[section.key])}
                review={reviews[section.key]}
                onReview={handleReview}
                onEdit={startEditing}
                onSave={handleSave}
                onReset={handleReset}
                registerRef={registerRef}
              />
            ))}
          </Box>
        </Box>

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

        <CustomDialog
          open={dialogOpen}
          onClose={closeDialog}
          maxWidth="lg"
          title={
            <Typography component="span" sx={{ fontSize: 14, fontWeight: 700 }}>
              {dialogSection?.title}
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
          {dialogSection && (
            <Box
              sx={{
                backgroundColor: "#F6F6F6",
                borderRadius: 2,
                p: 2,
                minWidth: 0,
              }}
            >
              <EditingContext.Provider value>
                <SectionBody section={dialogSection} />
              </EditingContext.Provider>
            </Box>
          )}
        </CustomDialog>

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

export default Financial;