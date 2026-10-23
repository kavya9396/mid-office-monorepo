
import type { ReactNode } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";

export type KeyValueRow = {
  id: string;
  firstLabel: string;
  firstValue: ReactNode;
  secondLabel: string;
  secondValue: ReactNode;
  thirdLabel: string;
  thirdValue: ReactNode;
};

type KeyValueTableProps = {
  title: string;
  rows: KeyValueRow[];
};

export default function KeyValueTable({
  title,
  rows,
}: Readonly<KeyValueTableProps>) {
  return (
    <Box
      sx={{
        backgroundColor: "#f6f6f6",
        borderRadius: 5,
        overflow: "hidden",
        border: "1px solid #E3E3E3",
      }}
    >
      {/* HEADER */}
      <Box
        sx={{
          px: 2.5,
          py: 1.25,
          backgroundColor: "#E45F14",
        }}
      >
        <Typography
          sx={{
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {title}
        </Typography>
      </Box>

      {/* TABLE */}
      <TableContainer>
        <Table
          size="small"
          sx={{
            "& td": {
              borderColor: "#D4D7DB",
              fontFamily: "Mulish, sans-serif",
              fontSize: "12px",
              color: "#4B5563",
              py: 1.1,
            },
          }}
        >
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {/* FIRST LABEL */}
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    backgroundColor: "#FFEAD7",
                    width: "16.66%",
                    borderBottom: "1px solid #C9CDD3",
                    fontWeight: 700,
                  }}
                >
                  {row.firstLabel}
                </TableCell>

                {/* FIRST VALUE */}
                <TableCell
                  sx={{
                    width: "16.66%",
                    backgroundColor: "#fff",
                  }}
                >
                  {row.firstValue}
                </TableCell>

                {/* SECOND LABEL */}
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    backgroundColor: "#FFEAD7",
                    width: "16.66%",
                    borderBottom: "1px solid #C9CDD3",
                    fontWeight: 700,
                  }}
                >
                  {row.secondLabel}
                </TableCell>

                {/* SECOND VALUE */}
                <TableCell
                  sx={{
                    width: "16.66%",
                    backgroundColor: "#fff",
                  }}
                >
                  {row.secondValue}
                </TableCell>

                {/* THIRD LABEL */}
                <TableCell
                  component="th"
                  scope="row"
                  sx={{
                    backgroundColor: "#FFEAD7",
                    width: "16.66%",
                    borderBottom: "1px solid #C9CDD3",
                    fontWeight: 700,
                  }}
                >
                  {row.thirdLabel}
                </TableCell>

                {/* THIRD VALUE */}
                <TableCell
                  sx={{
                    width: "16.66%",
                    backgroundColor: "#fff",
                  }}
                >
                  {row.thirdValue}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
