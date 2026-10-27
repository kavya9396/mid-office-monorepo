import type { ReactNode } from "react";
import { Box } from "@mui/material";
import {
  colors,
  CustomButton,
  CustomSelect,
  CustomTextField,
  CustomTooltip,
  EyeIcon,
} from "@insurance-poc/ui";
import type {
  RequirementColumnConfig,
  RequirementItem,
  RequirementLabels,
  RequirementStatusOption,
} from "./types";

const CELL_MIN_HEIGHT = 27; // 27 + 2 x 4px cell padding + 1px border = 36px row, as in the prototype

export const cellBox = (node: ReactNode, center = false) => (
  <Box
    sx={{
      minHeight: CELL_MIN_HEIGHT,
      minWidth: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: center ? "center" : "flex-start",
    }}
  >
    {node}
  </Box>
);

const compactSelectSx = {
  minWidth: 0,
  "& .MuiOutlinedInput-root": {
    height: 25,
    borderRadius: "6px",
    fontSize: "10px",
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.borderInput },
  "& .MuiSelect-select": {
    fontSize: "10px",
    px: 0.6,
    textOverflow: "ellipsis",
  },
  "& .MuiSelect-icon": { right: 1, fontSize: 17 },
};

const compactTextFieldSx = {
  minWidth: 0,
  "& .MuiInputBase-root": {
    height: 25,
    borderRadius: "6px",
    fontSize: "10.5px",
  },
  "& .MuiInputBase-input": {
    fontSize: "10.5px",
    minWidth: 0,
    px: 0.7,
    py: 0.35,
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
  },
  "& .MuiOutlinedInput-notchedOutline": { borderColor: colors.borderInput },
};

const dialogButtonSx = {
  p: 0,
  borderRadius: "50%",
  border: "1px solid transparent",
  color: colors.info,
  "&:hover": { borderColor: colors.infoBorder, bgcolor: colors.infoSurface },
  "&.Mui-disabled": { color: colors.iconDisabled },
};

/* ------------------------------------------------------------------ */
/* Cell renderers                                                       */
/* ------------------------------------------------------------------ */

export type CellContext = {
  row: RequirementItem;
  config: RequirementColumnConfig;
  /** False when the table or the column is read-only. */
  editable: boolean;
  statusOptions: RequirementStatusOption[];
  labels: RequirementLabels;
  onValueChange: (row: RequirementItem, key: RequirementColumnConfig["key"], value: string) => void;
  onOpenDialog: (title: string, value: string) => void;
};

function TextCell({ value }: Readonly<{ value: string }>) {
  return cellBox(
    <CustomTooltip title={value} arrow placement="left">
      <Box
        sx={{
          width: "100%",
          minWidth: 0,
          fontSize: 11,
          lineHeight: 1.25,
          color: colors.textBody,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value || "-"}
      </Box>
    </CustomTooltip>,
  );
}

function selectOptions({ config, statusOptions }: CellContext) {
  if (config.options) return config.options;
  return config.key === "status" ? statusOptions : [];
}

function SelectCell(ctx: Readonly<CellContext>) {
  const { row, config, onValueChange } = ctx;
  return cellBox(
    <Box sx={compactSelectSx}>
      <CustomSelect
        options={selectOptions(ctx)}
        value={row[config.key]}
        onChange={(next) => onValueChange(row, config.key, next)}
      />
    </Box>,
  );
}

function InputCell({ row, config, onValueChange }: Readonly<CellContext>) {
  const value = row[config.key];
  return cellBox(
    <CustomTooltip title={value} arrow placement="left">
      <Box sx={{ width: "100%", minWidth: 0 }}>
        <CustomTextField
          fullWidth
          value={value}
          placeholder={config.placeholder}
          onChange={(event) => onValueChange(row, config.key, event.target.value)}
          htmlInputProps={{ "aria-label": config.header }}
          sx={compactTextFieldSx}
        />
      </Box>
    </CustomTooltip>,
  );
}

function DialogCell({ row, config, labels, onOpenDialog }: Readonly<CellContext>) {
  const text = row[config.key].trim();
  return cellBox(
    <CustomTooltip title={text || labels.noDescription} arrow placement="left">
      <span>
        <CustomButton
          variant="text"
          aria-label={`View ${config.header}`}
          disabled={!text}
          onClick={() => onOpenDialog(config.header, text)}
          sx={dialogButtonSx}
        >
          <EyeIcon />
        </CustomButton>
      </span>
    </CustomTooltip>,
    true,
  );
}

const EDITORS: Partial<Record<string, (ctx: CellContext) => ReactNode>> = {
  select: (ctx) => <SelectCell {...ctx} />,
  input: (ctx) => <InputCell {...ctx} />,
  dialog: (ctx) => <DialogCell {...ctx} />,
};

export function renderRequirementCell(ctx: CellContext): ReactNode {
  const { config, row, editable } = ctx;
  if (config.render) return config.render(row);

  const editor = editable ? EDITORS[config.type ?? "text"] : undefined;
  return editor ? editor(ctx) : <TextCell value={row[config.key].trim()} />;
}
