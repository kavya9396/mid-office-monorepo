import {
  Paper,
  Box,
  Typography,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import CustomButton from "../Button/Button";

export type Column<T> = {
  key: keyof T;
  header?: string;
  width?: string;
  sticky?: "left" | "right";
  render?: (value: T[keyof T], row: T, rowIndex: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
  renderSelectAll?: () => void;
};

type CustomTableProps<T> = {
  title?: string;
  columns: Column<T>[];
  data: T[];
  headerAction?: React.ReactNode;
};

export default function CustomTable<T extends object>({
  title,
  columns = [],
  data = [],
  headerAction,
}: CustomTableProps<T>) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #D8D8D8",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      {/* HEADER */}
      {title && (
        <Box
          sx={{
            backgroundColor: "#E45F14",
            color: "#FFFFFF",
            px: 3,
            py: 1.2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography sx={{ fontSize: "12px", fontWeight: 700 }}>
            {title}
          </Typography>
          {headerAction}
          {headerAction && <Box>{headerAction}</Box>}
        </Box>
      )}

      {/* TABLE */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            width: "100%",
            tableLayout: "fixed",
            "& th": {
              backgroundColor: "#FFEAD7",
              color: "#000",
              fontSize: "10px",
              fontWeight: 600,
              py: 0.5,
              px: 1,
              lineHeight: 1.2,
              borderBottom: "1px solid #D6D6D6",
            },

            "& td": {
              color: "#4A4A4A",
              fontSize: "11px",
              py: 0.5,
              px: 1,
              lineHeight: 1.2,
              borderBottom: "1px solid #E1E1E1",
              whiteSpace: "normal",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
            },

            "& tr:last-child td": {
              borderBottom: "none",
            },
          }}
        >
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={String(col.key)}
                  sx={{
                    width: col.width,
                    ...(col.sticky
                      ? {
                          position: "sticky",
                          [col.sticky]: 0,
                          zIndex: 3,
                          backgroundColor: "#E9EEF3",
                        }
                      : {}),
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      lineHeight: 1.2,
                    }}
                  >
                    {col.headerRender ? (
                      col.headerRender()
                    ) : (
                      <Typography
                        sx={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#000",
                        }}
                      >
                        {col.header}
                      </Typography>
                    )}

                    {/* SUB ACTION (Select All) */}
                    {col.renderSelectAll && (
                      <CustomButton
                        variant="text"
                        sx={{
                          color: "#E45F14",
                          fontSize: "12px",
                          p: 0,
                          textDecoration: "underline",
                          "&:hover": {
                            textDecoration: "underline",
                            backgroundColor: "transparent",
                          },
                        }}
                        onClick={col.renderSelectAll}
                      >
                        (Select All)
                      </CustomButton>
                    )}
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          {/* BODY */}
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length || 1} align="center">
                  <Typography sx={{ fontSize: "11px", py: 1 }}>
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((col) => {
                    const value = row[col.key];
                    const content = col.render
                      ? col.render(value, row, rowIndex)
                      : (value as React.ReactNode);

                    return (
                      <TableCell
                        key={String(col.key)}
                        sx={{
                          fontSize: "12px",
                          ...(col.sticky
                            ? {
                                position: "sticky",
                                [col.sticky]: 0,
                                zIndex: 2,
                                backgroundColor: "#FFFFFF",
                              }
                            : {}),
                        }}
                      >
                        {col.render ? (
                          content
                        ) : (
                          <Typography sx={{ fontSize: "10px" }}>
                            {content}
                          </Typography>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}