import { Box, Typography } from "@mui/material";
import { colors, CustomButton, CustomTooltip, type Column } from "@insurance-poc/ui";
import { cellBox, renderRequirementCell, type CellContext } from "./RequirementCells";
import { DEFAULT_ACTIONS_WEIGHT, DEFAULT_COLUMN_WEIGHT } from "./defaults";
import type {
  RequirementActionsColumnConfig,
  RequirementColumnConfig,
  RequirementItem,
  RequirementRowAction,
  RequirementRowActionTone,
} from "./types";

const toneStyles: Record<RequirementRowActionTone, { color: string; bg: string; border: string }> = {
  primary: { color: colors.primary, bg: colors.surfaceSelectedSoft, border: colors.primary },
  danger: { color: colors.dangerStrong, bg: colors.dangerSurface, border: colors.dangerStrong },
  info: { color: colors.info, bg: colors.infoSurface, border: colors.infoBorder },
};

const actionButtonSx = {
  width: 24,
  height: 24,
  minWidth: 24,
  p: 0,
  borderRadius: "50%",
  border: `1px solid ${colors.borderAction}`,
  color: colors.iconMuted,
};

const headerCell = (header: string, center = false) =>
  cellBox(
    <Typography sx={{ fontSize: 10.5, fontWeight: 700, lineHeight: 1.15 }}>{header}</Typography>,
    center,
  );

/* ------------------------------------------------------------------ */
/* Row actions                                                          */
/* ------------------------------------------------------------------ */

type RowActionButtonProps = {
  action: RequirementRowAction;
  row: RequirementItem;
  onRemoveRow: (id: RequirementItem["id"]) => void;
};

function RowActionButton({ action, row, onRemoveRow }: Readonly<RowActionButtonProps>) {
  const tone = toneStyles[action.tone ?? "primary"];
  return (
    <CustomTooltip title={action.label} placement="left">
      <span>
        <CustomButton
          variant="text"
          aria-label={action.label}
          disabled={action.disabled?.(row)}
          onClick={() => action.onClick(row, { removeRow: () => onRemoveRow(row.id) })}
          sx={{
            ...actionButtonSx,
            "&:hover": { borderColor: tone.border, color: tone.color, bgcolor: tone.bg },
          }}
        >
          {action.icon}
        </CustomButton>
      </span>
    </CustomTooltip>
  );
}

/* ------------------------------------------------------------------ */
/* Column builder                                                       */
/* ------------------------------------------------------------------ */

type BuildColumnsOptions = {
  columnConfigs: RequirementColumnConfig[];
  /** Row actions already filtered for read-only mode. */
  visibleActions: RequirementRowAction[];
  actionsColumnConfig?: RequirementActionsColumnConfig;
  cellContext: Omit<CellContext, "row" | "config" | "editable">;
  readOnly: boolean;
  onRemoveRow: (id: RequirementItem["id"]) => void;
};

export function buildTableColumns({
  columnConfigs,
  visibleActions,
  actionsColumnConfig,
  cellContext,
  readOnly,
  onRemoveRow,
}: BuildColumnsOptions): Column<RequirementItem>[] {
  const showActions = visibleActions.length > 0;
  const actionsWeight = actionsColumnConfig?.weight ?? DEFAULT_ACTIONS_WEIGHT;
  const actionsHeader = actionsColumnConfig?.header ?? "Actions";

  const totalWeight =
    columnConfigs.reduce((sum, col) => sum + (col.weight ?? DEFAULT_COLUMN_WEIGHT), 0) +
    (showActions ? actionsWeight : 0);
  const widthOf = (weight: number) => `${((weight / totalWeight) * 100).toFixed(2)}%`;

  const dataColumns: Column<RequirementItem>[] = columnConfigs.map((config) => ({
    key: config.key,
    header: config.header,
    headerRender: () => headerCell(config.header),
    width: widthOf(config.weight ?? DEFAULT_COLUMN_WEIGHT),
    render: (_value, row) =>
      renderRequirementCell({
        ...cellContext,
        row,
        config,
        editable: !readOnly && !config.readOnly,
      }),
  }));

  if (!showActions) return dataColumns;

  const actionsColumn: Column<RequirementItem> = {
    key: "id",
    header: actionsHeader,
    headerRender: () => headerCell(actionsHeader, true),
    width: widthOf(actionsWeight),
    render: (_value, row) =>
      cellBox(
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {visibleActions
            .filter((action) => !action.hidden?.(row))
            .map((action) => (
              <RowActionButton key={action.key} action={action} row={row} onRemoveRow={onRemoveRow} />
            ))}
        </Box>,
        true,
      ),
  };

  return actionsColumnConfig?.position === "end"
    ? [...dataColumns, actionsColumn]
    : [actionsColumn, ...dataColumns];
}
