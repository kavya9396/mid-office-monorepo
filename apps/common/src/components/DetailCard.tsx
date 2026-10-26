import { useState } from "react";
import { Box, IconButton, Typography, type DialogProps } from "@mui/material";
import {
  CloseIcon,
  CustomDialog,
  CustomTable,
  KeyRightArrowIcon,
} from "@insurance-poc/ui";

export type DetailAttribute = {
  name: string;
  value: string;
};

export type DetailTableRow = Record<string, string>;

export type DetailTable = {
  name: string;
  columns: string[];
  rows: DetailTableRow[];
};

export type DetailCardProps = {
  /** Heading shown on the card (and on the dialog unless dialogTitle is given). */
  title: string;
  /** Fields shown on the summary card. */
  attributes: DetailAttribute[];
  /** Fields shown in the dialog. When omitted (and no tables) the card is not expandable. */
  expandedAttributes?: DetailAttribute[];
  /** Tables shown in the dialog below the fields. */
  tables?: DetailTable[];
  dialogTitle?: string;
  dialogMaxWidth?: DialogProps["maxWidth"];
};

const FieldText = ({ name, value }: DetailAttribute) => (
  <Typography
    component="div"
    noWrap
    sx={{ fontSize: 10, fontWeight: 500 }}
  >
    {name}:{" "}
    <Box
      component="span"
      sx={{ fontWeight: 700, fontSize: 10 }}
    >
      {value || "-"}
    </Box>
  </Typography>
);

export function DetailCard({
  title,
  attributes,
  expandedAttributes = [],
  tables = [],
  dialogTitle,
  dialogMaxWidth = "sm",
}: Readonly<DetailCardProps>) {
  const [open, setOpen] = useState(false);
  const expandable = expandedAttributes.length > 0 || tables.length > 0;

  return (
    <>
      {/* SUMMARY CARD */}
      <Box
        sx={{
          backgroundColor: "#fff",
          borderTop: (theme) => `4px solid ${theme.palette.primary.main}`,
          borderRadius: "10px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          px: 1.25,
          py: 1,
          width: "100%",
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 800, color: "primary.main" }}>{title}</Typography>
          {expandable && (
            <IconButton
              aria-label={`View ${title}`}
              onClick={() => setOpen(true)}
              sx={{
                width: 25,
                height: 25,
                p: 0,
                border: (theme) => `1px solid ${theme.palette.primary.main}`,
                color: "primary.main",
              }}
            >
              <KeyRightArrowIcon width={16} height={16} />
            </IconButton>
          )}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 1,
            rowGap: 0.75,
          }}
        >
          {attributes.map((attr) => (
            <Box key={attr.name} sx={{ minWidth: 0 }}>
              <FieldText {...attr} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* DETAIL DIALOG */}
      {expandable && (
        <CustomDialog
          open={open}
          onClose={() => setOpen(false)}
          maxWidth={dialogMaxWidth}
          showCloseIcon={false}
          paperSx={{ borderRadius: "8px" }}
          contentSx={{  }}
          title={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                component="span"
                sx={{ fontSize: 12, fontWeight: 800 }}
              >
                {dialogTitle ?? title}
              </Typography>
              <IconButton
                aria-label="Close dialog"
                onClick={() => setOpen(false)}
                sx={{ p: 0, color: "#fff" }}
              >
                <CloseIcon width={22} height={22} />
              </IconButton>
            </Box>
          }
        >
          {expandedAttributes.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                columnGap: 3,
              }}
            >
              {expandedAttributes.map((attr) => (
                <Box
                  key={attr.name}
                  sx={{ py: 0.75, borderBottom: "1px solid #E5E5E5" }}
                >
                  <FieldText {...attr} />
                </Box>
              ))}
            </Box>
          )}

          {tables.map((table) => (
            <Box key={table.name} sx={{ mt: 1.5 }}>
              <CustomTable<DetailTableRow>
                title={table.name}
                columns={table.columns.map((col) => ({
                  key: col,
                  header: col,
                }))}
                data={table.rows}
                getRowId={(row) => JSON.stringify(row)}
              />
            </Box>
          ))}
        </CustomDialog>
      )}
    </>
  );
}

export default DetailCard;
